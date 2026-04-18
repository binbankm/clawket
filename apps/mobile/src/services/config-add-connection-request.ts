export type PendingConfigAddConnectionRequest = {
  requestedAt: number;
  tab?: 'quick' | 'manual';
  flow?: 'local' | 'youmind';
};

let pendingConfigAddConnectionRequest: PendingConfigAddConnectionRequest | null = null;

export function requestConfigAddConnection(input?: {
  requestedAt?: number;
  tab?: 'quick' | 'manual';
  flow?: 'local' | 'youmind';
}): PendingConfigAddConnectionRequest {
  const nextRequest: PendingConfigAddConnectionRequest = {
    requestedAt: input?.requestedAt ?? Date.now(),
    tab: input?.tab,
    flow: input?.flow,
  };
  pendingConfigAddConnectionRequest = nextRequest;
  return nextRequest;
}

export function consumePendingConfigAddConnectionRequest(): PendingConfigAddConnectionRequest | null {
  const nextRequest = pendingConfigAddConnectionRequest;
  pendingConfigAddConnectionRequest = null;
  return nextRequest;
}
