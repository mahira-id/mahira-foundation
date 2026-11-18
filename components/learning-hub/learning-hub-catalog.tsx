import { MahiraMark } from "@/components/brand/mahira";
import { LearningCard } from "@/components/learning-hub/learning-card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { CatalogPlan } from "@/lib/learning-hub/catalog-view";

/**
 * The Learning Hub catalog `/{locale}/learning-hub` (M3-12, DECISIONS §2.16
 * decision 10A). Server component, no data access: the page passes the plan
 * of lib/learning-hub/catalog-view.ts. Structure kept by any restyling
 * (asserted by tests/integration/learning-hub.test.ts): `<main id="main"
 * data-lh-page="catalog">`, one H1 (the global's title, else "Learning
 * Hub") with the intro, the toolkit section `section[data-lh-toolkits]`
 * only when it has cards (never before M3-13), then one
 * `section[data-lh-theme="<topic id>"]` per theme with an H2 (the Topic
 * name), the Topic description and its cards.
 */
export function LearningHubCatalog({ plan }: { plan: CatalogPlan }) {
  const labels = getDictionary(plan.locale).learningHub;
  return (
    <main data-lh-page="catalog" id="main">
      <header className="on-dark relative overflow-hidden bg-brand-500 text-white" data-lh-hero>
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 opacity-80" />
        <MahiraMark
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-1/2 hidden h-[36rem] w-auto -translate-y-1/2 text-white/[0.045] lg:block"
        />
        <div className="container-editorial relative pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28">
          <h1 className="max-w-4xl text-[clamp(2.25rem,5.4vw,4.75rem)] font-extrabold leading-[1] tracking-[-0.04em] text-balance">{plan.title}</h1>
          {plan.intro.length > 0 ? (
            <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-white sm:text-lg" data-lh-intro>
              {plan.intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative h-1 bg-brand-700">
          <span className="absolute inset-y-0 left-0 w-24 bg-orange" />
        </div>
      </header>
      {plan.toolkits.length > 0 ? (
        <section className="section-space bg-silver" data-lh-toolkits>
          <div className="container-editorial">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.875rem)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">{labels.toolkitHeading}</h2>
            {plan.toolkits.map((card) => (
              <LearningCard card={card} key={card.id} locale={plan.locale} />
            ))}
          </div>
        </section>
      ) : null}
      {plan.themes.map((theme, themeIndex) => (
        <section className={themeIndex % 2 === 0 ? "section-space bg-white" : "section-space bg-silver"} data-lh-theme={theme.topicId} key={theme.topicId}>
          <div className="container-editorial">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.875rem)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">{theme.name}</h2>
            {theme.description ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{theme.description}</p> : null}
            <div className="mt-8">
              {theme.cards.map((card) => (
                <LearningCard card={card} key={card.id} locale={plan.locale} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
