/* Hirnao global menu — overlay, does not patch React trees. */
(function () {
  if (window.__hirnaoNav) return;
  window.__hirnaoNav = true;

  var DEFAULT_SLUG = "ai-summit-paris-2026";
  var m = location.pathname.match(/^\/e\/([^/]+)/);
  var slug = m ? decodeURIComponent(m[1]) : DEFAULT_SLUG;
  var ev = "/e/" + slug;
  var lang = (document.documentElement.lang || "fr").toLowerCase().startsWith("en")
    ? "en"
    : "fr";
  try {
    var stored = localStorage.getItem("hirnao-locale");
    if (stored === "en" || stored === "fr") lang = stored;
  } catch (e) {}

  var L =
    lang === "en"
      ? {
          menu: "Menu",
          close: "Close menu",
          open: "Open menu",
          explore: "Explore",
          space: "My space",
          org: "Host",
          home: "Home",
          join: "Join the event",
          agent: "Voice agent",
          card: "Card ID",
          event: "Event floor",
          discover: "Discover",
          messages: "Messages",
          profile: "Profile",
          connections: "Connections",
          organizer: "Organizer space",
          admin: "Admin",
          eventName: "AI Summit Paris 2026",
        }
      : {
          menu: "Menu",
          close: "Fermer le menu",
          open: "Ouvrir le menu",
          explore: "Explorer",
          space: "Mon espace",
          org: "Organisation",
          home: "Accueil",
          join: "Rejoindre l'evenement",
          agent: "Agent vocal",
          card: "Card ID",
          event: "Salle & matching",
          discover: "Decouvrir",
          messages: "Messages",
          profile: "Profil",
          connections: "Connexions",
          organizer: "Espace organisation",
          admin: "Admin",
          eventName: "AI Summit Paris 2026",
        };

  var groups = [
    {
      label: L.explore,
      items: [
        { href: "/", label: L.home, match: /^\/$/ },
        { href: ev + "/join/", label: L.join, match: /\/join\/?$/ },
        { href: ev + "/event/", label: L.event, match: /\/event\/?$/ },
        { href: ev + "/discover/", label: L.discover, match: /\/discover\/?$/ },
      ],
    },
    {
      label: L.space,
      items: [
        { href: ev + "/agent/", label: L.agent, match: /\/agent\/?$/ },
        { href: ev + "/card/", label: L.card, match: /\/card\/?$/ },
        { href: ev + "/messages/", label: L.messages, match: /\/messages\/?$/ },
        { href: ev + "/profile/", label: L.profile, match: /\/profile\/?$/ },
        { href: ev + "/connections/", label: L.connections, match: /\/connections\/?$/ },
      ],
    },
    {
      label: L.org,
      items: [
        { href: "/organizer/", label: L.organizer, match: /^\/organizer/ },
        { href: "/admin/", label: L.admin, match: /^\/admin/ },
      ],
    },
  ];

  var css = [
    "#hn-root{position:relative;z-index:400;font-family:var(--font),Montserrat,system-ui,sans-serif}",
    "#hn-bar{position:fixed;top:0;left:0;right:0;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 16px;background:rgba(11,7,9,.72);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid var(--hairline,rgba(255,255,255,.12))}",
    "#hn-brand{display:flex;align-items:center;gap:10px;color:var(--ivoire,#fdf8f4);min-width:0}",
    "#hn-brand .logo{font-size:13px;letter-spacing:.32em;font-weight:200}",
    "#hn-brand small{display:block;font-family:var(--mono),ui-monospace,monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-faint,rgba(253,248,244,.5));margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}",
    "#hn-toggle{width:44px;height:44px;border:1px solid var(--border,rgba(255,255,255,.24));background:var(--bg-card,rgba(255,255,255,.13));border-radius:999px;color:var(--ivoire,#fdf8f4);display:grid;place-items:center;cursor:pointer}",
    "#hn-toggle:focus-visible{outline:2px solid var(--orange,#ff8a00);outline-offset:3px}",
    "#hn-toggle .bars{display:block;width:16px;height:10px;position:relative}",
    "#hn-toggle .bars i{position:absolute;left:0;right:0;height:1.5px;background:currentColor;border-radius:2px;transition:transform .28s ease,top .28s ease,opacity .2s ease}",
    "#hn-toggle .bars i:nth-child(1){top:0}",
    "#hn-toggle .bars i:nth-child(2){top:4.25px}",
    "#hn-toggle .bars i:nth-child(3){top:8.5px}",
    "#hn-root.is-open #hn-toggle .bars i:nth-child(1){top:4.25px;transform:rotate(45deg)}",
    "#hn-root.is-open #hn-toggle .bars i:nth-child(2){opacity:0}",
    "#hn-root.is-open #hn-toggle .bars i:nth-child(3){top:4.25px;transform:rotate(-45deg)}",
    "#hn-scrim{position:fixed;inset:0;background:rgba(11,7,9,.56);opacity:0;pointer-events:none;transition:opacity .28s ease}",
    "#hn-root.is-open #hn-scrim{opacity:1;pointer-events:auto}",
    "#hn-drawer{position:fixed;top:0;right:0;height:100dvh;width:min(86vw,360px);background:rgba(22,14,18,.94);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border-left:1px solid var(--border,rgba(255,255,255,.24));transform:translateX(104%);transition:transform .34s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;padding:72px 22px calc(28px + env(safe-area-inset-bottom))}",
    "#hn-drawer:before{content:'';position:absolute;left:0;top:18%;bottom:18%;width:3px;border-radius:99px;background:linear-gradient(180deg,#ff8a00,#f5108a)}",
    "#hn-root.is-open #hn-drawer{transform:none}",
    "#hn-drawer h2{font-size:34px;font-weight:200;letter-spacing:-.03em;line-height:1;margin:0 0 6px}",
    "#hn-drawer .hn-kicker{font-family:var(--mono),ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-faint,rgba(253,248,244,.5));margin-bottom:22px}",
    "#hn-nav{overflow:auto;display:flex;flex-direction:column;gap:22px;padding-right:4px}",
    "#hn-nav section span{display:block;font-family:var(--mono),ui-monospace,monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-faint,rgba(253,248,244,.5));margin-bottom:8px}",
    "#hn-nav a{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:20px;border:1px solid transparent;color:var(--ivoire,#fdf8f4);font-size:15px;font-weight:400}",
    "#hn-nav a:hover{background:rgba(255,255,255,.08)}",
    "#hn-nav a.is-on{background:var(--ivoire,#fdf8f4);color:var(--nuit,#0b0709);font-weight:600}",
    "#hn-nav a em{font-style:normal;font-size:12px;opacity:.45}",
    "body.hn-has-bar{padding-top:56px}",
    "body.hn-has-bar > div > header:not(.header){display:none !important}",
    "@media (min-width:860px){#hn-bar,#hn-drawer{padding-left:22px;padding-right:22px}}",
    "@media (prefers-reduced-motion:reduce){#hn-drawer,#hn-scrim,#hn-toggle .bars i{transition:none}}",
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function active(item) {
    if (item.match) return item.match.test(location.pathname);
    return (location.pathname.replace(/\/+$/, "") || "/") === item.href.replace(/\/+$/, "");
  }

  var root = document.createElement("div");
  root.id = "hn-root";
  root.innerHTML =
    '<div id="hn-bar">' +
    '<a id="hn-brand" href="/">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 371 215" width="26" aria-hidden="true"><g fill="none" stroke="url(#hn-g)" stroke-width="33" stroke-linecap="round"><defs><linearGradient id="hn-g" x1="0" y1="0" x2="371" y2="0"><stop offset="0" stop-color="#ff8a00"/><stop offset=".5" stop-color="#f5455e"/><stop offset="1" stop-color="#f5108a"/></linearGradient></defs><path d="M16.5 16.5 V198.5"/><path d="M16.5 111.5 H181"/><path d="M181 16.5 V198.5"/><path d="M181 16.5 354.5 198.5"/><path d="M354.5 16.5 V198.5"/></g></svg>' +
    '<span><span class="logo">HIRNAO</span><small>' +
    L.eventName +
    "</small></span></a>" +
    '<button type="button" id="hn-toggle" aria-expanded="false" aria-controls="hn-drawer" aria-label="' +
    L.open +
    '"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span></button>' +
    "</div>" +
    '<div id="hn-scrim" hidden></div>' +
    '<nav id="hn-drawer" role="dialog" aria-modal="true" aria-label="' +
    L.menu +
    '" hidden>' +
    "<h2>" +
    L.menu +
    '</h2><p class="hn-kicker">' +
    L.eventName +
    "</p><div id=\"hn-nav\"></div></nav>";

  var nav = root.querySelector("#hn-nav");
  groups.forEach(function (g) {
    var sec = document.createElement("section");
    var lab = document.createElement("span");
    lab.textContent = g.label;
    sec.appendChild(lab);
    g.items.forEach(function (item, i) {
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      if (active(item)) a.className = "is-on";
      var mark = document.createElement("em");
      mark.textContent = String(i + 1).padStart(2, "0");
      a.appendChild(mark);
      sec.appendChild(a);
    });
    nav.appendChild(sec);
  });

  document.body.appendChild(root);
  document.body.classList.add("hn-has-bar");

  var toggle = root.querySelector("#hn-toggle");
  var drawer = root.querySelector("#hn-drawer");
  var scrim = root.querySelector("#hn-scrim");
  var lastFocus = null;

  function setOpen(open) {
    root.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? L.close : L.open);
    drawer.hidden = !open;
    scrim.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      lastFocus = document.activeElement;
      var first = drawer.querySelector("a");
      if (first) first.focus();
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
  }

  toggle.addEventListener("click", function () {
    setOpen(!root.classList.contains("is-open"));
  });
  scrim.addEventListener("click", function () {
    setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      e.preventDefault();
      setOpen(false);
    }
  });
})();
