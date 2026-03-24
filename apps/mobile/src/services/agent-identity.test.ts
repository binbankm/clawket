import { describe, expect, it, jest } from '@jest/globals';
import { enrichAgentsWithIdentity } from './agent-identity';

describe('enrichAgentsWithIdentity', () => {
  it('fills missing identity name even when emoji already exists', async () => {
    const gateway = {
      fetchIdentity: jest.fn(async () => ({
        name: 'Writer',
        emoji: '✍️',
        avatar: 'avatars/writer.png',
      })),
    };

    const enriched = await enrichAgentsWithIdentity(gateway, [
      {
        id: 'writer',
        name: 'writer',
        identity: {
          emoji: '✍️',
        },
      },
    ]);

    expect(gateway.fetchIdentity as jest.Mock).toHaveBeenCalledWith('writer');
    expect(enriched[0]).toEqual({
      id: 'writer',
      name: 'writer',
      identity: {
        name: 'Writer',
        emoji: '✍️',
        avatar: 'avatars/writer.png',
      },
    });
  });

  it('skips fetch when both identity name and emoji are already present', async () => {
    const gateway = {
      fetchIdentity: jest.fn(async () => ({})),
    };

    const agents = [
      {
        id: 'writer',
        name: 'writer',
        identity: {
          name: 'Writer',
          emoji: '✍️',
        },
      },
    ];

    const enriched = await enrichAgentsWithIdentity(gateway, agents);

    expect(gateway.fetchIdentity as jest.Mock).not.toHaveBeenCalled();
    expect(enriched).toEqual(agents);
  });
});
