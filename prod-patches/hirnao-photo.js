/* Hirnao profile photo overlay */
(function () {
  if (window.__hirnaoPhoto) return;
  var path = location.pathname;
  if (!/\/e\/[^/]+\/(profile|card)\/?$/.test(path)) return;
  window.__hirnaoPhoto = true;
  var lang = (document.documentElement.lang || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
  try {
    var loc = localStorage.getItem("hirnao-locale") || localStorage.getItem("hirnao_locale");
    if (loc === "en" || loc === "fr") lang = loc;
  } catch (e) {}
  var L = lang === "en"
    ? { title: "Profile photo", hint: "Tap to add or change your photo", needAuth: "Sign in to add a photo", join: "Join the event", saving: "Saving...", done: "Photo saved", err: "Could not save the photo", tooBig: "Choose a lighter photo (max 8 MB)" }
    : { title: "Photo de profil", hint: "Touchez pour ajouter ou changer votre photo", needAuth: "Connectez-vous pour ajouter une photo", join: "Rejoindre l'evenement", saving: "Enregistrement...", done: "Photo enregistree", err: "Impossible d'enregistrer la photo", tooBig: "Choisissez une photo plus legere (8 Mo max)" };
  var css = "#hn-photo{margin:8px 0 16px;padding:18px 16px;border-radius:var(--radius,24px);border:1px solid var(--border,rgba(255,255,255,.24));background:var(--bg-card,rgba(255,255,255,.13));backdrop-filter:var(--blur);display:flex;align-items:center;gap:16px}#hn-photo button.hn-ava{width:84px;height:84px;border-radius:50%;border:1px solid var(--border);padding:0;overflow:hidden;background:rgba(255,255,255,.08);cursor:pointer;flex-shrink:0;position:relative}#hn-photo button.hn-ava img{width:100%;height:100%;object-fit:cover;display:block}#hn-photo button.hn-ava span.ph{font-size:28px;font-weight:200;color:var(--text-faint)}#hn-photo button.hn-ava i{position:absolute;right:4px;bottom:4px;width:22px;height:22px;border-radius:50%;background:var(--ivoire,#fdf8f4);color:var(--nuit,#0b0709);font-size:14px;font-style:normal;display:grid;place-items:center}#hn-photo .meta{min-width:0}#hn-photo .meta strong{display:block;font-size:15px;font-weight:500}#hn-photo .meta p{margin:4px 0 0;font-size:12.5px;color:var(--text-muted);font-weight:300}#hn-photo input{display:none}#hn-photo a.hn-join{display:inline-flex;margin-top:8px;padding:8px 14px;border-radius:999px;background:var(--ivoire,#fdf8f4);color:var(--nuit,#0b0709);font-size:13px;font-weight:600}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  function token() { try { return localStorage.getItem("hirnao_token") || ""; } catch (e) { return ""; } }
  function user() { try { return JSON.parse(localStorage.getItem("hirnao_user") || "null"); } catch (e) { return null; } }
  var root = document.createElement("div");
  root.id = "hn-photo";
  var slug = (path.match(/^\/e\/([^/]+)/) || [])[1] || "ai-summit-paris-2026";
  var u = user();
  var src = (u && (u.avatar_url || u.photo_url)) || "";
  root.innerHTML = '<button type="button" class="hn-ava" aria-label="' + L.title + '">' + (src ? '<img alt="" src="' + src.replace(/"/g, "") + '">' : '<span class="ph">' + ((u && u.display_name && u.display_name.charAt(0)) || "+") + "</span>") + "<i>+</i></button><div class=\"meta\"><strong>" + L.title + "</strong><p class=\"hn-msg\">" + (token() ? L.hint : L.needAuth) + "</p>" + (token() ? "" : '<a class="hn-join" href="/e/' + slug + '/join/">' + L.join + "</a>") + '</div><input type="file" accept="image/jpeg,image/png,image/webp,image/*">';
  function mount() {
    if (document.getElementById("hn-photo")) return;
    var header = document.querySelector(".container .header") || document.querySelector("header.header");
    if (header && header.parentNode) { header.parentNode.insertBefore(root, header.nextSibling); return; }
    var box = document.querySelector(".container.page-content") || document.querySelector(".container");
    if (box) box.insertBefore(root, box.firstChild); else document.body.appendChild(root);
  }
  mount(); setTimeout(mount, 400); setTimeout(mount, 1200);
  var file = root.querySelector("input");
  var btn = root.querySelector("button.hn-ava");
  var msg = root.querySelector(".hn-msg");
  btn.addEventListener("click", function () { if (!token()) { location.href = "/e/" + slug + "/join/"; return; } file.click(); });
  function compress(f) {
    return new Promise(function (resolve, reject) {
      if (f.size > 8 * 1024 * 1024) return reject(new Error("too-big"));
      var img = new Image();
      var url = URL.createObjectURL(f);
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, max = 720;
        if (w > max || h > max) { var r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.84));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad")); };
      img.src = url;
    });
  }
  file.addEventListener("change", function () {
    var f = file.files && file.files[0]; file.value = ""; if (!f) return;
    msg.textContent = L.saving;
    compress(f).then(function (dataUrl) {
      var imgEl = root.querySelector("img") || document.createElement("img");
      imgEl.alt = ""; imgEl.src = dataUrl;
      var ph = root.querySelector("span.ph");
      if (ph) ph.replaceWith(imgEl); else if (!imgEl.parentNode) btn.insertBefore(imgEl, btn.firstChild);
      return fetch("/api/v1/profile/photo", { method: "POST", headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl }) });
    }).then(function (res) { if (!res.ok) throw new Error("http"); return res.json(); }).then(function (body) {
      if (body && body.avatar_url) {
        var imgEl = root.querySelector("img"); if (imgEl) imgEl.src = body.avatar_url;
        try { var cur = user() || {}; cur.avatar_url = body.avatar_url; localStorage.setItem("hirnao_user", JSON.stringify(body.user || cur)); } catch (e) {}
      }
      msg.textContent = L.done;
    }).catch(function (err) { msg.textContent = err && err.message === "too-big" ? L.tooBig : L.err; });
  });
})();
