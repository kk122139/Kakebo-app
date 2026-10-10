import "dotenv/config";
import { Pool, PoolClient } from "pg";
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
export const db = new Pool({ connectionString: process.env.DATABASE_URL });
export async function transaction<T>(
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function event(
  c: PoolClient,
  userId: string,
  kind: string,
  payload: unknown,
) {
  await c.query(
    "INSERT INTO outbox(id,user_id,kind,payload) VALUES($1,$2,$3,$4)",
    [randomUUID(), userId, kind, JSON.stringify(payload)],
  );
}
export async function startAudit() {
  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const collection = mongo.db("kakebo").collection("audit");
  await collection.createIndex({ eventId: 1 }, { unique: true });
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const { rows } = await db.query(
        "SELECT * FROM outbox WHERE delivered_at IS NULL ORDER BY created_at LIMIT 100",
      );
      for (const row of rows) {
        await collection.updateOne(
          { eventId: row.id },
          {
            $setOnInsert: {
              eventId: row.id,
              userId: row.user_id,
              kind: row.kind,
              payload: row.payload,
              createdAt: row.created_at,
            },
          },
          { upsert: true },
        );
        await db.query("UPDATE outbox SET delivered_at=now() WHERE id=$1", [
          row.id,
        ]);
      }
    } catch {
      console.error("Auditoría pendiente: se reintentará.");
    } finally {
      busy = false;
    }
  }, 3000);
  return async () => {
    clearInterval(timer);
    await mongo.close();
  };
}
