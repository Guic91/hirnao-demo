import { demoStore } from "./demo-store.js";

let useDemo = process.env.DEMO_MODE === "true";
let useFirebase = process.env.DB_BACKEND === "firebase" || Boolean(process.env.FIREBASE_PROJECT_ID);
let checked = false;

export function isDemoMode() {
  return useDemo;
}

export function isFirebaseMode() {
  return !useDemo && useFirebase;
}

export async function initDb() {
  if (checked) return;
  checked = true;

  if (useDemo) {
    console.log("HIRNAO API: demo mode enabled (in-memory)");
    return;
  }

  if (useFirebase) {
    try {
      const { seedFirestoreIfEmpty } = await import("./firestore-seed.js");
      await seedFirestoreIfEmpty();
      console.log("HIRNAO API: connected to Firebase Firestore");
      return;
    } catch (err) {
      console.warn("HIRNAO API: Firebase unavailable — falling back to demo mode", err);
      useDemo = true;
      useFirebase = false;
      return;
    }
  }

  try {
    const pg = await import("./db-pg.js");
    await pg.query("SELECT 1");
    console.log("HIRNAO API: connected to PostgreSQL (legacy)");
  } catch {
    console.warn("HIRNAO API: PostgreSQL unavailable — using demo mode");
    useDemo = true;
  }
}

export { demoStore };
