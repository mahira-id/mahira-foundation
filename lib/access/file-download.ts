import { loginHref } from "@/lib/auth/routes";
import { readReturnPath } from "@/lib/auth/validation";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";
import type { FileAccessFacts } from "@/lib/publications/file-access";

import { ANONYMOUS, evaluateFileAccess, requiredLevel, type Principal } from "./evaluator";

/**
 * The decision of `GET /api/files/{fileId}/download` (M3-08; M5-04,
 * DECISIONS §2.18 decisions 11 and 12; ACCESS-POLICY §8 steps 1–9 and 11).
 * No I/O of its own: lib/cms/public-content.ts getFileDownload passes the
 * reads, the principal and the signer as ports, so unit tests use fakes.
 *
 * 1. The file, read anonymously (ready, Access Level `public` or, with
 *    accounts on, `registered`; payload/access/public-read.ts).
 * 2. The publication record whose live version lists it, read anonymously
 *    (published, same levels), with its locale and slug.
 * 3. The required level (requiredLevel: ready PDF, stricter of both).
 * 4. Only for `registered`: the principal (the public session; staff are
 *    anonymous, DEC-009). A `public` file never touches the session.
 * 5. The decision (evaluateFileAccess). Allowed: sign a 60 s URL, only
 *    now. Login needed: the login page of the publication's locale with the
 *    detail path as return path. Anything else: the same not-found.
 *
 * A failing read or signer throws (the route answers 503); a failing
 * principal counts as anonymous.
 */
export type LivePublicationFacts = { accessLevel?: unknown; locale?: unknown; slug?: unknown };

export type FileDownloadPorts<F extends FileAccessFacts> = {
  accountsEnabled: boolean;
  findFile(id: number): Promise<F | null>;
  findPublication(id: number): Promise<LivePublicationFacts | null>;
  principal(): Promise<Principal>;
  sign(file: F): Promise<string>;
};

export type FileDownloadDecision =
  | { kind: "redirect"; url: string }
  | { kind: "login"; location: string }
  | { kind: "not-found" };

const NOT_FOUND: FileDownloadDecision = { kind: "not-found" };

/** `/{locale}/login?next=<detail path>`; without a valid locale and slug the default locale's login page. */
export function loginLocation(publication: LivePublicationFacts): string {
  const { locale, slug } = publication;
  if (typeof locale !== "string" || !isLocale(locale)) return loginHref(DEFAULT_LOCALE, null);
  return loginHref(locale, typeof slug === "string" ? readReturnPath(`/${locale}/publications/${slug}`) : null);
}

async function principalOf(read: () => Promise<Principal>): Promise<Principal> {
  try {
    return await read();
  } catch {
    return ANONYMOUS;
  }
}

export async function decideFileDownload<F extends FileAccessFacts>(id: number, ports: FileDownloadPorts<F>): Promise<FileDownloadDecision> {
  const file = await ports.findFile(id);
  if (!file) return NOT_FOUND;
  const publication = await ports.findPublication(id);
  if (!publication) return NOT_FOUND;
  const level = requiredLevel(publication.accessLevel, file, { accountsEnabled: ports.accountsEnabled });
  if (level === null) return NOT_FOUND;
  const principal = level === "public" ? ANONYMOUS : await principalOf(ports.principal);
  const decision = evaluateFileAccess(level, principal);
  if (!decision.allowed) {
    return decision.reason === "authentication_required" ? { kind: "login", location: loginLocation(publication) } : NOT_FOUND;
  }
  return { kind: "redirect", url: await ports.sign(file) };
}
