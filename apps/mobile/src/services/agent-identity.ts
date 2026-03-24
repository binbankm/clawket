import type { AgentInfo } from '../types/agent';

type IdentityGateway = {
  fetchIdentity(agentId?: string): Promise<{ name?: string; avatar?: string; emoji?: string }>;
};

function hasCompleteAgentIdentity(agent: AgentInfo): boolean {
  return Boolean(agent.identity?.name?.trim() && agent.identity?.emoji?.trim());
}

export async function enrichAgentsWithIdentity(
  gateway: IdentityGateway,
  agents: AgentInfo[],
): Promise<AgentInfo[]> {
  return await Promise.all(
    agents.map(async (agent) => {
      if (hasCompleteAgentIdentity(agent)) {
        return agent;
      }
      try {
        const identity = await gateway.fetchIdentity(agent.id);
        return {
          ...agent,
          identity: {
            ...agent.identity,
            name: agent.identity?.name || identity.name,
            emoji: agent.identity?.emoji || identity.emoji,
            avatar: agent.identity?.avatar || identity.avatar,
          },
        };
      } catch {
        return agent;
      }
    }),
  );
}
