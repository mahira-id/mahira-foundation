import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { PREVIEW_EXIT_PATH } from "@/lib/publications/preview";

/**
 * Banner of the staff draft preview (M3-05, DECISIONS §2.11 P11 A): shown
 * only when the detail page read the latest version for a verified staff
 * session. The exit is a native POST form (a full page load, no client
 * router cache involved, DECISIONS §2.10) to the exit handler, which
 * disables Draft Mode and returns to this publication's URL.
 */
export function PreviewBanner({ locale, slug }: { locale: Locale; slug: string }) {
  const labels = getDictionary(locale).preview;
  return (
    <aside className="border-b border-brand-200 bg-brand-50" data-preview-banner role="status">
      <div className="container-editorial flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">{labels.notice}</p>
        <form action={PREVIEW_EXIT_PATH} method="post">
          <input name="locale" type="hidden" value={locale} />
          <input name="slug" type="hidden" value={slug} />
          <button className="btn btn-outline-dark" type="submit">
            {labels.exit}
          </button>
        </form>
      </div>
    </aside>
  );
}
