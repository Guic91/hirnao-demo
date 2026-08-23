import type { CardProfile, Event, User } from "@hirnao/shared";
import { demoCards, demoEvent, demoUsers } from "./demo-store.js";
import { getFirestoreDb } from "./firebase.js";

const EVENT_ID = demoEvent.id;
const META_DOC = "_meta/seed";

interface ParticipantSeed {
  id: string;
  event_id: string;
  user_id: string;
  card_id?: string;
  status: string;
  visible_in_event: boolean;
  checked_in_at?: string;
  created_at: string;
}

export async function seedFirestoreIfEmpty(): Promise<boolean> {
  const db = getFirestoreDb();
  const meta = await db.doc(META_DOC).get();
  if (meta.exists && meta.data()?.seeded) {
    return false;
  }

  const batch = db.batch();
  const now = new Date().toISOString();

  for (const user of demoUsers) {
    batch.set(db.collection("users").doc(user.id), user);
  }

  batch.set(db.collection("events").doc(demoEvent.id), demoEvent);

  for (const card of demoCards) {
    batch.set(db.collection("cards").doc(card.id), card);
    const participant: ParticipantSeed = {
      id: `p-${card.user_id}`,
      event_id: EVENT_ID,
      user_id: card.user_id,
      card_id: card.id,
      status: "checked_in",
      visible_in_event: true,
      checked_in_at: now,
      created_at: now,
    };
    batch.set(db.collection("participants").doc(participant.id), participant);
  }

  batch.set(db.collection("reports").doc("r-demo-1"), {
    id: "r-demo-1",
    reporter_id: "00000000-0000-0000-0000-000000000002",
    reported_user_id: "00000000-0000-0000-0000-000000000004",
    event_id: EVENT_ID,
    reason: "Comportement inapproprié lors d'une connexion",
    status: "open",
    created_at: now,
    reporter_name: "Sophie Martin",
    reported_name: "Lucas Dubois",
  });

  batch.set(db.doc(META_DOC), { seeded: true, seeded_at: now });
  await batch.commit();
  console.log("HIRNAO API: Firestore seeded with demo data");
  return true;
}

export async function clearFirestoreSeed(): Promise<void> {
  const db = getFirestoreDb();
  const collections = [
    "users",
    "events",
    "participants",
    "cards",
    "recommendations",
    "connections",
    "reports",
    "audit_logs",
    "agent_memories",
    "ai_usage_logs",
    "user_consents",
  ];

  for (const name of collections) {
    const snap = await db.collection(name).limit(500).get();
    if (snap.empty) continue;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await db.doc(META_DOC).delete();
}
