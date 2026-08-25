/* Hirnao voice helper — Fish Audio TTS/ASR + coupe audio + fallback navigateur */
(function () {
  if (window.__hirnaoVoice) return;
  var API = "https://hirnao.com/api/v1";
  var audioEl = null;
  var rec = null;
  var chunks = [];
  var stream = null;
  var recognition = null;
  var recActive = false;
  var liveText = "";

  function token() {
    try {
      var t = localStorage.getItem("hirnao_token");
      if (t) return t;
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
      audioEl = null;
    }
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  }

  async function speak(text) {
    cut();
    if (!text) return;
    try {
      var res = await fetch(API + "/agent/tts", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ text: String(text) }),
      });
      if (res.ok) {
        var blob = await res.blob();
        if (blob && blob.size > 40) {
          audioEl = new Audio(URL.createObjectURL(blob));
          audioEl.play().catch(function () {});
          return;
        }
      }
    } catch (e) {
      console.warn("hirnao fish tts", e);
    }
    try {
      if (window.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(String(text));
        u.lang = "fr-FR";
        u.rate = 1.02;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }

  function startRecognition() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    try {
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.stop();
        } catch (e) {}
      }
      liveText = "";
      recognition = new SR();
      recognition.lang = "fr-FR";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = function (e) {
        var t = "";
        for (var i = 0; i < e.results.length; i++) {
          t += e.results[i][0].transcript;
        }
        liveText = t;
      };
      recognition.onend = function () {
        if (recActive) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };
      recognition.start();
    } catch (e) {
      console.warn("hirnao sr", e);
    }
  }

  async function startMic() {
    recActive = true;
    startRecognition();
    if (stream) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      var mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      rec = new MediaRecorder(stream, { mimeType: mime });
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
      try {
        recognition.onend = null;
        recognition.stop();
      } catch (e) {}
    }
  }

  function stopMicBlob() {
    return new Promise(function (resolve) {
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = function () {
        var blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        chunks = [];
        resolve(blob.size > 600 ? blob : null);
      };
      try {
        rec.stop();
      } catch (e) {
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
    var res = await fetch(API + "/agent/transcribe", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        audio_base64: await blobToB64(blob),
        mime_type: blob.type || "audio/webm",
      }),
    });
    if (!res.ok) throw new Error("transcribe " + res.status);
    var data = await res.json();
    return (data && data.text) || "";
  }

  async function resetMic() {
    if (stream) {
      try {
        stream.getTracks().forEach(function (t) {
          t.stop();
        });
      } catch (e) {}
      stream = null;
    }
    rec = null;
    chunks = [];
    await startMic();
  }

  window.__hirnaoVoice = {
    cut: cut,
    speak: speak,
    start: async function (question) {
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
      try {
        await resetMic();
      } catch (e) {}
      return text;
    },
  };
})();
