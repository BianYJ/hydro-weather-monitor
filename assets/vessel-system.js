(function () {
  "use strict";

  var REGIONS = {
    global: { label: "全球", lat: 18, lon: 105, zoom: 2 },
    eastChina: { label: "东海", lat: 29.5, lon: 124, zoom: 6 },
    southChina: { label: "南海", lat: 15, lon: 113, zoom: 5 },
    malacca: { label: "马六甲", lat: 2.8, lon: 101.2, zoom: 7 },
    europe: { label: "欧洲", lat: 50, lon: 4, zoom: 4 }
  };

  var overlay;
  var frame;
  var navButton;
  var activeRegion = "global";

  function escapeForScript(value) {
    return String(value).replace(/[<>&]/g, function (char) {
      return { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" }[char];
    });
  }

  function mapDocument(options) {
    var height = Math.max(560, frame && frame.parentElement ? frame.parentElement.clientHeight : 720);
    var declarations = [
      'var width="100%"',
      'var height="' + height + '"',
      'var latitude="' + escapeForScript(options.lat) + '"',
      'var longitude="' + escapeForScript(options.lon) + '"',
      'var zoom="' + escapeForScript(options.zoom) + '"',
      'var names=true'
    ];

    if (options.mmsi) declarations.push('var mmsi="' + escapeForScript(options.mmsi) + '"');
    if (options.imo) declarations.push('var imo="' + escapeForScript(options.imo) + '"');
    if (options.mmsi || options.imo) declarations.push("var show_track=true");

    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#071725}iframe{max-width:100%!important}</style>' +
      '</head><body><script>' + declarations.join(";") + ';</script>' +
      '<script src="https://www.vesselfinder.com/aismap.js"></script></body></html>';
  }

  function loadMap(options) {
    if (!frame) return;
    frame.srcdoc = mapDocument(options);
  }

  function setRegion(key) {
    var region = REGIONS[key] || REGIONS.global;
    activeRegion = key in REGIONS ? key : "global";
    overlay.querySelectorAll(".vessel-region").forEach(function (button) {
      button.classList.toggle("active", button.dataset.region === activeRegion);
    });
    overlay.querySelector(".vessel-map-area").textContent = region.label + "海域";
    overlay.querySelector(".vessel-error").textContent = "";
    loadMap(region);
  }

  function searchShip() {
    var input = overlay.querySelector(".vessel-search-input");
    var error = overlay.querySelector(".vessel-error");
    var value = input.value.replace(/\s+/g, "");
    var options = { lat: 18, lon: 105, zoom: 3 };

    if (/^\d{9}$/.test(value)) {
      options.mmsi = value;
    } else if (/^\d{7}$/.test(value)) {
      options.imo = value;
    } else {
      error.textContent = "请输入 9 位 MMSI 或 7 位 IMO 编号";
      input.focus();
      return;
    }

    error.textContent = "";
    overlay.querySelectorAll(".vessel-region").forEach(function (button) {
      button.classList.remove("active");
    });
    overlay.querySelector(".vessel-map-area").textContent = "单船查询 · " + value;
    loadMap(options);
  }

  function showVessels() {
    document.querySelectorAll(".nav a, .nav button").forEach(function (item) {
      item.classList.toggle("active", item === navButton);
    });
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    var nav = document.querySelector(".nav");
    if (nav) nav.classList.remove("open");
    if (!frame.srcdoc) setRegion(activeRegion);
  }

  function hideVessels() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function buildOverlay() {
    overlay = document.createElement("section");
    overlay.className = "vessel-system";
    overlay.hidden = true;
    overlay.setAttribute("aria-label", "全球船舶信息系统");
    overlay.innerHTML =
      '<div class="vessel-shell">' +
        '<header class="vessel-heading">' +
          '<div><p class="vessel-kicker">GLOBAL AIS MONITORING</p><h1>全球船舶实时定位</h1></div>' +
          '<div class="vessel-live"><span class="vessel-live-dot"></span>公共 AIS 数据接入正常</div>' +
        '</header>' +
        '<div class="vessel-layout">' +
          '<aside class="vessel-sidebar">' +
            '<section class="vessel-section">' +
              '<h2 class="vessel-section-title">船舶动态</h2>' +
              '<p class="vessel-description">拖动、缩放地图查看各海域船舶。点击船舶图标可查看船名、类型、MMSI、航速、航向及最近报告时间。</p>' +
            '</section>' +
            '<section class="vessel-section">' +
              '<h2 class="vessel-section-title">快速定位</h2>' +
              '<div class="vessel-regions">' +
                '<button class="vessel-region active" data-region="global">全球</button>' +
                '<button class="vessel-region" data-region="eastChina">东海</button>' +
                '<button class="vessel-region" data-region="southChina">南海</button>' +
                '<button class="vessel-region" data-region="malacca">马六甲</button>' +
                '<button class="vessel-region" data-region="europe">欧洲</button>' +
              '</div>' +
            '</section>' +
            '<section class="vessel-section">' +
              '<h2 class="vessel-section-title">单船查询</h2>' +
              '<div class="vessel-search-row">' +
                '<input class="vessel-search-input" inputmode="numeric" maxlength="9" placeholder="MMSI / IMO" aria-label="输入MMSI或IMO">' +
                '<button class="vessel-search-button">查询</button>' +
              '</div>' +
              '<div class="vessel-error" role="alert"></div>' +
              '<p class="vessel-note">支持 9 位 MMSI 或 7 位 IMO 编号。</p>' +
              '<button class="vessel-reset">返回全球船舶地图</button>' +
            '</section>' +
            '<section class="vessel-section">' +
              '<h2 class="vessel-section-title">可查看信息</h2>' +
              '<div class="vessel-fields">' +
                '<div class="vessel-field">船名 / 呼号</div><div class="vessel-field">船舶类型</div>' +
                '<div class="vessel-field">MMSI / IMO</div><div class="vessel-field">航速 / 航向</div>' +
                '<div class="vessel-field">当前位置</div><div class="vessel-field">更新时间</div>' +
              '</div>' +
            '</section>' +
            '<section class="vessel-section">' +
              '<p class="vessel-note">AIS 覆盖和更新时间受岸基接收站、卫星与船舶设备影响，仅供信息参考，不可用于航行决策。</p>' +
              '<a class="vessel-source" href="https://www.vesselfinder.com/" target="_blank" rel="noopener noreferrer">数据地图：VesselFinder 官方 AIS ↗</a>' +
            '</section>' +
          '</aside>' +
          '<main class="vessel-map-panel">' +
            '<div class="vessel-map-toolbar">' +
              '<div class="vessel-map-badge vessel-map-area">全球海域</div>' +
              '<div class="vessel-map-badge">点击船舶标记查看详细信息</div>' +
            '</div>' +
            '<iframe class="vessel-map-frame" title="全球船舶AIS实时地图" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' +
          '</main>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    frame = overlay.querySelector(".vessel-map-frame");

    overlay.querySelectorAll(".vessel-region").forEach(function (button) {
      button.addEventListener("click", function () { setRegion(button.dataset.region); });
    });
    overlay.querySelector(".vessel-search-button").addEventListener("click", searchShip);
    overlay.querySelector(".vessel-search-input").addEventListener("keydown", function (event) {
      if (event.key === "Enter") searchShip();
    });
    overlay.querySelector(".vessel-reset").addEventListener("click", function () { setRegion("global"); });
  }

  function install() {
    var nav = document.querySelector(".nav");
    if (!nav || document.querySelector(".vessel-nav-button")) return false;

    buildOverlay();
    navButton = document.createElement("button");
    navButton.type = "button";
    navButton.className = "vessel-nav-button";
    navButton.textContent = "船舶信息";
    navButton.addEventListener("click", showVessels);
    nav.appendChild(navButton);

    nav.addEventListener("click", function (event) {
      var target = event.target.closest("a, button");
      if (target && target !== navButton) hideVessels();
    });
    window.addEventListener("hashchange", function () {
      if (!overlay.hidden) hideVessels();
    });
    return true;
  }

  if (!install()) {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (install() || attempts > 100) window.clearInterval(timer);
    }, 100);
  }
})();
