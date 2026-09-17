/* Shambani Milk — "Shops Near You" locator.
 * Loads the shops table from Supabase (read-only, public), builds cascading
 * Region → District → Division → Ward filters from the data itself, adds a
 * street/shop-name search, and locates the visitor via browser geolocation +
 * OpenStreetMap reverse geocoding (best effort).
 *
 * Automatic mode: visitors who previously granted location permission get
 * shops in their area loaded automatically on page load (no taps). First-time
 * visitors use the "Use my location" button once — after that, every visit is
 * automatic. Detection matches the geocoded area name down the cascade
 * (region → district → division → ward) as far as the data allows.
 *
 * Distance-ready: if shop rows ever include `lat`/`lng` columns, results are
 * sorted by distance from the visitor and each card shows a "X km away" chip.
 * Without coordinates this code path simply stays inactive.
 */
(function () {
  "use strict";

  var root = document.getElementById("shop-locator");
  if (!root) return;

  var cfg = window.SUPABASE_CONFIG || {};
  var shops = null;          // cached rows
  var userPos = null;        // {lat, lon} from the last successful detection
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

  function hasCoords(s) {
    return s && isFinite(parseFloat(s.lat)) && isFinite(parseFloat(s.lng));
  }

  function kmBetween(lat1, lon1, lat2, lon2) {
    var R = 6371, d2r = Math.PI / 180;
    var dLat = (lat2 - lat1) * d2r, dLon = (lon2 - lon1) * d2r;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function distanceKm(s) {
    if (!userPos || !hasCoords(s)) return null;
    return kmBetween(userPos.lat, userPos.lon, parseFloat(s.lat), parseFloat(s.lng));
  }

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
    // Distance sort (active only when shops carry lat/lng and we know the visitor's position)
    if (userPos && rows.some(hasCoords)) {
      rows = rows.slice().sort(function (a, b) {
        var da = distanceKm(a), db = distanceKm(b);
        if (da == null && db == null) return 0;
        if (da == null) return 1;
        if (db == null) return -1;
        return da - db;
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
    var km = distanceKm(s);
    if (km != null) html += '<p class="shop-dist"><span class="chip">' + esc(km < 10 ? km.toFixed(1) : Math.round(km)) + " km</span></p>";
    html += '<div class="shop-actions">';
    if (s.phone) html += '<a class="btn btn-navy btn-sm" href="tel:' + esc(String(s.phone).replace(/[^+\d]/g, "")) + '">' + esc(t("shops.call")) + "</a>";
    if (s.whatsapp) {
      var digits = String(s.whatsapp).replace(/\D/g, "");
      html += '<a class="btn btn-wa btn-sm" href="https://wa.me/' + esc(digits) + '" target="_blank" rel="noopener">WhatsApp</a>';
    }
    if (hasCoords(s)) {
      html += '<a class="btn btn-outline btn-sm shop-dir" href="https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent(parseFloat(s.lat) + "," + parseFloat(s.lng)) +
        '" target="_blank" rel="noopener">' + esc(t("shops.directions")) + "</a>";
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

  // Normalise an administrative name so geocoder output can be matched
  // against the values stored in the shops table. Handles English and
  // Swahili prefixes/suffixes and ignores case/punctuation, e.g.
  // "Morogoro Municipal Council" ~= "Morogoro Municipal".
  function normName(name) {
    return String(name || "").toLowerCase()
      .replace(/mkoa\s+wa\s+/g, "")
      .replace(/wilaya\s+ya\s+/g, "")
      .replace(/kata\s+ya\s+/g, "")
      .replace(/mtaa\s+wa\s+/g, "")
      .replace(/\s*(region|district|division|ward|council|municipal council|city council)\s*$/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  // Find the stored option that best matches a geocoded name.
  function matchIn(options, rawName) {
    if (!rawName) return null;
    var n = normName(rawName);
    if (!n) return null;
    for (var i = 0; i < options.length; i++) {
      var o = normName(options[i]);
      if (!o) continue;
      if (o === n) return options[i];
    }
    // Fallback: one side contained in the other (e.g. "Morogoro" vs "Morogoro Municipal")
    for (var j = 0; j < options.length; j++) {
      var o2 = normName(options[j]);
      if (o2 && (o2.indexOf(n) !== -1 || n.indexOf(o2) !== -1)) return options[j];
    }
    return null;
  }

  // Apply a geocoded address to the cascade, level by level. Selects must be
  // rebuilt between assignments so the next level's options exist.
  // Returns the deepest matched level name, or null if the region didn't match.
  function applyDetected(addr) {
    if (!shops || !shops.length) return null;

    var regions = distinctSorted(shops, "region");
    var rMatch = matchIn(regions, addr.state || addr.region);
    if (!rMatch) return null;
    selRegion.value = rMatch;
    rebuildSelects(1);

    var deepest = rMatch;

    var dMatch = matchIn(distinctSorted(filteredBy(0), "district"), addr.city_district || addr.county || addr.city || addr.town);
    if (dMatch) {
      selDistrict.value = dMatch;
      rebuildSelects(2);
      deepest = dMatch;
    }

    var divMatch = matchIn(distinctSorted(filteredBy(1), "division"), addr.suburb || addr.city_district || addr.quarter);
    if (divMatch) {
      selDivision.value = divMatch;
      rebuildSelects(3);
      deepest = divMatch;
    }

    var wMatch = matchIn(distinctSorted(filteredBy(2), "ward"), addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district);
    if (wMatch) {
      selWard.value = wMatch;
      deepest = wMatch;
    }

    render();
    return deepest;
  }

  function detectLocation(silent) {
    // Nothing to match against yet — say so honestly instead of "detection failed"
    if (!shops || !shops.length) {
      if (!silent) setStatus(detectStatus, t("shops.detect.empty"), "busy");
      return;
    }
    if (!navigator.geolocation) {
      if (!silent) setStatus(detectStatus, t("shops.detect.fail"), "err");
      return;
    }
    if (!silent) setStatus(detectStatus, t("shops.detect.busy"), "busy");
    navigator.geolocation.getCurrentPosition(function (pos) {
      userPos = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=" + userPos.lat + "&lon=" + userPos.lon + "&accept-language=en", {
        headers: { "Accept": "application/json" }
      }).then(function (r) { return r.json(); }).then(function (data) {
        var addr = (data && data.address) || {};
        var area = applyDetected(addr);
        if (area) {
          setStatus(detectStatus, t("shops.detect.ok").replace("{area}", area), "ok");
        } else if (silent) {
          // Automatic attempt found nothing usable — stay quiet, default view is fine
          setStatus(detectStatus, "");
        } else {
          setStatus(detectStatus, t("shops.detect.fail"), "err");
        }
      }).catch(function () {
        if (!silent) setStatus(detectStatus, t("shops.detect.fail"), "err");
      });
    }, function () {
      if (!silent) setStatus(detectStatus, t("shops.detect.fail"), "err");
    }, { timeout: 10000, maximumAge: 300000 });
  }

  /* Automatic detection for returning visitors: only runs when the browser
   * already has location permission (previously granted). First-time visitors
   * never get a surprise permission popup — they use the button once. */
  function maybeAutoDetect() {
    if (!shops || !shops.length) return; // no shops to match against yet
    if (!navigator.geolocation || !navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: "geolocation" }).then(function (st) {
      if (st.state === "granted") detectLocation(true);
    }).catch(function () { /* permissions API unavailable — manual button only */ });
  }

  /* ---------- wire up ---------- */

  FILTERS.forEach(function (f, i) {
    f.sel.addEventListener("change", function () { refresh(i + 1); });
  });
  if (inpStreet) inpStreet.addEventListener("input", function () { render(); });
  if (detectBtn) detectBtn.addEventListener("click", function () { detectLocation(false); });

  document.addEventListener("langchange", function () { refresh(0); });

  // script is deferred, so the DOM is already parsed — init directly
  loadShops(function () {
    refresh(0);
    maybeAutoDetect();
  });
})();
