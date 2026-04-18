import {
  clearYouMindChatAttachmentCacheForTests,
  rememberYouMindChatAttachments,
  resolveRememberedYouMindChatAttachment,
} from './youmind-chat-attachment-cache';

const SCOPE_A = 'https://youmind.test::cfg-a';
const SCOPE_B = 'https://youmind.test::cfg-b';

const MATERIAL_REFERENCE = {
  id: 'mat-1',
  type: 'material' as const,
  entity_type: 'snip' as const,
  from: 'user' as const,
  at_name: 'photo.jpg',
};

const IMAGE_REFERENCE = {
  type: 'inlineImage' as const,
  image_url: 'https://cdn.example.com/photo.jpg',
  at_name: 'photo.jpg',
};

const ATTACHMENT_A = {
  uri: 'file:///account-a/photo.jpg',
  mimeType: 'image/jpeg',
  fileName: 'photo.jpg',
};

const ATTACHMENT_B = {
  uri: 'file:///account-b/photo.jpg',
  mimeType: 'image/jpeg',
  fileName: 'photo.jpg',
};

describe('youmind-chat-attachment-cache scope isolation', () => {
  afterEach(() => {
    clearYouMindChatAttachmentCacheForTests();
  });

  it('returns the cached attachment for the same scope and material id', () => {
    rememberYouMindChatAttachments(SCOPE_A, [MATERIAL_REFERENCE], [ATTACHMENT_A]);

    expect(resolveRememberedYouMindChatAttachment(SCOPE_A, 'mat-1')).toEqual({
      url: ATTACHMENT_A.uri,
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      updatedAt: expect.any(Number),
    });
  });

  it('does not leak account A attachments into account B for colliding material ids', () => {
    rememberYouMindChatAttachments(SCOPE_A, [MATERIAL_REFERENCE], [ATTACHMENT_A]);

    expect(resolveRememberedYouMindChatAttachment(SCOPE_B, 'mat-1')).toBeNull();
  });

  it('keeps separate values when the same id is remembered under two scopes', () => {
    rememberYouMindChatAttachments(SCOPE_A, [MATERIAL_REFERENCE], [ATTACHMENT_A]);
    rememberYouMindChatAttachments(SCOPE_B, [MATERIAL_REFERENCE], [ATTACHMENT_B]);

    expect(resolveRememberedYouMindChatAttachment(SCOPE_A, 'mat-1')?.url).toBe(ATTACHMENT_A.uri);
    expect(resolveRememberedYouMindChatAttachment(SCOPE_B, 'mat-1')?.url).toBe(ATTACHMENT_B.uri);
  });

  it('isolates image_url-keyed entries by scope', () => {
    rememberYouMindChatAttachments(SCOPE_A, [IMAGE_REFERENCE], [ATTACHMENT_A]);

    expect(resolveRememberedYouMindChatAttachment(SCOPE_A, IMAGE_REFERENCE.image_url)?.url).toBe(ATTACHMENT_A.uri);
    expect(resolveRememberedYouMindChatAttachment(SCOPE_B, IMAGE_REFERENCE.image_url)).toBeNull();
  });

  it('treats null and undefined scopes as a single anonymous bucket distinct from named scopes', () => {
    rememberYouMindChatAttachments(null, [MATERIAL_REFERENCE], [ATTACHMENT_A]);

    expect(resolveRememberedYouMindChatAttachment(undefined, 'mat-1')?.url).toBe(ATTACHMENT_A.uri);
    expect(resolveRememberedYouMindChatAttachment(SCOPE_A, 'mat-1')).toBeNull();
  });

  it('returns null for empty ids regardless of scope', () => {
    rememberYouMindChatAttachments(SCOPE_A, [MATERIAL_REFERENCE], [ATTACHMENT_A]);

    expect(resolveRememberedYouMindChatAttachment(SCOPE_A, '')).toBeNull();
    expect(resolveRememberedYouMindChatAttachment(SCOPE_A, null)).toBeNull();
  });
});
