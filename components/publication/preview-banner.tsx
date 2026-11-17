import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { PREVIEW_EXIT_PATH } from "@/lib/publications/preview";

type PreviewBannerProps = { locale: Locale } & (
  | { id: number; slug: string; about?: undefined }
  | { about: true; id?: undefined; slug?: undefined }
);

/**
 * Banner of the staff draft preview (M3-05, DECISIONS §2.11 P11 A; the
 * About page since M3-09, DECISIONS §2.15 decision 7B): shown only when the
 * page read the latest version for a verified staff session. The exit is a
 * native POST form (a full page load, no client router cache involved,
 * DECISIONS §2.10) to the exit handler, which disables Draft Mode and goes
 * to the live public page, or to the edit page in /admin when there is none
 * (M3-05b). A publication posts `id`, `locale` and `slug`; the About page
 * posts `about` (its locale) and `locale`.
 */
export function PreviewBanner(props: PreviewBannerProps) {
  const { locale } = props;
  const labels = getDictionary(locale).preview;
  return (
    <aside className="border-b border-brand-200 bg-brand-50" data-preview-banner role="status">
      <div className="container-editorial flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">{labels.notice}</p>
        <form action={PREVIEW_EXIT_PATH} method="post">
          {props.about ? <input name="about" type="hidden" value={locale} /> : <input name="id" type="hidden" value={props.id} />}
          <input name="locale" type="hidden" value={locale} />
          {props.about ? null : <input name="slug" type="hidden" value={props.slug} />}
          <button className="btn btn-outline-dark" type="submit">
            {labels.exit}
          </button>
        </form>
      </div>
    </aside>
  );
}
