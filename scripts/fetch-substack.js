#!/usr/bin/env node
/**
 * Fetch Substack RSS, parse to JSON, write to data/substack.json
 */
const fetch = require("node-fetch");
const { Parser } = require("xml2js");
const fs = require("fs");
const path = require("path");

const PUB = process.env.SUBSTACK_PUB || "parapowermapper"; // override via env if you like
const FEED_URL = `https://${PUB}.substack.com/feed`;
const OUT_PATH = path.join(__dirname, "..", "data", "substack.json");

(async () => {
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parser = new Parser();
    const { rss } = await parser.parseStringPromise(xml);
    const items = (rss.channel[0].item || []).map((item) => ({
      title: item.title[0],
      link: item.link[0],
      description: item.description[0],
      pubDate: item.pubDate[0],
    }));
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(items, null, 2), "utf8");
    console.log(`✅ Wrote ${items.length} posts to data/substack.json`);
  } catch (err) {
    console.error(`❌ Failed fetching Substack feed:`, err);
    process.exit(1);
  }
})();
