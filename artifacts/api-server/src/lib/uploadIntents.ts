const TTL_MS = 60 * 60 * 1000;

interface Intent {
  userId: string;
  expiresAt: number;
}

const intents = new Map<string, Intent>();

function cleanup(): void {
  const now = Date.now();
  for (const [k, v] of intents.entries()) {
    if (v.expiresAt < now) intents.delete(k);
  }
}

export function recordUploadIntent(objectPath: string, userId: string): void {
  cleanup();
  intents.set(objectPath, { userId, expiresAt: Date.now() + TTL_MS });
}

export function consumeUploadIntent(
  objectPath: string,
  userId: string,
): boolean {
  cleanup();
  const intent = intents.get(objectPath);
  if (!intent) return false;
  if (intent.userId !== userId) return false;
  if (intent.expiresAt < Date.now()) {
    intents.delete(objectPath);
    return false;
  }
  intents.delete(objectPath);
  return true;
}
