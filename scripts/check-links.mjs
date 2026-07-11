#!/usr/bin/env node
/**
 * Weekly link checker for the verified resource index (also runnable locally:
 * `node scripts/check-links.mjs`). Every URL in lib/resource-index.json is
 * fetched; hard failures (404/410, DNS/network errors) fail the run so a CI
 * badge/alert tells us the index needs repair. Bot-blocking statuses
 * (403/405/429/999) are warnings only — the link usually works in a browser.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const index = JSON.parse(readFileSync(join(here, "../lib/resource-index.json"), "utf8"));

const WARN_STATUSES = new Set([403, 405, 429, 999]);

async function check(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LearnXLinkCheck/1.0)" },
    });
    if (res.status >= 400) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LearnXLinkCheck/1.0)" },
      });
    }
    return { status: res.status };
  } catch (error) {
    return { status: 0, error: String(error).slice(0, 120) };
  } finally {
    clearTimeout(timeout);
  }
}

const results = await Promise.all(
  index.map(async (entry) => ({ entry, result: await check(entry.url) }))
);

let failures = 0;
let warnings = 0;
for (const { entry, result } of results) {
  if (result.status >= 200 && result.status < 400) {
    console.log(`ok    ${entry.id} (${result.status})`);
  } else if (WARN_STATUSES.has(result.status)) {
    warnings++;
    console.log(`WARN  ${entry.id} (${result.status}) ${entry.url} — likely bot-blocked, verify manually`);
  } else {
    failures++;
    console.log(`FAIL  ${entry.id} (${result.status || result.error}) ${entry.url}`);
  }
}

console.log(`\n${index.length} links checked: ${failures} failed, ${warnings} warnings`);
if (failures > 0) process.exit(1);
