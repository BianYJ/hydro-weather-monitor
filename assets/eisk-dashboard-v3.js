(function () {
  "use strict";

  var state = {
    data: window.__EISK_TIDE_DATA__ || null,
    stationId: localStorage.getItem("eisk-station") || "332",
    weatherQuery: localStorage.getItem("weather-place") || "宁波",
    weather: null,
    weatherAbort: null,
    dashboard: null,
    auto: true,
    lastRefresh: 0,
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function dateKey(date) {
    var parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return values.year + "-" + values.month + "-" + values.day;
  }

  function lunar(date) {
    try {
      return new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric" }).format(date);
    } catch (_) {
      return "农历日期暂不可用";
    }
  }

  function eventDate(day, event) { return new Date(day.date + "T" + event.time + ":00+08:00"); }

  function eventsOf(station) {
    return (station.days || []).flatMap(function (day) {
      return (day.events || []).map(function (event) { return Object.assign({ date: day.date, at: eventDate(day, event) }, event); });
    }).sort(function (a, b) { return a.at - b.at; });
  }

  function statusOf(station) {
    var now = new Date();
    var events = eventsOf(station);
    if (events.length < 2) return { height: null, direction: "待同步", high: null, low: null, day: null, stale: true };
    var previous = null;
    var next = null;
    events.forEach(function (event) {
      if (event.at <= now) previous = event;
      if (!next && event.at > now) next = event;
    });
    var height = null;
    var direction = "待同步";
    if (previous && next) {
      var ratio = Math.max(0, Math.min(1, (now - previous.at) / Math.max(1, next.at - previous.at)));
      height = previous.height + (next.height - previous.height) * (1 - Math.cos(Math.PI * ratio)) / 2;
      direction = next.height >= previous.height ? "涨潮" : "退潮";
    } else {
      var nearest = next || previous;
      height = nearest ? nearest.height : null;
    }
    return {
      height: height,
      direction: direction,
      high: events.find(function (event) { return event.at > now && event.kind === "高潮"; }) || null,
      low: events.find(function (event) { return event.at > now && event.kind === "低潮"; }) || null,
      day: (station.days || []).find(function (day) { return day.date === dateKey(now); }) || (station.days || [])[0] || null,
      stale: !previous || !next,
    };
  }

  function station() {
    if (!state.data || !state.data.stations || !state.data.stations.length) return null;
    return state.data.stations.find(function (item) { return item.id === state.stationId; }) ||
      state.data.stations.find(function (item) { return item.id === "332"; }) || state.data.stations[0];
  }

  function setMessage(message, error) {
    if (!state.dashboard) return;
    var node = state.dashboard.querySelector(".eisk-search-message");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("error", Boolean(error));
    clearTimeout(setMessage.timer);
    setMessage.timer = setTimeout(function () { node.textContent = ""; }, 3500);
  }

  function addStationSearch() {
    var tools = state.dashboard.querySelector(".heading-tools");
    if (!tools || tools.querySelector(".eisk-station-search")) return;
    var form = document.createElement("form");
    form.className = "city-search eisk-station-search";
    form.innerHTML = '<span>≈</span><input list="eisk-all-stations" aria-label="搜索潮汐站" placeholder="搜索潮汐站"><datalist id="eisk-all-stations"></datalist><button type="submit">查询</button>';
    tools.insertBefore(form, tools.querySelector(".clock"));
    var message = document.createElement("div");
    message.className = "eisk-search-message";
    tools.appendChild(message);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      selectByQuery(form.querySelector("input").value);
    });
    populateStations();
  }

  function populateStations() {
    if (!state.data || !state.dashboard) return;
    var list = state.dashboard.querySelector("#eisk-all-stations");
    if (!list || list.dataset.count === String(state.data.stations.length)) return;
    list.innerHTML = state.data.stations.map(function (item) {
      return '<option value="' + esc(item.region + " · " + item.name) + '">站号 ' + esc(item.id) + '</option>';
    }).join("");
    list.dataset.count = String(state.data.stations.length);
    var current = station();
    if (current) state.dashboard.querySelector(".eisk-station-search input").value = current.region + " · " + current.name;
  }

  function selectByQuery(raw) {
    if (!state.data) return;
    var query = String(raw || "").toLowerCase().replace(/[\s·•]/g, "");
    var found = state.data.stations.find(function (item) {
      var full = (item.region + item.name).toLowerCase().replace(/\s/g, "");
      return item.id === query || item.name.toLowerCase() === query || full === query;
    }) || state.data.stations.find(function (item) {
      return (item.region + item.name + item.id).toLowerCase().replace(/\s/g, "").includes(query);
    });
    if (!found) return setMessage("未找到该潮汐站，请从下拉建议中选择", true);
    selectStation(found.id);
    setMessage("已切换至 " + found.region + " · " + found.name);
  }

  function selectStation(id) {
    state.stationId = id;
    localStorage.setItem("eisk-station", id);
    renderTide();
  }

  function ensureLayer(parent, className) {
    var node = parent.querySelector(":scope > ." + className);
    if (!node) {
      node = document.createElement("div");
      node.className = className;
      parent.appendChild(node);
    }
    return node;
  }

  function renderMetrics(current, status) {
    var cards = state.dashboard.querySelectorAll(".metric-grid .metric-card");
    if (cards.length < 4) return;
    cards[3].classList.add("eisk-hidden-card");
    var items = [
      { icon: "≈", title: "当前预报潮高", value: status.height == null ? "--" : status.height.toFixed(2), time: current.name + " · " + status.direction, note: status.stale ? "数据待更新" : "天文潮位" },
      { icon: "↟", title: "下次高潮", value: status.high ? status.high.height.toFixed(1) : "--", time: status.high ? status.high.time : "--:--", note: status.high ? (status.high.date === dateKey(new Date()) ? "今天" : status.high.date.slice(5)) + " · " + current.name : "等待同步" },
      { icon: "↡", title: "下次低潮", value: status.low ? status.low.height.toFixed(1) : "--", time: status.low ? status.low.time : "--:--", note: status.low ? (status.low.date === dateKey(new Date()) ? "今天" : status.low.date.slice(5)) + " · " + current.name : "等待同步" },
    ];
    items.forEach(function (item, index) {
      cards[index].classList.add("eisk-card-enhanced");
      var layer = ensureLayer(cards[index], "eisk-card-layer");
      layer.innerHTML = '<div class="metric-top"><span class="metric-icon">' + item.icon + '</span><span class="live-tag">预报</span></div><p>' + esc(item.title) + '</p><div class="metric-value"><strong>' + esc(item.value) + '</strong><span>m</span></div><div class="metric-foot"><b class="eisk-big-time">' + esc(item.time) + '</b><small>' + esc(item.note) + '</small></div>';
    });
  }

  function renderStationPanel(current, status) {
    var panel = state.dashboard.querySelector(".map-panel");
    if (!panel) return;
    panel.classList.add("eisk-panel-enhanced");
    var layer = ensureLayer(panel, "eisk-station-layer");
    var sameRegion = state.data.stations.filter(function (item) { return item.region === current.region && item.id !== current.id; }).slice(0, 8);
    var events = status.day ? status.day.events : [];
    layer.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">TIDE STATION NETWORK</p><h2>潮汐站态势</h2></div><a href="' + esc(current.sourceUrl) + '" target="_blank" rel="noreferrer">Eisk 来源 ↗</a></div>' +
      '<div class="eisk-station-hero"><div><span>当前潮汐站</span><h3>' + esc(current.name) + '</h3><small>' + esc(current.region) + ' · 站号 ' + esc(current.id) + '</small></div><div><span>预报潮高</span><strong>' + (status.height == null ? "--" : status.height.toFixed(2)) + ' m</strong><em>' + esc(status.direction) + '</em></div></div>' +
      '<div class="eisk-event-chart eisk-hover-chart">' + (events.length ? events.map(function (event) {
        var tip = event.time + " " + event.kind + "，预报潮高 " + event.height.toFixed(1) + " 米";
        return '<button class="' + (event.kind === "高潮" ? "high" : "low") + '" data-tip="' + esc(tip) + '"><i></i><b>' + esc(event.time) + '</b><span>' + esc(event.kind) + '</span><strong>' + event.height.toFixed(1) + ' m</strong></button>';
      }).join("") : '<div class="eisk-empty">该站数据等待同步</div>') + '<div class="eisk-chart-tip"></div></div>' +
      '<div class="eisk-quick-stations"><span>同地区快速切换</span><div><button class="active" data-station-id="' + current.id + '">' + esc(current.name) + '</button>' + sameRegion.map(function (item) { return '<button data-station-id="' + item.id + '">' + esc(item.name) + '</button>'; }).join("") + '</div></div>';
    layer.querySelectorAll("[data-station-id]").forEach(function (button) { button.addEventListener("click", function () { selectStation(button.dataset.stationId); }); });
  }

  function renderAlert(current, status) {
    var panel = state.dashboard.querySelector(".alerts-panel");
    if (!panel) return;
    panel.classList.add("eisk-panel-enhanced");
    var layer = ensureLayer(panel, "eisk-alert-layer");
    var next = [status.high, status.low].filter(Boolean).sort(function (a, b) { return a.at - b.at; })[0];
    layer.innerHTML = '<div class="panel-heading compact"><div><p class="eyebrow">TIDE REMINDER</p><h2>潮汐提示</h2></div><span class="alert-count">预报</span></div>' + (next ?
      '<div class="eisk-alert"><i>≈</i><div><strong>' + esc(current.name) + '当前' + esc(status.direction) + '</strong><p>下一潮汐节点：' + esc(next.kind) + ' ' + esc(next.time) + '，预报潮高 ' + next.height.toFixed(1) + ' m。</p><small>天文潮位不含台风、寒潮、洪水等造成的增减水</small></div></div>' :
      '<div class="eisk-empty">潮汐提示等待同步</div>');
  }

  function updateMeta() {
    if (!state.dashboard || !state.data) return;
    var strip = state.dashboard.querySelector(".status-strip");
    if (strip) {
      var divs = strip.querySelectorAll(":scope > div");
      if (divs[0]) divs[0].innerHTML = '<span class="status-dot"></span> 数据接收正常 <strong class="eisk-status-count">· ' + state.data.succeeded + '/' + state.data.stations.length + '站</strong>';
      if (divs[1]) divs[1].classList.add("eisk-status-hidden");
      if (divs[2]) divs[2].classList.add("eisk-status-hidden");
      var updated = strip.querySelector(".updated");
      if (updated) {
        var time = new Date(state.data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
        updated.innerHTML = '<span class="eisk-updated-text">最近更新：' + esc(time) + '</span>';
      }
    }
    var clock = state.dashboard.querySelector(".clock");
    if (clock) {
      var lunarNode = clock.querySelector(".eisk-lunar");
      if (!lunarNode) { lunarNode = document.createElement("em"); lunarNode.className = "eisk-lunar"; clock.appendChild(lunarNode); }
      lunarNode.textContent = lunar(new Date());
    }
  }

  function renderTide() {
    if (!state.dashboard || !state.data) return;
    var current = station();
    if (!current) return;
    state.stationId = current.id;
    var input = state.dashboard.querySelector(".eisk-station-search input");
    if (input) input.value = current.region + " · " + current.name;
    var status = statusOf(current);
    renderMetrics(current, status);
    renderStationPanel(current, status);
    renderAlert(current, status);
    updateMeta();
  }

  function weatherDescription(code) {
    if (code === 0) return "晴朗";
    if (code <= 3) return "多云";
    if (code <= 48) return "有雾";
    if (code <= 67) return "降雨";
    if (code <= 77) return "降雪";
    return code <= 82 ? "阵雨" : "雷阵雨";
  }

  async function loadWeather(query) {
    if (!query) return;
    if (state.weatherAbort) state.weatherAbort.abort();
    state.weatherAbort = new AbortController();
    state.weatherQuery = query;
    state.lastRefresh = Date.now();
    localStorage.setItem("weather-place", query);
    try {
      var candidates = [query];
      var tail = query.match(/([^省市区县镇街道]+)(?:省|市|区|县|镇|街道)?$/);
      if (tail && tail[1] !== query) candidates.push(tail[1]);
      var place = null;
      for (var index = 0; index < candidates.length; index += 1) {
        var geo = await (await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(candidates[index]) + "&count=1&language=zh&format=json", { signal: state.weatherAbort.signal })).json();
        if (geo.results && geo.results[0]) { place = geo.results[0]; break; }
      }
      if (!place) throw new Error("未找到天气地址");
      var url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation&timezone=Asia%2FShanghai&forecast_days=2&past_days=1";
      var payload = await (await fetch(url, { signal: state.weatherAbort.signal })).json();
      var hour = payload.current.time.slice(0, 13) + ":00";
      var start = Math.max(0, payload.hourly.time.findIndex(function (item) { return item >= hour; }));
      state.weather = { place: [place.name, place.admin1].filter(Boolean).join(" · "), description: weatherDescription(payload.current.weather_code), hours: payload.hourly.time.slice(start, start + 24).map(function (time, offset) { return { time: time, value: Number(payload.hourly.precipitation[start + offset] || 0) }; }) };
      renderRain();
    } catch (error) {
      if (error.name !== "AbortError") renderRain(error.message || "逐小时降雨加载失败");
    }
  }

  function renderRain(error) {
    if (!state.dashboard) return;
    var panel = state.dashboard.querySelector(".rainfall-panel");
    if (!panel) return;
    panel.classList.add("eisk-rain-enhanced");
    var layer = ensureLayer(panel, "eisk-rain-layer");
    if (error || !state.weather) {
      layer.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">RAINFALL</p><h2>逐小时降雨</h2></div></div><div class="eisk-empty">' + esc(error || "正在获取逐小时降雨…") + '</div>';
      return;
    }
    var max = Math.max.apply(Math, state.weather.hours.map(function (item) { return item.value; }).concat([1]));
    var total = state.weather.hours.reduce(function (sum, item) { return sum + item.value; }, 0);
    layer.innerHTML = '<div class="panel-heading"><div><p class="eyebrow">RAINFALL</p><h2>逐小时降雨</h2></div><span class="data-source">' + esc(state.weather.place) + ' · 未来24小时</span></div><div class="eisk-rain-summary"><span>累计 <strong>' + total.toFixed(1) + ' mm</strong></span><span>最大小时 <strong>' + max.toFixed(1) + ' mm</strong></span></div><div class="eisk-rain-chart eisk-hover-chart">' + state.weather.hours.map(function (item, index) {
      var label = item.time.slice(11, 16);
      var tip = item.time.slice(5, 10) + " " + label + "，降雨量 " + item.value.toFixed(1) + " 毫米";
      return '<button data-tip="' + esc(tip) + '"><em>' + (item.value ? item.value.toFixed(1) : "") + '</em><i style="height:' + Math.max(3, item.value / max * 92) + 'px"></i><small>' + (index % 3 === 0 ? label : "") + '</small></button>';
    }).join("") + '<div class="eisk-chart-tip"></div></div>';
  }

  function bindHover(root) {
    if (root.dataset.eiskHover) return;
    root.dataset.eiskHover = "true";
    root.addEventListener("pointerover", function (event) {
      var item = event.target.closest("[data-tip]");
      if (!item) return;
      var chart = item.closest(".eisk-hover-chart");
      var tip = chart.querySelector(".eisk-chart-tip");
      tip.textContent = item.dataset.tip;
      tip.classList.add("show");
    });
    root.addEventListener("pointermove", function (event) {
      var chart = event.target.closest(".eisk-hover-chart");
      var tip = chart && chart.querySelector(".eisk-chart-tip.show");
      if (!tip) return;
      var box = chart.getBoundingClientRect();
      tip.style.left = Math.max(8, Math.min(box.width - 190, event.clientX - box.left + 10)) + "px";
      tip.style.top = Math.max(5, event.clientY - box.top - 45) + "px";
    });
    root.addEventListener("pointerout", function (event) {
      var chart = event.target.closest(".eisk-hover-chart");
      var tip = chart && chart.querySelector(".eisk-chart-tip");
      if (tip) tip.classList.remove("show");
    });
  }

  function installDashboard(shell) {
    if (!shell || shell.dataset.eiskV3) return;
    shell.dataset.eiskV3 = "true";
    state.dashboard = shell;
    addStationSearch();
    populateStations();
    var cityForm = shell.querySelector(".city-search:not(.eisk-station-search)");
    if (cityForm) cityForm.addEventListener("submit", function () { var value = cityForm.querySelector("input").value.trim(); if (value) setTimeout(function () { loadWeather(value); }, 0); });
    var toggle = shell.querySelector(".auto-switch input");
    if (toggle) { state.auto = toggle.checked; toggle.addEventListener("change", function () { state.auto = toggle.checked; }); }
    var trend = shell.querySelector(".trend-panel");
    if (trend) trend.classList.add("eisk-hidden-trend");
    bindHover(shell);
    renderTide();
    renderRain();
    var initialWeather = cityForm && cityForm.querySelector("input").value.trim();
    if (initialWeather) loadWeather(initialWeather);
  }

  function installNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    nav.querySelectorAll("button, a").forEach(function (item) { if (item.textContent.trim() === "水文水位") item.hidden = true; });
    if (nav.dataset.eiskFast) return;
    nav.dataset.eiskFast = "true";
    nav.addEventListener("click", function (event) {
      var target = event.target.closest("button, a");
      if (!target) return;
      var text = target.textContent.trim();
      if (text !== "船舶信息") document.querySelectorAll(".vessel-system").forEach(function (item) { item.hidden = true; });
      if (text !== "三维模型查看器") document.querySelectorAll(".model-viewer-system").forEach(function (item) { item.hidden = true; });
      if (text !== "船舶信息" && text !== "三维模型查看器") document.body.style.overflow = "";
      window.scrollTo({ top: 0, behavior: "auto" });
    }, true);
  }

  async function refreshData() {
    try {
      var response = await fetch("./data/eisk-tides.json?v=" + Date.now(), { cache: "no-store" });
      if (response.ok) state.data = await response.json();
    } catch (_) {
      if (!state.data) console.error("潮汐数据文件不可用，且没有嵌入式兜底数据");
    }
    populateStations();
    renderTide();
  }

  function initialize() {
    installNav();
    installDashboard(document.querySelector(".dashboard-shell"));
    refreshData();
    var main = document.querySelector("main");
    if (main) new MutationObserver(function () { installNav(); installDashboard(document.querySelector(".dashboard-shell")); }).observe(main, { childList: true });
    setInterval(function () {
      updateMeta();
      if (state.dashboard && document.body.contains(state.dashboard) && new Date().getSeconds() === 0) renderTide();
      if (state.auto && Date.now() - state.lastRefresh > 10 * 60 * 1000) { state.lastRefresh = Date.now(); refreshData(); loadWeather(state.weatherQuery); }
    }, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
