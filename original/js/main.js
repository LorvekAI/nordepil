(function () {
  "use strict";
  var cfg = window.NORDEPIL || {};
  var root = document.documentElement;

  /* ---------- Idioma (castellano / catalán) ---------- */
  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function detectLang() {
    var q = null;
    try { q = new URLSearchParams(window.location.search).get("lang"); } catch (e) {}
    if (q === "ca" || q === "es") return q;
    var saved = store("nordepil-lang");
    if (saved === "ca" || saved === "es") return saved;
    var nav = (navigator.language || "es").toLowerCase();
    return nav.indexOf("ca") === 0 ? "ca" : "es";
  }
  function setLang(lang) {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    store("nordepil-lang", lang);
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
    var t = document.querySelector('meta[name="title-' + lang + '"]');
    if (t) document.title = t.getAttribute("content");
    updateWhatsApp(lang);
  }

  /* ---------- Enlaces de WhatsApp ---------- */
  function waUrl(lang) {
    var msg = (cfg.waMessage && cfg.waMessage[lang]) || "";
    return "https://wa.me/" + (cfg.whatsapp || "") + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  function updateWhatsApp(lang) {
    var url = waUrl(lang);
    document.querySelectorAll("a[data-wa]").forEach(function (a) {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }

  /* ---------- Medición (GoatCounter, sin cookies) ---------- */
  if (cfg.goatcounter) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + cfg.goatcounter + ".goatcounter.com/count");
    document.head.appendChild(s);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-wa]");
    if (!a) return;
    var where = a.getAttribute("data-wa") || "web";
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: "whatsapp-" + where, title: "Clic WhatsApp (" + where + ")", event: true });
    }
  });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Pestañas Ellas / Ellos ---------- */
  var tabs = document.querySelectorAll("[role=tab]");
  function selectTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    document.querySelectorAll("[data-laser-only]").forEach(function (el) { el.hidden = id === "faciales"; });
  }
  if (tabs.length) {
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        selectTab(t.getAttribute("aria-controls"));
        try { history.replaceState(null, "", "#" + t.getAttribute("aria-controls")); } catch (e) {}
      });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        selectTab(next.getAttribute("aria-controls"), true);
      });
    });
    var hash = (location.hash || "").replace("#", "");
    selectTab(["ellos", "faciales"].indexOf(hash) !== -1 ? hash : "ellas");
  }

  /* ---------- Centros: horario de hoy y "abierto ahora" ---------- */
  function madridNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[map.weekday], mins: parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10) };
    } catch (e) { return null; }
  }
  function toMins(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  var now = madridNow();
  document.querySelectorAll("[data-hours]").forEach(function (center) {
    var schedule;
    try { schedule = JSON.parse(center.getAttribute("data-hours")); } catch (e) { return; }
    var status = center.querySelector(".status");
    if (!now || !status) return;
    var today = schedule[String(now.day)];
    var open = !!today && now.mins >= toMins(today[0]) && now.mins < toMins(today[1]);
    status.classList.toggle("is-open", open);
    status.querySelectorAll("[data-open]").forEach(function (el) { el.hidden = !open; });
    status.querySelectorAll("[data-closed]").forEach(function (el) { el.hidden = open; });
    center.querySelectorAll("tr[data-days]").forEach(function (tr) {
      var ds = tr.getAttribute("data-days").split(",");
      tr.classList.toggle("is-today", ds.indexOf(String(now.day)) !== -1);
    });
  });

  /* ---------- Año del pie ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Filtro de faciales por objetivo ---------- */
  document.querySelectorAll(".filter-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      document.querySelectorAll(".filter-chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      document.querySelectorAll(".facial").forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var match = f === "todos" || tags.indexOf(f) !== -1;
        card.classList.toggle("is-dim", !match);
        card.classList.toggle("is-match", match && f !== "todos");
      });
    });
  });

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Cintas en movimiento: se duplica el contenido para que el bucle no tenga cortes ---------- */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    var group = track.firstElementChild;
    if (!group || reduce) return;
    var clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a, button").forEach(function (el) { el.tabIndex = -1; });
    track.appendChild(clone);
  });

  /* ---------- Pase de fotos ---------- */
  document.querySelectorAll("[data-slideshow]").forEach(function (box) {
    var slides = box.querySelectorAll("picture");
    var dotsBox = box.querySelector(".slide-dots");
    if (slides.length < 2) return;
    var i = 0, timer = null, dots = [];
    slides.forEach(function (_, k) {
      if (!dotsBox) return;
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Foto " + (k + 1));
      b.addEventListener("click", function () { show(k); restart(); });
      dotsBox.appendChild(b); dots.push(b);
    });
    function show(k) {
      slides[i].classList.remove("is-active");
      if (dots[i]) dots[i].removeAttribute("aria-current");
      i = k;
      slides[i].classList.add("is-active");
      if (dots[i]) dots[i].setAttribute("aria-current", "true");
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (!reduce) timer = setInterval(function () { show((i + 1) % slides.length); }, 4500);
    }
    box.classList.add("is-running");
    slides[0].classList.add("is-active");
    if (dots[0]) dots[0].setAttribute("aria-current", "true");
    restart();
  });

  /* ---------- Cifras que cuentan y aparición al hacer scroll ---------- */
  root.classList.add("js");
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var start = parseInt(el.getAttribute("data-from") || "0", 10);
    var t0 = null, dur = 1400;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var revealEls = document.querySelectorAll(".sr");
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduce) {
    var vh = window.innerHeight || 800;
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) el.classList.add("in");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.classList.contains("sr")) e.target.classList.add("in");
        if (e.target.hasAttribute("data-count") && !e.target.dataset.done) {
          e.target.dataset.done = "1";
          countUp(e.target);
        }
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  document.querySelectorAll("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
  });
  setLang(detectLang());
})();
