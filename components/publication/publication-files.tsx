import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { PublicationFileItem } from "@/lib/publications/detail-view";
import { fileFormatLabel, fileKindLabel, fileLanguageLabel } from "@/lib/publications/file-labels";

/**
 * File panel of the publication detail page (M3-08, DECISIONS §2.14 item 7).
 * Only the files visitors may download reach it (publicFiles), so there is
 * no locked state: restricted files are hidden until M5. No files, no panel.
 * Each row: label, kind, document language, "PDF · size" and a plain link to
 * the download route (works without JavaScript; the route checks access
 * again on every request). In the staff draft preview (`preview`) the files
 * show without links and with a note that downloads activate after publishing.
 */
export function PublicationFiles({
  files,
  locale,
  preview = false,
}: {
  files: PublicationFileItem[];
  locale: Locale;
  preview?: boolean;
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
        {files.map((file) => (
          <li
            className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            data-publication-file={file.id}
            key={file.id}
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink [overflow-wrap:anywhere]">{file.label}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                <span>{fileKindLabel(file.kind, locale)}</span>
                <span aria-hidden="true">·</span>
                <span>
                  <span className="sr-only">{`${labels.documentLanguage}: `}</span>
                  {fileLanguageLabel(file.language, locale)}
                </span>
                <span aria-hidden="true">·</span>
                <span>{fileFormatLabel(file.sizeBytes, locale)}</span>
              </p>
            </div>
            {preview ? null : (
              <a className="btn btn-primary shrink-0" href={file.downloadPath}>
                {labels.download}
                <span className="sr-only">{`: ${file.label}`}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
      {preview ? (
        <p className="mt-4 text-sm text-muted" data-files-preview-note>
          {labels.previewNote}
        </p>
      ) : null}
    </section>
  );
}
