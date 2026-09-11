/* Shambani Milk — "Shops Near You" locator.
 * Loads the shops table from Supabase (read-only, public), builds cascading
 * Region → District → Division → Ward filters from the data itself, adds a
 * street/shop-name search, and can pre-select the visitor's region using
 * browser geolocation + OpenStreetMap reverse geocoding (best effort).
 */
(function () {
  "use strict";

  var root = document.getElementById("shop-locator");
  if (!root) return;

  var cfg = window.SUPABASE_CONFIG || {};
  var shops = null;          // cached rows
  var detectBtn = document.getElementById("detect-location");
  var detectStatus = document.getElementById("detect-status");
  var selRegion = document.getElementById("f-region");
  var selDistrict = document.getElementById("f-district");
  var selDivision = document.getElementById("f-division");
  var selWard = document.getElementById("f-ward");
  var inpStreet = document.getElementById("f-street");
  var resultsBox = document.getElementById("shop-results");
  var countBox = document.getElementById("shop-count");
  var listStatus = document.getElementById("shops-status");

  function t(key) {
    var d = document.documentElement.lang === "sw" ? window.I18N_SW : window.I18N_EN;
    return (d && d[key]) || (window.I18N_EN && window.I18N_EN[key]) || key;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function baseUrl() { return cfg.url.replace(/\/+$/, ""); }

  function setStatus(el, text, cls) {
    if (!el) return;
    el.textContent = text || "";
    el.className = "form-status" + (cls ? " " + cls : "");
  }

  /* ---------- data ---------- */

  function loadShops(cb) {
    if (shops) return cb(null, shops);
    if (!cfg.url || !cfg.anonKey) {
      shops = [];
      return cb(null, shops);
    }
    setStatus(listStatus, t("shops.loading"), "busy");
    fetch(baseUrl() + "/rest/v1/shops?select=*&is_active=eq.true&order=shop_name.asc", {
      headers: { "apikey": cfg.anonKey, "Authorization": "Bearer " + cfg.anonKey }
    }).then(function (res) {
      if (res.ok) return res.json();
      // Table not created yet (or project paused) -> behave as "no shops yet"
      return res.json().catch(function () { return {}; }).then(function () { return []; });
    }).then(function (rows) {
      shops = rows || [];
      setStatus(listStatus, "");
      cb(null, shops);
    }).catch(function () {
      shops = [];
      setStatus(listStatus, t("shops.error"), "err");
      cb(null, shops);
    });
  }

  /* ---------- cascade ---------- */

  function distinctSorted(rows, key) {
    var seen = {}, out = [];
    for (var i = 0; i < rows.length; i++) {
      var v = (rows[i][key] || "").trim();
      if (v && !seen[v]) { seen[v] = 1; out.push(v); }
    }
    return out.sort(function (a, b) { return a.localeCompare(b); });
  }

  function filteredBy(selector) {
    var rows = shops || [];
    var pairs = [[selRegion, "region"], [selDistrict, "district"], [selDivision, "division"], [selWard, "ward"]];
    for (var i = 0; i <= selector; i++) {
      var val = pairs[i][0].value;
      if (val) {
        var key = pairs[i][1];
        rows = rows.filter(function (r) { return (r[key] || "").trim() === val; });
      }
    }
    return rows;
  }

  function fillSelect(sel, values, allLabel) {
    var current = sel.value;
    sel.innerHTML = "";
    var optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = allLabel;
    optAll.className = "opt-all";
    sel.appendChild(optAll);
    for (var i = 0; i < values.length; i++) {
      var o = document.createElement("option");
      o.value = values[i];
      o.textContent = values[i];
      sel.appendChild(o);
    }
    // keep selection if still valid, else reset
    var still = current && values.indexOf(current) !== -1;
    sel.value = still ? current : "";
  }

  var FILTERS = [
    { sel: selRegion, key: "region", upTo: -1, all: "shops.f.all.regions", label: "shops.f.region" },
    { sel: selDistrict, key: "district", upTo: 0, all: "shops.f.all.districts", label: "shops.f.district" },
    { sel: selDivision, key: "division", upTo: 1, all: "shops.f.all.divisions", label: "shops.f.division" },
    { sel: selWard, key: "ward", upTo: 2, all: "shops.f.all.wards", label: "shops.f.ward" }
  ];

  function rebuildSelects(resetFrom) {
    for (var i = 0; i < FILTERS.length; i++) {
      if (i < resetFrom) continue;
      var f = FILTERS[i];
      fillSelect(f.sel, distinctSorted(filteredBy(f.upTo), f.key), t(f.all));
      f.sel.setAttribute("aria-label", t(f.label));
    }
    if (inpStreet) inpStreet.setAttribute("placeholder", t("shops.f.street"));
  }

  /* ---------- results ---------- */

  function currentResults() {
    var rows = filteredBy(FILTERS.length - 1);
    var q = (inpStreet && inpStreet.value || "").trim().toLowerCase();
    if (q) {
      rows = rows.filter(function (r) {
        return (["street", "shop_name", "address", "ward"].some(function (k) {
          return ((r[k] || "") + "").toLowerCase().indexOf(q) !== -1;
        }));
      });
    }
    return rows;
  }

  function shopCard(s) {
    var where = [s.district, s.division, s.ward, s.street].filter(function (x) { return (x || "").trim(); }).join(" › ");
    var html = '<article class="card shop-card"><div class="card-body">';
    html += "<h3>" + esc(s.shop_name) + "</h3>";
    if (where) html += '<p class="shop-where">' + esc(where) + "</p>";
    if (s.address) html += '<p class="shop-addr">' + esc(s.address) + "</p>";
    html += '<div class="shop-actions">';
    if (s.phone) html += '<a class="btn btn-navy btn-sm" href="tel:' + esc(String(s.phone).replace(/[^+\d]/g, "")) + '">' + esc(t("shops.call")) + "</a>";
    if (s.whatsapp) {
      var digits = String(s.whatsapp).replace(/\D/g, "");
      html += '<a class="btn btn-wa btn-sm" href="https://wa.me/' + esc(digits) + '" target="_blank" rel="noopener">WhatsApp</a>';
    }
    html += "</div></div></article>";
    return html;
  }

  function render() {
    if (!resultsBox) return;
    var rows = currentResults();
    countBox.textContent = String(rows.length);
    if (rows.length) {
      resultsBox.innerHTML = rows.map(shopCard).join("");
      setStatus(listStatus, "");
    } else {
      resultsBox.innerHTML = "";
      var total = (shops || []).length;
      setStatus(listStatus, total ? t("shops.none.area") : t("shops.none.yet"), "err");
    }
  }

  function refresh(resetFrom) {
    rebuildSelects(resetFrom || 0);
    render();
  }

  /* ---------- location detection (best effort) ---------- */

  function normalizeRegion(name) {
    return String(name || "").toLowerCase()
      .replace(/mkoa\s+wa\s+/i, "").replace(/\s*region$/i, "").trim();
  }

  function detectLocation() {
    if (!navigator.geolocation) { setStatus(detectStatus, t("shops.detect.fail"), "err"); return; }
    setStatus(detectStatus, t("shops.detect.busy"), "busy");
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lon = pos.coords.longitude;
      fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&lat=" + lat + "&lon=" + lon + "&accept-language=en", {
        headers: { "Accept": "application/json" }
      }).then(function (r) { return r.json(); }).then(function (data) {
        var detected = normalizeRegion(data && data.address && (data.address.state || data.address.region || ""));
        var regions = distinctSorted(shops || [], "region");
        var match = null;
        for (var i = 0; i < regions.length; i++) {
          if (normalizeRegion(regions[i]) === detected) { match = regions[i]; break; }
        }
        if (match) {
          selRegion.value = match;
          refresh(1);
          setStatus(detectStatus, t("shops.detect.ok").replace("{region}", match), "ok");
        } else {
          setStatus(detectStatus, t("shops.detect.fail"), "err");
        }
      }).catch(function () { setStatus(detectStatus, t("shops.detect.fail"), "err"); });
    }, function () {
      setStatus(detectStatus, t("shops.detect.fail"), "err");
    }, { timeout: 10000 });
  }

  /* ---------- wire up ---------- */

  FILTERS.forEach(function (f, i) {
    f.sel.addEventListener("change", function () { refresh(i + 1); });
  });
  if (inpStreet) inpStreet.addEventListener("input", function () { render(); });
  if (detectBtn) detectBtn.addEventListener("click", detectLocation);

  document.addEventListener("langchange", function () { refresh(0); });

  // script is deferred, so the DOM is already parsed — init directly
  loadShops(function () { refresh(0); });
})();
