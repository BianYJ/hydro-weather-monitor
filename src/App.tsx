"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import CadViewer from "./components/CadViewer";
import PdfViewer from "./components/PdfViewer";
import PointCloudViewer from "./components/PointCloudViewer";

type Weather = {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  code: number;
  high: number;
  low: number;
};

type Station = {
  id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "steady";
  status: "正常" | "关注" | "预警";
  x: number;
  y: number;
};

const BASE_STATIONS: Station[] = [
  { id: "YK01", name: "甬江口站", type: "潮位", value: 2.46, unit: "m", trend: "up", status: "正常", x: 76, y: 36 },
  { id: "SJ02", name: "三江口站", type: "水位", value: 1.83, unit: "m", trend: "up", status: "关注", x: 50, y: 50 },
  { id: "YJ03", name: "姚江大闸", type: "水位", value: 1.26, unit: "m", trend: "steady", status: "正常", x: 28, y: 34 },
  { id: "FH04", name: "奉化江站", type: "流量", value: 184, unit: "m³/s", trend: "down", status: "正常", x: 46, y: 77 },
  { id: "BL05", name: "北仑沿海站", type: "风速", value: 5.8, unit: "m/s", trend: "up", status: "正常", x: 86, y: 58 },
];

const WATER_LEVELS = [1.42, 1.46, 1.49, 1.52, 1.58, 1.63, 1.69, 1.72, 1.78, 1.83, 1.86, 1.83];
const TIDE_LEVELS = [1.18, 1.42, 1.88, 2.31, 2.74, 2.92, 2.66, 2.19, 1.67, 1.31, 1.46, 1.92];
const RAIN_LEVELS = [0, 0, 0.4, 1.2, 2.8, 4.6, 3.2, 1.8, 0.8, 0.2, 0, 0];

function formatTime(date: Date | null) {
  if (!date) return "等待首次更新";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function weatherText(code: number) {
  if (code === 0) return "晴朗";
  if (code <= 3) return "多云";
  if (code <= 48) return "有雾";
  if (code <= 67) return "降雨";
  if (code <= 77) return "降雪";
  if (code <= 82) return "阵雨";
  return "雷阵雨";
}

function weatherGlyph(code: number) {
  if (code === 0) return "☀";
  if (code <= 3) return "◒";
  if (code <= 48) return "≋";
  if (code <= 82) return "☂";
  return "ϟ";
}

function TrendChart({
  values,
  secondary,
  color = "#2dd4bf",
  secondaryColor = "#5ea7ff",
  labels = ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"],
}: {
  values: number[];
  secondary?: number[];
  color?: string;
  secondaryColor?: string;
  labels?: string[];
}) {
  const all = secondary ? [...values, ...secondary] : values;
  const min = Math.min(...all) * 0.9;
  const max = Math.max(...all) * 1.08 || 1;
  const points = (data: number[]) =>
    data.map((v, i) => `${28 + i * (544 / (data.length - 1))},${158 - ((v - min) / (max - min)) * 112}`).join(" ");
  const area = `28,158 ${points(values)} 572,158`;

  return (
    <div className="chart-wrap" aria-label="24小时趋势图">
      <svg viewBox="0 0 600 198" role="img">
        <defs>
          <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".26" />
            <stop offset="100%" stopColor={color} stopOpacity=".01" />
          </linearGradient>
        </defs>
        {[46, 83, 120, 157].map((y) => (
          <line key={y} x1="28" y1={y} x2="572" y2={y} className="chart-grid" />
        ))}
        <polygon points={area} fill={`url(#fill-${color.replace("#", "")})`} />
        <polyline points={points(values)} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {secondary && (
          <polyline points={points(secondary)} fill="none" stroke={secondaryColor} strokeWidth="2" strokeDasharray="6 6" strokeLinejoin="round" />
        )}
        {values.map((v, i) => (
          <circle key={i} cx={28 + i * (544 / (values.length - 1))} cy={158 - ((v - min) / (max - min)) * 112} r={i === values.length - 1 ? 4 : 2} fill={color} />
        ))}
        {labels.map((label, i) => (
          <text key={label + i} x={28 + i * (544 / (labels.length - 1))} y="188" textAnchor="middle" className="chart-label">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="rain-bars" aria-label="逐小时降雨柱状图">
      {values.map((value, i) => (
        <div className="rain-column" key={i}>
          <span className="rain-value">{value > 0 ? value : ""}</span>
          <span className="rain-bar" style={{ height: `${Math.max(3, (value / max) * 56)}px` }} />
          <small>{String(i * 2).padStart(2, "0")}</small>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [now, setNow] = useState<Date | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState("宁波");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");
  const [stations, setStations] = useState(BASE_STATIONS);
  const [selectedStation, setSelectedStation] = useState(BASE_STATIONS[1].id);
  const [activeMetric, setActiveMetric] = useState<"水位" | "潮位">("水位");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<"dashboard" | "pointcloud" | "cad" | "pdf">("dashboard");

  const loadWeather = useCallback(async (city: string) => {
    setWeatherLoading(true);
    setWeatherError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
        { signal: controller.signal },
      );
      const geo = await geoResponse.json();
      if (!geo.results?.[0]) throw new Error("未找到该城市");
      const place = geo.results[0];
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
        { signal: controller.signal },
      );
      const data = await response.json();
      setWeather({
        city: `${place.name}${place.admin1 ? ` · ${place.admin1}` : ""}`,
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        precipitation: data.current.precipitation,
        code: data.current.weather_code,
        high: data.daily.temperature_2m_max[0],
        low: data.daily.temperature_2m_min[0],
      });
      setUpdatedAt(new Date());
    } catch (error) {
      setWeatherError(
        error instanceof DOMException && error.name === "AbortError"
          ? "天气服务响应超时"
          : error instanceof Error
            ? error.message
            : "天气数据暂时不可用",
      );
    } finally {
      window.clearTimeout(timeout);
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      setNow(new Date());
      setUpdatedAt(new Date());
      loadWeather("宁波");
    }, 0);
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadWeather]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      setStations((current) =>
        current.map((station, index) => ({
          ...station,
          value: Number((station.value + Math.sin(Date.now() / 60000 + index) * (station.unit === "m³/s" ? 1.2 : 0.008)).toFixed(station.unit === "m³/s" ? 0 : 2)),
        })),
      );
      setUpdatedAt(new Date());
    }, 12000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  const selected = useMemo(
    () => stations.find((station) => station.id === selectedStation) ?? stations[0],
    [stations, selectedStation],
  );

  function submitCity(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) loadWeather(query.trim());
  }

  function refreshAll() {
    loadWeather(query);
    setStations((current) =>
      current.map((station, index) => ({
        ...station,
        value: Number((station.value + (index % 2 ? 0.01 : -0.01)).toFixed(station.unit === "m³/s" ? 0 : 2)),
      })),
    );
    setUpdatedAt(new Date());
  }

  function openDashboardAnchor(anchor: string) {
    setActiveWorkspace("dashboard");
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  const activeValues = activeMetric === "水位" ? WATER_LEVELS : TIDE_LEVELS;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#overview" onClick={() => openDashboardAnchor("overview")} aria-label="水文气象监测平台首页">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>
            <strong>澜境监测</strong>
            <small>HYDRO & WEATHER</small>
          </span>
        </a>
        <nav className={menuOpen ? "nav open" : "nav"} aria-label="主导航">
          <button className={activeWorkspace === "dashboard" ? "active" : ""} onClick={() => openDashboardAnchor("overview")}>综合态势</button>
          <button onClick={() => openDashboardAnchor("weather")}>气象监测</button>
          <button onClick={() => openDashboardAnchor("water")}>水文水位</button>
          <button className={activeWorkspace === "pointcloud" ? "active" : ""} onClick={() => { setActiveWorkspace("pointcloud"); setMenuOpen(false); }}>三维点云</button>
          <button className={activeWorkspace === "cad" ? "active" : ""} onClick={() => { setActiveWorkspace("cad"); setMenuOpen(false); }}>CAD查看</button>
          <button className={activeWorkspace === "pdf" ? "active" : ""} onClick={() => { setActiveWorkspace("pdf"); setMenuOpen(false); }}>PDF查看</button>
        </nav>
        <div className="header-actions">
          <span className="system-state"><i /> 系统运行正常</span>
          <button className="icon-button" onClick={refreshAll} aria-label="刷新所有数据" title="刷新数据">↻</button>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="打开导航菜单">☰</button>
        </div>
      </header>

      {activeWorkspace !== "dashboard" ? (
        <div className="feature-shell">
          <div className="feature-heading">
            <div>
              <p className="eyebrow">工程文件在线工作台</p>
              <h1>
                {activeWorkspace === "pointcloud" && "三维点云在线查看"}
                {activeWorkspace === "cad" && "CAD 图纸在线查看"}
                {activeWorkspace === "pdf" && "PDF 文档在线查看"}
              </h1>
            </div>
            <button onClick={() => openDashboardAnchor("overview")}>← 返回综合态势</button>
          </div>
          <div className="feature-panel">
            {activeWorkspace === "pointcloud" && <PointCloudViewer />}
            {activeWorkspace === "cad" && <CadViewer />}
            {activeWorkspace === "pdf" && <PdfViewer />}
          </div>
        </div>
      ) : (
      <div className="dashboard-shell" id="overview">
        <section className="page-heading">
          <div>
            <p className="eyebrow">综合监测驾驶舱</p>
            <h1>水文气象实时监测平台</h1>
            <p className="heading-subtitle">汇集气象、水位、潮位与水文要素，辅助快速掌握区域水安全态势</p>
          </div>
          <div className="heading-tools">
            <form className="city-search" onSubmit={submitCity}>
              <span>⌖</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="输入城市" placeholder="搜索城市天气" />
              <button type="submit">查询</button>
            </form>
            <div className="clock">
              <strong>{now ? now.toLocaleTimeString("zh-CN", { hour12: false }) : "--:--:--"}</strong>
              <span>{now ? now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }) : "正在同步时间"}</span>
            </div>
          </div>
        </section>

        <div className="status-strip">
          <div><span className="status-dot" /> 数据接收正常</div>
          <div>接入站点 <strong>24</strong></div>
          <div>在线率 <strong>100%</strong></div>
          <div className="updated">最近更新：{formatTime(updatedAt)}</div>
          <label className="auto-switch">
            <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
            <span /> 自动刷新
          </label>
        </div>

        <section className="metric-grid" aria-label="核心指标">
          <article className="metric-card cyan">
            <div className="metric-top"><span className="metric-icon">≈</span><span className="live-tag">实时</span></div>
            <p>当前水位</p>
            <div className="metric-value"><strong>{stations[1].value}</strong><span>m</span></div>
            <div className="metric-foot"><span className="trend up">↗ 0.06 m</span><small>警戒水位 2.50 m</small></div>
          </article>
          <article className="metric-card blue">
            <div className="metric-top"><span className="metric-icon">≋</span><span className="live-tag">实时</span></div>
            <p>当前潮位</p>
            <div className="metric-value"><strong>{stations[0].value}</strong><span>m</span></div>
            <div className="metric-foot"><span className="trend up">↗ 涨潮</span><small>高潮 16:42</small></div>
          </article>
          <article className="metric-card violet">
            <div className="metric-top"><span className="metric-icon">⇢</span><span className="live-tag">实时</span></div>
            <p>瞬时流量</p>
            <div className="metric-value"><strong>{stations[3].value}</strong><span>m³/s</span></div>
            <div className="metric-foot"><span className="trend down">↘ 3.2%</span><small>断面均速 1.42 m/s</small></div>
          </article>
          <article className="metric-card amber">
            <div className="metric-top"><span className="metric-icon">◌</span><span className="live-tag">24h</span></div>
            <p>累计降雨</p>
            <div className="metric-value"><strong>15.0</strong><span>mm</span></div>
            <div className="metric-foot"><span className="trend steady">— 小雨</span><small>最大小时 4.6 mm</small></div>
          </article>
        </section>

        <section className="main-grid">
          <article className="panel map-panel" id="stations">
            <div className="panel-heading">
              <div><p className="eyebrow">MONITORING NETWORK</p><h2>监测站点态势</h2></div>
              <div className="legend"><span><i className="normal" />正常</span><span><i className="attention" />关注</span><span><i className="warning" />预警</span></div>
            </div>
            <div className="hydro-map">
              <div className="map-grid" />
              <div className="coast coast-one" />
              <div className="coast coast-two" />
              <div className="river river-one" />
              <div className="river river-two" />
              <span className="map-label l1">姚江</span>
              <span className="map-label l2">奉化江</span>
              <span className="map-label l3">甬江</span>
              <span className="sea-label">东海</span>
              {stations.map((station) => (
                <button
                  className={`station-pin ${station.status === "关注" ? "attention" : station.status === "预警" ? "warning" : ""} ${selectedStation === station.id ? "selected" : ""}`}
                  style={{ left: `${station.x}%`, top: `${station.y}%` }}
                  key={station.id}
                  onClick={() => setSelectedStation(station.id)}
                  aria-label={`查看${station.name}`}
                >
                  <i /><span>{station.name}</span>
                </button>
              ))}
              <div className="map-scale">0　5　10 km</div>
            </div>
            <div className="station-detail">
              <div>
                <span className={`station-badge ${selected.status === "关注" ? "attention" : ""}`}>{selected.status}</span>
                <div><strong>{selected.name}</strong><small>站点编号 {selected.id} · 演示监测数据</small></div>
              </div>
              <div className="detail-value"><small>{selected.type}</small><strong>{selected.value}</strong><span>{selected.unit}</span></div>
              <div className="detail-meta"><small>变化趋势</small><strong>{selected.trend === "up" ? "上升 ↗" : selected.trend === "down" ? "下降 ↘" : "平稳 —"}</strong></div>
              <button onClick={() => document.getElementById("water")?.scrollIntoView({ behavior: "smooth" })}>查看趋势 →</button>
            </div>
          </article>

          <div className="side-stack">
            <article className="panel weather-panel" id="weather">
              <div className="panel-heading compact">
                <div><p className="eyebrow">LIVE WEATHER</p><h2>实时天气</h2></div>
                <span className="data-source">OPEN-METEO</span>
              </div>
              {weatherLoading ? (
                <div className="weather-loading">正在获取实时天气…</div>
              ) : weatherError ? (
                <div className="weather-loading error">{weatherError}，请更换城市重试。</div>
              ) : weather ? (
                <>
                  <div className="weather-main">
                    <span className="weather-glyph">{weatherGlyph(weather.code)}</span>
                    <div><strong>{Math.round(weather.temperature)}°</strong><span>{weatherText(weather.code)} · 体感 {Math.round(weather.feelsLike)}°</span></div>
                    <div className="weather-place"><strong>{weather.city}</strong><span>{Math.round(weather.low)}° / {Math.round(weather.high)}°</span></div>
                  </div>
                  <div className="weather-details">
                    <div><span>相对湿度</span><strong>{weather.humidity}%</strong></div>
                    <div><span>当前风速</span><strong>{weather.windSpeed} km/h</strong></div>
                    <div><span>实时降水</span><strong>{weather.precipitation} mm</strong></div>
                  </div>
                </>
              ) : null}
            </article>

            <article className="panel alerts-panel">
              <div className="panel-heading compact">
                <div><p className="eyebrow">ALERT CENTER</p><h2>预警信息</h2></div>
                <span className="alert-count">1 条关注</span>
              </div>
              <div className="alert-item">
                <span className="alert-symbol">!</span>
                <div><strong>三江口站水位持续上涨</strong><p>近 2 小时上涨 0.12 m，距关注阈值 0.67 m</p><small>10 分钟前 · 水位关注</small></div>
              </div>
              <div className="no-alert"><span>✓</span><div><strong>暂无其他预警</strong><small>其余 23 个站点运行正常</small></div></div>
            </article>
          </div>
        </section>

        <section className="trend-grid" id="water">
          <article className="panel trend-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">24H TREND</p><h2>水位 · 潮位趋势</h2></div>
              <div className="segment-control">
                <button className={activeMetric === "水位" ? "active" : ""} onClick={() => setActiveMetric("水位")}>水位</button>
                <button className={activeMetric === "潮位" ? "active" : ""} onClick={() => setActiveMetric("潮位")}>潮位</button>
              </div>
            </div>
            <div className="chart-summary">
              <div><span>{activeMetric}最新值</span><strong>{activeMetric === "水位" ? stations[1].value : stations[0].value} m</strong></div>
              <div><span>24h 最大值</span><strong>{Math.max(...activeValues).toFixed(2)} m</strong></div>
              <div><span>变化幅度</span><strong className="positive">+{(activeValues[activeValues.length - 1] - activeValues[0]).toFixed(2)} m</strong></div>
              <span className="demo-label">演示曲线</span>
            </div>
            <TrendChart values={activeValues} color={activeMetric === "水位" ? "#2dd4bf" : "#5ea7ff"} />
          </article>

          <article className="panel rainfall-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">RAINFALL</p><h2>逐小时降雨</h2></div>
              <span className="demo-label">演示曲线</span>
            </div>
            <div className="rain-summary">
              <div><span>今日累计</span><strong>15.0 <small>mm</small></strong></div>
              <div><span>最大雨强</span><strong>4.6 <small>mm/h</small></strong></div>
            </div>
            <MiniBars values={RAIN_LEVELS} />
          </article>
        </section>

        <footer>
          <div><span className="brand-mark small"><i /><i /><i /></span><strong>澜境监测</strong><span>· 水文气象综合监测平台</span></div>
          <p>天气数据来自 Open-Meteo；水位、潮位及水文数据为界面演示，接入正式监测接口后方可用于业务决策。</p>
        </footer>
      </div>
      )}
    </main>
  );
}
