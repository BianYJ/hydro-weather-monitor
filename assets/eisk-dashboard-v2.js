(function () {
  "use strict";

  var DATA_URL = "./data/eisk-tides.json";
  var DEFAULT_STATION = "332";
  var DEFAULT_WEATHER = "金山";
  var state = {
    data: null,
    stationId: localStorage.getItem("eisk-station") || DEFAULT_STATION,
    autoRefresh: localStorage.getItem("eisk-auto-refresh") !== "false",
    weatherQuery: localStorage.getItem("weather-place") || DEFAULT_WEATHER,
    weather: null,
    weatherError: "",
    tideError: "",
    dashboard: null,
    weatherAbort: null,
    lastAutoAt: 0,
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char];
    });
  }

  function shanghaiParts(date) {
    var parts = new Intl.DateTimeFormat("en", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).formatToParts(date);
    var values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return values;
  }

  function shanghaiDateKey(date) {
    var parts = shanghaiParts(date);
    return parts.year + "-" + parts.month + "-" + parts.day;
  }

  function lunarDate(date) {
    try {
      return new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
        timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric"
      }).format(date);
    } catch (_) {
      return "农历日期暂不可用";
    }
  }

  function eventDate(day, event) {
    return new Date(day.date + "T" + event.time + ":00+08:00");
  }

  function flattenEvents(station) {
    return (station.days || []).flatMap(function (day) {
      return (day.events || []).map(function (event) {
        return Object.assign({ date: day.date, at: eventDate(day, event) }, event);
      });
    }).sort(function (a, b) { return a.at - b.at; });
  }

  function stationStatus(station, now) {
    var events = flattenEvents(station);
    var empty = {
      height: null, direction: "待同步", nextHigh: null, nextLow: null,
      day: null, events: [], stale: true
    };
    if (events.length < 2) return empty;
    var previous = null;
    var next = null;
    for (var index = 0; index < events.length; index += 1) {
      if (events[index].at <= now) previous = events[index];
      if (!next && events[index].at > now) next = events[index];
    }
    var height = null;
    var direction = "待同步";
    var stale = !previous || !next;
    if (previous && next) {
      var ratio = Math.max(0, Math.min(1, (now - previous.at) / Math.max(1, next.at - previous.at)));
      var eased = (1 - Math.cos(Math.PI * ratio)) / 2;
      height = previous.height + (next.height - previous.height) * eased;
      direction = next.height >= previous.height ? "涨潮" : "退潮";
    } else {
      var nearest = next || previous;
      height = nearest ? nearest.height : null;
    }
    var today = shanghaiDateKey(now);
    var day = (station.days || []).find(function (item) { return item.date === today; }) || (station.days || [])[0] || null;
    return {
      height: height,
      direction: direction,
      nextHigh: events.find(function (event) { return event.at > now && event.kind === "高潮"; }) || null,
      nextLow: events.find(function (event) { return event.at > now && event.kind === "低潮"; }) || null,
      day: day,
      events: day ? day.events : [],
      stale: stale,
    };
  }

  function selectedStation() {
    if (!state.data || !state.data.stations || !state.data.stations.length) return null;
    return state.data.stations.find(function (station) { return station.id === state.stationId; }) ||
      state.data.stations.find(function (station) { return station.id === DEFAULT_STATION; }) || state.data.stations[0];
  }

  function weatherText(code) {
    if (code === 0) return "晴朗";
    if (code <= 3) return "多云";
    if (code <= 48) return "有雾";
    if (code <= 67) return "降雨";
    if (code <= 77) return "降雪";
    if (code <= 82) return "阵雨";
    return "雷阵雨";
  }

  function weatherIcon(code) {
    if (code === 0) return "☀";
    if (code <= 3) return "◒";
    if (code <= 48) return "≋";
    if (code <= 82) return "☂";
    return "ϟ";
  }

  function windDirection(degrees) {
    var values = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
    return values[Math.round(Number(degrees || 0) / 45) % 8];
  }

  function formatGeneratedAt() {
    if (!state.data || !state.data.generatedAt) return "等待同步";
    var date = new Date(state.data.generatedAt);
    if (Number.isNaN(date.getTime())) return state.data.generatedAt;
    return date.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
  }

  function buildDashboard(shell) {
    if (!shell || shell.querySelector(":scope > .eisk-dashboard-v2")) return;
    shell.classList.add("eisk-dashboard-rebuilt");
    var dashboard = document.createElement("div");
    dashboard.className = "eisk-dashboard-v2";
    dashboard.innerHTML =
      '<section class="eisk-overview-head">' +
        '<div class="eisk-title"><p class="eyebrow">COASTAL TIDE & WEATHER</p><h1>沿海潮汐气象综合态势</h1><p>潮汐站、实时天气与逐小时降雨集中展示</p></div>' +
        '<div class="eisk-clock" aria-live="polite"><strong data-clock-time>--:--:--</strong><span data-clock-date>正在同步时间</span><em data-clock-lunar>农历日期</em></div>' +
      '</section>' +
      '<section class="eisk-search-row" aria-label="查询工具">' +
        '<form class="eisk-search-form" data-weather-form><span>⌖</span><input data-weather-input aria-label="天气地址" placeholder="输入天气地址，如上海金山"><button>查询天气</button></form>' +
        '<form class="eisk-search-form" data-station-form><span>≈</span><input data-station-input list="eisk-station-options" aria-label="潮汐站" placeholder="输入潮汐站名称或地区"><datalist id="eisk-station-options"></datalist><button>查询潮汐</button></form>' +
        '<div class="eisk-search-message" data-search-message role="status"></div>' +
      '</section>' +
      '<section class="eisk-status-strip">' +
        '<div><i class="eisk-status-dot"></i><span>数据接收状态</span><strong data-data-state>正在连接</strong></div>' +
        '<div><span>更新时间</span><strong data-data-time>等待同步</strong></div>' +
        '<label class="eisk-auto"><input type="checkbox" data-auto-refresh><span></span>自动刷新</label>' +
      '</section>' +
      '<section class="eisk-metric-grid" aria-label="潮汐核心指标">' +
        '<article class="eisk-metric current"><div><span>≈</span><em>预报</em></div><p>当前预报潮高</p><strong data-current-height>--</strong><small>m</small><footer data-current-note>等待潮汐数据</footer></article>' +
        '<article class="eisk-metric high"><div><span>↟</span><em>预报</em></div><p>下次高潮</p><strong data-next-high>--</strong><small>m</small><footer><b data-next-high-time>--:--</b><span data-next-high-date>等待同步</span></footer></article>' +
        '<article class="eisk-metric low"><div><span>↡</span><em>预报</em></div><p>下次低潮</p><strong data-next-low>--</strong><small>m</small><footer><b data-next-low-time>--:--</b><span data-next-low-date>等待同步</span></footer></article>' +
      '</section>' +
      '<section class="eisk-main-grid">' +
        '<article class="eisk-panel eisk-station-state"><header><div><p class="eyebrow">TIDE STATION STATUS</p><h2>潮汐站态势</h2></div><a data-source-link target="_blank" rel="noreferrer">查看来源 ↗</a></header><div data-station-content class="eisk-panel-loading">正在加载潮汐站数据…</div></article>' +
        '<div class="eisk-side-stack">' +
          '<article class="eisk-panel eisk-weather"><header><div><p class="eyebrow">LIVE WEATHER</p><h2>实时天气</h2></div><span>OPEN-METEO</span></header><div data-weather-content class="eisk-panel-loading">正在获取实时天气…</div></article>' +
          '<article class="eisk-panel eisk-tide-alert"><header><div><p class="eyebrow">TIDE REMINDER</p><h2>潮汐提示</h2></div><span>预报</span></header><div data-alert-content class="eisk-panel-loading">正在分析潮汐状态…</div></article>' +
        '</div>' +
      '</section>' +
      '<section class="eisk-panel eisk-rain-panel"><header><div><p class="eyebrow">HOURLY PRECIPITATION</p><h2>逐小时降雨</h2></div><span data-rain-place>等待天气地址</span></header><div data-rain-content class="eisk-panel-loading">正在获取逐小时降雨…</div></section>' +
      '<footer class="eisk-source-note">潮汐数据来自 Eisk 潮汐表精灵，属于天文潮位预报；天气与降雨来自 Open-Meteo。数据仅供态势参考。</footer>';
    shell.appendChild(dashboard);
    state.dashboard = dashboard;
    bindDashboard(dashboard);
    populateStationOptions();
    updateClock();
    renderTide();
    renderWeather();
  }

  function bindDashboard(dashboard) {
    var weatherInput = dashboard.querySelector("[data-weather-input]");
    var stationInput = dashboard.querySelector("[data-station-input]");
    weatherInput.value = state.weatherQuery;
    dashboard.querySelector("[data-auto-refresh]").checked = state.autoRefresh;
    dashboard.querySelector("[data-weather-form]").addEventListener("submit", function (event) {
      event.preventDefault();
      var value = weatherInput.value.trim();
      if (value) loadWeather(value);
    });
    dashboard.querySelector("[data-station-form]").addEventListener("submit", function (event) {
      event.preventDefault();
      selectStationFromQuery(stationInput.value);
    });
    dashboard.querySelector("[data-auto-refresh]").addEventListener("change", function (event) {
      state.autoRefresh = event.target.checked;
      localStorage.setItem("eisk-auto-refresh", String(state.autoRefresh));
      setSearchMessage(state.autoRefresh ? "已开启自动刷新" : "已暂停自动刷新");
    });
    dashboard.addEventListener("click", function (event) {
      var stationButton = event.target.closest("[data-station-id]");
      if (stationButton) selectStation(stationButton.dataset.stationId);
    });
    dashboard.addEventListener("pointerover", showChartTip);
    dashboard.addEventListener("pointermove", moveChartTip);
    dashboard.addEventListener("pointerout", hideChartTip);
  }

  function populateStationOptions() {
    if (!state.dashboard || !state.data) return;
    var list = state.dashboard.querySelector("#eisk-station-options");
    if (!list || list.dataset.loaded === String(state.data.stations.length)) return;
    list.innerHTML = state.data.stations.map(function (station) {
      return '<option value="' + escapeHtml(station.region + " · " + station.name) + '">站号 ' + escapeHtml(station.id) + '</option>';
    }).join("");
    list.dataset.loaded = String(state.data.stations.length);
  }

  function selectStationFromQuery(raw) {
    if (!state.data) return;
    var query = String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
    query = query.replace(/[·•]/g, "");
    var station = state.data.stations.find(function (item) {
      var full = (item.region + item.name).toLowerCase().replace(/\s+/g, "");
      return item.id === query || item.name.toLowerCase() === query || full === query;
    }) || state.data.stations.find(function (item) {
      return (item.region + item.name + item.id).toLowerCase().replace(/\s+/g, "").includes(query);
    });
    if (!station) {
      setSearchMessage("未找到该潮汐站，请从下拉建议中选择", true);
      return;
    }
    selectStation(station.id);
    setSearchMessage("已切换至 " + station.region + " · " + station.name);
  }

  function selectStation(id) {
    state.stationId = id;
    localStorage.setItem("eisk-station", id);
    var station = selectedStation();
    if (state.dashboard && station) state.dashboard.querySelector("[data-station-input]").value = station.region + " · " + station.name;
    renderTide();
  }

  function setSearchMessage(message, error) {
    if (!state.dashboard) return;
    var node = state.dashboard.querySelector("[data-search-message]");
    node.textContent = message || "";
    node.classList.toggle("error", Boolean(error));
    window.clearTimeout(setSearchMessage.timer);
    setSearchMessage.timer = window.setTimeout(function () { node.textContent = ""; }, 4200);
  }

  function setText(selector, value) {
    var node = state.dashboard && state.dashboard.querySelector(selector);
    if (node) node.textContent = value;
  }

  function eventDayLabel(event) {
    if (!event) return "等待同步";
    return event.date === shanghaiDateKey(new Date()) ? "今天" : event.date.slice(5);
  }

  function renderTide() {
    if (!state.dashboard) return;
    var station = selectedStation();
    if (!station) {
      setText("[data-data-state]", state.tideError || "数据不可用");
      return;
    }
    state.stationId = station.id;
    var status = stationStatus(station, new Date());
    setText("[data-data-state]", (state.data.succeeded || state.data.stations.length) + "/" + state.data.stations.length + " 个潮汐站已同步");
    setText("[data-data-time]", formatGeneratedAt());
    setText("[data-current-height]", status.height == null ? "--" : status.height.toFixed(2));
    setText("[data-current-note]", station.name + " · " + status.direction + (status.stale ? " · 待更新" : ""));
    setText("[data-next-high]", status.nextHigh ? status.nextHigh.height.toFixed(1) : "--");
    setText("[data-next-high-time]", status.nextHigh ? status.nextHigh.time : "--:--");
    setText("[data-next-high-date]", eventDayLabel(status.nextHigh) + " · " + station.name);
    setText("[data-next-low]", status.nextLow ? status.nextLow.height.toFixed(1) : "--");
    setText("[data-next-low-time]", status.nextLow ? status.nextLow.time : "--:--");
    setText("[data-next-low-date]", eventDayLabel(status.nextLow) + " · " + station.name);
    state.dashboard.querySelector("[data-source-link]").href = station.sourceUrl;
    state.dashboard.querySelector("[data-station-input]").value = station.region + " · " + station.name;
    renderStationState(station, status);
    renderAlert(station, status);
  }

  function renderStationState(station, status) {
    var container = state.dashboard.querySelector("[data-station-content]");
    var related = state.data.stations.filter(function (item) { return item.region === station.region && item.id !== station.id; }).slice(0, 7);
    var events = status.events || [];
    container.className = "";
    container.innerHTML =
      '<div class="eisk-selected-station"><div><span>当前站点</span><h3>' + escapeHtml(station.name) + '</h3><small>' + escapeHtml(station.region) + ' · 站号 ' + escapeHtml(station.id) + '</small></div><div><span>当前状态</span><strong>' + escapeHtml(status.direction) + '</strong><em>' + (status.height == null ? "--" : status.height.toFixed(2)) + ' m</em></div></div>' +
      '<div class="eisk-tide-events eisk-hover-chart" aria-label="当日潮汐时次图">' + (events.length ? events.map(function (event) {
        var tip = event.time + " " + event.kind + "，预报潮高 " + event.height.toFixed(1) + " 米";
        return '<button class="' + (event.kind === "高潮" ? "high" : "low") + '" data-tip="' + escapeHtml(tip) + '"><i></i><b>' + escapeHtml(event.time) + '</b><span>' + escapeHtml(event.kind) + '</span><strong>' + event.height.toFixed(1) + ' m</strong></button>';
      }).join("") : '<div class="eisk-empty">该站潮汐时次等待同步</div>') + '</div>' +
      '<div class="eisk-related"><span>同地区快速切换</span><div><button class="active" data-station-id="' + station.id + '">' + escapeHtml(station.name) + '</button>' + related.map(function (item) {
        return '<button data-station-id="' + item.id + '">' + escapeHtml(item.name) + '</button>';
      }).join("") + '</div></div>';
  }

  function renderAlert(station, status) {
    var node = state.dashboard.querySelector("[data-alert-content]");
    node.className = "";
    if (!status.nextHigh && !status.nextLow) {
      node.innerHTML = '<div class="eisk-alert-card muted"><i>i</i><div><strong>潮汐数据等待同步</strong><p>可点击右上角“查看来源”核对该站原始页面。</p></div></div>';
      return;
    }
    var nextEvent = [status.nextHigh, status.nextLow].filter(Boolean).sort(function (a, b) { return a.at - b.at; })[0];
    node.innerHTML = '<div class="eisk-alert-card"><i>≈</i><div><strong>' + escapeHtml(station.name) + '当前' + escapeHtml(status.direction) + '</strong><p>下一潮汐节点：' + escapeHtml(nextEvent.kind) + ' ' + escapeHtml(eventDayLabel(nextEvent)) + ' ' + escapeHtml(nextEvent.time) + '，预报潮高 ' + nextEvent.height.toFixed(1) + ' m。</p><small>天文潮位不包含台风、寒潮、洪水等造成的增减水</small></div></div>';
  }

  async function loadTides() {
    try {
      var response = await fetch(DATA_URL + "?v=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      state.data = await response.json();
      state.tideError = "";
      populateStationOptions();
      renderTide();
    } catch (error) {
      state.tideError = "潮汐数据加载失败";
      setText("[data-data-state]", state.tideError);
      console.error(state.tideError, error);
    }
  }

  async function loadWeather(query) {
    if (state.weatherAbort) state.weatherAbort.abort();
    state.weatherAbort = new AbortController();
    state.lastAutoAt = Date.now();
    state.weatherQuery = query || state.weatherQuery;
    localStorage.setItem("weather-place", state.weatherQuery);
    state.weatherError = "";
    if (state.dashboard) {
      state.dashboard.querySelector("[data-weather-input]").value = state.weatherQuery;
      state.dashboard.querySelector("[data-weather-content]").innerHTML = '<div class="eisk-panel-loading">正在获取实时天气…</div>';
    }
    try {
      var candidates = [state.weatherQuery];
      var tail = state.weatherQuery.match(/([^省市区县镇街道]+)(?:省|市|区|县|镇|街道)?$/);
      if (tail && tail[1] && tail[1] !== state.weatherQuery) candidates.push(tail[1]);
      var geo = null;
      for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        var geoResponse = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(candidates[candidateIndex]) + "&count=1&language=zh&format=json", { signal: state.weatherAbort.signal });
        var candidateGeo = await geoResponse.json();
        if (candidateGeo.results && candidateGeo.results[0]) { geo = candidateGeo; break; }
      }
      if (!geo || !geo.results || !geo.results[0]) throw new Error("未找到该天气地址");
      var place = geo.results[0];
      var url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=precipitation&timezone=Asia%2FShanghai&forecast_days=2&past_days=1";
      var weatherResponse = await fetch(url, { signal: state.weatherAbort.signal });
      if (!weatherResponse.ok) throw new Error("天气服务暂时不可用");
      var payload = await weatherResponse.json();
      var currentHour = payload.current.time.slice(0, 13) + ":00";
      var start = Math.max(0, payload.hourly.time.findIndex(function (time) { return time >= currentHour; }));
      state.weather = {
        place: [place.name, place.admin2 || place.admin1].filter(Boolean).join(" · "),
        current: payload.current,
        hours: payload.hourly.time.slice(start, start + 24).map(function (time, index) {
          return { time: time, precipitation: Number(payload.hourly.precipitation[start + index] || 0) };
        }),
      };
      renderWeather();
      setSearchMessage("已更新 " + state.weather.place + " 的天气");
    } catch (error) {
      if (error.name === "AbortError") return;
      state.weatherError = error.message || "天气数据加载失败";
      renderWeather();
      setSearchMessage(state.weatherError, true);
    }
  }

  function renderWeather() {
    if (!state.dashboard) return;
    var weatherNode = state.dashboard.querySelector("[data-weather-content]");
    var rainNode = state.dashboard.querySelector("[data-rain-content]");
    if (state.weatherError) {
      weatherNode.innerHTML = '<div class="eisk-empty error">' + escapeHtml(state.weatherError) + '</div>';
      rainNode.innerHTML = '<div class="eisk-empty error">逐小时降雨暂不可用</div>';
      return;
    }
    if (!state.weather) return;
    var current = state.weather.current;
    weatherNode.className = "";
    weatherNode.innerHTML = '<div class="eisk-weather-main"><span>' + weatherIcon(current.weather_code) + '</span><div><strong>' + Math.round(current.temperature_2m) + '°</strong><small>' + escapeHtml(weatherText(current.weather_code)) + ' · 体感 ' + Math.round(current.apparent_temperature) + '°</small></div><em>' + escapeHtml(state.weather.place) + '</em></div>' +
      '<div class="eisk-weather-grid"><div><span>相对湿度</span><strong>' + current.relative_humidity_2m + '%</strong></div><div><span>' + escapeHtml(windDirection(current.wind_direction_10m)) + '风</span><strong>' + current.wind_speed_10m + ' km/h</strong></div><div><span>实时降水</span><strong>' + current.precipitation + ' mm</strong></div></div>';
    renderRain();
  }

  function renderRain() {
    if (!state.dashboard || !state.weather) return;
    var hours = state.weather.hours;
    var max = Math.max.apply(Math, hours.map(function (hour) { return hour.precipitation; }).concat([1]));
    var total = hours.reduce(function (sum, hour) { return sum + hour.precipitation; }, 0);
    var node = state.dashboard.querySelector("[data-rain-content]");
    state.dashboard.querySelector("[data-rain-place]").textContent = state.weather.place + " · 未来24小时";
    node.className = "";
    node.innerHTML = '<div class="eisk-rain-summary"><span>未来24小时累计 <strong>' + total.toFixed(1) + ' mm</strong></span><span>最大小时降雨 <strong>' + max.toFixed(1) + ' mm</strong></span></div>' +
      '<div class="eisk-rain-chart eisk-hover-chart" aria-label="未来24小时逐小时降雨图">' + hours.map(function (hour, index) {
        var label = hour.time.slice(11, 16);
        var date = hour.time.slice(5, 10);
        var height = Math.max(3, hour.precipitation / max * 104);
        var tip = date + " " + label + "，降雨量 " + hour.precipitation.toFixed(1) + " 毫米";
        return '<button data-tip="' + escapeHtml(tip) + '" aria-label="' + escapeHtml(tip) + '"><em>' + (hour.precipitation ? hour.precipitation.toFixed(1) : "") + '</em><i style="height:' + height.toFixed(1) + 'px"></i><small>' + (index % 3 === 0 ? label : "") + '</small></button>';
      }).join("") + '<div class="eisk-chart-tooltip" role="tooltip"></div></div>';
  }

  function showChartTip(event) {
    var target = event.target.closest("[data-tip]");
    if (!target) return;
    var chart = target.closest(".eisk-hover-chart");
    var tooltip = chart && chart.querySelector(".eisk-chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "eisk-chart-tooltip";
      tooltip.setAttribute("role", "tooltip");
      chart.appendChild(tooltip);
    }
    tooltip.textContent = target.dataset.tip;
    tooltip.classList.add("show");
  }

  function moveChartTip(event) {
    var chart = event.target.closest(".eisk-hover-chart");
    var tooltip = chart && chart.querySelector(".eisk-chart-tooltip.show");
    if (!tooltip) return;
    var box = chart.getBoundingClientRect();
    tooltip.style.left = Math.max(12, Math.min(box.width - 190, event.clientX - box.left + 12)) + "px";
    tooltip.style.top = Math.max(8, event.clientY - box.top - 48) + "px";
  }

  function hideChartTip(event) {
    if (event.relatedTarget && event.relatedTarget.closest && event.relatedTarget.closest("[data-tip]") === event.target.closest("[data-tip]")) return;
    var chart = event.target.closest(".eisk-hover-chart");
    var tooltip = chart && chart.querySelector(".eisk-chart-tooltip");
    if (tooltip) tooltip.classList.remove("show");
  }

  function updateClock() {
    if (!state.dashboard) return;
    var now = new Date();
    var parts = shanghaiParts(now);
    setText("[data-clock-time]", parts.hour + ":" + parts.minute + ":" + parts.second);
    setText("[data-clock-date]", now.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "long", day: "numeric", weekday: "long" }));
    setText("[data-clock-lunar]", lunarDate(now));
  }

  function installNavFixes() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    Array.from(nav.querySelectorAll("button, a")).forEach(function (item) {
      if (item.textContent.trim() === "水文水位") {
        item.hidden = true;
        item.setAttribute("aria-hidden", "true");
      }
    });
    if (nav.dataset.fastSwitchInstalled) return;
    nav.dataset.fastSwitchInstalled = "true";
    nav.addEventListener("click", function (event) {
      var target = event.target.closest("button, a");
      if (!target || target.hidden) return;
      var label = target.textContent.trim();
      if (label !== "船舶信息") document.querySelectorAll(".vessel-system").forEach(function (item) { item.hidden = true; });
      if (label !== "三维模型查看器") document.querySelectorAll(".model-viewer-system").forEach(function (item) { item.hidden = true; });
      if (label !== "船舶信息" && label !== "三维模型查看器") document.body.style.overflow = "";
      document.body.classList.add("eisk-route-switching");
      window.scrollTo({ top: 0, behavior: "auto" });
      window.clearTimeout(installNavFixes.timer);
      installNavFixes.timer = window.setTimeout(function () { document.body.classList.remove("eisk-route-switching"); }, 240);
    }, true);
  }

  function installRouteObserver() {
    var main = document.querySelector("main");
    if (!main) return;
    new MutationObserver(function () {
      var shell = document.querySelector(".dashboard-shell");
      if (shell) {
        buildDashboard(shell);
        populateStationOptions();
        renderTide();
        renderWeather();
      }
      installNavFixes();
    }).observe(main, { childList: true });
  }

  function prefetchRoutes() {
    [
      "./assets/leaflet-src-6d8xYZEx.js",
      "./assets/cad-viewer-CEchWyPN.js",
      "./assets/cad-viewer-eZyP10jO.css"
    ].forEach(function (href) {
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.appendChild(link);
    });
  }

  async function initialize() {
    installNavFixes();
    buildDashboard(document.querySelector(".dashboard-shell"));
    installRouteObserver();
    await Promise.all([loadTides(), loadWeather(state.weatherQuery)]);
    var lastMinute = -1;
    window.setInterval(function () {
      updateClock();
      var minute = new Date().getMinutes();
      if (minute !== lastMinute && state.dashboard && document.body.contains(state.dashboard)) {
        lastMinute = minute;
        renderTide();
      }
      if (state.autoRefresh && Date.now() - state.lastAutoAt > 10 * 60 * 1000) {
        loadTides();
        loadWeather(state.weatherQuery);
      }
    }, 1000);
    if ("requestIdleCallback" in window) window.requestIdleCallback(prefetchRoutes, { timeout: 2500 });
    else window.setTimeout(prefetchRoutes, 1200);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
