import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { ArrowIcon } from "@/components/ui/icons";
import { getAboutHref } from "@/lib/cms/public-content";

/**
 * "Selengkapnya tentang Mahira" under the homepage `#tentang` text (M3-09,
 * DECISIONS §2.15 decision 5): a link to `/id/about`, shown only while the
 * Indonesian About page is visible to visitors. The section itself stays as
 * it was. Request-time read inside Suspense (the homepage shell stays
 * static); a failed read renders nothing.
 */
async function HomeAboutLinkContent() {
  await connection();
  const href = await getAboutHref("id");
  if (!href) return null;
  return (
    <p className="mt-6">
      <Link
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white underline-offset-4 hover:underline"
        data-home-about-link
        href={href}
      >
        Selengkapnya tentang Mahira
        <ArrowIcon className="h-3.5 w-3.5" />
      </Link>
    </p>
  );
}

export function HomeAboutLink() {
  return (
    <Suspense fallback={null}>
      <HomeAboutLinkContent />
    </Suspense>
  );
}
