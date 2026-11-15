import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { shouldServeStreamingMetadata } from "next/dist/server/lib/streaming-metadata";

import { HTML_LIMITED_BOTS, NEXT_DEFAULT_HTML_LIMITED_BOTS } from "../../lib/seo/html-limited-bots";
import nextConfig from "../../next.config";

/**
 * `htmlLimitedBots` (M3-07 item 8, DECISIONS §2.13): Next's default list +
 * Googlebot. Next keeps only the pattern source of the option and matches it
 * case-insensitively (`shouldServeStreamingMetadata`, the function that
 * decides whether a request gets the static shell); an agent that "does not
 * get streaming metadata" gets the blocking render and the real HTTP status.
 */
const AGENTS = {
  googlebot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  googlebotSmartphone:
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  googlebotImage: "Googlebot-Image/1.0",
  bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  adsbot: "AdsBot-Google (+http://www.google.com/adsbot.html)",
  twitterbot: "Twitterbot/1.0",
  facebook: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  chrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0",
  safariIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  node: "node",
} as const;
const CRAWLERS = ["googlebot", "googlebotSmartphone", "googlebotImage", "bingbot", "adsbot", "twitterbot", "facebook"] as const;
const BROWSERS = ["chrome", "firefox", "safariIphone", "node"] as const;

describe("lib/seo/html-limited-bots.ts and next.config.ts (M3-07 item 8)", () => {
  test("HB1 the copy of Next's default list equals the installed HTML_LIMITED_BOT_UA_RE (rerun on every Next upgrade)", () => {
    assert.equal(NEXT_DEFAULT_HTML_LIMITED_BOTS, HTML_LIMITED_BOT_UA_RE.source);
    assert.equal(HTML_LIMITED_BOTS.source, `${HTML_LIMITED_BOT_UA_RE.source}|Googlebot`);
  });

  test("HB2 with the configured pattern, crawlers get the blocking render and browsers keep the static shell", () => {
    for (const name of CRAWLERS) {
      assert.equal(shouldServeStreamingMetadata(AGENTS[name], HTML_LIMITED_BOTS.source), false, `${name}: blocking render`);
    }
    for (const name of BROWSERS) {
      assert.equal(shouldServeStreamingMetadata(AGENTS[name], HTML_LIMITED_BOTS.source), true, `${name}: static shell`);
    }
    // Why the option is set: Next's default list leaves Googlebot on the static shell (HTTP 200).
    assert.equal(shouldServeStreamingMetadata(AGENTS.googlebot, undefined), true, "googlebot with Next's default list");
    assert.equal(shouldServeStreamingMetadata(AGENTS.bingbot, undefined), false, "bingbot with Next's default list");
  });

  test("HB3 next.config.ts sets htmlLimitedBots to this pattern and turns on experimental.globalNotFound (item 9)", () => {
    assert.equal(nextConfig.htmlLimitedBots, HTML_LIMITED_BOTS);
    assert.equal(nextConfig.experimental?.globalNotFound, true);
  });
});
