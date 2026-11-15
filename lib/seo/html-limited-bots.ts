/**
 * User agents that get Next's blocking render (M3-07 item 8, DECISIONS
 * §2.13; `htmlLimitedBots` in next.config.ts). For these agents Next 16.4.4
 * skips the static shell of a route (`shouldForceDynamicPPRRender` in
 * next/dist/build/templates/app-page-runtime.js), so a notFound() of the
 * publication detail answers HTTP 404 and a permanentRedirect() HTTP 308
 * with `Location`, instead of HTTP 200 with the shell. Every other agent
 * keeps the shell and its HTTP 200 (DECISIONS §2.11 P7 A as amended).
 *
 * Setting the option replaces Next's default list, so this is that list
 * (`HTML_LIMITED_BOT_UA_RE` in next/dist/shared/lib/router/utils/html-bots.js,
 * Next 16.4.4) plus `Googlebot`, which Next treats as a JavaScript-running
 * crawler and leaves out. Next keeps only the pattern source and matches it
 * case-insensitively. Upgrade review item (DEC-006, ENVIRONMENTS §3.1): on
 * every Next upgrade tests/unit/html-limited-bots.test.ts compares the copy
 * with the installed list. No imports, because next.config.ts loads this file.
 */
export const NEXT_DEFAULT_HTML_LIMITED_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";

export const HTML_LIMITED_BOTS = new RegExp(`${NEXT_DEFAULT_HTML_LIMITED_BOTS}|Googlebot`, "i");
