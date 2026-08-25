const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.SUPABASE_ANON_KEY;
const email = `voice.qa.${Date.now()}@hirnao.test`;
const password = "VoiceQa-2026!";
const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: service,
    Authorization: `Bearer ${service}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password, email_confirm: true }),
});
const user = await created.json();
const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const sess = await login.json();
const token = sess.access_token || "";
const tts = await fetch("http://127.0.0.1:3001/v1/agent/tts", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Bonjour, ceci est un test." }),
});
const session = await fetch("http://127.0.0.1:3001/v1/agent/session", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ event_id: "10000000-0000-0000-0000-000000000001" }),
});
const sessionBody = await session.text();
const sync = await fetch("http://127.0.0.1:3001/v1/auth/sync", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ display_name: "Voice QA", locale: "fr" }),
});
console.log(JSON.stringify({
  email,
  user_id: user.id,
  create_status: created.status,
  login_status: login.status,
  token,
  tts_status: tts.status,
  tts_type: tts.headers.get("content-type"),
  tts_bytes: Number(tts.headers.get("content-length") || 0),
  session_status: session.status,
  session_body: sessionBody.slice(0, 240),
  sync_status: sync.status,
  sync_body: (await sync.text()).slice(0, 240),
}));
