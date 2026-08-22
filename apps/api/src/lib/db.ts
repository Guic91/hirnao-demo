import { demoStore } from "./demo-store.js";

let useDemo = process.env.DEMO_MODE === "true";
let checked = false;

export function isDemoMode() {
  return useDemo;
}

export async function initDb() {
  if (checked) return;
  checked = true;
  if (useDemo) {
    console.log("HIRNAO API: demo mode enabled");
    return;
  }
  try {
    const pg = await import("./db-pg.js");
    await pg.query("SELECT 1");
    console.log("HIRNAO API: connected to PostgreSQL");
  } catch {
    console.warn("HIRNAO API: PostgreSQL unavailable — using demo mode");
    useDemo = true;
  }
}

export { demoStore };
