/**
 * YouTube sources of Learning Hub resources (M3-11, DECISIONS §2.16
 * decision 8A). Pure, no import at all, so the Payload config
 * (payload/hooks/learning-resources.ts) and the pages share it.
 *
 * Trust boundary: the editor pastes a URL in the admin. The save hook keeps
 * only the video or playlist ID that parseYouTubeSource extracts from an
 * allowed YouTube host; anything else is refused. Pages never render a
 * stored URL: every YouTube URL (embed, watch link, thumbnail) is built
 * here from a validated ID. No YouTube API (no key, no duration).
 */
export type YouTubeKind = "video" | "playlist";

/** A YouTube video ID: 11 characters of [A-Za-z0-9_-]. */
export const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** A YouTube playlist ID (PL…, UU…, OL…, RD…): 10 to 64 characters of [A-Za-z0-9_-]. */
export const YOUTUBE_PLAYLIST_ID = /^[A-Za-z0-9_-]{10,64}$/;

/** Longest URL the parser reads; a longer input is refused. */
export const MAX_SOURCE_LENGTH = 2048;

/** Exact host names (after URL parsing, lower case); no other host, no sub-domain wildcard. */
export const YOUTUBE_HOSTS: ReadonlySet<string> = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Path prefixes of a single video on youtube.com / youtube-nocookie.com: `/<prefix>/<id>`. */
const VIDEO_PATH_PREFIXES = new Set(["embed", "shorts", "live"]);

/**
 * The path segment of a playlist embed (`/embed/videoseries?list=…`). It
 * has the shape of a video ID (11 characters) but is never one, so a
 * playlist embed URL saved as a video is refused instead of being stored
 * as the ID `videoseries`.
 */
const PLAYLIST_EMBED_SEGMENT = "videoseries";

export function isYouTubeId(kind: YouTubeKind, value: unknown): value is string {
  if (typeof value !== "string") return false;
  return kind === "video" ? YOUTUBE_VIDEO_ID.test(value) && value !== PLAYLIST_EMBED_SEGMENT : YOUTUBE_PLAYLIST_ID.test(value);
}

/** The only value of a query parameter, or null when it is missing or repeated. */
function single(params: URLSearchParams, name: string): string | null {
  const values = params.getAll(name);
  return values.length === 1 ? (values[0] ?? null) : null;
}

function videoIdOf(url: URL): string | null {
  const segments = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "youtu.be") return segments.length === 1 ? (segments[0] ?? null) : null;
  if (segments.length === 1 && segments[0] === "watch") return single(url.searchParams, "v");
  if (segments.length === 2 && VIDEO_PATH_PREFIXES.has(segments[0] ?? "")) return segments[1] ?? null;
  return null;
}

/**
 * The video or playlist ID of an editor's input, or null when it is not
 * one. Accepted: the bare ID itself, or an `http(s)` URL of at most
 * MAX_SOURCE_LENGTH characters, without user info or port, on one of
 * YOUTUBE_HOSTS:
 * - video: `/watch?v=<id>`, `/embed/<id>`, `/shorts/<id>`, `/live/<id>`,
 *   `youtu.be/<id>`;
 * - playlist: the `list=<id>` parameter (`/playlist?list=…`,
 *   `/watch?v=…&list=…`, `/embed/videoseries?list=…`).
 * The ID must then match YOUTUBE_VIDEO_ID (and not be `videoseries`) or
 * YOUTUBE_PLAYLIST_ID.
 */
export function parseYouTubeSource(kind: YouTubeKind, input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (value === "" || value.length > MAX_SOURCE_LENGTH) return null;
  if (isYouTubeId(kind, value)) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username !== "" || url.password !== "" || url.port !== "") return null;
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  const id = kind === "video" ? videoIdOf(url) : single(url.searchParams, "list");
  return isYouTubeId(kind, id) ? id : null;
}

/** The privacy-enhanced embed URL (loaded only after the visitor clicks play), or null for an invalid ID. */
export function embedUrl(kind: YouTubeKind, id: unknown): string | null {
  if (!isYouTubeId(kind, id)) return null;
  return kind === "video"
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
    : `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1`;
}

/** The "Tonton di YouTube" link, or null for an invalid ID. */
export function watchUrl(kind: YouTubeKind, id: unknown): string | null {
  if (!isYouTubeId(kind, id)) return null;
  return kind === "video" ? `https://www.youtube.com/watch?v=${id}` : `https://www.youtube.com/playlist?list=${id}`;
}

/**
 * Thumbnail of a video from YouTube's image server (no API key), or null
 * for an invalid ID. The browser loads it directly from Google (IP visible,
 * no cookie; note for the privacy policy, M4-02). Playlists have no keyless
 * thumbnail URL: they use an uploaded cover or the typographic cover.
 */
export function videoThumbnailUrl(id: unknown): string | null {
  return isYouTubeId("video", id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
