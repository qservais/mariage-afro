import { db, uploadIntentsTable } from "@workspace/db";
import { eq, lt } from "drizzle-orm";

const TTL_MS = 60 * 60 * 1000;

async function cleanup(): Promise<void> {
  try {
    await db.delete(uploadIntentsTable).where(lt(uploadIntentsTable.expiresAt, new Date()));
  } catch {
    // non-critical, best-effort cleanup
  }
}

export async function recordUploadIntent(objectPath: string, userId: string): Promise<void> {
  void cleanup();
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db
    .insert(uploadIntentsTable)
    .values({ objectPath, userId, expiresAt })
    .onConflictDoUpdate({
      target: uploadIntentsTable.objectPath,
      set: { userId, expiresAt },
    });
}

export async function consumeUploadIntent(objectPath: string, userId: string): Promise<boolean> {
  void cleanup();
  const [intent] = await db
    .select()
    .from(uploadIntentsTable)
    .where(eq(uploadIntentsTable.objectPath, objectPath))
    .limit(1);
  if (!intent) return false;
  if (intent.userId !== userId) return false;
  if (intent.expiresAt < new Date()) {
    await db.delete(uploadIntentsTable).where(eq(uploadIntentsTable.objectPath, objectPath));
    return false;
  }
  await db.delete(uploadIntentsTable).where(eq(uploadIntentsTable.objectPath, objectPath));
  return true;
}
