import { randomBytes } from "node:crypto";

/**
 * Synthetic `[FIXTURE]` PDFs (M3-08). A valid one-page PDF 1.4: header
 * `%PDF-`, a page with the text, an optional padding stream (random bytes,
 * not referenced by the page) to reach a size, a correct xref table and the
 * `%%EOF` trailer, so Payload's content check (file-type detection plus
 * `%PDF-` header and `xref`/`%%EOF` in the last 1 KB) and PDF viewers both
 * accept it. No third-party document is ever used.
 */
function escapePdfText(text: string): string {
  return text.replace(/[^\x20-\x7e]/g, "?").replace(/([\\()])/g, "\\$1");
}

/** A PDF with `text` on its page and about `paddingBytes` of extra data. */
export function fixturePdf(text: string, paddingBytes = 0): Buffer {
  const content = Buffer.from(`BT /F1 18 Tf 72 770 Td (${escapePdfText(`[FIXTURE] ${text}`)}) Tj ET\n`, "latin1");
  const padding = paddingBytes > 0 ? randomBytes(paddingBytes) : null;
  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"),
    Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>", "latin1"),
    Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`, "latin1"), content, Buffer.from("endstream", "latin1")]),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "latin1"),
  ];
  if (padding) {
    objects.push(Buffer.concat([Buffer.from(`<< /Length ${padding.length} >>\nstream\n`, "latin1"), padding, Buffer.from("\nendstream", "latin1")]));
  }
  const header = Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1");
  const parts: Buffer[] = [header];
  const offsets: number[] = [];
  let length = header.length;
  objects.forEach((body, index) => {
    const object = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`, "latin1"), body, Buffer.from("\nendobj\n", "latin1")]);
    offsets.push(length);
    parts.push(object);
    length += object.length;
  });
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(length),
    "%%EOF",
    "",
  ].join("\n");
  parts.push(Buffer.from(xref, "latin1"));
  return Buffer.concat(parts);
}

/** A PDF of about `bytes` in total (at least the size of the page alone). */
export function fixturePdfOfSize(text: string, bytes: number): Buffer {
  const base = fixturePdf(text).length;
  // The padding object adds its own header and markers (about 60 bytes).
  return fixturePdf(text, Math.max(0, bytes - base - 64));
}
