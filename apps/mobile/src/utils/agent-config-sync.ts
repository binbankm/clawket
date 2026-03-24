import type { AgentIdentityProfile } from './agent-identity-profile';
import { sanitizeFallbackModels } from './fallback-models';

type ConfigRecord = Record<string, unknown>;

type SyncParams = {
  agentId: string;
  agentName: string;
  identityProfile: AgentIdentityProfile;
  model?: string;
  fallbacks?: string[];
};

type SyncResult = {
  patch: Record<string, unknown>;
  changed: boolean;
};

function toTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildSyncedIdentity(
  currentIdentity: Record<string, unknown> | undefined,
  profile: AgentIdentityProfile,
): Record<string, unknown> | undefined {
  const nextIdentity: Record<string, unknown> = {
    ...(currentIdentity ?? {}),
  };

  delete nextIdentity.name;
  delete nextIdentity.emoji;
  delete nextIdentity.theme;
  delete nextIdentity.avatar;

  const name = toTrimmed(profile.name);
  const emoji = toTrimmed(profile.emoji);
  const theme = toTrimmed(profile.theme);
  const avatar = toTrimmed(profile.avatar);

  if (name) nextIdentity.name = name;
  if (emoji) nextIdentity.emoji = emoji;
  if (theme) nextIdentity.theme = theme;
  if (avatar) nextIdentity.avatar = avatar;

  return Object.keys(nextIdentity).length > 0 ? nextIdentity : undefined;
}

export function buildAgentConfigSyncPatch(
  cfg: ConfigRecord,
  params: SyncParams,
): SyncResult | null {
  const agents = (cfg.agents as ConfigRecord | undefined) ?? {};
  const list = Array.isArray(agents.list) ? agents.list : null;
  if (!list) {
    return null;
  }

  const index = list.findIndex(
    (entry) => entry && typeof entry === 'object' && (entry as ConfigRecord).id === params.agentId,
  );
  if (index < 0) {
    return null;
  }

  const currentEntry = list[index] as ConfigRecord;
  const nextEntry: ConfigRecord = { ...currentEntry };
  const trimmedName = params.agentName.trim();
  nextEntry.name = trimmedName;

  const currentIdentity = typeof currentEntry.identity === 'object' && currentEntry.identity !== null
    ? currentEntry.identity as ConfigRecord
    : undefined;
  const syncedIdentity = buildSyncedIdentity(currentIdentity, params.identityProfile);
  if (syncedIdentity) {
    nextEntry.identity = syncedIdentity;
  } else {
    delete nextEntry.identity;
  }

  if (params.model !== undefined || params.fallbacks !== undefined) {
    const primaryModel = toTrimmed(params.model);
    const nextFallbacks = sanitizeFallbackModels(params.fallbacks ?? [], { primaryModel });
    if (primaryModel || nextFallbacks.length > 0) {
      nextEntry.model = {
        ...(primaryModel ? { primary: primaryModel } : {}),
        ...(nextFallbacks.length > 0 ? { fallbacks: nextFallbacks } : {}),
      };
    } else {
      delete nextEntry.model;
    }
  }

  const changed = JSON.stringify(currentEntry) !== JSON.stringify(nextEntry);
  const nextList = [...list];
  nextList[index] = nextEntry;

  return {
    changed,
    patch: {
      agents: {
        ...agents,
        list: nextList,
      },
    },
  };
}
