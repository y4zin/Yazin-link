import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { imageLinks, InsertImageLink, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) { const normalized = user[field] ?? null; values[field] = normalized; updateSet[field] = normalized; }
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createImageLink(link: InsertImageLink) {
  const db = await getDb();
  if (!db) throw new Error("خدمة روابط الصور غير متاحة حاليًا. حاول مرة أخرى بعد قليل.");
  await db.insert(imageLinks).values(link);
  return link;
}

export async function getImageLinkByPublicId(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(imageLinks).where(eq(imageLinks.publicId, publicId)).limit(1);
  return result[0];
}

function affectedRows(result: unknown) {
  const header = Array.isArray(result) ? result[0] : result;
  if (!header || typeof header !== "object") return 0;
  const value = (header as { affectedRows?: unknown }).affectedRows;
  return typeof value === "number" ? value : 0;
}

export async function listImageLinksByOwner(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("تعذر الوصول إلى الروابط الآن. حاول مرة أخرى بعد قليل.");
  return db.select().from(imageLinks).where(eq(imageLinks.ownerOpenId, ownerOpenId)).orderBy(desc(imageLinks.createdAt));
}

export async function deleteImageLinkForOwner(publicId: string, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("تعذر حذف الرابط الآن. حاول مرة أخرى بعد قليل.");
  const result = await db.delete(imageLinks).where(and(eq(imageLinks.publicId, publicId), eq(imageLinks.ownerOpenId, ownerOpenId)));
  return affectedRows(result);
}

export async function claimImageLinkForOwner(publicId: string, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("تعذر ربط الرابط بحسابك الآن. حاول مرة أخرى بعد قليل.");
  const result = await db.update(imageLinks).set({ ownerOpenId }).where(and(eq(imageLinks.publicId, publicId), isNull(imageLinks.ownerOpenId)));
  return affectedRows(result);
}
