import { describe, expect, it } from '@jest/globals';
import { buildAgentConfigSyncPatch } from './agent-config-sync';

describe('buildAgentConfigSyncPatch', () => {
  it('syncs identity-managed fields and preserves unrelated config', () => {
    const result = buildAgentConfigSyncPatch(
      {
        agents: {
          list: [
            {
              id: 'writer',
              name: 'Writer',
              identity: {
                name: 'Writer',
                emoji: '✍️',
                theme: 'calm',
                avatar: 'avatars/writer.png',
                custom: 'keep-me',
              },
              model: {
                primary: 'openai/gpt-5',
                fallbacks: ['openai/gpt-4.1'],
              },
            },
          ],
        },
      },
      {
        agentId: 'writer',
        agentName: '  Nova  ',
        identityProfile: {
          name: 'Nova',
          emoji: '🦊',
          creature: 'fox',
          vibe: 'sharp',
          theme: '',
          avatar: '',
        },
        model: 'openai/gpt-5-mini',
        fallbacks: ['openai/gpt-4.1', 'openai/gpt-5-mini'],
      },
    );

    expect(result).not.toBeNull();
    expect(result?.changed).toBe(true);
    expect(result?.patch).toEqual({
      agents: {
        list: [
          {
            id: 'writer',
            name: 'Nova',
            identity: {
              name: 'Nova',
              emoji: '🦊',
              custom: 'keep-me',
            },
            model: {
              primary: 'openai/gpt-5-mini',
              fallbacks: ['openai/gpt-4.1'],
            },
          },
        ],
      },
    });
  });

  it('removes managed model fields when editor clears them', () => {
    const result = buildAgentConfigSyncPatch(
      {
        agents: {
          list: [
            {
              id: 'writer',
              name: 'Writer',
              model: {
                primary: 'openai/gpt-5',
                fallbacks: ['openai/gpt-4.1'],
              },
            },
          ],
        },
      },
      {
        agentId: 'writer',
        agentName: 'Writer',
        identityProfile: {
          name: 'Writer',
          emoji: '',
          creature: '',
          vibe: '',
          theme: '',
          avatar: '',
        },
        model: '',
        fallbacks: [],
      },
    );

    expect(result?.patch).toEqual({
      agents: {
        list: [
          {
            id: 'writer',
            name: 'Writer',
            identity: {
              name: 'Writer',
            },
          },
        ],
      },
    });
  });
});
