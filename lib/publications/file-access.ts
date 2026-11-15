/**
 * Effective access of a publication file (M3-08, DECISIONS §2.14 item 3;
 * DEC-011). Pure: no I/O, no Payload import at runtime.
 *
 * The effective level is the stricter of the publication and the file; a
 * file set looser than its publication has no effect. In M3-08 only a file
 * whose effective level is `public` is shown and downloadable; `registered`
 * and `subscriber` files stay hidden until M5/M7. Anything unknown or
 * missing is treated as the strictest case (deny by default).
 */
export type AccessLevel = "public" | "registered" | "subscriber";

const RANK: Record<AccessLevel, number> = { public: 0, registered: 1, subscriber: 2 };

export function isAccessLevel(value: unknown): value is AccessLevel {
  return value === "public" || value === "registered" || value === "subscriber";
}

/** The stricter of two levels (public < registered < subscriber); an unknown value gives `subscriber`. */
export function stricterAccess(publication: unknown, file: unknown): AccessLevel {
  if (!isAccessLevel(publication) || !isAccessLevel(file)) return "subscriber";
  return RANK[file] > RANK[publication] ? file : publication;
}

/** The file fields the decision needs, as the Local API returns them. */
export type FileAccessFacts = {
  status?: unknown;
  mimeType?: unknown;
  accessLevel?: unknown;
};

/**
 * True when visitors may download the file in M3-08: the file is `ready`, a
 * PDF, and the stricter of the publication's and the file's level is
 * `public`. Whether the publication itself is live (published + public) is
 * checked by the read (PUBLIC_PUBLICATION_READ), not here.
 */
export function isPublicDownload(publicationAccess: unknown, file: FileAccessFacts): boolean {
  return (
    file.status === "ready" &&
    file.mimeType === "application/pdf" &&
    stricterAccess(publicationAccess, file.accessLevel) === "public"
  );
}
