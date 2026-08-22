import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://hirnao:hirnao_dev@localhost:5432/hirnao";

async function seed() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  const sql = readFileSync(join(__dirname, "../migrations/003_seed_demo.sql"), "utf8");
  await client.query(sql);

  await client.end();
  console.log("seed complete");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
