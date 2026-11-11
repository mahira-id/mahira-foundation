import type { PayloadRequest } from "payload";

/**
 * Minimal stand-in for a Payload request in unit tests (no database, no
 * Payload instance). Only the properties the access functions and hooks under
 * test read are set; anything else is undefined on purpose, so a hook that
 * starts reading more of `req` fails loudly instead of passing by accident.
 */
export type FakeUser = {
  id: number;
  role?: string;
  collection?: string;
  email?: string;
};

export type FakeReqOptions = {
  user?: FakeUser | null;
  payloadAPI?: "local" | "REST" | "GraphQL";
  context?: Record<string, unknown>;
  payload?: unknown;
  fallbackLocale?: unknown;
};

/** A staff user of the `users` collection with a fixture-style email. */
export function fakeUser(role: string, id = 1, collection = "users"): FakeUser {
  return { id, role, collection, email: `fixture-test-unit-${id}@example.invalid` };
}

export function fakeReq(options: FakeReqOptions = {}): PayloadRequest {
  const req: Record<string, unknown> = {
    user: options.user ?? null,
    // REST by default: the most restrictive caller, so a test must opt in to
    // the server-side Local API explicitly.
    payloadAPI: options.payloadAPI ?? "REST",
    context: options.context ?? {},
    payload: options.payload ?? {},
  };
  if ("fallbackLocale" in options) req.fallbackLocale = options.fallbackLocale;
  return req as unknown as PayloadRequest;
}
