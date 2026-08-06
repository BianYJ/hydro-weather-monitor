import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "data/eisk-tides.json");
const BASE_URL = "https://www.eisk.cn";
const CATALOG_URL = `${BASE_URL}/Tides/332.html`;
const CONCURRENCY = Math.max(2, Math.min(24, Number(process.env.EISK_CONCURRENCY) || 12));

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function discoverStations(html) {
  const stations = [];
  const seen = new Set();
  const cityPattern = /<div class=["']city["']>([\s\S]*?)<\/div>/gi;
  for (const cityMatch of html.matchAll(cityPattern)) {
    const block = cityMatch[1];
    const firstLinkAt = block.search(/<a\b/i);
    const region = cleanText(firstLinkAt >= 0 ? block.slice(0, firstLinkAt) : "") || "其他地区";
    const linkPattern = /<a href=["']\/Tides\/(\d+)\.html["'][^>]*title=["']([^"']*?)潮汐表["'][^>]*>([^<]+)<\/a>/gi;
    for (const link of block.matchAll(linkPattern)) {
      if (seen.has(link[1])) continue;
      seen.add(link[1]);
      stations.push({ id: link[1], name: cleanText(link[3]) || cleanText(link[2]), region });
    }
  }
  if (!stations.length) throw new Error("未能从 Eisk 页面解析潮汐站目录");
  return stations.sort((a, b) => `${a.region}${a.name}`.localeCompare(`${b.region}${b.name}`, "zh-CN"));
}

function parseBigTides(html, stationId) {
  const days = [];
  const rowPattern = new RegExp(`<a href=["']\\/m\\/MiniTides\\/${stationId}\\.html\\?date=(\\d{4}-\\d{2}-\\d{2})["']>([\\s\\S]*?)<\\/a>`, "gi");
  for (const row of html.matchAll(rowPattern)) {
    const events = [];
    const eventPattern = /class=["']tide2["'][^>]*>\s*(\d{2}:\d{2})\s*<span[^>]*>\s*(满潮|干潮)\s*<\/span>\s*([\d.]+)米/gi;
    for (const event of row[2].matchAll(eventPattern)) {
      events.push({
        time: event[1],
        kind: event[2] === "满潮" ? "高潮" : "低潮",
        height: Number(event[3]),
      });
    }
    if (events.length >= 2) days.push({ date: row[1], events });
  }
  return days;
}

async function fetchText(url, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "hydro-weather-monitor/2.0 (+GitHub Pages tide sync)" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, 1200));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(OUTPUT, "utf8"));
  } catch {
    return null;
  }
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

const previous = await readPrevious();
const catalogHtml = await fetchText(CATALOG_URL, 3);
const catalog = discoverStations(catalogHtml);
let succeeded = 0;
let failed = 0;

const stations = await mapPool(catalog, CONCURRENCY, async (station, index) => {
  try {
    const html = await fetchText(`${BASE_URL}/BigTides/${station.id}`);
    const days = parseBigTides(html, station.id);
    if (!days.length) throw new Error("没有可用潮汐时次");
    succeeded += 1;
    if ((succeeded + failed) % 40 === 0) console.log(`同步进度 ${succeeded + failed}/${catalog.length}`);
    return { ...station, sourceUrl: `${BASE_URL}/Tides/${station.id}.html`, days };
  } catch (error) {
    failed += 1;
    const fallback = previous?.stations?.find((item) => item.id === station.id);
    if ((succeeded + failed) % 40 === 0) console.log(`同步进度 ${succeeded + failed}/${catalog.length}`);
    return {
      ...station,
      sourceUrl: `${BASE_URL}/Tides/${station.id}.html`,
      days: fallback?.days || [],
      syncError: error instanceof Error ? error.message : "同步失败",
    };
  }
});

const payload = {
  source: "Eisk 潮汐表精灵",
  sourceUrl: BASE_URL,
  sourceStatement: "潮汐表数据来自国家海洋信息中心；为天文潮位预报，不含气象增减水。",
  timezone: "Asia/Shanghai",
  generatedAt: new Date().toISOString(),
  stationCount: stations.length,
  succeeded,
  failed,
  stations,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`已接入 ${stations.length} 个潮汐站；成功 ${succeeded}，待重试 ${failed}`);
