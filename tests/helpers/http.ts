/**
 * HTTP helpers for the DB integration tests (M3-10). The server is the
 * `next start` that `bun run test:integration` starts on TEST_BASE_URL.
 * Redirects are never followed, so a 3xx is seen as such. Request bodies of
 * auth calls, passwords and tokens are never printed.
 */
export const BASE_URL = (process.env.TEST_BASE_URL ?? "http://localhost:3100").replace(/\/+$/, "");

export type JsonObject = Record<string, unknown>;
export type RestResult = { status: number; body: JsonObject };
type RestError = { message?: string; data?: { errors?: { path?: string; message?: string }[] } };
type Raw = { status: number; headers: Headers; text: string };

/** "<message>: <cause code> <cause message>", without request data. */
function networkError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause as { code?: string; message?: string } | undefined;
  return cause ? `${error.message}: ${cause.code ?? ""} ${cause.message ?? ""}`.trim() : error.message;
}

/**
 * One request, body read included. A GET is retried once on a transport
 * error (e.g. a keep-alive socket the server closed between two requests);
 * GET is idempotent, other methods are never retried. The retry is reported
 * on stderr with method, path and error only. Throws when it still fails.
 */
async function request(method: string, path: string, init: RequestInit): Promise<Raw> {
  const once = async (): Promise<Raw> => {
    const response = await fetch(`${BASE_URL}${path}`, { ...init, method, redirect: "manual" });
    return { status: response.status, headers: response.headers, text: await response.text() };
  };
  try {
    return await once();
  } catch (error) {
    if (method !== "GET") throw error;
    process.stderr.write(`[http] GET ${path}: ${networkError(error)}; retrying once\n`);
    return once();
  }
}

/** JSON request; status 0 (and body.fetchError) when the server cannot be reached. */
export async function rest(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<RestResult> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `JWT ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  try {
    const raw = await request(method, path, {
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    let body: JsonObject = {};
    try {
      body = raw.text ? (JSON.parse(raw.text) as JsonObject) : {};
    } catch {
      body = { nonJson: true };
    }
    return { status: raw.status, body };
  } catch (error) {
    return { status: 0, body: { fetchError: networkError(error) } };
  }
}

/** Error messages of a Payload REST error body (field errors first). */
export function restErrors(body: JsonObject): string {
  const errors = (Array.isArray(body.errors) ? body.errors : []) as RestError[];
  return errors
    .map((error) =>
      error.data?.errors?.length
        ? error.data.errors.map((item) => `${item.path}: ${item.message}`).join("; ")
        : (error.message ?? ""),
    )
    .join(" | ");
}

/** "HTTP <status> [<errors>]", safe for assertion messages. */
export function restFact(result: RestResult): string {
  const errors = restErrors(result.body);
  const fetchError = typeof result.body.fetchError === "string" ? ` (${result.body.fetchError})` : "";
  return `HTTP ${result.status}${errors ? ` [${errors}]` : ""}${fetchError}`;
}

export function restDoc(result: RestResult): JsonObject {
  const doc = result.body.doc;
  return doc && typeof doc === "object" ? (doc as JsonObject) : {};
}

export type PageResult = { status: number; location: string; postponed: boolean; body: string; error?: string };

export async function getPage(path: string): Promise<PageResult> {
  try {
    const raw = await request("GET", path, {});
    return {
      status: raw.status,
      location: raw.headers.get("location") ?? "",
      postponed: raw.headers.get("x-nextjs-postponed") === "1",
      body: raw.text,
    };
  } catch (error) {
    return { status: 0, location: "", postponed: false, body: "", error: networkError(error) };
  }
}

export function pageFact(result: PageResult): string {
  return `HTTP ${result.status}${result.location ? ` -> ${result.location}` : ""}${result.error ? ` (${result.error})` : ""}`;
}

/** Logs in through REST; returns the JWT or undefined. Prints nothing. */
export async function login(email: string, password: string): Promise<string | undefined> {
  const result = await rest("POST", "/api/users/login", { body: { email, password } });
  return typeof result.body.token === "string" ? result.body.token : undefined;
}

/** Fails unless GET / answers 200. */
export async function assertServerUp(): Promise<void> {
  const home = await getPage("/");
  if (home.status !== 200) {
    throw new Error(
      `No server answering GET / with 200 at ${BASE_URL} (${pageFact(home)}). ` +
      "Run the integration tests with `bun run test:integration`, which builds and starts it.",
    );
  }
}
