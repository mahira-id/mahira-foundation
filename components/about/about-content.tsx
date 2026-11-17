import type { ReactNode } from "react";

import type { AboutCta, AboutList, AboutPage, AboutSection } from "@/lib/about/about-view";

/**
 * Content of the About page `/{locale}/about` (M3-09, DECISIONS §2.15
 * decisions 2, 10, 14). Server component, no data access: the page passes
 * the view model of lib/about/about-view.ts. Structure (kept by any
 * restyling): `<main id="main" data-about-page="<locale>" data-preview>`
 * with the optional preview banner first, one H1 (the hero title), one
 * `<section data-about-section>` per section (`id` = its anchor) with an H2
 * (the heading, else the label; the label above it when both are set),
 * optional `<blockquote data-about-quote>`, lists as `<ol>`/`<ul>`
 * `data-about-list="numbered|bulleted"` with an optional H3, and CTA links
 * `data-about-cta`. All text is plain (no markup from the CMS).
 */
function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </>
  );
}

function Ctas({ ctas }: { ctas: AboutCta[] }) {
  if (ctas.length === 0) return null;
  return (
    <div data-about-ctas>
      {ctas.map((cta, index) => (
        <a data-about-cta href={cta.href} key={index}>
          {cta.label}
        </a>
      ))}
    </div>
  );
}

function List({ list }: { list: AboutList }) {
  const items = list.items.map((item, index) => (
    <li key={index}>
      {item.title ? (
        <p data-about-item-title>
          <strong>{item.title}</strong>
        </p>
      ) : null}
      {item.subtitle ? (
        <p data-about-item-subtitle>
          <strong>{item.subtitle}</strong>
        </p>
      ) : null}
      {item.text ? <p>{item.text}</p> : null}
    </li>
  ));
  return (
    <div data-about-list-block>
      {list.heading ? <h3>{list.heading}</h3> : null}
      <Paragraphs items={list.intro} />
      {list.style === "numbered" ? <ol data-about-list="numbered">{items}</ol> : <ul data-about-list="bulleted">{items}</ul>}
    </div>
  );
}

function Section({ section }: { section: AboutSection }) {
  const heading = section.heading ?? section.label;
  return (
    <section data-about-section id={section.anchor ?? undefined}>
      {section.heading && section.label ? <p data-about-label>{section.label}</p> : null}
      <h2>{heading}</h2>
      <Paragraphs items={section.body} />
      {section.quote ? (
        <blockquote data-about-quote>
          <p>{section.quote}</p>
        </blockquote>
      ) : null}
      {section.lists.map((list, index) => (
        <List key={index} list={list} />
      ))}
      <Paragraphs items={section.outro} />
      <Ctas ctas={section.ctas} />
    </section>
  );
}

export function AboutContent({ about, preview, banner }: { about: AboutPage; preview: boolean; banner?: ReactNode }) {
  return (
    <main data-about-page={about.locale} data-preview={preview ? "true" : "false"} id="main">
      {banner}
      <header data-about-hero>
        {about.eyebrow ? <p data-about-eyebrow>{about.eyebrow}</p> : null}
        <h1>{about.title}</h1>
        <Paragraphs items={about.lead} />
        <Ctas ctas={about.ctas} />
      </header>
      {about.sections.map((section, index) => (
        <Section key={index} section={section} />
      ))}
    </main>
  );
}
