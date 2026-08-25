import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import type { FastifyPluginAsync } from "fastify";
import { badRequest } from "../lib/errors.js";
import * as data from "../lib/data.js";
import * as pg from "../lib/db-pg.js";

const DIR = process.env.AVATAR_DIR || "/app/data/avatars";
const MAX = 2_500_000;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function publicUrl(userId: string, ext: string): string {
  const base = (process.env.WEB_URL || "https://hirnao.com").replace(/\/$/, "");
  return `${base}/api/v1/profile/photo/${userId}.${ext}`;
}

function parseDataUrl(raw: string): { mime: string; buf: Buffer } | null {
  const m = raw.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!m) return null;
  const mime = m[1].toLowerCase() === "image/jpg" ? "image/jpeg" : m[1].toLowerCase();
  const buf = Buffer.from(m[2].replace(/\s/g, ""), "base64");
  if (!buf.length || buf.length > MAX) return null;
  return { mime, buf };
}

async function persistUrls(userId: string, url: string) {
  await data.updateUser(userId, { avatar_url: url });
  try {
    await pg.query(
      `UPDATE card_profiles SET photo_url = $2, updated_at = NOW() WHERE user_id = $1`,
      [userId, url],
    );
  } catch {
    /* card_profiles may be empty */
  }
}

export const profilePhotoRoutes: FastifyPluginAsync = async (app) => {
  mkdirSync(DIR, { recursive: true });

  app.post(
    "/photo",
    { preHandler: [app.authenticate], bodyLimit: 3_500_000 },
    async (request, reply) => {
      const image = (request.body as { image?: string } | null)?.image;
      if (!image) return badRequest(reply, "Missing image");
      const parsed = parseDataUrl(image);
      if (!parsed) return badRequest(reply, "Invalid image (jpeg/png/webp, max 2.5 Mo)");
      const ext = TYPES[parsed.mime] || "jpg";
      const dest = join(DIR, `${request.userId}.${ext}`);
      for (const other of ["jpg", "png", "webp"]) {
        const p = join(DIR, `${request.userId}.${other}`);
        if (other !== ext && existsSync(p)) {
          try {
            unlinkSync(p);
          } catch {
            /* ignore */
          }
        }
      }
      writeFileSync(dest, parsed.buf);
      const url = `${publicUrl(request.userId, ext)}?v=${Date.now()}`;
      await persistUrls(request.userId, url);
      const user = await data.findUserById(request.userId);
      return { ok: true, avatar_url: url, user };
    },
  );

  app.get("/photo/:file", async (request, reply) => {
    const file = String((request.params as { file: string }).file || "");
    const m = file.match(/^([0-9a-f-]{36})\.(jpg|jpeg|png|webp)$/i);
    if (!m) return reply.code(404).send({ message: "Not found" });
    const ext = m[2].toLowerCase() === "jpeg" ? "jpg" : m[2].toLowerCase();
    const path = join(DIR, `${m[1]}.${ext}`);
    if (!existsSync(path)) return reply.code(404).send({ message: "Not found" });
    const mime =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    reply.header("Cache-Control", "public, max-age=3600");
    return reply.type(mime).send(readFileSync(path));
  });
};
