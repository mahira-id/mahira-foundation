import { AccessBadge } from "@/components/home/access-badge";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { PublicationFileItem } from "@/lib/publications/detail-view";
import { fileFormatLabel, fileKindLabel, fileLanguageLabel } from "@/lib/publications/file-labels";

/**
 * A panel row. `kind` and `access` (M5-04) are set for publication files
 * only; a toolkit file (M3-13) has neither (all toolkits are public) and its
 * row shows no kind label.
 */
export type PanelFile = Omit<PublicationFileItem, "kind" | "access"> & {
  kind?: PublicationFileItem["kind"];
  access?: PublicationFileItem["access"];
};

/**
 * File panel of the publication detail page (M3-08, DECISIONS §2.14 item 7).
 * Only files visitors may see reach it (publicFiles): `public` files and,
 * with accounts on, `registered` files in a locked state (M5-04, DECISIONS
 * §2.19 decision 4). `subscriber` files never arrive (hidden until M7). No
 * files, no panel. Each row: label, kind, document language, "PDF · size"
 * and a plain link to the download route (works without JavaScript; the
 * route checks access again on every request). A `registered` row adds the
 * "Terdaftar" badge, `data-file-access="registered"` and the link text
 * "Unduh PDF (perlu akun)" on an outline button, so the lock is carried by
 * text and style, not colour only. The HTML is the same for every visitor
 * (no page reads the session): the route answers a login redirect or the
 * download. In the staff draft preview (`preview`) the files show without
 * links (a registered row keeps its badge) and with a note that downloads
 * activate after publishing.
 * The toolkit detail page (M3-13) reuses it with its own `previewNote` and
 * `languageLabel`; publication callers pass neither.
 */
export function PublicationFiles({
  files,
  locale,
  preview = false,
  previewNote,
  languageLabel,
}: {
  files: PanelFile[];
  locale: Locale;
  preview?: boolean;
  previewNote?: string;
  languageLabel?: (language: Locale) => string;
}) {
  if (files.length === 0) return null;
  const labels = getDictionary(locale).files;
  return (
    <section
      aria-labelledby="publication-files-heading"
      className="mt-10 max-w-2xl"
      data-files-mode={preview ? "preview" : "live"}
      data-publication-files={files.length}
    >
      <h2 className="text-xl font-bold tracking-[-0.01em] text-ink" id="publication-files-heading">
        {labels.heading}
      </h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {files.map((file) => {
          const locked = file.access === "registered";
          return (
            <li
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              data-file-access={locked ? "registered" : undefined}
              data-publication-file={file.id}
              key={file.id}
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-ink [overflow-wrap:anywhere]">{file.label}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                  {file.kind ? (
                    <>
                      <span>{fileKindLabel(file.kind, locale)}</span>
                      <span aria-hidden="true">·</span>
                    </>
                  ) : null}
                  <span>
                    <span className="sr-only">{`${labels.documentLanguage}: `}</span>
                    {/* The endonym carries the document's lang; a custom label is in the page language and must not. */}
                    <span lang={languageLabel ? undefined : file.language}>
                      {languageLabel ? languageLabel(file.language) : fileLanguageLabel(file.language, locale)}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{fileFormatLabel(file.sizeBytes, locale)}</span>
                  {locked ? <AccessBadge level="registered" locale={locale} /> : null}
                </p>
              </div>
              {preview ? null : (
                <a
                  className={`btn shrink-0 ${locked ? "btn-outline-dark" : "btn-primary"}`}
                  href={file.downloadPath}
                >
                  {locked ? labels.downloadRegistered : labels.download}
                  <span className="sr-only">{`: ${file.label}`}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {preview ? (
        <p className="mt-4 text-sm text-muted" data-files-preview-note>
          {previewNote ?? labels.previewNote}
        </p>
      ) : null}
    </section>
  );
}
