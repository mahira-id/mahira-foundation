import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook } from "payload";
import { parseYouTubeSource, type YouTubeKind } from "../../lib/learning-hub/youtube";

const COLLECTION = "learning-resources";

const MESSAGES: Record<YouTubeKind, string> = {
  video:
    "Tempel URL video YouTube yang valid (mis. https://www.youtube.com/watch?v=…, https://youtu.be/…). Hanya youtube.com, youtu.be, dan youtube-nocookie.com yang diterima.",
  playlist:
    "Tempel URL playlist YouTube yang valid (mis. https://www.youtube.com/playlist?list=…). Hanya youtube.com, youtu.be, dan youtube-nocookie.com yang diterima.",
};

function kindOf(type: unknown): YouTubeKind | null {
  return type === "video" || type === "playlist" ? type : null;
}

/**
 * beforeChange of `learning-resources` (M3-11, DECISIONS §2.16 decision
 * 8A): the save boundary of the YouTube source. Runs on every save, drafts
 * included (Payload skips field validation on draft saves, so a field
 * `validate` alone would let a raw URL into a draft).
 * - A video or playlist: the pasted URL (or bare ID) becomes the ID that
 *   parseYouTubeSource extracts from an allowed YouTube host; anything else
 *   is refused with a ValidationError on `youtubeId`. Only the ID is stored.
 *   An empty value is stored as null (publishing then needs one: the field's
 *   `validate`).
 * - Any other type (guide, toolkit, none chosen yet): `youtubeId` is null.
 * - The save changes the type (video <-> playlist) and the stored ID is not
 *   replaced (not sent, or sent unchanged, as the admin form does): the ID
 *   is cleared, so a video ID never stays as a playlist ID or the reverse.
 * - Not sent in this save, type unchanged: the stored ID stays.
 */
export const normalizeYouTubeSource: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const sentType: unknown = data.type;
  const kind = kindOf(sentType ?? originalDoc?.type);
  if (!kind) return { ...data, youtubeId: null };
  const raw: unknown = data.youtubeId;
  const typeChanged = sentType !== undefined && sentType !== originalDoc?.type;
  if (raw === undefined) return typeChanged ? { ...data, youtubeId: null } : data;
  if (typeChanged && raw === originalDoc?.youtubeId) return { ...data, youtubeId: null };
  if (raw === null || (typeof raw === "string" && raw.trim() === "")) return { ...data, youtubeId: null };
  const id = parseYouTubeSource(kind, raw);
  if (id === null) {
    throw new ValidationError({ collection: COLLECTION, errors: [{ path: "youtubeId", message: MESSAGES[kind] }], req });
  }
  return { ...data, youtubeId: id };
};

/**
 * `publishedAt` of a resource is filled with the current time (UTC) when it
 * is saved as published and has no date yet, including when the save itself
 * clears it; staff may change it later. Same rule as publications (Owner
 * 2026-11-10, P3 B (i)); it orders the catalog and the homepage block.
 */
export const setResourcePublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const status = data._status ?? originalDoc?._status;
  const publishedAt = data.publishedAt !== undefined ? data.publishedAt : originalDoc?.publishedAt;
  if (status === "published" && !publishedAt) return { ...data, publishedAt: new Date().toISOString() };
  return data;
};
