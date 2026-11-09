/**
 * M2-01 database smoke script (spike only).
 *
 * Usage:
 *   SPIKE_MODE=describe  bun run payload run scripts/spike/m2-01-db-smoke.ts
 *     Prints the connection class only (kind, host suffix, port, sslmode
 *     present). Does not connect.
 *   (default)            bun run payload run scripts/spike/m2-01-db-smoke.ts
 *     50 parallel finds on `publications` and 10 parallel create-then-delete
 *     of `translation-groups`; prints latency p50/p95/max and error classes.
 *
 * Never prints environment values.
 */
import { describeDatabaseUri, resolveDatabaseUri } from "../../payload/db/database-uri";

const FIND_COUNT = 50;
const WRITE_COUNT = 10;

type Timed = { ms: number; error?: string };

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function errorClass(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as { code?: unknown; name?: unknown; cause?: { code?: unknown } };
    if (typeof record.code === "string") return record.code;
    if (record.cause && typeof record.cause.code === "string") return record.cause.code;
    if (typeof record.name === "string") return record.name;
  }
  return "unknown";
}

async function timed(task: () => Promise<unknown>): Promise<Timed> {
  const started = performance.now();
  try {
    await task();
    return { ms: performance.now() - started };
  } catch (error) {
    return { ms: performance.now() - started, error: errorClass(error) };
  }
}

function summarize(label: string, results: Timed[]): number {
  const sorted = results.map((r) => r.ms).sort((a, b) => a - b);
  const errors = results.filter((r) => r.error);
  const classes = [...new Set(errors.map((r) => r.error))].join(",") || "none";
  console.log(
    `${errors.length === 0 ? "PASS" : "FAIL"} ${label} n=${results.length} ` +
    `p50=${percentile(sorted, 50).toFixed(0)}ms p95=${percentile(sorted, 95).toFixed(0)}ms ` +
    `max=${(sorted.at(-1) ?? 0).toFixed(0)}ms errors=${errors.length} classes=${classes}`,
  );
  return errors.length;
}

const description = describeDatabaseUri(resolveDatabaseUri());

if (process.env.SPIKE_MODE === "describe") {
  console.log(
    `INFO db-uri kind=${description.kind} hostSuffix=${description.hostSuffix} ` +
    `port=${description.port} hasSslmode=${description.hasSslmode}`,
  );
} else {
  const { getPayload } = await import("payload");
  const { default: config } = await import("@payload-config");

  console.log(`INFO db-uri kind=${description.kind} port=${description.port}`);
  const initStarted = performance.now();
  const payload = await getPayload({ config });
  console.log(`INFO getPayload ${(performance.now() - initStarted).toFixed(0)}ms`);

  const finds = await Promise.all(
    Array.from({ length: FIND_COUNT }, () =>
      timed(() =>
        payload.find({ collection: "publications", depth: 0, limit: 10, overrideAccess: true }),
      ),
    ),
  );

  const writes = await Promise.all(
    Array.from({ length: WRITE_COUNT }, (_, n) =>
      timed(async () => {
        const group = await payload.create({
          collection: "translation-groups",
          data: { label: `[FIXTURE] concurrency ${n}` },
          overrideAccess: true,
        });
        await payload.delete({
          collection: "translation-groups",
          id: group.id,
          overrideAccess: true,
        });
      }),
    ),
  );

  const leftover = await payload.count({
    collection: "translation-groups",
    where: { label: { like: "[FIXTURE] concurrency" } },
    overrideAccess: true,
  });

  let failures = 0;
  failures += summarize("concurrency-find", finds);
  failures += summarize("concurrency-create-delete", writes);
  console.log(
    `${leftover.totalDocs === 0 ? "PASS" : "FAIL"} concurrency-cleanup leftover=${leftover.totalDocs}`,
  );
  if (leftover.totalDocs !== 0) failures += 1;

  await payload.destroy();
  // Let socket close callbacks finish: an immediate exit intermittently hits a
  // libuv assertion on Windows (Node 26.4.0, exit code 9). The payload bin
  // would call process.exit(0) itself, so the failure code is set here.
  await new Promise((resolve) => setTimeout(resolve, 250));
  process.exit(failures === 0 ? 0 : 1);
}
