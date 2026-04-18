import {
  resolveSessionSidebarSelection,
  shouldResetSessionSidebarChrome,
} from './session-sidebar-presentation';

describe('resolveSessionSidebarSelection', () => {
  it('preserves explicit tab and channel in default mode', () => {
    expect(resolveSessionSidebarSelection('default', {
      requestedAt: 1,
      tab: 'subagents',
      channel: 'Discord',
    })).toEqual({
      activeTab: 'subagents',
      activeChannel: 'discord',
    });
  });

  it('forces a single chats view in chat-only mode', () => {
    expect(resolveSessionSidebarSelection('chat-only', {
      requestedAt: 1,
      tab: 'cron',
      channel: 'telegram',
    })).toEqual({
      activeTab: 'sessions',
      activeChannel: 'all',
    });
  });

  it('returns null when there is no external selection request', () => {
    expect(resolveSessionSidebarSelection('chat-only', null)).toBeNull();
  });
});

describe('shouldResetSessionSidebarChrome', () => {
  it('keeps default mode untouched', () => {
    expect(shouldResetSessionSidebarChrome({
      presentation: 'default',
      activeTab: 'cron',
      activeChannel: 'telegram',
    })).toBe(false);
  });

  it('resets hidden controls back to the chats-only state', () => {
    expect(shouldResetSessionSidebarChrome({
      presentation: 'chat-only',
      activeTab: 'subagents',
      activeChannel: 'telegram',
    })).toBe(true);
  });

  it('keeps search text intact in chat-only mode', () => {
    expect(shouldResetSessionSidebarChrome({
      presentation: 'chat-only',
      activeTab: 'sessions',
      activeChannel: 'all',
    })).toBe(false);
  });
});
