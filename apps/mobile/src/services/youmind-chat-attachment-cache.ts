import AsyncStorage from '@react-native-async-storage/async-storage';
import type { YouMindChatAttachmentReference, YouMindPendingChatAttachment } from './youmind';

type RememberedAttachmentEntry = {
  url: string;
  name: string;
  mimeType?: string;
  updatedAt: number;
};

const STORAGE_KEY = 'clawket.youmindChatAttachmentCache.v2';
const LEGACY_STORAGE_KEYS = ['clawket.youmindChatAttachmentCache.v1'];
const MAX_ENTRIES = 200;
const SCOPE_DELIMITER = '::';

let attachmentCache = new Map<string, RememberedAttachmentEntry>();
let hydrationPromise: Promise<void> | null = null;

function normalizeKey(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeScope(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildScopedKey(scopeId: string | null | undefined, key: string): string {
  return `${normalizeScope(scopeId)}${SCOPE_DELIMITER}${key}`;
}

function trimEntryMap(entries: Map<string, RememberedAttachmentEntry>): Map<string, RememberedAttachmentEntry> {
  if (entries.size <= MAX_ENTRIES) return entries;
  const trimmed = new Map(
    [...entries.entries()]
      .sort((left, right) => right[1].updatedAt - left[1].updatedAt)
      .slice(0, MAX_ENTRIES),
  );
  return trimmed;
}

async function persistAttachmentCache(): Promise<void> {
  const payload = Object.fromEntries(attachmentCache.entries());
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function hydrateYouMindChatAttachmentCache(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    try {
      // Drop the legacy un-scoped cache so attachments cannot leak across YouMind accounts.
      await Promise.all(
        LEGACY_STORAGE_KEYS.map((key) => AsyncStorage.removeItem(key).catch(() => undefined)),
      );
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, RememberedAttachmentEntry>;
      const next = new Map<string, RememberedAttachmentEntry>();
      for (const [key, value] of Object.entries(parsed)) {
        const trimmedKey = typeof key === 'string' ? key.trim() : '';
        if (!trimmedKey || !value || typeof value !== 'object') continue;
        if (typeof value.url !== 'string' || typeof value.name !== 'string') continue;
        if (!trimmedKey.includes(SCOPE_DELIMITER)) continue;
        next.set(trimmedKey, {
          url: value.url,
          name: value.name,
          mimeType: typeof value.mimeType === 'string' ? value.mimeType : undefined,
          updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
        });
      }
      attachmentCache = trimEntryMap(next);
    } catch {
      attachmentCache = new Map();
    }
  })();
  return hydrationPromise;
}

export function rememberYouMindChatAttachments(
  scopeId: string | null | undefined,
  references: YouMindChatAttachmentReference[],
  attachments: YouMindPendingChatAttachment[],
): void {
  const next = new Map(attachmentCache);
  const now = Date.now();

  references.forEach((reference, index) => {
    const attachment = attachments[index];
    if (!attachment) return;
    const baseKey = normalizeKey(reference.type === 'material' ? reference.id : reference.image_url);
    if (!baseKey) return;
    next.set(buildScopedKey(scopeId, baseKey), {
      url: attachment.uri,
      name: attachment.fileName?.trim() || reference.at_name.trim() || 'Attachment',
      mimeType: attachment.mimeType?.trim() || undefined,
      updatedAt: now + index,
    });
  });

  attachmentCache = trimEntryMap(next);
  void persistAttachmentCache().catch(() => {});
}

export function resolveRememberedYouMindChatAttachment(
  scopeId: string | null | undefined,
  id: string | null | undefined,
): RememberedAttachmentEntry | null {
  const key = normalizeKey(id);
  if (!key) return null;
  return attachmentCache.get(buildScopedKey(scopeId, key)) ?? null;
}

export function clearYouMindChatAttachmentCacheForTests(): void {
  attachmentCache = new Map();
  hydrationPromise = null;
}
