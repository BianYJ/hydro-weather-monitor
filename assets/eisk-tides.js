(function () {
  "use strict";

  var state = { data: null, stationId: localStorage.getItem("eisk-station") || "332" };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function eventDate(day, event) {
    return new Date(day.date + "T" + event.time + ":00+08:00");
  }

  function shanghaiDateKey(date) {
    var parts = new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return values.year + "-" + values.month + "-" + values.day;
  }

  function flattenEvents(station) {
    return station.days.flatMap(function (day) {
      return day.events.map(function (event) {
        return Object.assign({ date: day.date, at: eventDate(day, event) }, event);
      });
    }).sort(function (a, b) { return a.at - b.at; });
  }

  function stationStatus(station, now) {
    var events = flattenEvents(station);
    var previous = events[0];
    var next = events[events.length - 1];
    for (var index = 0; index < events.length; index += 1) {
      if (events[index].at <= now) previous = events[index];
      if (events[index].at > now) { next = events[index]; break; }
    }
    var duration = Math.max(1, next.at - previous.at);
    var ratio = Math.max(0, Math.min(1, (now - previous.at) / duration));
    var eased = (1 - Math.cos(Math.PI * ratio)) / 2;
    var height = previous.height + (next.height - previous.height) * eased;
    var direction = next.height >= previous.height ? "涨潮" : "退潮";
    var nextHigh = events.find(function (event) { return event.at > now && event.kind === "高潮"; }) || events.find(function (event) { return event.kind === "高潮"; });
    var nextLow = events.find(function (event) { return event.at > now && event.kind === "低潮"; }) || events.find(function (event) { return event.kind === "低潮"; });
    var today = shanghaiDateKey(now);
    var day = station.days.find(function (item) { return item.date === today; }) || station.days[Math.floor(station.days.length / 2)];
    var heights = day ? day.events.map(function (event) { return event.height; }) : events.map(function (event) { return event.height; });
    return {
      height: height,
      direction: direction,
      nextHigh: nextHigh,
      nextLow: nextLow,
      range: Math.max.apply(Math, heights) - Math.min.apply(Math, heights),
      day: day,
      stale: now < events[0].at || now > events[events.length - 1].at,
    };
  }

  function formatEvent(event) {
    if (!event) return "待同步";
    return event.time + " · " + event.height.toFixed(1) + " m";
  }

  function ensureOverlay(parent, className) {
    var overlay = parent.querySelector(":scope > ." + className);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = className;
      parent.appendChild(overlay);
    }
    return overlay;
  }

  function renderMetricCards(station, status) {
    var cards = document.querySelectorAll(".metric-grid .metric-card");
    if (cards.length < 4) return;
    var values = [
      { icon: "≈", label: "当前预报潮高", value: status.height.toFixed(2), unit: "m", foot: station.name + " · " + status.direction, note: status.stale ? "数据待同步" : "天文潮位" },
      { icon: "↟", label: "下次高潮", value: status.nextHigh ? status.nextHigh.height.toFixed(1) : "--", unit: "m", foot: status.nextHigh ? status.nextHigh.time : "待同步", note: station.name },
      { icon: "↡", label: "下次低潮", value: status.nextLow ? status.nextLow.height.toFixed(1) : "--", unit: "m", foot: status.nextLow ? status.nextLow.time : "待同步", note: station.name },
      { icon: "↕", label: "今日潮差", value: status.range.toFixed(1), unit: "m", foot: "高潮－低潮", note: status.day ? status.day.date : "待同步" },
    ];
    cards.forEach(function (card, index) {
      card.classList.add("eisk-metric-card");
      var layer = ensureOverlay(card, "eisk-card-content");
      var item = values[index];
      layer.innerHTML = '<div class="metric-top"><span class="metric-icon">' + item.icon + '</span><span class="live-tag">预报</span></div>' +
        '<p>' + escapeHtml(item.label) + '</p>' +
        '<div class="metric-value"><strong>' + escapeHtml(item.value) + '</strong><span>' + escapeHtml(item.unit) + '</span></div>' +
        '<div class="metric-foot"><span class="trend ' + (index === 2 ? "down" : "up") + '">' + escapeHtml(item.foot) + '</span><small>' + escapeHtml(item.note) + '</small></div>';
    });
  }

  function renderStationPanel(data, selectedStation) {
    var panel = Array.from(document.querySelectorAll(".panel.map-panel")).find(function (item) {
      return item.querySelector("h2")?.textContent.includes("监测站点态势");
    });
    if (!panel) return;
    panel.classList.add("eisk-panel-active");
    var overlay = ensureOverlay(panel, "eisk-station-panel");
    var cards = data.stations.map(function (station) {
      var itemStatus = stationStatus(station, new Date());
      return '<button class="eisk-station-item ' + (station.id === selectedStation.id ? "active" : "") + '" data-eisk-station="' + station.id + '">' +
        '<span><i></i><strong>' + escapeHtml(station.name) + '</strong><small>' + escapeHtml(itemStatus.direction) + '</small></span>' +
        '<em>' + itemStatus.height.toFixed(2) + ' <small>m</small></em></button>';
    }).join("");
    overlay.innerHTML = '<div class="eisk-panel-heading"><div><p class="eyebrow">EISK TIDE STATIONS</p><h2>上海沿海潮汐站态势</h2></div>' +
      '<a href="' + escapeHtml(selectedStation.sourceUrl) + '" target="_blank" rel="noreferrer">查看来源 ↗</a></div>' +
      '<div class="eisk-coast-map"><div class="eisk-sea">东海</div>' + data.stations.map(function (station) {
        return '<button class="eisk-map-pin ' + (station.id === selectedStation.id ? "active" : "") + '" style="left:' + station.x + '%;top:' + station.y + '%" data-eisk-station="' + station.id + '"><i></i><span>' + escapeHtml(station.name) + '</span></button>';
      }).join("") + '</div><div class="eisk-station-list">' + cards + '</div>';
    overlay.querySelectorAll("[data-eisk-station]").forEach(function (button) {
      button.addEventListener("click", function () { selectStation(button.dataset.eiskStation); });
    });
  }

  function curveSamples(station, day) {
    if (!day || day.events.length < 2) return [];
    var all = flattenEvents(station);
    var start = new Date(day.date + "T00:00:00+08:00");
    return Array.from({ length: 49 }, function (_, index) {
      var at = new Date(start.getTime() + index * 30 * 60 * 1000);
      var previous = all[0];
      var next = all[all.length - 1];
      for (var eventIndex = 0; eventIndex < all.length; eventIndex += 1) {
        if (all[eventIndex].at <= at) previous = all[eventIndex];
        if (all[eventIndex].at > at) { next = all[eventIndex]; break; }
      }
      var ratio = Math.max(0, Math.min(1, (at - previous.at) / Math.max(1, next.at - previous.at)));
      return previous.height + (next.height - previous.height) * (1 - Math.cos(Math.PI * ratio)) / 2;
    });
  }

  function chartSvg(values, day) {
    if (!values.length) return '<div class="eisk-empty">趋势数据待同步</div>';
    var min = Math.min.apply(Math, values) - 0.2;
    var max = Math.max.apply(Math, values) + 0.2;
    var points = values.map(function (value, index) {
      var x = 30 + index * 540 / (values.length - 1);
      var y = 155 - (value - min) / Math.max(0.1, max - min) * 112;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
    return '<svg viewBox="0 0 600 198" role="img" aria-label="' + escapeHtml(day.date) + '潮汐趋势">' +
      '<defs><linearGradient id="eisk-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#39d9cb" stop-opacity=".3"/><stop offset="100%" stop-color="#39d9cb" stop-opacity=".01"/></linearGradient></defs>' +
      [46, 83, 120, 157].map(function (y) { return '<line x1="30" y1="' + y + '" x2="570" y2="' + y + '" class="chart-grid"/>'; }).join("") +
      '<polygon points="30,157 ' + points + ' 570,157" fill="url(#eisk-fill)"/><polyline points="' + points + '" fill="none" stroke="#39d9cb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      [0, 6, 12, 18, 24].map(function (hour) { return '<text x="' + (30 + hour * 22.5) + '" y="188" text-anchor="middle" class="chart-label">' + String(hour).padStart(2, "0") + ':00</text>'; }).join("") + '</svg>';
  }

  function renderTrendPanel(data, station, status) {
    var section = document.getElementById("water");
    var panel = section?.querySelector(".trend-panel");
    if (!panel) return;
    panel.classList.add("eisk-panel-active");
    var overlay = ensureOverlay(panel, "eisk-trend-panel");
    var options = data.stations.map(function (item) {
      return '<option value="' + item.id + '"' + (item.id === station.id ? " selected" : "") + '>' + escapeHtml(item.name) + '</option>';
    }).join("");
    var events = status.day?.events || [];
    overlay.innerHTML = '<div class="eisk-panel-heading"><div><p class="eyebrow">ASTRONOMICAL TIDE</p><h2>24 小时潮汐预报</h2></div>' +
      '<label>潮汐站<select id="eisk-station-select">' + options + '</select></label></div>' +
      '<div class="eisk-summary"><div><span>当前预报潮高</span><strong>' + status.height.toFixed(2) + ' m</strong></div><div><span>潮汐状态</span><strong>' + escapeHtml(status.direction) + '</strong></div><div><span>今日潮差</span><strong>' + status.range.toFixed(1) + ' m</strong></div><div><span>预报日期</span><strong>' + escapeHtml(status.day?.date || "待同步") + '</strong></div></div>' +
      '<div class="eisk-chart">' + chartSvg(curveSamples(station, status.day), status.day || { date: "" }) + '</div>' +
      '<div class="eisk-event-row">' + events.map(function (event) { return '<span class="' + (event.kind === "高潮" ? "high" : "low") + '"><i></i><strong>' + event.time + '</strong><small>' + event.kind + ' ' + event.height.toFixed(1) + ' m</small></span>'; }).join("") + '</div>' +
      '<p class="eisk-note">数据来源：<a href="' + escapeHtml(station.sourceUrl) + '" target="_blank" rel="noreferrer">Eisk 潮汐表精灵</a>。天文潮位预报不包含台风、寒潮、洪水等造成的增减水，不可作为航行或防灾决策的唯一依据。</p>';
    overlay.querySelector("#eisk-station-select")?.addEventListener("change", function (event) { selectStation(event.target.value); });
  }

  function renderAlertPanel(station, status) {
    var panel = document.querySelector(".alerts-panel");
    if (!panel) return;
    panel.classList.add("eisk-panel-active");
    var overlay = ensureOverlay(panel, "eisk-alert-panel");
    overlay.innerHTML = '<div class="panel-heading compact"><div><p class="eyebrow">TIDE REMINDER</p><h2>潮汐提示</h2></div><span class="alert-count">预报</span></div>' +
      '<div class="eisk-alert-main"><span>≈</span><div><strong>' + escapeHtml(station.name) + '当前' + escapeHtml(status.direction) + '</strong><p>预报潮高约 ' + status.height.toFixed(2) + ' m；下次高潮 ' + escapeHtml(formatEvent(status.nextHigh)) + '</p><small>来源：Eisk · 更新时间见潮汐数据文件</small></div></div>' +
      '<div class="eisk-safe"><span>i</span><div><strong>天文潮位说明</strong><small>实际海况可能受风暴潮、气压、径流等因素影响</small></div></div>';
  }

  function renderMeta(data) {
    var strip = document.querySelector(".status-strip");
    if (strip) {
      strip.querySelectorAll(":scope > div")[1]?.replaceChildren(document.createTextNode("接入潮汐站 "), Object.assign(document.createElement("strong"), { textContent: String(data.stations.length) }));
      var source = strip.querySelector(".eisk-strip-source");
      if (!source) {
        source = document.createElement("a");
        source.className = "eisk-strip-source";
        source.target = "_blank";
        source.rel = "noreferrer";
        source.textContent = "数据：Eisk ↗";
        strip.appendChild(source);
      }
      source.href = data.sourceUrl;
    }
    var footer = document.querySelector("footer p");
    if (footer) footer.textContent = "天气数据来自 Open-Meteo；潮汐预报来自 Eisk（原始数据标注来自国家海洋信息中心）。潮汐为天文预报值，仅供态势参考。";
  }

  function render() {
    if (!state.data) return;
    var station = state.data.stations.find(function (item) { return item.id === state.stationId; }) || state.data.stations[0];
    if (!station) return;
    state.stationId = station.id;
    var status = stationStatus(station, new Date());
    renderMetricCards(station, status);
    renderStationPanel(state.data, station);
    renderTrendPanel(state.data, station, status);
    renderAlertPanel(station, status);
    renderMeta(state.data);
  }

  function selectStation(id) {
    state.stationId = id;
    localStorage.setItem("eisk-station", id);
    render();
  }

  async function load() {
    try {
      var response = await fetch("./data/eisk-tides.json?v=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      state.data = await response.json();
      render();
      var main = document.querySelector("main");
      if (main) new MutationObserver(function () { window.requestAnimationFrame(render); }).observe(main, { childList: true });
      window.setInterval(render, 60 * 1000);
    } catch (error) {
      console.error("Eisk 潮汐数据加载失败", error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
