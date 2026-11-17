import { writeFile } from "node:fs/promises";
import path from "node:path";

import { fixturePdfOfSize } from "../tests/helpers/pdf";

/**
 * Writes a synthetic `[FIXTURE]` PDF of about N MB for the Owner Preview
 * check of M3-08 (ENVIRONMENTS §3.1 "Unduhan file (M3-08)"): upload through
 * /admin, download from the detail page, TTL behaviour of a large download.
 * Valid PDF, random padding, no third-party content.
 *
 *   node --import tsx scripts/make-fixture-pdf.ts [MB=10] [out=mahira-fixture-m3-08-<MB>mb.pdf]
 *
 * The default name does not start with `fixture-test-`, so the integration
 * cleanup never touches the Owner's file; delete it in /admin after the check.
 */
async function main(): Promise<void> {
  const [mbArg, outArg] = process.argv.slice(2);
  const mb = mbArg === undefined ? 10 : Number(mbArg);
  if (!Number.isFinite(mb) || mb <= 0 || mb > 50) throw new Error("MB must be a number above 0 and at most 50 (bucket limit).");
  const out = path.resolve(outArg ?? `mahira-fixture-m3-08-${mb}mb.pdf`);
  const pdf = fixturePdfOfSize(`Mahira M3-08 Preview check, ${mb} MB synthetic file`, Math.round(mb * 1024 * 1024));
  await writeFile(out, pdf);
  console.log(`wrote ${out} (${pdf.length} bytes)`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
