import { mapYouMindChatToUiMessages } from './hooks/youMindMessageMapping';
import { clearYouMindChatAttachmentCacheForTests, rememberYouMindChatAttachments } from '../../services/youmind-chat-attachment-cache';
import { applyYouMindChunk, mapYouMindChatDetail } from '../../services/youmind';
import { YouMindChatDetail } from '../../services/youmind';

describe('mapYouMindChatToUiMessages', () => {
  afterEach(() => {
    clearYouMindChatAttachmentCacheForTests();
  });

  it('does not render an empty assistant shell before streaming blocks arrive', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAtMs: 1_100,
          content: 'hello',
        },
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          blocks: [],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: 'hello',
        timestampMs: 1_100,
      },
    ]);
  });

  it('renders the assistant once a visible content block arrives', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          model: 'gpt-test',
          blocks: [
            {
              id: 'block-1',
              kind: 'content',
              text: 'hi there',
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'content:block-1',
        role: 'assistant',
        text: 'hi there',
        timestampMs: 1_200,
        modelLabel: 'gpt-test',
        streaming: false,
      },
    ]);
  });

  it('renders user image attachments as message images', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAtMs: 1_100,
          content: '',
          attachments: [
            {
              kind: 'image',
              url: 'https://cdn.example.com/image.png',
              name: 'image.png',
              mimeType: 'image/png',
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: '',
        timestampMs: 1_100,
        imageUris: ['https://cdn.example.com/image.png'],
      },
    ]);
  });

  it('maps a YouMind user message skill so the client can render it inline with the message', () => {
    const chat = mapYouMindChatDetail({
      id: 'chat-1',
      title: 'Test',
      createdAt: '1970-01-01T00:00:01.000Z',
      updatedAt: '1970-01-01T00:00:02.000Z',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAt: '1970-01-01T00:00:01.100Z',
          content: 'Summarize this article',
          skill: {
            id: 'skill-1',
            name: 'Article Summarizer',
          },
        },
      ],
    }, 'scope-a');

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: 'Summarize this article',
        userSkill: {
          id: 'skill-1',
          name: 'Article Summarizer',
        },
        timestampMs: 1_100,
      },
    ]);
  });

  it('renders user file attachments as fallback text lines', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAtMs: 1_100,
          content: 'Please read this',
          attachments: [
            {
              kind: 'file',
              url: 'https://cdn.example.com/doc.pdf',
              name: 'doc.pdf',
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: 'Please read this\ndoc.pdf',
        timestampMs: 1_100,
      },
    ]);
  });

  it('strips YouMind mention markup from user content when attachments are rendered separately', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAtMs: 1_100,
          content: '@[@image.png](id:snip-1;type:material)',
          attachments: [
            {
              kind: 'image',
              url: 'https://cdn.example.com/image.png',
              name: 'image.png',
              mimeType: 'image/png',
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: '',
        timestampMs: 1_100,
        imageUris: ['https://cdn.example.com/image.png'],
      },
    ]);
  });

  it('prefers the image attachment when local mobile metadata duplicates a material reference', () => {
    const chat = mapYouMindChatDetail({
      id: 'chat-1',
      title: 'Test',
      createdAt: '1970-01-01T00:00:01.000Z',
      updatedAt: '1970-01-01T00:00:02.000Z',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAt: '1970-01-01T00:00:01.100Z',
          content: '@[@photo-123.jpg](id:snip-1;type:material)',
          atReferences: [
            {
              id: 'snip-1',
              type: 'material',
              entity_type: 'snip',
              from: 'user',
              at_name: 'photo-123.jpg',
            },
          ],
          mobileAtReference: [
            {
              id: 'snip-1',
              type: 'snip',
              title: 'photo-123.jpg',
              image: 'file:///photo-123.jpg',
            },
          ],
        },
      ],
    }, 'scope-a');

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: '',
        timestampMs: 1_100,
        imageUris: ['file:///photo-123.jpg'],
      },
    ]);
  });

  it('restores user image attachments from the local cache when chat history only includes material refs', () => {
    rememberYouMindChatAttachments(
      'scope-a',
      [
        {
          id: 'snip-1',
          type: 'material',
          entity_type: 'snip',
          from: 'user',
          at_name: 'photo-123.jpg',
        },
      ],
      [
        {
          uri: 'file:///photo-123.jpg',
          mimeType: 'image/jpeg',
          fileName: 'photo-123.jpg',
        },
      ],
    );

    const chat = mapYouMindChatDetail({
      id: 'chat-1',
      title: 'Test',
      createdAt: '1970-01-01T00:00:01.000Z',
      updatedAt: '1970-01-01T00:00:02.000Z',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAt: '1970-01-01T00:00:01.100Z',
          content: '@[@photo-123.jpg](id:snip-1;type:material)',
          atReferences: [
            {
              id: 'snip-1',
              type: 'material',
              entity_type: 'snip',
              from: 'user',
              at_name: 'photo-123.jpg',
            },
          ],
        },
      ],
    }, 'scope-a');

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: '',
        timestampMs: 1_100,
        imageUris: ['file:///photo-123.jpg'],
      },
    ]);
  });

  it('does not surface another account\'s cached attachment when material ids collide', () => {
    rememberYouMindChatAttachments(
      'scope-a',
      [
        {
          id: 'snip-1',
          type: 'material',
          entity_type: 'snip',
          from: 'user',
          at_name: 'private.jpg',
        },
      ],
      [
        {
          uri: 'file:///account-a-private.jpg',
          mimeType: 'image/jpeg',
          fileName: 'private.jpg',
        },
      ],
    );

    const chat = mapYouMindChatDetail({
      id: 'chat-1',
      title: 'Test',
      createdAt: '1970-01-01T00:00:01.000Z',
      updatedAt: '1970-01-01T00:00:02.000Z',
      messages: [
        {
          id: 'user-1',
          role: 'user',
          createdAt: '1970-01-01T00:00:01.100Z',
          content: '@[@private.jpg](id:snip-1;type:material)',
          atReferences: [
            {
              id: 'snip-1',
              type: 'material',
              entity_type: 'snip',
              from: 'user',
              at_name: 'private.jpg',
            },
          ],
        },
      ],
    }, 'scope-b');

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'user:user-1',
        role: 'user',
        text: 'private.jpg',
        timestampMs: 1_100,
      },
    ]);
  });

  it('marks the latest visible assistant block as streaming for the active YouMind response', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          model: 'gpt-test',
          blocks: [
            {
              id: 'block-1',
              kind: 'content',
              text: 'Already finished',
            },
          ],
        },
        {
          id: 'assistant-2',
          role: 'assistant',
          createdAtMs: 1_300,
          model: 'gpt-test',
          blocks: [
            {
              id: 'block-2',
              kind: 'reasoning',
              text: 'Drafting',
            },
            {
              id: 'block-3',
              kind: 'content',
              text: 'Streaming answer',
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat, { streamingAssistantMessageId: 'assistant-2' })).toEqual([
      {
        id: 'content:block-3',
        role: 'assistant',
        text: 'Streaming answer',
        timestampMs: 1_300,
        modelLabel: 'gpt-test',
        streaming: true,
      },
      {
        id: 'reasoning:block-2',
        role: 'assistant',
        text: 'Thinking\n\nDrafting',
        timestampMs: 1_300,
        modelLabel: 'gpt-test',
        streaming: false,
      },
      {
        id: 'content:block-1',
        role: 'assistant',
        text: 'Already finished',
        timestampMs: 1_200,
        modelLabel: 'gpt-test',
        streaming: false,
      },
    ]);
  });

  it('maps generating tool statuses to running during streaming', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          blocks: [
            {
              id: 'tool-1',
              kind: 'tool',
              status: 'processing',
              toolName: 'imageGenerate',
              toolResult: {},
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'tool:tool-1',
        role: 'tool',
        text: '',
        timestampMs: 1_200,
        toolName: 'Create Image',
        toolStatus: 'running',
        toolSummary: 'Create Image',
        toolArgs: undefined,
        toolDetail: '{}',
        toolDurationMs: undefined,
        toolPresentation: undefined,
      },
    ]);
  });

  it('keeps streamed tool cards readable while snake_case completion block updates are still in flight', () => {
    const draft = {
      id: 'chat-1',
      title: 'Test',
      createdAt: '1970-01-01T00:00:01.000Z',
      updatedAt: '1970-01-01T00:00:02.000Z',
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAt: '1970-01-01T00:00:01.200Z',
          updatedAt: '1970-01-01T00:00:01.200Z',
          model: 'gpt-test',
          status: 'running',
          blocks: [],
        },
      ],
    };

    applyYouMindChunk(draft, {
      mode: 'insert',
      dataType: 'CompletionBlock',
      data: {
        id: 'tool-1',
        message_id: 'assistant-1',
        type: 'tool',
        status: 'executing',
        tool_name: 'googleSearch',
        tool_arguments: {
          query: 'latest ai trends',
        },
      },
    });

    applyYouMindChunk(draft, {
      mode: 'replace',
      targetType: 'CompletionBlock',
      targetId: 'tool-1',
      path: '.tool_result',
      data: {
        results: ['a'],
      },
    });

    const chat = mapYouMindChatDetail(draft, 'scope-a');

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'tool:tool-1',
        role: 'tool',
        text: '',
        timestampMs: 1_200,
        toolName: 'Google Search',
        toolStatus: 'running',
        toolSummary: 'Google Search: latest ai trends',
        toolArgs: JSON.stringify({
          query: 'latest ai trends',
        }, null, 2),
        toolDetail: JSON.stringify({
          results: ['a'],
        }, null, 2),
        toolDurationMs: undefined,
        toolPresentation: undefined,
      },
    ]);
  });

  it('renders image generator tool output as a tool card with image presentation metadata', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          blocks: [
            {
              id: 'tool-1',
              kind: 'tool',
              status: 'success',
              toolName: 'imageGenerate',
              toolResult: {
                image_urls: ['https://cdn.example.com/generated.webp'],
                original_image_urls: ['https://cdn.example.com/generated-original.png'],
              },
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'tool:tool-1',
        role: 'tool',
        text: '',
        timestampMs: 1_200,
        toolName: 'Create Image',
        toolStatus: 'success',
        toolSummary: 'Create Image',
        toolArgs: undefined,
        toolDetail: JSON.stringify({
          image_urls: ['https://cdn.example.com/generated.webp'],
          original_image_urls: ['https://cdn.example.com/generated-original.png'],
        }, null, 2),
        toolDurationMs: undefined,
        toolPresentation: [
          {
            kind: 'image-gallery',
            imageUris: ['https://cdn.example.com/generated.webp'],
            originalImageUris: ['https://cdn.example.com/generated-original.png'],
          },
        ],
      },
    ]);
  });

  it('keeps non-image tools on the default tool card path', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          blocks: [
            {
              id: 'tool-1',
              kind: 'tool',
              status: 'success',
              toolName: 'googleSearch',
              toolArguments: {
                query: 'latest ai trends',
              },
              toolResult: {
                results: ['a'],
              },
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'tool:tool-1',
        role: 'tool',
        text: '',
        timestampMs: 1_200,
        toolName: 'Google Search',
        toolStatus: 'success',
        toolSummary: 'Google Search: latest ai trends',
        toolArgs: JSON.stringify({
          query: 'latest ai trends',
        }, null, 2),
        toolDetail: JSON.stringify({
          results: ['a'],
        }, null, 2),
        toolDurationMs: undefined,
        toolPresentation: undefined,
      },
    ]);
  });

  it('renders slides generate output as an image gallery presentation', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          blocks: [
            {
              id: 'tool-1',
              kind: 'tool',
              status: 'success',
              toolName: 'slidesGenerate',
              toolResult: {
                status: 'success',
                totalSlides: 3,
                successCount: 2,
                failedCount: 1,
                slides: [
                  {
                    index: 1,
                    title: 'Cover',
                    status: 'success',
                    imageUrl: 'https://cdn.example.com/slides/cover.webp',
                    originalImageUrl: 'https://cdn.example.com/slides/cover.png',
                  },
                  {
                    index: 2,
                    title: 'Content',
                    status: 'success',
                    imageUrl: 'https://cdn.example.com/slides/content.webp',
                  },
                  {
                    index: 3,
                    title: 'Closing',
                    status: 'error',
                    error: 'Failed to generate image',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'tool:tool-1',
        role: 'tool',
        text: '',
        timestampMs: 1_200,
        toolName: 'Create Slides',
        toolStatus: 'success',
        toolSummary: 'Create Slides: 3 slides',
        toolArgs: undefined,
        toolDetail: JSON.stringify({
          status: 'success',
          totalSlides: 3,
          successCount: 2,
          failedCount: 1,
          slides: [
            {
              index: 1,
              title: 'Cover',
              status: 'success',
              imageUrl: 'https://cdn.example.com/slides/cover.webp',
              originalImageUrl: 'https://cdn.example.com/slides/cover.png',
            },
            {
              index: 2,
              title: 'Content',
              status: 'success',
              imageUrl: 'https://cdn.example.com/slides/content.webp',
            },
            {
              index: 3,
              title: 'Closing',
              status: 'error',
              error: 'Failed to generate image',
            },
          ],
        }, null, 2),
        toolDurationMs: undefined,
        toolPresentation: [
          {
            kind: 'image-gallery',
            imageUris: [
              'https://cdn.example.com/slides/cover.webp',
              'https://cdn.example.com/slides/content.webp',
            ],
            originalImageUris: ['https://cdn.example.com/slides/cover.png'],
          },
        ],
      },
    ]);
  });

  it('formats run skill tools with a readable title and skill name instead of raw tool response text', () => {
    const chat: YouMindChatDetail = {
      id: 'chat-1',
      title: 'Test',
      createdAtMs: 1_000,
      updatedAtMs: 2_000,
      messages: [
        {
          id: 'assistant-1',
          role: 'assistant',
          createdAtMs: 1_200,
          blocks: [
            {
              id: 'tool-1',
              kind: 'tool',
              status: 'success',
              toolName: 'run_skill',
              toolResponse: 'Skill name=Summarize Article, id=skill-1',
              toolResult: {
                success: true,
                skillName: 'Summarize Article',
                skillId: 'skill-1',
              },
            },
          ],
        },
      ],
    };

    expect(mapYouMindChatToUiMessages(chat)).toEqual([
      {
        id: 'tool:tool-1',
        role: 'tool',
        text: '',
        timestampMs: 1_200,
        toolName: 'Run Skill',
        toolStatus: 'success',
        toolSummary: 'Run Skill: Summarize Article',
        toolArgs: undefined,
        toolDetail: JSON.stringify({
          success: true,
          skillName: 'Summarize Article',
          skillId: 'skill-1',
        }, null, 2),
        toolDurationMs: undefined,
        toolPresentation: undefined,
      },
    ]);
  });
});
