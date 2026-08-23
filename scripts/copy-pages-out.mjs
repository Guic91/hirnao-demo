import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "apps/web/out");
const target = resolve(root, "out");

if (!existsSync(source)) {
  console.error(`Missing static export directory: ${source}`);
  console.error("Run with STATIC_EXPORT=true to generate apps/web/out");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Copied ${source} -> ${target}`);
