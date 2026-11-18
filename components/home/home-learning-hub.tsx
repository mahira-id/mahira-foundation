import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { SectionHeader } from "@/components/home/section-header";
import { ArrowIcon } from "@/components/ui/icons";
import { getHomepageLearningHub, getLearningHubHref } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * The Learning Hub on the homepage `/` (M3-12, DECISIONS §2.16 decision
 * 11A): a block with up to three newest Indonesian resources and a link to
 * `/id/learning-hub`, and a menu item in the header and footer. All of it
 * exists only while the Indonesian catalog exists (at least one visible
 * resource); otherwise nothing is rendered, so the homepage is unchanged
 * (DECISIONS §2.7 P2 A, gate G1). Request-time reads inside Suspense (the
 * homepage shell stays static, a publish shows without a deploy); a failed
 * read or the CMS off renders nothing (both read functions never throw). The
 * homepage is Indonesian only, so the texts come from the `id` dictionary.
 */
const labels = getDictionary("id").learningHub;

async function HomeLearningHubContent() {
  await connection();
  const hub = await getHomepageLearningHub();
  if (!hub) return null;
  return (
    <section aria-labelledby="learning-hub-heading" className="section-space border-t border-line bg-white" data-home-learning-hub id="learning-hub">
      <div className="container-editorial">
        <SectionHeader
          action={
            <Link
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 transition-colors hover:text-brand-900"
              data-home-learning-hub-link
              href={hub.href}
            >
              {labels.viewAll}
              <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
          }
          description={hub.intro[0]}
          id="learning-hub-heading"
          label={labels.navLabel}
          title={hub.title}
        />
        <div className="mt-10 grid lg:grid-cols-12 lg:gap-8">
          <ul className="lg:col-span-9 lg:col-start-4">
            {hub.cards.map((card) => (
              <li className="border-b border-line py-6 first:pt-0 last:border-b-0" data-home-learning-card={card.type} key={card.id}>
                <p className="eyebrow text-brand-700">{labels.types[card.type]}</p>
                <h3 className="mt-3 text-xl font-bold tracking-[-0.01em] text-ink">{card.title}</h3>
                {card.summary ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{card.summary}</p> : null}
                {card.materialLanguage ? <p className="mt-3 text-sm font-semibold text-ink-soft">{labels.materialLanguage[card.materialLanguage]}</p> : null}
                {card.href ? (
                  <Link className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900" href={card.href}>
                    {card.type === "toolkit" ? labels.readToolkit : labels.read}
                  </Link>
                ) : card.youtube ? (
                  <a
                    className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900"
                    href={card.youtube.watchUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {labels.watch}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The block, between the CMS sections and `#tentang`. */
export function HomeLearningHub() {
  return (
    <Suspense fallback={null}>
      <HomeLearningHubContent />
    </Suspense>
  );
}

type NavVariant = "desktop" | "mobile" | "footer";

async function HomeNavLearningHubContent({ variant }: { variant: NavVariant }) {
  await connection();
  const href = await getLearningHubHref("id");
  if (!href) return null;
  if (variant === "desktop") {
    return (
      <Link className="text-[0.8125rem] font-semibold text-white underline-offset-4 transition-colors hover:underline" data-home-nav-learning-hub href={href}>
        {labels.navLabel}
      </Link>
    );
  }
  if (variant === "mobile") {
    return (
      <li>
        <Link className="flex items-center justify-between py-4 text-base font-semibold text-white" data-home-nav-learning-hub href={href}>
          {labels.navLabel}
          <ArrowIcon className="h-4 w-4 text-white/60" />
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link className="text-sm text-silver transition-colors hover:text-white" data-home-nav-learning-hub href={href}>
        {labels.navLabel}
      </Link>
    </li>
  );
}

/**
 * The menu item of the homepage header (desktop and mobile list) and footer:
 * passed to `Header` / `Footer` as a slot before "Tentang", only with the CMS on.
 */
export function HomeNavLearningHub({ variant }: { variant: NavVariant }) {
  return (
    <Suspense fallback={null}>
      <HomeNavLearningHubContent variant={variant} />
    </Suspense>
  );
}
