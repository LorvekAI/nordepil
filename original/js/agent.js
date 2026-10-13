/* Agente de preguntas frecuentes de Nordepil (Lorvek).
   Burbuja de chat flotante abajo a la derecha. Al pulsarla abre el agente de Lead Genius
   en un panel. El enlace del agente está en js/config.js (agentUrl).
   - Queda por debajo de la cabecera y del menú: nunca los tapa.
   - Si se abre el menú en el móvil, el chat se cierra y la burbuja se oculta.
   - En la vista previa de Claude no se pueden cargar otras webs dentro de la página,
     así que allí el panel ofrece abrir el agente en una pestaña nueva. */
(function () {
  "use strict";
  var cfg = window.NORDEPIL || {};
  var agentUrl = cfg.agentUrl;
  if (!agentUrl) return;
  var lorvekUrl = cfg.lorvekUrl || "https://lorvekai.github.io/lorvekai-web/";
  var host = (location.hostname || "").toLowerCase();
  var preview = /claudeusercontent\.com$|claude\.ai$/.test(host) || location.protocol === "file:";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function t(es, ca) { return '<span lang="es">' + es + '</span><span lang="ca">' + ca + "</span>"; }
  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12.5a7.5 7.5 0 0 1-11.1 6.6L4 20l1-4.4A7.5 7.5 0 1 1 20 12.5z"/><path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" stroke-width="2.6"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42z"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

  var css = [
    ".np-chat{--np-red:var(--red,#F32A05);--np-red-deep:var(--red-deep,#A8221D);--np-ink:var(--ink,#2B2725);--np-muted:var(--muted,#7A706C);--np-paper:var(--paper,#fff);--np-blush:var(--blush,#FCF1EE);--np-head:var(--header-h,60px);",
    "position:fixed;right:16px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:70;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--body,system-ui,sans-serif)}",
    ".np-launch{position:relative;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;background:var(--np-red);color:#fff;box-shadow:0 14px 30px -12px rgba(120,20,5,.55);transition:transform .2s ease,background .2s ease}",
    ".np-launch:hover{background:var(--np-red-deep);transform:translateY(-2px)}",
    ".np-launch > span{grid-area:1/1;display:grid;place-items:center;transition:opacity .2s ease,transform .25s ease}",
    ".np-launch svg{width:28px;height:28px}",
    ".np-launch .x{opacity:0;transform:rotate(-45deg)}",
    ".np-chat.is-open .np-launch .chat{opacity:0;transform:rotate(45deg)}",
    ".np-chat.is-open .np-launch .x{opacity:1;transform:none}",
    ".np-by{font-size:10.5px;line-height:1;letter-spacing:.02em;color:var(--np-muted);text-decoration:none;background:rgba(255,255,255,.82);padding:3px 7px;border-radius:999px;white-space:nowrap}",
    ".np-by:hover{color:var(--np-ink)}",
    ".np-hint{position:absolute;right:72px;bottom:30px;background:var(--np-paper);color:var(--np-ink);font-size:.9rem;font-weight:600;line-height:1.25;padding:10px 14px;border-radius:14px 14px 4px 14px;box-shadow:0 12px 30px -14px rgba(0,0,0,.35);white-space:nowrap;opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .35s ease,transform .35s ease}",
    ".np-hint.is-on{opacity:1;transform:none}",
    ".np-panel{position:fixed;right:16px;bottom:calc(100px + env(safe-area-inset-bottom,0px));width:min(390px,calc(100vw - 32px));height:min(620px,calc(100svh - var(--np-head) - 130px));background:var(--np-paper);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 70px -24px rgba(40,10,5,.45),0 0 0 1px rgba(43,39,37,.08);transform-origin:bottom right;transition:opacity .25s ease,transform .25s ease}",
    ".np-panel[hidden]{display:none!important}",
    ".np-panel.is-entering{opacity:0;transform:translateY(12px) scale(.98)}",
    ".np-top{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 18px;background:var(--np-red);color:#fff}",
    ".np-top img{width:92px;height:auto;display:block}",
    ".np-top .np-title{flex:1;min-width:0;font-size:.82rem;line-height:1.25;opacity:.92}",
    ".np-top .np-title b{display:block;font-size:.95rem;opacity:1}",
    ".np-close{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;display:grid;place-items:center;flex:none}",
    ".np-close:hover{background:rgba(255,255,255,.26)}",
    ".np-close svg{width:20px;height:20px}",
    ".np-expand{width:40px;height:40px;border-radius:50%;background:transparent;color:#fff;display:grid;place-items:center;flex:none;opacity:.85}",
    ".np-expand:hover{background:rgba(255,255,255,.14);opacity:1}",
    ".np-expand svg{width:18px;height:18px}",
    ".np-wa{display:inline-flex!important;align-items:center;gap:8px!important;min-height:36px;padding:0 14px 0 11px;border-radius:999px;background:var(--np-ink);color:#fff!important;font-size:13px;font-weight:700;letter-spacing:.01em}",
    ".np-wa:hover{background:#000}",
    ".np-wa svg{width:17px!important;height:17px!important}",
    ".np-body{flex:1;min-height:0;position:relative;background:var(--np-paper)}",
    ".np-body iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}",
    ".np-loading{position:absolute;inset:0;display:grid;place-items:center;color:var(--np-muted);font-size:.9rem}",
    ".np-intro{height:100%;overflow:auto;padding:22px 20px;display:grid;gap:14px;align-content:start;background:var(--np-blush)}",
    ".np-msg{background:var(--np-paper);color:var(--np-ink);border-radius:4px 16px 16px 16px;padding:12px 14px;font-size:.95rem;line-height:1.45;box-shadow:0 6px 18px -14px rgba(0,0,0,.3);max-width:92%}",
    ".np-chips{display:flex;flex-wrap:wrap;gap:8px}",
    ".np-chips a{text-decoration:none;border:1.5px solid rgba(243,42,5,.35);color:var(--np-red-deep);border-radius:999px;padding:6px 12px;font-size:.85rem;font-weight:600;background:var(--np-paper)}",
    ".np-chips a:hover{border-color:var(--np-red)}",
    ".np-cta{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 20px;border-radius:999px;background:var(--np-red);color:#fff;text-decoration:none;font-weight:700;justify-self:start}",
    ".np-cta:hover{background:var(--np-red-deep)}",
    ".np-cta svg{width:18px;height:18px}",
    ".np-note{font-size:.8rem;color:var(--np-muted)}",
    ".np-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-top:1px solid rgba(43,39,37,.1);font-size:11px;color:var(--np-muted);background:var(--np-paper)}",
    ".np-foot a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:5px}",
    ".np-foot a:hover{color:var(--np-ink)}",
    ".np-foot svg{width:13px;height:13px}",
    "body.menu-open .np-chat{display:none}",
    "body:has(.nav.is-open) .np-chat{display:none}",
    "@media (max-width:600px){",
    ".np-launch{width:56px;height:56px}",
    ".np-hint{right:66px;bottom:28px}",
    ".np-panel{left:0;right:0;width:auto;bottom:0;top:calc(var(--np-head) + env(safe-area-inset-top,0px) + 8px);height:auto;border-radius:18px 18px 0 0;padding-bottom:env(safe-area-inset-bottom,0px)}",
    ".np-chat.is-open .np-launch,.np-chat.is-open .np-by{visibility:hidden}",
    "body.np-lock{overflow:hidden}",
    "}",
    "@media (prefers-reduced-motion:reduce){.np-launch,.np-launch > span,.np-panel,.np-hint{transition:none}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.createElement("div");
  root.className = "np-chat";
  root.innerHTML =
    '<div class="np-panel" id="np-panel" role="dialog" aria-label="Asistente de Nordepil" hidden>' +
      '<div class="np-top">' +
        '<img src="img/logo-blanco.png" alt="Nordepil" width="1702" height="474">' +
        '<div class="np-title"><b>' + t("Asistente", "Assistent") + "</b>" + t("Resolvemos tus dudas al momento", "Resolem els teus dubtes al moment") + "</div>" +
        '<a class="np-expand" href="' + agentUrl + '" target="_blank" rel="noopener" aria-label="Abrir en pantalla completa" title="Abrir en pantalla completa">' + ICON_OUT + "</a>" +
        '<button class="np-close" type="button" aria-label="Cerrar">' + ICON_X + "</button>" +
      "</div>" +
      '<div class="np-body"></div>' +
      '<div class="np-foot">' +
        '<a class="np-wa" data-wa="agente-panel" href="https://wa.me/' + (cfg.whatsapp || "34698942826") + '" target="_blank" rel="noopener">' + ICON_WA + t("Escribir por WhatsApp", "Escriure per WhatsApp") + "</a>" +
        '<a href="' + lorvekUrl + '" target="_blank" rel="noopener">' + t("Desarrollado por Lorvek", "Desenvolupat per Lorvek") + "</a>" +
      "</div>" +
    "</div>" +
    '<span class="np-hint" aria-hidden="true">' + t("¿Dudas? Pregúntame 👋", "Dubtes? Pregunta'm 👋") + "</span>" +
    '<button class="np-launch" type="button" aria-expanded="false" aria-controls="np-panel" aria-label="Abrir el asistente de Nordepil">' +
      '<span class="chat">' + ICON_CHAT + '</span><span class="x">' + ICON_X + "</span>" +
    "</button>" +
    '<a class="np-by" href="' + lorvekUrl + '" target="_blank" rel="noopener">' + t("Desarrollado por Lorvek", "Desenvolupat per Lorvek") + "</a>";
  document.body.appendChild(root);

  var panel = root.querySelector(".np-panel");
  var body = root.querySelector(".np-body");
  var launch = root.querySelector(".np-launch");
  var closeBtn = root.querySelector(".np-close");
  var waBtn = root.querySelector(".np-wa");
  function waHref() {
    var lang = document.documentElement.getAttribute("data-lang") === "ca" ? "ca" : "es";
    var msg = (cfg.waMessage && cfg.waMessage[lang]) || "";
    return "https://wa.me/" + (cfg.whatsapp || "34698942826") + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  ["pointerdown", "focus"].forEach(function (ev) { waBtn.addEventListener(ev, function () { waBtn.href = waHref(); }); });
  waBtn.href = waHref();
  var hint = root.querySelector(".np-hint");
  var loaded = false;

  function chip(label) { return '<a href="' + agentUrl + '" target="_blank" rel="noopener">' + label + "</a>"; }
  function fill() {
    if (loaded) return;
    loaded = true;
    if (preview) {
      body.innerHTML =
        '<div class="np-intro">' +
          '<p class="np-msg">' + t("¡Hola! 👋 Soy el asistente de Nordepil. Te resuelvo dudas sobre la depilación láser, los tratamientos, los centros y los horarios.",
                                   "Hola! 👋 Sóc l'assistent de Nordepil. Et resolc dubtes sobre la depilació làser, els tractaments, els centres i els horaris.") + "</p>" +
          '<div class="np-chips">' + chip(t("¿Duele?", "Fa mal?")) + chip(t("¿Cuántas sesiones?", "Quantes sessions?")) + chip(t("Horarios", "Horaris")) + "</div>" +
          '<a class="np-cta" href="' + agentUrl + '" target="_blank" rel="noopener">' + t("Empezar a chatear", "Començar a xatejar") + ICON_OUT + "</a>" +
          '<p class="np-note">' + t("En esta vista previa el chat se abre en una pestaña nueva. En la web publicada se abre aquí mismo.",
                                    "En aquesta vista prèvia el xat s'obre en una pestanya nova. Al web publicat s'obre aquí mateix.") + "</p>" +
        "</div>";
      return;
    }
    body.innerHTML = '<div class="np-loading">' + t("Cargando…", "Carregant…") + "</div>";
    var frame = document.createElement("iframe");
    frame.src = agentUrl;
    frame.title = "Asistente de Nordepil";
    frame.setAttribute("allow", "clipboard-write; microphone");
    frame.addEventListener("load", function () { var l = body.querySelector(".np-loading"); if (l) l.remove(); });
    body.appendChild(frame);
  }

  function setOpen(open) {
    root.classList.toggle("is-open", open);
    launch.setAttribute("aria-expanded", String(open));
    launch.setAttribute("aria-label", open ? "Cerrar el asistente" : "Abrir el asistente de Nordepil");
    document.body.classList.toggle("np-lock", open && window.innerWidth <= 600);
    hint.classList.remove("is-on");
    if (open) {
      fill();
      panel.hidden = false;
      if (!reduce) {
        panel.classList.add("is-entering");
        requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.remove("is-entering"); }); });
      }
      closeBtn.focus({ preventScroll: true });
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "agente-abierto", title: "Agente abierto", event: true });
      }
    } else {
      panel.hidden = true;
    }
  }

  launch.addEventListener("click", function () { setOpen(!root.classList.contains("is-open")); });
  closeBtn.addEventListener("click", function () { setOpen(false); launch.focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("is-open")) { setOpen(false); launch.focus(); }
  });
  // si se abre el menú del móvil, el chat se cierra para no taparlo
  var toggle = document.querySelector(".menu-toggle");
  if (toggle) toggle.addEventListener("click", function () { if (root.classList.contains("is-open")) setOpen(false); });

  // saludo breve una sola vez por visita
  var seen = false;
  try { seen = sessionStorage.getItem("np-hint") === "1"; } catch (e) {}
  if (!seen) {
    setTimeout(function () { if (!root.classList.contains("is-open")) hint.classList.add("is-on"); }, 3000);
    setTimeout(function () { hint.classList.remove("is-on"); }, 9000);
    try { sessionStorage.setItem("np-hint", "1"); } catch (e) {}
  }
})();
