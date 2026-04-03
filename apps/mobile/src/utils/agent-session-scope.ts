type SessionSnapshotLike = {
  sessionKey?: string | null;
  agentId?: string | null;
};

export function agentSessionPrefix(agentId: string | null | undefined): string | null {
  const normalizedAgentId = agentId?.trim();
  if (!normalizedAgentId) return null;
  return `agent:${normalizedAgentId}:`;
}

export function isSessionKeyInAgentScope(
  sessionKey: string | null | undefined,
  agentId: string | null | undefined,
): boolean {
  const normalizedSessionKey = sessionKey?.trim();
  const prefix = agentSessionPrefix(agentId);
  if (!normalizedSessionKey || !prefix) return false;
  return normalizedSessionKey.startsWith(prefix);
}

export function sanitizeSnapshotForAgent<T extends SessionSnapshotLike>(
  snapshot: T | null | undefined,
  agentId: string | null | undefined,
): T | null {
  if (!snapshot) return null;
  if (!isSessionKeyInAgentScope(snapshot.sessionKey, agentId)) return null;
  if (snapshot.agentId?.trim() && snapshot.agentId?.trim() !== agentId?.trim()) return null;
  return snapshot;
}
