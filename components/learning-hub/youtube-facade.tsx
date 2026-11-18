"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PlayIcon } from "@/components/ui/icons";
import type { ResourceCover } from "@/lib/learning-hub/catalog-view";

/**
 * Click-to-load YouTube player of a video or playlist card (M3-12, DECISIONS
 * §2.16 decision 8A). Before the click the page holds only a still image and
 * a play button: no iframe, so no request to YouTube for the player and no
 * cookie. The click swaps in a `youtube-nocookie.com` iframe with an
 * accessible title. The iframe source is the server-built `embedUrl` (from
 * the validated ID, never an editor URL); it is checked again here, so
 * anything that is not an embed on `www.youtube-nocookie.com` renders no
 * iframe. The still image of a video is YouTube's image server (the browser
 * contacts Google, no cookie; M4-02 privacy note); a playlist uses its
 * uploaded cover or the typographic cover passed as `fallback`.
 */
const EMBED_PREFIX = "https://www.youtube-nocookie.com/embed/";

export function YouTubeFacade({
  embedUrl,
  title,
  playLabel,
  thumbnailUrl,
  cover,
  fallback,
}: {
  embedUrl: string;
  /** Resource title: the iframe's accessible title. */
  title: string;
  /** Accessible name of the play button ("Putar: …"). */
  playLabel: string;
  thumbnailUrl: string | null;
  cover: ResourceCover | null;
  /** Typographic cover for a playlist without an image. */
  fallback: ReactNode;
}) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  // The play button is replaced by the player: keep keyboard focus in the page flow, on the player.
  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);
  const safe = embedUrl.startsWith(EMBED_PREFIX);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-ink" data-lh-player data-playing={playing ? "true" : "false"}>
      {playing && safe ? (
        <iframe
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          className="absolute inset-0 h-full w-full border-0"
          data-lh-iframe
          ref={frame}
          referrerPolicy="strict-origin-when-cross-origin"
          src={embedUrl}
          title={title}
        />
      ) : (
        <>
          {thumbnailUrl ? (
            <Image alt="" className="absolute inset-0 h-full w-full object-cover" fill sizes="(min-width: 1024px) 40vw, 100vw" src={thumbnailUrl} unoptimized />
          ) : cover ? (
            <Image alt="" className="absolute inset-0 h-full w-full object-cover" fill sizes="(min-width: 1024px) 40vw, 100vw" src={cover.url} unoptimized />
          ) : (
            <div className="absolute inset-0">{fallback}</div>
          )}
          {safe ? (
            <button
              aria-label={playLabel}
              className="group absolute inset-0 flex items-center justify-center"
              data-lh-play
              onClick={() => setPlaying(true)}
              type="button"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-700 transition-colors group-hover:bg-silver">
                <PlayIcon className="ml-1 h-6 w-6" />
              </span>
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
