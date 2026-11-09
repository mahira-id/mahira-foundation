/**
 * M2-03 storage checks (spike only): public files in Supabase Storage of the
 * APP project through @payloadcms/storage-s3 (DEC-012, SPIKE-003 public part).
 *
 * Usage (production server running, e.g. `bun run start --port 3100`):
 *   bun run payload run scripts/spike/m2-03-storage-checks.ts
 * Env (names only):
 *   SPIKE_FIXTURE_DIR  synthetic fixtures (default $TEMP/mahira-m2-fixtures):
 *                      fixture-m2-public.pdf, fixture-m2-cover.png,
 *                      fixture-m2-cover-v2.png, fixture-m2-bad.txt
 *   SPIKE_BASE_URL     default http://localhost:3100
 *   SPIKE_S7_GATE=1    wait for the file <fixture dir>/go-s7 before S7 (lets
 *                      an operator snapshot storage.objects before the delete)
 *   SPIKE_MODE=cleanup only delete the spike fixtures, then exit
 *
 * Output: `PASS|FAIL|OBSERVED <id> <fact>`; exit code 1 if a PASS/FAIL check
 * fails. URLs are printed with the APP project origin replaced by
 * <APP_SUPABASE_URL>; credentials and signed URLs are never printed.
 *
 * Fixtures (spike-created only): media docs with alt `[FIXTURE] ...`,
 * publications with slug `fixture-m2-media-*`, translation groups labelled
 * `[FIXTURE] media *`. Deleted at start; the replaced PNG and its publication
 * stay in place for the restart/durability check.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import { requireEnv } from "../../payload/env";
import type { Media } from "../../payload/payload-types";

const BASE_URL = process.env.SPIKE_BASE_URL ?? "http://localhost:3100";
const FIXTURE_DIR = process.env.SPIKE_FIXTURE_DIR ?? path.join(os.tmpdir(), "mahira-m2-fixtures");
const APP_URL = requireEnv("APP_SUPABASE_URL").replace(/\/+$/, "");
const PUBLIC_PREFIX = `${APP_URL}/storage/v1/object/public/spike-m2-public/spike-m2/`;
const ALT_PREFIX = "[FIXTURE]";
const SLUG_PREFIX = "fixture-m2-media-";
const GROUP_PREFIX = "[FIXTURE] media ";
const REPO_ROOT = process.cwd();

const payload = await getPayload({ config });
const counts = { pass: 0, fail: 0, observed: 0 };

function redact(text: string): string {
  return text.split(APP_URL).join("<APP_SUPABASE_URL>");
}

function check(id: string, pass: boolean, fact: string): void {
  if (pass) counts.pass++;
  else {
    counts.fail++;
    process.exitCode = 1;
  }
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${redact(fact)}`);
}

function observe(id: string, fact: string): void {
  counts.observed++;
  console.log(`OBSERVED ${id} ${redact(fact)}`);
}

function sha256(data: Buffer | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function fixture(name: string): string {
  return path.join(FIXTURE_DIR, name);
}

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

type Fetched = { status: number; type: string | null; cache: string | null; sha: string; ms: number; size: number };

async function anonymousFetch(url: string): Promise<Fetched> {
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store" });
  const body = new Uint8Array(await response.arrayBuffer());
  return {
    status: response.status,
    type: response.headers.get("content-type"),
    cache: response.headers.get("cache-control"),
    sha: sha256(body),
    ms: Math.round(performance.now() - started),
    size: body.length,
  };
}

function describe(fetched: Fetched): string {
  return `HTTP ${fetched.status} type=${fetched.type} bytes=${fetched.size} cache-control=${fetched.cache} ${fetched.ms}ms`;
}

function cacheBusted(url: string): string {
  return `${url}?spike-cb=${Date.now()}`;
}

async function timedCreate(alt: string, file: string): Promise<{ doc: Media; ms: number }> {
  const started = performance.now();
  const doc = await payload.create({ collection: "media", data: { alt }, filePath: file, overrideAccess: true });
  return { doc, ms: Math.round(performance.now() - started) };
}

async function cleanup(): Promise<string> {
  const publications = await payload.find({ collection: "publications", depth: 0, pagination: false, overrideAccess: true });
  const ownPublications = publications.docs.filter((doc) => doc.slug.startsWith(SLUG_PREFIX));
  for (const doc of ownPublications) {
    await payload.delete({ collection: "publications", id: doc.id, overrideAccess: true });
  }
  const groups = await payload.find({ collection: "translation-groups", depth: 0, pagination: false, overrideAccess: true });
  const ownGroups = groups.docs.filter((doc) => doc.label.startsWith(GROUP_PREFIX));
  for (const doc of ownGroups) {
    await payload.delete({ collection: "translation-groups", id: doc.id, overrideAccess: true });
  }
  // Deleting through Payload lets the storage adapter delete the objects too.
  const media = await payload.find({ collection: "media", depth: 0, pagination: false, overrideAccess: true });
  const ownMedia = media.docs.filter((doc) => doc.alt.startsWith(ALT_PREFIX));
  for (const doc of ownMedia) {
    await payload.delete({ collection: "media", id: doc.id, overrideAccess: true });
  }
  return `publications=${ownPublications.length} groups=${ownGroups.length} media=${ownMedia.length} (other media left: ${media.docs.length - ownMedia.length})`;
}

async function idBySlug(collection: "authors" | "topics" | "publication-types", slug: string): Promise<number> {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  const doc = found.docs[0];
  if (!doc) throw new Error(`Seed fixture ${slug} missing; run scripts/spike/m2-01-seed.ts`);
  return doc.id;
}

function findFilesNamed(root: string, names: Set<string>, hits: string[] = []): string[] {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      findFilesNamed(path.join(root, entry.name), names, hits);
    } else if (names.has(entry.name)) {
      hits.push(path.relative(REPO_ROOT, path.join(root, entry.name)));
    }
  }
  return hits;
}

async function waitForGate(): Promise<void> {
  if (process.env.SPIKE_S7_GATE !== "1") return;
  const marker = fixture("go-s7");
  console.log("INFO waiting for go-s7 marker before S7");
  const deadline = Date.now() + 10 * 60 * 1000;
  while (!existsSync(marker) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log(`INFO gate ${existsSync(marker) ? "opened" : "timed out"}`);
}

async function run(): Promise<void> {
  console.log(`INFO cleanup deleted ${await cleanup()}`);
  if (process.env.SPIKE_MODE === "cleanup") return;

  // ---------------------------------------------------------------- S1 upload PDF
  const pdfPath = fixture("fixture-m2-public.pdf");
  const pdfLocal = readFileSync(pdfPath);
  const { doc: pdf, ms: pdfUploadMs } = await timedCreate("[FIXTURE] public pdf", pdfPath);
  const pdfUrl = pdf.url ?? "";
  check(
    "S1",
    Boolean(pdf.filename) && pdf.mimeType === "application/pdf" && pdf.filesize === pdfLocal.length && pdfUrl.startsWith(PUBLIC_PREFIX),
    `media id=${pdf.id} filename=${pdf.filename} mimeType=${pdf.mimeType} filesize=${pdf.filesize} (local ${pdfLocal.length}) prefix=${pdf.prefix} url=${pdfUrl} upload=${pdfUploadMs}ms`,
  );

  // ---------------------------------------------------------------- S2 anonymous fetch
  const pdfFetch = await anonymousFetch(pdfUrl);
  check(
    "S2",
    pdfFetch.status === 200 && (pdfFetch.type ?? "").startsWith("application/pdf") && pdfFetch.sha === sha256(pdfLocal),
    `anonymous GET public URL: ${describe(pdfFetch)} sha256 ${pdfFetch.sha === sha256(pdfLocal) ? "matches" : "DIFFERS from"} local file`,
  );
  const proxy = await fetch(`${BASE_URL}/api/media/file/${encodeURIComponent(pdf.filename ?? "")}`);
  observe("S2-proxy", `GET /api/media/file/<filename> (Payload proxy) -> HTTP ${proxy.status} (disablePayloadAccessControl: true)`);

  // ---------------------------------------------------------------- S3 cover image on a publication
  const pngPath = fixture("fixture-m2-cover.png");
  const pngLocal = readFileSync(pngPath);
  const { doc: png, ms: pngUploadMs } = await timedCreate("[FIXTURE] cover png", pngPath);
  const pngUrl = png.url ?? "";
  const pngFetch = await anonymousFetch(pngUrl);
  observe("S3-upload", `png media id=${png.id} ${png.mimeType} ${png.width}x${png.height} upload=${pngUploadMs}ms fetch: ${describe(pngFetch)} sha256 ${pngFetch.sha === sha256(pngLocal) ? "matches" : "differs"}`);

  const group = await payload.create({ collection: "translation-groups", data: { label: `${GROUP_PREFIX}cover` }, overrideAccess: true });
  const publication = await payload.create({
    collection: "publications",
    data: {
      title: "[FIXTURE] Publikasi uji cover M2-03",
      slug: `${SLUG_PREFIX}cover`,
      locale: "id",
      translationGroup: group.id,
      summary: "[FIXTURE] Ringkasan uji penyimpanan M2-03.",
      publicationType: await idBySlug("publication-types", "fixture-type-policy-brief"),
      topics: [await idBySlug("topics", "fixture-topic-energi")],
      authors: [await idBySlug("authors", "fixture-author-a")],
      accessLevel: "public",
      coverImage: png.id,
      _status: "published",
    },
    depth: 0,
    overrideAccess: true,
  });
  const restPub = await fetch(`${BASE_URL}/api/publications/${publication.id}?depth=1`);
  const restText = await restPub.text();
  const restBody = JSON.parse(restText) as { coverImage?: Record<string, unknown> };
  const cover = restBody.coverImage ?? {};
  const leaks = ["X-Amz-", "storage/v1/s3", ".storage.supabase.co", requireEnv("APP_SUPABASE_S3_ACCESS_KEY_ID")].filter((needle) =>
    restText.includes(needle),
  );
  check(
    "S3",
    restPub.status === 200 && cover.url === pngUrl && String(cover.url).startsWith(PUBLIC_PREFIX) && leaks.length === 0,
    `anonymous GET /api/publications/${publication.id}?depth=1 -> HTTP ${restPub.status}; coverImage.url=${String(cover.url)}; coverImage keys=[${Object.keys(cover).join(",")}]; S3 endpoint/signature/access key in body: ${leaks.length === 0 ? "none" : `${leaks.length} hit(s)`}`,
  );
  const restMedia = await fetch(`${BASE_URL}/api/media/${png.id}`);
  const restMediaBody = (await restMedia.json()) as Record<string, unknown>;
  observe("S3-media", `anonymous GET /api/media/${png.id} -> HTTP ${restMedia.status} url=${String(restMediaBody.url)} prefix=${String(restMediaBody.prefix)} _objectKey=${restMediaBody._objectKey === undefined ? "absent" : "present"}`);

  // ---------------------------------------------------------------- S4 disallowed MIME type
  try {
    const bad = await payload.create({ collection: "media", data: { alt: "[FIXTURE] bad txt" }, filePath: fixture("fixture-m2-bad.txt"), overrideAccess: true });
    check("S4", false, `text/plain upload ACCEPTED as media id=${bad.id} mimeType=${bad.mimeType}`);
  } catch (error) {
    check("S4", true, `text/plain upload rejected: ${errorText(error)}`);
  }

  // ---------------------------------------------------------------- S5 no local copy
  const names = new Set([pdf.filename, png.filename, "fixture-m2-public.pdf", "fixture-m2-cover.png"].filter((name): name is string => Boolean(name)));
  const hits = findFilesNamed(REPO_ROOT, names);
  const mediaDir = existsSync(path.join(REPO_ROOT, "media"));
  check("S5", !mediaDir && hits.length === 0, `<worktree>/media exists=${mediaDir}; files named like the uploads under the worktree (excl. node_modules,.next,.git): ${hits.length === 0 ? "none" : hits.join(",")}`);

  // ---------------------------------------------------------------- S6 replace file
  const v2Path = fixture("fixture-m2-cover-v2.png");
  const v2Local = readFileSync(v2Path);
  const started = performance.now();
  const replaced = await payload.update({ collection: "media", id: png.id, data: {}, filePath: v2Path, overrideAccess: true });
  const replaceMs = Math.round(performance.now() - started);
  const newFetch = await anonymousFetch(replaced.url ?? "");
  const oldFetch = await anonymousFetch(pngUrl);
  const oldBusted = await anonymousFetch(cacheBusted(pngUrl));
  observe(
    "S6",
    `replace ${replaceMs}ms: filename ${png.filename} -> ${replaced.filename}, url changed=${replaced.url !== pngUrl}; new URL ${describe(newFetch)} sha256 ${newFetch.sha === sha256(v2Local) ? "matches v2" : "differs from v2"}; old URL ${describe(oldFetch)}; old URL cache-busted HTTP ${oldBusted.status} -> old object ${oldBusted.status === 200 ? "STILL STORED (not deleted on replace)" : "deleted on replace"}`,
  );
  const pubAfter = await fetch(`${BASE_URL}/api/publications/${publication.id}?depth=1`);
  const pubAfterBody = (await pubAfter.json()) as { coverImage?: { url?: string } };
  observe("S6-pub", `publication coverImage.url after replace = ${pubAfterBody.coverImage?.url === replaced.url ? "new URL" : String(pubAfterBody.coverImage?.url)}`);

  // ---------------------------------------------------------------- S7 delete
  await waitForGate();
  const deleteStarted = performance.now();
  await payload.delete({ collection: "media", id: pdf.id, overrideAccess: true });
  const deleteMs = Math.round(performance.now() - deleteStarted);
  const afterDelete = await anonymousFetch(pdfUrl);
  const afterDeleteBusted = await anonymousFetch(cacheBusted(pdfUrl));
  check(
    "S7",
    [400, 404].includes(afterDelete.status),
    `delete media id=${pdf.id} ${deleteMs}ms; public URL afterwards ${describe(afterDelete)}; cache-busted HTTP ${afterDeleteBusted.status}`,
  );

  console.log(`INFO remaining fixtures for durability check: media id=${replaced.id} url=${redact(replaced.url ?? "")} publication id=${publication.id}`);
}

try {
  await run();
} catch (error) {
  check("RUN", false, `aborted: ${errorText(error)}`);
} finally {
  console.log(`SUMMARY pass=${counts.pass} fail=${counts.fail} observed=${counts.observed}`);
  await payload.destroy();
}
// Give pg pool sockets time to close (Windows libuv assertion, FEAT-002);
// the payload bin would otherwise exit 0 and drop process.exitCode.
await new Promise((resolve) => setTimeout(resolve, 250));
process.exit(process.exitCode ?? 0);
