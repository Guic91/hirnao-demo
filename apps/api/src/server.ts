import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { registerAuth } from "./lib/auth.js";
import { initDb } from "./lib/db.js";
import { authRoutes } from "./routes/auth.js";
import { cardRoutes } from "./routes/cards.js";
import { eventRoutes } from "./routes/events.js";
import { agentRoutes } from "./routes/agent.js";
import { matchingRoutes } from "./routes/matching.js";
import { connectionRoutes } from "./routes/connections.js";
import { messageRoutes } from "./routes/messages.js";
import { meetingRoutes } from "./routes/meetings.js";
import { organizerRoutes } from "./routes/organizer.js";
import { adminRoutes } from "./routes/admin.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? "hirnao-dev-secret-change-in-prod",
  });
  registerAuth(app);

  app.get("/health", async () => ({
    status: "ok",
    service: "hirnao-api",
    version: "0.1.0",
  }));

  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(cardRoutes, { prefix: "/v1/cards" });
  await app.register(eventRoutes, { prefix: "/v1/events" });
  await app.register(agentRoutes, { prefix: "/v1/agent" });
  await app.register(matchingRoutes, { prefix: "/v1/matching" });
  await app.register(connectionRoutes, { prefix: "/v1/connections" });
  await app.register(messageRoutes, { prefix: "/v1/messages" });
  await app.register(meetingRoutes, { prefix: "/v1/meetings" });
  await app.register(organizerRoutes, { prefix: "/v1/organizer" });
  await app.register(adminRoutes, { prefix: "/v1/admin" });

  return app;
}

async function main() {
  await initDb();
  const app = await buildApp();
  await app.listen({ port: PORT, host: HOST });
  console.log(`HIRNAO API listening on http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
