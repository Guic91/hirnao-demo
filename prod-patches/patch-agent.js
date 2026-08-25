const fs = require("fs");
const p = "/app/apps/api/src/routes/agent.ts";
let s = fs.readFileSync(p, "utf8");
if (s.includes("fishTts")) {
  console.log("agent already patched");
  process.exit(0);
}
s = s.replace(
  "  transcribeAudio,\n",
  "  transcribeAudio,\n  fishTts,\n  isFishAvailable,\n",
);
const route = `
  app.post("/tts", { preHandler: [app.authenticate] }, async (request, reply) => {
    const text = String((request.body as { text?: string } | null)?.text ?? "").trim();
    if (!text) return badRequest(reply, "Missing text");
    if (!isFishAvailable()) return badRequest(reply, "Fish Audio not configured");
    return reply.type("audio/mpeg").send(await fishTts(text.slice(0, 2000)));
  });

`;
s = s.replace('  app.post("/onboarding/message"', route + '  app.post("/onboarding/message"');
fs.writeFileSync(p, s);
console.log("patched agent.ts");
