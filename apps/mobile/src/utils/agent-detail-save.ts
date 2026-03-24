import { generateAgentIdentityMarkdown, type AgentIdentityProfile } from './agent-identity-profile';
import { buildAgentConfigSyncPatch } from './agent-config-sync';

type GatewayLike = {
  getConfig(): Promise<{ config: Record<string, unknown> | null; hash: string | null }>;
  setAgentFile(name: string, content: string, agentId?: string): Promise<{ ok: boolean }>;
};

type PatchWithRestart = (params: {
  patch: Record<string, unknown>;
  configHash: string;
}) => Promise<unknown>;

type PersistAgentDetailParams = {
  agentId: string;
  gateway: GatewayLike;
  patchWithRestart: PatchWithRestart;
  agentName: string;
  identityProfile: AgentIdentityProfile;
  model: string;
  fallbacks: string[];
  shouldWriteIdentityFile: boolean;
  shouldSyncConfig: boolean;
  previousIdentityFileContent: string;
};

export async function persistAgentDetailChanges(
  params: PersistAgentDetailParams,
): Promise<{ nextIdentityFileContent: string }> {
  let nextIdentityFileContent = params.previousIdentityFileContent;
  let identityFileWritten = false;

  if (params.shouldWriteIdentityFile) {
    nextIdentityFileContent = generateAgentIdentityMarkdown(params.identityProfile);
    const identitySaved = await params.gateway.setAgentFile(
      'IDENTITY.md',
      nextIdentityFileContent,
      params.agentId,
    );
    if (!identitySaved.ok) {
      throw new Error('Failed to update IDENTITY.md');
    }
    identityFileWritten = true;
  }

  try {
    if (params.shouldSyncConfig) {
      const freshConfig = await params.gateway.getConfig();
      if (!freshConfig.config || !freshConfig.hash) {
        throw new Error('Gateway config is unavailable. Reload and try again.');
      }

      const patchResult = buildAgentConfigSyncPatch(freshConfig.config, {
        agentId: params.agentId,
        agentName: params.agentName,
        identityProfile: params.identityProfile,
        model: params.model,
        fallbacks: params.fallbacks,
      });
      if (!patchResult) {
        throw new Error(`Agent "${params.agentId}" was not found in gateway config.`);
      }

      if (patchResult.changed) {
        await params.patchWithRestart({
          patch: patchResult.patch,
          configHash: freshConfig.hash,
        });
      }
    }
  } catch (error) {
    if (identityFileWritten) {
      try {
        const rollback = await params.gateway.setAgentFile(
          'IDENTITY.md',
          params.previousIdentityFileContent,
          params.agentId,
        );
        if (!rollback.ok) {
          throw new Error('Failed to restore IDENTITY.md');
        }
      } catch {
        throw new Error('Failed to update agent config after writing IDENTITY.md; original identity could not be restored.');
      }
    }
    throw error;
  }

  return { nextIdentityFileContent };
}
