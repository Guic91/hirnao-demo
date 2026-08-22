import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://hirnao:hirnao_dev@localhost:5432/hirnao";

let pool: pg.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const result = await query<T>(text, params);
  return result.rows[0] ?? null;
}
