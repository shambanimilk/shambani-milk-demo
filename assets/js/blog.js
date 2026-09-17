/* Shambani Milk — News & Updates renderer.
 * Reads window.SHAMBANI_POSTS (posts-data.js) and renders either the post
 * list (blog.html) or a single article (blog.html?p=<slug>).
 *
 * NOTE: this script must load AFTER main.js. Rendering happens on
 * DOMContentLoaded (registered after main.js's, so it runs after the language
 * has been applied) and again on "langchange", so posts always display in the
 * visitor's chosen language.
 */
(function () {
  "use strict";

  var view = document.getElementById("blog-view");
  if (!view) return;

  function lang() { return document.documentElement.lang === "sw" ? "sw" : "en"; }

  function t(key) {
    var d = lang() === "sw" ? window.I18N_SW : window.I18N_EN;
    return (d && d[key]) || (window.I18N_EN && window.I18N_EN[key]) || key;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function posts() {
    var list = (window.SHAMBANI_POSTS || []).slice();
    list.sort(function (a, b) { return String(b.dateISO).localeCompare(String(a.dateISO)); });
    return list;
  }

  function currentSlug() {
    try {
      return new URLSearchParams(window.location.search).get("p");
    } catch (e) { return null; }
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(lang() === "sw" ? "sw-TZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) { return iso; }
  }

  function renderList() {
    var list = posts();
    document.title = t("meta.title.blog");
    if (!list.length) {
      view.innerHTML = '<div class="note"><p>' + esc(t("blog.empty")) + "</p></div>";
      return;
    }
    var html = '<div class="grid grid-3">';
    list.forEach(function (p) {
      var c = p[lang()] || p.en || {};
      html += '<article class="card blog-card">';
      if (p.img) html += '<img src="' + esc(p.img) + '" alt="" loading="lazy" width="800" height="500">';
      html += '<div class="card-body">';
      html += '<div class="post-meta"><time datetime="' + esc(p.dateISO) + '">' + esc(fmtDate(p.dateISO)) + "</time></div>";
      html += "<h3><a href=\"blog.html?p=" + encodeURIComponent(p.slug) + '">' + esc(c.title || p.slug) + "</a></h3>";
      if (c.excerpt) html += "<p>" + esc(c.excerpt) + "</p>";
      html += '<a class="text-link" href="blog.html?p=' + encodeURIComponent(p.slug) + '">' + esc(t("blog.readmore")) + " →</a>";
      html += "</div></article>";
    });
    html += "</div>";
    view.innerHTML = html;
  }

  function renderArticle(p) {
    var c = p[lang()] || p.en || {};
    document.title = (c.title || p.slug) + " — Shambani Milk";
    var html = '<a class="back-link" href="blog.html">' + esc(t("blog.back")) + "</a>";
    html += '<div class="article-head">';
    html += '<div class="post-meta"><time datetime="' + esc(p.dateISO) + '">' + esc(fmtDate(p.dateISO)) + "</time></div>";
    html += "<h1>" + esc(c.title || p.slug) + "</h1>";
    if (p.example) html += '<p class="note post-note">' + esc(t("blog.example")) + "</p>";
    html += "</div>";
    if (p.img) html += '<p><img src="' + esc(p.img) + '" alt="" loading="lazy" width="800" height="500" style="border-radius:12px"></p>';
    html += '<div class="article-body">' + (c.body || "") + "</div>";
    view.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function render() {
    var slug = currentSlug();
    var p = slug ? posts().filter(function (x) { return x.slug === slug; })[0] : null;
    if (p) renderArticle(p); else renderList();
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("langchange", render);
})();
