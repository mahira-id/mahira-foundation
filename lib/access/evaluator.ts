import { stricterAccess, type FileAccessFacts } from "@/lib/publications/file-access";

/**
 * Server-side access evaluator of publication files (M5-03, DECISIONS §2.18
 * decisions 11, 12 and 14b; ACCESS-POLICY §6–§9, the illustrative contract
 * of §7 reduced to what M5 needs). Pure: no I/O, no clock, no Payload or
 * Supabase import; the download route (lib/access/file-download.ts) gives it
 * trusted facts read on the server.
 *
 * - Principal: only the public account counts. A Payload staff session is
 *   never read, so staff are `anonymous` here (DEC-009; staff open files in
 *   /admin). A public user carries one fact, whether Supabase Auth has
 *   confirmed the email (`email_confirmed_at`).
 * - Level: the stricter of the publication's and the file's Access Level
 *   (DEC-011, stricterAccess; an unknown value is `subscriber`), only for a
 *   ready PDF. `subscriber` has no download before M7, and `registered`
 *   none while public accounts are off: both give null, which the route
 *   answers with its 404.
 * - Decision: `public` allows everyone; `registered` allows a verified
 *   public user, asks an anonymous caller to log in (the route answers 303
 *   to the login page), and denies an unverified user like an unavailable
 *   resource (the route's 404). Anything else is denied (fail closed).
 */
export type Principal = { kind: "anonymous" } | { kind: "public_user"; emailVerified: boolean };

export const ANONYMOUS: Principal = { kind: "anonymous" };

/** Effective levels that have a download in M5. */
export type DownloadLevel = "public" | "registered";

export type AccessReason = "public_access" | "authenticated_access" | "authentication_required" | "resource_unavailable";

export type AccessDecision =
  | { allowed: true; reason: "public_access" | "authenticated_access" }
  | { allowed: false; reason: "authentication_required"; requiredAction: "login" }
  | { allowed: false; reason: "resource_unavailable" };

/**
 * The level a download of this file needs, or null when visitors can never
 * download it now (not ready, not a PDF, effective level `subscriber` or
 * unknown, or `registered` while accounts are off). Whether the
 * publication itself is live is checked by the read
 * (payload/access/public-read.ts), not here.
 */
export function requiredLevel(
  publicationAccess: unknown,
  file: FileAccessFacts,
  { accountsEnabled }: { accountsEnabled: boolean },
): DownloadLevel | null {
  if (file.status !== "ready" || file.mimeType !== "application/pdf") return null;
  const level = stricterAccess(publicationAccess, file.accessLevel);
  if (level === "public") return "public";
  if (level === "registered" && accountsEnabled) return "registered";
  return null;
}

/** The decision for one download; never reads anything itself. */
export function evaluateFileAccess(level: DownloadLevel, principal: Principal): AccessDecision {
  if (level === "public") return { allowed: true, reason: "public_access" };
  if (level !== "registered") return { allowed: false, reason: "resource_unavailable" };
  if (principal.kind === "anonymous") return { allowed: false, reason: "authentication_required", requiredAction: "login" };
  if (principal.kind === "public_user" && principal.emailVerified === true) return { allowed: true, reason: "authenticated_access" };
  return { allowed: false, reason: "resource_unavailable" };
}
