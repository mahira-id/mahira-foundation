import type { HomeTopic } from "@/lib/home/homepage-view";

/**
 * "Bidang kerja" of `/` (DECISIONS §2.7 P10 A): active topics, no links
 * until topic routes are decided (DEC-005).
 */
export function TopicIndex({ topics }: { topics: HomeTopic[] }) {
  return (
    <ul className="mt-10 grid gap-x-10 md:grid-cols-2">
      {topics.map((topic, index) => (
        <li className="flex gap-5 border-t border-line py-5" data-home-topic={topic.slug} key={topic.slug}>
          <span className="pt-1 text-xs font-bold tabular-nums text-brand-700">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>
            <span className="block text-lg font-bold tracking-[-0.02em] text-ink">{topic.name}</span>
            {topic.description ? (
              <span className="mt-1 block max-w-sm text-sm leading-relaxed text-muted">{topic.description}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
