import type { ToolPresentation, UiMessage } from '../../../types/chat';
import type { YouMindChatAttachment, YouMindChatDetail } from '../../../services/youmind';

function stringifyValue(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeToolName(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function titleCaseWords(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatYouMindToolDisplayName(toolName: string | undefined): string {
  const normalized = normalizeToolName(toolName);
  switch (normalized) {
    case 'runskill':
      return 'Run Skill';
    case 'findskill':
      return 'Find Skill';
    case 'updateskill':
      return 'Update Skill';
    case 'imagegenerate':
    case 'imagegenerator':
      return 'Create Image';
    case 'slidesgenerate':
      return 'Create Slides';
    case 'librarysearch':
      return 'Search Library';
    case 'readlinks':
      return 'Read Links';
    case 'write':
    case 'proxywrite':
    case 'writepage':
    case 'writepageworkflow':
    case 'writenote':
      return 'Write';
    default:
      return titleCaseWords((toolName ?? 'tool').replace(/[_-]+/g, ' '));
  }
}

function readStringField(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNestedRecord(record: Record<string, unknown> | null, keys: string[]): Record<string, unknown> | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return null;
}

function parseSkillNameFromToolResponse(toolResponse: string | undefined): string | undefined {
  if (!toolResponse) return undefined;
  const match = toolResponse.match(/skill\s+name\s*=\s*([^,\n]+)/i);
  return match?.[1]?.trim() || undefined;
}

function extractYouMindToolDescription(
  toolName: string | undefined,
  toolArguments: unknown,
  toolResult: unknown,
  toolResponse: string | undefined,
): string | undefined {
  const normalized = normalizeToolName(toolName);
  const argsRecord = readRecord(toolArguments);
  const resultRecord = readRecord(toolResult);

  if (normalized === 'runskill' || normalized === 'updateskill') {
    return readStringField(resultRecord, ['skillName', 'skill_name'])
      || readStringField(argsRecord, ['name', 'skillName', 'skill_name'])
      || parseSkillNameFromToolResponse(toolResponse);
  }

  if (normalized === 'findskill') {
    const skills = Array.isArray(resultRecord?.skills) ? resultRecord.skills : [];
    if (skills.length > 0) {
      return `${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`;
    }
    return undefined;
  }

  if (normalized === 'googlesearch') {
    return readStringField(argsRecord, ['query', 'q', 'keyword']);
  }

  if (normalized === 'imagegenerate' || normalized === 'imagegenerator') {
    const snipRecord = readNestedRecord(resultRecord, ['snip']);
    const snipVoRecord = readNestedRecord(snipRecord, ['vo']);
    return readStringField(snipVoRecord, ['title'])
      || readStringField(resultRecord, ['title'])
      || readStringField(argsRecord, ['title']);
  }

  if (normalized === 'slidesgenerate') {
    const slides = Array.isArray(resultRecord?.slides) ? resultRecord.slides : [];
    if (slides.length > 0) {
      return `${slides.length} ${slides.length === 1 ? 'slide' : 'slides'}`;
    }
    return readStringField(resultRecord, ['title'])
      || readStringField(argsRecord, ['title']);
  }

  if (
    normalized === 'write'
    || normalized === 'proxywrite'
    || normalized === 'writepage'
    || normalized === 'writepageworkflow'
    || normalized === 'writenote'
  ) {
    const pageRecord = readNestedRecord(resultRecord, ['page', 'note']);
    const contentRecord = readNestedRecord(resultRecord, ['content']);
    return readStringField(pageRecord, ['title'])
      || readStringField(contentRecord, ['title'])
      || readStringField(resultRecord, ['title'])
      || readStringField(argsRecord, ['title', 'title_edit', 'provided_title']);
  }

  return readStringField(resultRecord, ['title', 'name'])
    || readStringField(argsRecord, ['title', 'name']);
}

function buildYouMindToolSummary(
  toolName: string | undefined,
  toolArguments: unknown,
  toolResult: unknown,
  toolResponse: string | undefined,
): string {
  const displayName = formatYouMindToolDisplayName(toolName);
  const description = extractYouMindToolDescription(toolName, toolArguments, toolResult, toolResponse);
  if (!description) return displayName;
  return `${displayName}: ${description}`;
}

function isImageGeneratorTool(toolName: string | undefined): boolean {
  const normalized = normalizeToolName(toolName);
  return normalized === 'imagegenerate' || normalized === 'imagegenerator';
}

function isSlidesGeneratorTool(toolName: string | undefined): boolean {
  return normalizeToolName(toolName) === 'slidesgenerate';
}

function collectStringUrls(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return [trimmed];
    }
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractImageGalleryPresentation(toolResult: unknown): ToolPresentation[] | undefined {
  const record = readRecord(toolResult);
  if (!record) return undefined;

  const imageUris = uniqueStrings([
    ...collectStringUrls(record.image_urls),
    ...collectStringUrls(record.imageUrls),
    ...collectStringUrls(record.image_url),
    ...collectStringUrls(record.imageUrl),
    ...collectStringUrls(record.url),
  ]);
  const originalImageUris = uniqueStrings([
    ...collectStringUrls(record.original_image_urls),
    ...collectStringUrls(record.originalImageUrls),
    ...collectStringUrls(record.original_url),
    ...collectStringUrls(record.originalUrl),
  ]);

  const displayImageUris = imageUris.length > 0 ? imageUris : originalImageUris;
  if (displayImageUris.length === 0) return undefined;

  return [{
    kind: 'image-gallery',
    imageUris: displayImageUris,
    originalImageUris: originalImageUris.length > 0 ? originalImageUris : undefined,
  }];
}

function extractSlidesGalleryPresentation(toolResult: unknown): ToolPresentation[] | undefined {
  const record = readRecord(toolResult);
  const slides = Array.isArray(record?.slides) ? record.slides : null;
  if (!slides || slides.length === 0) return undefined;

  const imageUris: string[] = [];
  const originalImageUris: string[] = [];

  for (const slide of slides) {
    const slideRecord = readRecord(slide);
    if (!slideRecord) continue;

    const slideImageUris = uniqueStrings([
      ...collectStringUrls(slideRecord.imageUrl),
      ...collectStringUrls(slideRecord.image_url),
    ]);
    const slideOriginalImageUris = uniqueStrings([
      ...collectStringUrls(slideRecord.originalImageUrl),
      ...collectStringUrls(slideRecord.original_image_url),
    ]);

    const displayUri = slideImageUris[0] ?? slideOriginalImageUris[0];
    if (displayUri) {
      imageUris.push(displayUri);
    }

    const originalUri = slideOriginalImageUris[0];
    if (originalUri) {
      originalImageUris.push(originalUri);
    }
  }

  if (imageUris.length === 0) return undefined;

  return [{
    kind: 'image-gallery',
    imageUris,
    originalImageUris: originalImageUris.length > 0 ? originalImageUris : undefined,
  }];
}

function extractToolPresentation(toolName: string | undefined, toolResult: unknown): ToolPresentation[] | undefined {
  if (isImageGeneratorTool(toolName)) {
    return extractImageGalleryPresentation(toolResult);
  }
  if (isSlidesGeneratorTool(toolName)) {
    return extractSlidesGalleryPresentation(toolResult);
  }
  return undefined;
}

function normalizeStatus(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function isRunningStatus(value: string | undefined): boolean {
  const normalized = normalizeStatus(value);
  return normalized === 'running'
    || normalized === 'generating'
    || normalized === 'executing'
    || normalized === 'processing'
    || normalized === 'pending';
}

function isErrorStatus(value: string | undefined): boolean {
  const normalized = normalizeStatus(value);
  return normalized === 'error'
    || normalized === 'errored'
    || normalized === 'failed';
}

function resolveToolStatus(value: string | undefined): 'running' | 'success' | 'error' {
  if (isRunningStatus(value)) return 'running';
  if (isErrorStatus(value)) return 'error';
  return 'success';
}

type MapOptions = {
  streamingAssistantMessageId?: string | null;
};

function stripYouMindMentionMarkup(content: string): string {
  return content
    .replace(/@\[@[^\]]+\]\(id:[^)]+\)/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildUserMessageText(content: string, attachments: YouMindChatAttachment[] | undefined): string {
  const fileNames = (attachments ?? [])
    .filter((attachment) => attachment.kind === 'file')
    .map((attachment) => attachment.name.trim())
    .filter(Boolean);

  const trimmedContent = stripYouMindMentionMarkup(content);
  if (!trimmedContent) {
    return fileNames.join('\n');
  }
  if (fileNames.length === 0) {
    return trimmedContent;
  }
  return `${trimmedContent}\n${fileNames.join('\n')}`;
}

export function mapYouMindChatToUiMessages(chat: YouMindChatDetail | null, options?: MapOptions): UiMessage[] {
  if (!chat) return [];
  const items: UiMessage[] = [];
  for (const message of chat.messages) {
    if (message.role === 'user') {
      const imageUris = (message.attachments ?? [])
        .filter((attachment) => attachment.kind === 'image')
        .map((attachment) => attachment.url);
      items.push({
        id: `user:${message.id}`,
        role: 'user',
        text: buildUserMessageText(message.content, message.attachments),
        userSkill: message.skill,
        timestampMs: message.createdAtMs,
        imageUris: imageUris.length > 0 ? imageUris : undefined,
      });
      continue;
    }

    const nonToolVisibleBlocks = message.blocks.filter((block) => block.kind !== 'tool' && block.text.trim().length > 0);
    const streamingBlockId = message.id === options?.streamingAssistantMessageId
      ? nonToolVisibleBlocks[nonToolVisibleBlocks.length - 1]?.id
      : undefined;

    for (const block of message.blocks) {
      if (block.kind === 'tool') {
        const displayName = formatYouMindToolDisplayName(block.toolName);
        const summary = buildYouMindToolSummary(
          block.toolName,
          block.toolArguments,
          block.toolResult,
          block.toolResponse,
        );
        items.push({
          id: `tool:${block.id}`,
          role: 'tool',
          text: '',
          timestampMs: message.createdAtMs,
          toolName: displayName,
          toolStatus: resolveToolStatus(block.status),
          toolSummary: summary,
          toolArgs: stringifyValue(block.toolArguments),
          toolDetail: stringifyValue(block.toolResult) || block.toolResponse,
          toolDurationMs: block.elapsedMs,
          toolPresentation: extractToolPresentation(block.toolName, block.toolResult),
        });
        continue;
      }

      const text = block.kind === 'reasoning'
        ? `Thinking\n\n${block.text}`
        : block.text;

      if (!text.trim()) continue;
      items.push({
        id: `${block.kind}:${block.id}`,
        role: 'assistant',
        text,
        timestampMs: message.createdAtMs,
        modelLabel: message.model,
        streaming: block.id === streamingBlockId,
      });
    }
  }
  return [...items].reverse();
}
