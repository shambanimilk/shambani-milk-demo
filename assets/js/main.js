/* Shambani Milk — language toggle, nav, WhatsApp links, contact form */
(function () {
  "use strict";

  var WA_NUMBER = "255659566060"; // order line per website-build-prompt.md §7 (confirm with company)
  var LANG_KEY = "shambani-lang";

  var lang = (function () {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    return saved === "sw" || saved === "en" ? saved : "en";
  })();

  function dict() {
    return lang === "sw" ? window.I18N_SW : window.I18N_EN;
  }

  function t(key) {
    return dict()[key];
  }

  function applyI18n() {
    document.documentElement.lang = lang;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var val = t(nodes[i].getAttribute("data-i18n"));
      if (val != null) nodes[i].textContent = val;
    }

    var attrNodes = document.querySelectorAll("[data-i18n-attr]");
    for (var j = 0; j < attrNodes.length; j++) {
      var pairs = attrNodes[j].getAttribute("data-i18n-attr").split(",");
      for (var k = 0; k < pairs.length; k++) {
        var parts = pairs[k].split(":");
        var v = t(parts[1].trim());
        if (v != null) attrNodes[j].setAttribute(parts[0].trim(), v);
      }
    }

    var page = document.body.getAttribute("data-page");
    if (page) {
      var title = t("meta.title." + page);
      if (title) document.title = title;
      var desc = document.querySelector('meta[name="description"]');
      var descVal = t("meta.desc." + page);
      if (desc && descVal) desc.setAttribute("content", descVal);
    }

    var btns = document.querySelectorAll(".lang-switch button");
    for (var b = 0; b < btns.length; b++) {
      btns[b].setAttribute("aria-pressed", String(btns[b].getAttribute("data-lang") === lang));
    }
  }

  function applyWaLinks() {
    var links = document.querySelectorAll("[data-wa-msg]");
    for (var i = 0; i < links.length; i++) {
      var msg = t(links[i].getAttribute("data-wa-msg"));
      if (!msg) msg = links[i].getAttribute("data-wa-msg");
      links[i].href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
    }
  }

  function setLang(newLang) {
    lang = newLang;
    try { localStorage.setItem(LANG_KEY, newLang); } catch (e) {}
    applyI18n();
    applyWaLinks();
    document.dispatchEvent(new CustomEvent("langchange"));
  }

  function initLangSwitch() {
    var btns = document.querySelectorAll(".lang-switch button");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        setLang(this.getAttribute("data-lang"));
      });
    }
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");

    function setStatus(key, cls) {
      if (!status) return;
      status.textContent = t(key) || "";
      status.className = "form-status" + (cls ? " " + cls : "");
    }

    function mailtoSubmit() {
      var name = (document.getElementById("cf-name").value || "").trim();
      var phone = (document.getElementById("cf-phone").value || "").trim();
      var msg = (document.getElementById("cf-msg").value || "").trim();
      var subject = encodeURIComponent("Website enquiry — " + (name || "Shambani"));
      var body = encodeURIComponent(
        (lang === "sw" ? "Jina: " : "Name: ") + (name || "-") + "\n" +
        (lang === "sw" ? "Simu: " : "Phone: ") + (phone || "-") + "\n\n" + msg
      );
      window.location.href = "mailto:maziwa@shambani.co.tz?subject=" + subject + "&body=" + body;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setStatus("", "");
      var cfg = window.SUPABASE_CONFIG || {};
      if (!cfg.url || !cfg.anonKey) {
        mailtoSubmit();
        return;
      }
      var payload = {
        name: (document.getElementById("cf-name").value || "").trim(),
        phone: (document.getElementById("cf-phone").value || "").trim(),
        message: (document.getElementById("cf-msg").value || "").trim(),
        language: lang
      };
      setStatus("form.sending", "busy");
      fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/contact_messages", {
        method: "POST",
        headers: {
          "apikey": cfg.anonKey,
          "Authorization": "Bearer " + cfg.anonKey,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        setStatus("form.success", "ok");
        form.reset();
      }).catch(function () {
        setStatus("form.error", "err");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyI18n();
    applyWaLinks();
    initLangSwitch();
    initNav();
    initContactForm();
  });
})();
