/* Hirnao voice overlay — self-contained, iOS-safe. Does not patch hashed React chunks. */
(function () {
  if (window.__hirnaoVoice) return;
  if (!/\/e\/[^/]+\/agent\/?$/.test(location.pathname)) return;

  var API = "https://hirnao.com/api/v1";
  var audioEl = null;
  var rec = null;
  var chunks = [];
  var stream = null;
  var recognition = null;
  var recActive = false;
  var liveText = "";
  var pendingAnswer = null;
  var bypassClick = false;
  var busy = false;
  var started = false;
  var lastSpoken = "";
  var origFetch = window.fetch.bind(window);
  var ios = /iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

  function token() {
    try {
      var t = localStorage.getItem("hirnao_token");
      if (t && t.indexOf("demo-") !== 0) return t;
    } catch (e) {}
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf("auth-token") !== -1 || k.indexOf("sb-") === 0) {
          var v = JSON.parse(localStorage.getItem(k) || "null");
          var at =
            (v && v.access_token) ||
            (v && v.currentSession && v.currentSession.access_token);
          if (at) return at;
        }
      }
    } catch (e) {}
    return null;
  }

  function headers() {
    var h = { "Content-Type": "application/json" };
    var t = token();
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  function cut() {
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.removeAttribute("src");
        audioEl.load();
      } catch (e) {}
    }
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  }

  function unlockAudio() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        if (!window.__hnAC) window.__hnAC = new AC();
        window.__hnAC.resume();
      }
    } catch (e) {}
    try {
      if (!audioEl) audioEl = new Audio();
      audioEl.setAttribute("playsinline", "true");
      audioEl.muted = true;
      audioEl.src = SILENT;
      var p = audioEl.play();
      if (p && p.then) p.catch(function () {}).then(function () { audioEl.muted = false; });
      else audioEl.muted = false;
    } catch (e) {}
  }

  function browserSpeak(text) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = "fr-FR";
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  async function speak(text) {
    cut();
    if (!text || text === "…" || text === lastSpoken) return;
    lastSpoken = text;
    try {
      var res = await origFetch(API + "/agent/tts", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ text: String(text) }),
      });
      if (res.ok) {
        var blob = await res.blob();
        if (blob && blob.size > 40 && (blob.type || "").indexOf("json") === -1) {
          if (!audioEl) audioEl = new Audio();
          audioEl.muted = false;
          audioEl.src = URL.createObjectURL(blob);
          await audioEl.play().catch(function () { browserSpeak(text); });
          return;
        }
      }
    } catch (e) {
      console.warn("hirnao tts", e);
    }
    browserSpeak(text);
  }

  function startRecognition() {
    if (ios) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    try {
      if (recognition) {
        try { recognition.onend = null; recognition.stop(); } catch (e) {}
      }
      liveText = "";
      recognition = new SR();
      recognition.lang = "fr-FR";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = function (e) {
        var t = "";
        for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        liveText = t;
      };
      recognition.onend = function () {
        if (recActive && recognition) {
          try { recognition.start(); } catch (e) {}
        }
      };
      recognition.start();
    } catch (e) {
      console.warn("hirnao sr", e);
    }
  }

  function pickMime() {
    if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
    var list = ios
      ? ["audio/mp4", "audio/aac", "audio/mp4;codecs=mp4a.40.2"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    for (var i = 0; i < list.length; i++) {
      try { if (MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch (e) {}
    }
    return "";
  }

  async function startMic() {
    recActive = true;
    startRecognition();
    if (stream) {
      try {
        if (rec && rec.state === "inactive") {
          chunks = [];
          rec.start(250);
        }
      } catch (e) {}
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      chunks = [];
      if (typeof MediaRecorder === "undefined") return;
      var mime = pickMime();
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      rec.ondataavailable = function (e) {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      rec.start(250);
    } catch (e) {
      console.warn("hirnao mic", e);
    }
  }

  function stopRecognition() {
    recActive = false;
    if (recognition) {
      try { recognition.onend = null; recognition.stop(); } catch (e) {}
    }
  }

  function stopMicBlob() {
    return new Promise(function (resolve) {
      if (!rec || rec.state === "inactive") return resolve(null);
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, 2500);
      rec.onstop = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        var blob = new Blob(chunks, { type: rec.mimeType || "audio/mp4" });
        chunks = [];
        resolve(blob.size > 400 ? blob : null);
      };
      try { rec.stop(); } catch (e) {
        clearTimeout(timer);
        resolve(null);
      }
    });
  }

  function blobToB64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result || "");
        var i = s.indexOf(",");
        resolve(i >= 0 ? s.slice(i + 1) : s);
      };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  async function transcribe(blob) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 15000);
    try {
      var res = await origFetch(API + "/agent/transcribe", {
        method: "POST",
        headers: headers(),
        signal: ctrl.signal,
        body: JSON.stringify({
          audio_base64: await blobToB64(blob),
          mime_type: blob.type || "audio/mp4",
        }),
      });
      if (!res.ok) throw new Error("transcribe " + res.status);
      var data = await res.json();
      return (data && data.text) || "";
    } finally {
      clearTimeout(timer);
    }
  }

  async function resetMic() {
    if (ios) {
      chunks = [];
      try { if (rec && rec.state === "inactive") rec.start(250); } catch (e) {}
      return;
    }
    if (stream) {
      try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      stream = null;
    }
    rec = null;
    chunks = [];
    await startMic();
  }

  function labelOf(el) {
    return ((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
  }

  function isTalkButton(el) {
    var t = labelOf(el);
    return /^(Parler|Talk)\b/i.test(t) || /3 min/i.test(t);
  }

  function isNextButton(el) {
    var t = labelOf(el);
    return /^(Suivant|Question suivante|Next|Next question)$/i.test(t);
  }

  function isEndButton(el) {
    var t = labelOf(el);
    return /^(Terminer|End call|End)$/i.test(t);
  }

  function questionNode() {
    var nodes = document.querySelectorAll("p");
    for (var i = 0; i < nodes.length; i++) {
      var st = nodes[i].getAttribute("style") || "";
      if (st.indexOf("26px") !== -1 || st.indexOf("font-weight:200") !== -1) {
        var t = labelOf(nodes[i]);
        if (t && t !== "…") return nodes[i];
      }
    }
    return null;
  }

  function relabelNext() {
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      if (/^Question suivante$/i.test(labelOf(buttons[i]))) {
        var span = buttons[i].querySelector("span") || buttons[i];
        if (span === buttons[i]) buttons[i].textContent = "Suivant";
        else span.textContent = "Suivant";
      }
    }
  }

  function setBusy(on) {
    busy = on;
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      if (isNextButton(buttons[i]) || isEndButton(buttons[i])) {
        buttons[i].disabled = on || buttons[i].disabled;
        if (!on && isNextButton(buttons[i])) buttons[i].disabled = false;
      }
    }
  }

  window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (pendingAnswer && /\/agent\/answer/.test(url) && init && init.body) {
        var body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
        if (body && typeof body === "object") {
          body.answer = pendingAnswer;
          init = Object.assign({}, init, { body: JSON.stringify(body) });
        }
        pendingAnswer = null;
      }
    } catch (e) {}
    var p = origFetch(input, init);
    try {
      var url2 = typeof input === "string" ? input : (input && input.url) || "";
      if (/\/agent\/answer/.test(url2)) {
        p.then(function (res) {
          res.clone().json().then(function (data) {
            if (data && data.next_question) speak(data.next_question);
          }).catch(function () {});
        }).catch(function () {});
      }
    } catch (e) {}
    return p;
  };

  var voice = {
    cut: cut,
    speak: speak,
    start: async function (question) {
      unlockAudio();
      await startMic();
      if (question) await speak(question);
    },
    next: async function () {
      cut();
      stopRecognition();
      var spoken = (liveText || "").trim();
      var blob = await stopMicBlob();
      var text = spoken;
      if (blob) {
        try {
          var fish = (await transcribe(blob)).trim();
          if (fish) text = fish;
        } catch (e) {
          console.warn("hirnao asr", e);
        }
      }
      liveText = "";
      try { await resetMic(); } catch (e) {}
      return text;
    },
  };
  window.__hirnaoVoice = voice;

  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest("button") : null;
    if (!btn) return;
    if (bypassClick) return;

    if (isTalkButton(btn) || isTalkButton(btn.parentElement)) {
      started = true;
      unlockAudio();
      startMic();
      setTimeout(function () {
        var q = questionNode();
        if (q) speak(labelOf(q));
      }, 600);
      return;
    }

    if (isEndButton(btn)) {
      cut();
      stopRecognition();
      recActive = false;
      return;
    }

    if (!isNextButton(btn)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (busy) return;

    setBusy(true);
    voice.next().then(function (text) {
      if (!text || !String(text).trim()) {
        setBusy(false);
        try { btn.style.opacity = "0.7"; setTimeout(function () { btn.style.opacity = ""; }, 900); } catch (e) {}
        return;
      }
      pendingAnswer = String(text).trim();
      bypassClick = true;
      try { btn.click(); } catch (err) {}
      bypassClick = false;
      setTimeout(function () { setBusy(false); }, 400);
    }).catch(function (err) {
      console.warn("hirnao next", err);
      setBusy(false);
    });
  }, true);

  var obs = new MutationObserver(function () {
    relabelNext();
    if (!started) return;
    var q = questionNode();
    if (q) {
      var t = labelOf(q);
      if (t && t !== lastSpoken) speak(t);
    }
  });
  function watch() {
    if (document.body) obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) watch();
  else document.addEventListener("DOMContentLoaded", watch);

  var style = document.createElement("style");
  style.textContent =
    "body.hn-has-bar .container{min-height:calc(100dvh - 56px)!important}" +
    "body.hn-has-bar[data-hn-agent] .container{padding-top:8px!important}";
  document.head.appendChild(style);
  document.documentElement.setAttribute("data-hn-agent", "1");
  if (document.body) document.body.setAttribute("data-hn-agent", "1");
})();
