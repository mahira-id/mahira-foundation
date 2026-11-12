import type { Publication } from "@/payload/payload-types";

/**
 * Homepage view model (M3-04, DECISIONS §2.7). Pure: no I/O, no Payload
 * import at runtime. lib/cms/public-content.ts reads the CMS and maps the
 * documents through these functions; app/(site)/page.tsx renders the plan.
 */
export const HOME_PUBLICATION_LIMIT = 5; // lead + 4
export const HOME_LATEST_LIMIT = 4;

export type HomePublication = {
  slug: string;
  title: string;
  summary: string;
  typeName: string | null;
  topicName: string | null;
  authorNames: string;
  accessLevel: Publication["accessLevel"];
  publishedAt: string | null;
  dateLabel: string | null;
  year: string | null;
};

export type HomeTopic = { slug: string; name: string; description: string | null };

export type HomepageData =
  | { status: "off" }
  | { status: "error" }
  | { status: "ok"; publications: HomePublication[]; topics: HomeTopic[] };

export type HomepagePlan = {
  notice: "empty" | "error" | null;
  lead: HomePublication | null;
  latest: HomePublication[];
  topics: HomeTopic[];
};

/** A relation as the Local API returns it: an id when not populated, else the (selected) document. */
type NamedRelation = number | { name?: string | null } | null | undefined;
type AuthorRelation = number | { displayName?: string | null } | null | undefined;

/** The publication fields the homepage query selects (lib/cms/homepage-query.ts). */
export type HomePublicationDoc = {
  slug: string;
  title: string;
  summary?: string | null;
  accessLevel: Publication["accessLevel"];
  publicationType?: NamedRelation;
  topics?: NamedRelation[] | null;
  authors?: AuthorRelation[] | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

/** The topic fields the homepage query selects. */
export type HomeTopicDoc = {
  slug: string;
  name?: string | null;
  description?: string | null;
  isActive?: boolean | null;
};

// P9 A: "28 Okt 2026", in WIB (dates from the admin are stored in UTC).
const DATE_FORMAT = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const YEAR_FORMAT = new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "Asia/Jakarta" });

export function formatPublicationDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function publicationYear(iso: string): string {
  return YEAR_FORMAT.format(new Date(iso));
}

function nonEmpty(value: string | null | undefined): string | null {
  return value && value.trim() ? value : null;
}

function relationName(value: NamedRelation): string | null {
  if (!value || typeof value === "number") return null;
  return nonEmpty(value.name);
}

function authorName(value: AuthorRelation): string | null {
  if (!value || typeof value === "number") return null;
  return nonEmpty(value.displayName);
}

/**
 * Type and topic labels show even when the term is inactive (P10 A); the
 * primary topic is topics[0] (DEC-003). Without publishedAt no date is shown:
 * createdAt is not a publication date (P4b (i)).
 */
export function toHomePublication(doc: HomePublicationDoc): HomePublication {
  const publishedAt = nonEmpty(doc.publishedAt);
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary ?? "",
    typeName: relationName(doc.publicationType),
    topicName: relationName(doc.topics?.[0]),
    authorNames: (doc.authors ?? [])
      .map(authorName)
      .filter((name): name is string => name !== null)
      .join(", "),
    accessLevel: doc.accessLevel,
    publishedAt,
    dateLabel: publishedAt ? formatPublicationDate(publishedAt) : null,
    year: publishedAt ? publicationYear(publishedAt) : null,
  };
}

const TOPIC_COLLATOR = new Intl.Collator("id");

/** "Bidang kerja" (P10 A): active topics with an Indonesian name, sorted by name. */
export function toHomeTopics(docs: HomeTopicDoc[]): HomeTopic[] {
  const topics: HomeTopic[] = [];
  for (const doc of docs) {
    const name = nonEmpty(doc.name);
    if (doc.isActive !== true || !name) continue;
    topics.push({ slug: doc.slug, name, description: nonEmpty(doc.description) });
  }
  return topics.sort((a, b) => TOPIC_COLLATOR.compare(a.name, b.name));
}

/** Blocks of `/` per state (P1 A, P3 A, P4a A): the lead is never repeated in the index. */
export function planHomepage(data: HomepageData): HomepagePlan {
  if (data.status === "off") return { notice: "empty", lead: null, latest: [], topics: [] };
  if (data.status === "error") return { notice: "error", lead: null, latest: [], topics: [] };
  const [lead, ...rest] = data.publications;
  if (!lead) return { notice: "empty", lead: null, latest: [], topics: data.topics };
  return { notice: null, lead, latest: rest.slice(0, HOME_LATEST_LIMIT), topics: data.topics };
}

/** Server log label of a failed read (P3 A): the error name only, never its message (host, user, URI). */
export function readErrorLabel(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
