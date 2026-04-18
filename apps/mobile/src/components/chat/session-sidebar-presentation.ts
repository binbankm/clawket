import type { SessionSidebarTabKey } from './session-sidebar-data';

export type SessionSidebarPresentation = 'default' | 'chat-only';

export type SessionSidebarExternalSelection = {
  requestedAt: number;
  tab?: SessionSidebarTabKey;
  channel?: string;
} | null | undefined;

export function resolveSessionSidebarSelection(
  presentation: SessionSidebarPresentation,
  externalSelection?: SessionSidebarExternalSelection,
): { activeTab: SessionSidebarTabKey; activeChannel: string } | null {
  if (!externalSelection?.requestedAt) return null;
  if (presentation === 'chat-only') {
    return {
      activeTab: 'sessions',
      activeChannel: 'all',
    };
  }
  return {
    activeTab: externalSelection.tab ?? 'sessions',
    activeChannel: externalSelection.channel?.trim().toLowerCase() || 'all',
  };
}

export function shouldResetSessionSidebarChrome(input: {
  presentation: SessionSidebarPresentation;
  activeTab: SessionSidebarTabKey;
  activeChannel: string;
}): boolean {
  if (input.presentation !== 'chat-only') return false;
  return input.activeTab !== 'sessions' || input.activeChannel !== 'all';
}
