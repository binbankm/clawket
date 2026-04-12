import {
  isSessionKeyInAgentScope,
  sanitizeSnapshotForAgent,
} from './agent-session-scope';

describe('agent-session-scope', () => {
  it('rejects legacy OpenClaw agent session keys for backend-scoped Hermes sessions', () => {
    expect(isSessionKeyInAgentScope('agent:main:main', 'main', { mainSessionKey: 'main' })).toBe(false);
    expect(isSessionKeyInAgentScope('20260411_122441_d40735', 'main', { mainSessionKey: 'main' })).toBe(true);
  });

  it('rejects backend-scoped snapshots whose agent id does not match the current agent', () => {
    expect(
      sanitizeSnapshotForAgent(
        {
          sessionKey: '20260411_122441_d40735',
          agentId: 'writer',
        },
        'main',
        { mainSessionKey: 'main' },
      ),
    ).toBeNull();
  });
});
