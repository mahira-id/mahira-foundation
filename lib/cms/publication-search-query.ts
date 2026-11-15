import { sql } from "@payloadcms/db-postgres";

import type { Locale } from "@/lib/i18n/locales";
import { SEARCH_CONFIG } from "@/lib/publications/search-terms";

/**
 * Server-only. Full-text search of the publication index (M3-06, DEC-013,
 * ADR-0007, DECISIONS §2.12): the one raw SQL read of the public pages,
 * called only by getPublicationIndex in lib/cms/public-content.ts. It returns
 * publication ids and ranks, never text; the rows of the page still come
 * from the anonymous Local API.
 *
 * The document is built at query time (no stored column, no migration):
 * title (weight A), summary (B), and author names plus the topic and
 * publication type names in the route locale (C), with the text search
 * configuration of that locale. Body text and PDF content are not searched.
 *
 * Same guarantees as the Local API reads (PUBLIC_PUBLICATION_READ in
 * payload/access/public-read.ts, record `locale`, no fallback locale): only
 * the main `publications` row (never `_publications_v`, so a pending draft
 * is never searched) with `_status` published, access level public and the
 * route locale; taxonomy names only of that locale. Every value (locale,
 * configuration, query) is a bound parameter.
 */
type Sql = ReturnType<typeof sql>;

/** `drizzle.execute` of the Postgres adapter, or a fake in unit tests. */
export type SqlExecute = (query: Sql) => Promise<{ rows: unknown[] }>;

/**
 * One SELECT. ts_rank weights are {D, C, B, A} = {0.1, 0.2, 0.4, 1.0}:
 * title > summary > names (initial tuning, ADR-0007). Equal ranks are
 * ordered by planIndex (M3-05 order).
 */
export function buildSearchSql(locale: Locale, tsquery: string): Sql {
  const config = SEARCH_CONFIG[locale];
  return sql`
    SELECT d."id", ts_rank('{0.1,0.2,0.4,1.0}', d."document", d."query")::float8 AS "rank"
    FROM (
      SELECT
        p."id",
        q."query",
        setweight(to_tsvector(${config}::regconfig, coalesce(p."title", '')), 'A')
          || setweight(to_tsvector(${config}::regconfig, coalesce(p."summary", '')), 'B')
          || setweight(to_tsvector(${config}::regconfig, concat_ws(' ',
            (SELECT string_agg(a."display_name", ' ' ORDER BY r."order", r."id")
               FROM "publications_rels" r
               JOIN "authors" a ON a."id" = r."authors_id"
              WHERE r."parent_id" = p."id" AND r."path" = 'authors'),
            (SELECT string_agg(t."name", ' ' ORDER BY r."order", r."id")
               FROM "publications_rels" r
               JOIN "topics_locales" t ON t."_parent_id" = r."topics_id" AND t."_locale"::text = ${locale}
              WHERE r."parent_id" = p."id" AND r."path" = 'topics'),
            (SELECT string_agg(y."name", ' ' ORDER BY y."id")
               FROM "publication_types_locales" y
              WHERE y."_parent_id" = p."publication_type_id" AND y."_locale"::text = ${locale})
          )), 'C') AS "document"
      FROM "publications" p
      CROSS JOIN (SELECT to_tsquery(${config}::regconfig, ${tsquery}) AS "query") q
      WHERE p."locale"::text = ${locale}
        AND p."_status" = 'published'
        AND p."access_level" = 'public'
    ) d
    WHERE d."document" @@ d."query"
  `;
}

/**
 * Rank of every matching publication, by id. `tsquery` is the output of
 * toTsqueryText (lib/publications/search-terms.ts). Rows with an id that is
 * not a safe integer or a rank that is not a finite number are dropped.
 */
export async function findSearchRanks(execute: SqlExecute, locale: Locale, tsquery: string): Promise<Map<number, number>> {
  const result = await execute(buildSearchSql(locale, tsquery));
  const ranks = new Map<number, number>();
  for (const row of result.rows) {
    if (!row || typeof row !== "object") continue;
    const { id, rank } = row as { id?: unknown; rank?: unknown };
    if (typeof id !== "number" || !Number.isSafeInteger(id)) continue;
    if (typeof rank !== "number" || !Number.isFinite(rank)) continue;
    ranks.set(id, rank);
  }
  return ranks;
}
