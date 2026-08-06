import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "data/eisk-tides.json");
const BASE_URL = "https://www.eisk.cn";
const STATIONS = [
  { id: "332", name: "金山嘴", region: "上海市", x: 18, y: 75 },
  { id: "334", name: "芦潮港", region: "上海市", x: 64, y: 76 },
  { id: "349", name: "吴淞", region: "上海市", x: 53, y: 25 },
  { id: "320", name: "高桥", region: "上海市", x: 69, y: 32 },
  { id: "313", name: "崇明", region: "上海市", x: 56, y: 10 },
];

function shanghaiDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const noonUtc = new Date(`${values.year}-${values.month}-${values.day}T04:00:00Z`);
  noonUtc.setUTCDate(noonUtc.getUTCDate() + offsetDays);
  return noonUtc.toISOString().slice(0, 10);
}

function parseEvents(html, fallbackDate) {
  const dateMatch = html.match(/id=["']select_date["'][^>]*>(\d{4}-\d{2}-\d{2})</i);
  const date = dateMatch?.[1] ?? fallbackDate;
  const events = [];
  const pattern = /class=["']tide2["'][^>]*>\s*(\d{2}:\d{2})\s*<span[^>]*>\s*(满潮|干潮)\s*<\/span>\s*([\d.]+)米/gi;
  for (const match of html.matchAll(pattern)) {
    events.push({
      time: match[1],
      kind: match[2] === "满潮" ? "高潮" : "低潮",
      height: Number(match[3]),
    });
  }
  return { date, events };
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "hydro-weather-monitor/1.0 (+GitHub Pages data sync)" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1500));
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

const previous = await readPrevious();
const targetDates = [-1, 0, 1].map(shanghaiDate);
const stations = [];

for (const station of STATIONS) {
  const days = [];
  for (const date of targetDates) {
    const url = `${BASE_URL}/Tides/${station.id}.html?date=${date}`;
    try {
      const parsed = parseEvents(await fetchText(url), date);
      if (parsed.events.length < 2) throw new Error("未解析到完整潮汐时次");
      days.push(parsed);
    } catch (error) {
      const fallback = previous?.stations
        ?.find((item) => item.id === station.id)
        ?.days?.find((item) => item.date === date);
      if (fallback) {
        days.push(fallback);
      } else {
        console.warn(`${station.name} ${date} 同步失败：${error.message}`);
      }
    }
  }
  if (days.length) {
    stations.push({
      ...station,
      sourceUrl: `${BASE_URL}/Tides/${station.id}.html`,
      days: days.sort((a, b) => a.date.localeCompare(b.date)),
    });
  }
}

if (!stations.length) throw new Error("所有 Eisk 潮汐站同步失败，保留上一版文件");

const payload = {
  source: "Eisk 潮汐表精灵",
  sourceUrl: BASE_URL,
  sourceStatement: "潮汐表数据来自国家海洋信息中心；为天文潮位预报，不含气象增减水。",
  timezone: "Asia/Shanghai",
  generatedAt: new Date().toISOString(),
  stations,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`已更新 ${stations.length} 个潮汐站：${targetDates.join("、")}`);
