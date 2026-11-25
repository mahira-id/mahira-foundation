import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, test } from "node:test";
import { PublicationFiles, type PanelFile } from "../../components/publication/publication-files";
import { dictionaries } from "../../lib/i18n/dictionaries";
import { LOCALES } from "../../lib/i18n/locales";
import { fileFormatLabel, fileKindLabel, fileLanguageLabel, fileSizeLabel } from "../../lib/publications/file-labels";

/**
 * Labels of the file panel (M3-08, DECISIONS §2.14 item 7). No database, no
 * env. The rendered panel on the detail page is covered by
 * tests/integration/publication-files.test.ts (DLU1–DLU5).
 */
describe("file panel labels (M3-08: size, kind, document language)", () => {
  test("FL1 fileSizeLabel: B, whole KB (at least 1), MB with one decimal; decimal comma in Indonesian, point in English", () => {
    const cases: [number, string, string][] = [
      [0, "0 B", "0 B"],
      [1, "1 B", "1 B"],
      [812, "812 B", "812 B"],
      [1023, "1023 B", "1023 B"],
      [1024, "1 KB", "1 KB"],
      [1536, "2 KB", "2 KB"],
      [348_160, "340 KB", "340 KB"],
      [1_047_500, "1023 KB", "1023 KB"],
      // 1048064 B = 1023.5 KB would round to 1024 KB: shown as MB.
      [1_048_064, "1 MB", "1 MB"],
      [1_572_864, "1,5 MB", "1.5 MB"],
      [10_485_760, "10 MB", "10 MB"],
      [10_980_000, "10,5 MB", "10.5 MB"],
      [52_428_800, "50 MB", "50 MB"],
    ];
    for (const [bytes, id, en] of cases) {
      assert.equal(fileSizeLabel(bytes, "id"), id, `${bytes} B (id)`);
      assert.equal(fileSizeLabel(bytes, "en"), en, `${bytes} B (en)`);
    }
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.equal(fileSizeLabel(bad, "id"), "0 B", `${bad}`);
    }
    assert.equal(fileFormatLabel(10_485_760, "id"), "PDF · 10 MB");
    assert.equal(fileFormatLabel(1_572_864, "id"), "PDF · 1,5 MB");
    assert.equal(fileFormatLabel(1_572_864, "en"), "PDF · 1.5 MB");
  });

  test("FL2 kind and document language labels follow the page locale; every kind has a label in both locales; no Cover", () => {
    const kinds = ["preview", "full_document", "appendix", "dataset", "supplementary", "other"] as const;
    assert.deepEqual(Object.keys(dictionaries.id.files.kinds).sort(), [...kinds].sort(), "id kinds");
    assert.deepEqual(Object.keys(dictionaries.en.files.kinds).sort(), [...kinds].sort(), "en kinds");
    assert.equal(fileKindLabel("full_document", "id"), "Dokumen lengkap");
    assert.equal(fileKindLabel("full_document", "en"), "Full document");
    assert.equal(fileKindLabel("appendix", "id"), "Lampiran");
    assert.equal(fileKindLabel("appendix", "en"), "Appendix");
    for (const locale of LOCALES) {
      const labels = kinds.map((kind) => fileKindLabel(kind, locale));
      assert.equal(new Set(labels).size, kinds.length, `${locale}: kind labels are distinct`);
      assert.equal(labels.every((label) => label.trim().length > 0), true, `${locale}: no empty label`);
    }
    // The document language is named by its own name, whatever the page language.
    assert.equal(fileLanguageLabel("id", "id"), "Bahasa Indonesia");
    assert.equal(fileLanguageLabel("en", "id"), "English");
    assert.equal(fileLanguageLabel("id", "en"), "Bahasa Indonesia");
    assert.equal(fileLanguageLabel("en", "en"), "English");
    assert.equal(dictionaries.id.files.download, "Unduh PDF");
    assert.equal(dictionaries.en.files.download, "Download PDF");
    assert.equal(dictionaries.id.files.downloadRegistered, "Unduh PDF (perlu akun)");
    assert.equal(dictionaries.en.files.downloadRegistered, "Download PDF (account required)");
    assert.equal(dictionaries.id.files.previewNote, "Unduhan aktif setelah publikasi diterbitkan.");
    assert.equal(dictionaries.en.files.previewNote, "Downloads become active once the publication is published.");
  });

  test("FL3 file panel rows (M5-04, DECISIONS §2.19 decision 4): a registered row has the Terdaftar/Registered badge, data-file-access, the locked label on an outline button; a public row has none; preview has no link; the same HTML for every visitor", () => {
    const row = (id: number, access?: PanelFile["access"]): PanelFile => ({
      id,
      label: `Berkas ${id}`,
      kind: "full_document",
      language: "id",
      sizeBytes: 1_572_864,
      downloadPath: `/api/files/${id}/download`,
      access,
    });
    const files = [row(1, "public"), row(2, "registered"), row(3)];
    const render = (locale: "id" | "en", preview = false) =>
      renderToStaticMarkup(createElement(PublicationFiles, { files, locale, preview }));

    for (const [locale, badge, locked, open] of [
      ["id", "Terdaftar", "Unduh PDF (perlu akun)", "Unduh PDF"],
      ["en", "Registered", "Download PDF (account required)", "Download PDF"],
    ] as const) {
      const html = render(locale);
      assert.equal(html, render(locale), `${locale}: deterministic, no session input`);
      const rows = html.split("<li ").slice(1);
      assert.equal(rows.length, 3);
      assert.equal(rows[1].includes('data-file-access="registered"'), true, `${locale}: registered row marked`);
      assert.equal(rows[1].includes(badge), true, `${locale}: badge`);
      assert.equal(rows[1].includes(locked), true, `${locale}: locked label`);
      assert.equal(rows[1].includes("btn-outline-dark"), true, `${locale}: outline button`);
      assert.equal(rows[1].includes('href="/api/files/2/download"'), true, `${locale}: same download link`);
      for (const index of [0, 2]) {
        assert.equal(rows[index].includes("data-file-access"), false, `${locale}: row ${index} not locked`);
        assert.equal(rows[index].includes(badge), false, `${locale}: row ${index} has no badge`);
        assert.equal(rows[index].includes("btn-primary"), true, `${locale}: row ${index} primary button`);
        assert.equal(rows[index].includes(`>${open}<`), true, `${locale}: row ${index} label`);
      }
      assert.equal(html.includes("sb-"), false);
      assert.equal(html.includes("X-Amz"), false);
    }

    const preview = render("id", true);
    assert.equal(preview.includes("href="), false, "preview: no links");
    assert.equal(preview.includes("Terdaftar"), true, "preview: the registered badge stays");
    assert.equal(preview.includes("Unduh PDF"), false, "preview: no download text");
  });
});
