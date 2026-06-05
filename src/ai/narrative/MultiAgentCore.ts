/**
 * V748 MultiAgentCore — Direction A Iter 6/9 (Round 3)
 * Multi-agent core: agent registry + capability matching + coordination
 * Sources: chatdev multi-agent + nanobot swarm + ruflo hierarchical
 */

export type AgentRole = 'planner' | 'executor' | 'reviewer' | 'critic' | 'synthesizer' | 'observer';
export type AgentState = 'idle' | 'busy' | 'overloaded' | 'failed' | 'retired';
export type CoordinationPattern = 'centralized' | 'distributed' | 'hierarchical' | 'mesh' | 'hybrid';

export interface Agent {
  agentId: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  state: AgentState;
  load: number;
  successRate: number;
  reputation: number;
  joinedAt: number;
}

export interface AgentMessage {
  messageId: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: number;
  delivered: boolean;
}

export interface MultiAgentCoreState {
  agents: Map<string, Agent>;
  messages: Map<string, AgentMessage>;
  coordinationPattern: CoordinationPattern;
  totalAgents: number;
  activeAgents: number;
  totalMessages: number;
  deliveredMessages: number;
  averageLoad: number;
  averageSuccessRate: number;
  dominantRole: AgentRole | null;
}

// Factory
export function createMultiAgentCoreState(): MultiAgentCoreState {
  return {
    agents: new Map(),
    messages: new Map(),
    coordinationPattern: 'distributed',
    totalAgents: 0,
    activeAgents: 0,
    totalMessages: 0,
    deliveredMessages: 0,
    averageLoad: 0,
    averageSuccessRate: 0.7,
    dominantRole: null,
  };
}

// Register agent
export function registerAgent(
  state: MultiAgentCoreState,
  agentId: string,
  name: string,
  role: AgentRole,
  capabilities: string[] = [],
  reputation: number = 0.5
): MultiAgentCoreState {
  const agent: Agent = {
    agentId,
    name,
    role,
    capabilities,
    state: 'idle',
    load: 0,
    successRate: 0.7,
    reputation,
    joinedAt: Date.now(),
  };
  const agents = new Map(state.agents).set(agentId, agent);
  return recomputeMultiAgent({ ...state, agents, totalAgents: agents.size, activeAgents: state.activeAgents + 1 });
}

// Update agent state
export function updateAgentState(state: MultiAgentCoreState, agentId: string, newState: AgentState, load: number = 0): MultiAgentCoreState {
  const agent = state.agents.get(agentId);
  if (!agent) return state;

  const updated: Agent = { ...agent, state: newState, load: Math.min(1, Math.max(0, load)) };
  const agents = new Map(state.agents).set(agentId, updated);
  return recomputeMultiAgent({ ...state, agents });
}

// Update agent success rate
export function updateAgentSuccessRate(state: MultiAgentCoreState, agentId: string, successRate: number): MultiAgentCoreState {
  const agent = state.agents.get(agentId);
  if (!agent) return state;

  const updated: Agent = { ...agent, successRate: Math.min(1, Math.max(0, successRate)) };
  const agents = new Map(state.agents).set(agentId, updated);
  return recomputeMultiAgent({ ...state, agents });
}

// Send message
export function sendAgentMessage(state: MultiAgentCoreState, messageId: string, fromId: string, toId: string, content: string): MultiAgentCoreState {
  const message: AgentMessage = { messageId, fromId, toId, content, timestamp: Date.now(), delivered: true };
  const messages = new Map(state.messages).set(messageId, message);
  return recomputeMultiAgent({ ...state, messages, totalMessages: messages.size, deliveredMessages: state.deliveredMessages + 1 });
}

// Set coordination pattern
export function setCoordinationPattern(state: MultiAgentCoreState, pattern: CoordinationPattern): MultiAgentCoreState {
  return { ...state, coordinationPattern: pattern };
}

// Get agents by role
export function getAgentsByRole(state: MultiAgentCoreState, role: AgentRole): Agent[] {
  return Array.from(state.agents.values()).filter(a => a.role === role);
}

// Find best agent for task
export function findBestAgent(state: MultiAgentCoreState, requiredCapabilities: string[]): Agent | null {
  const agents = Array.from(state.agents.values()).filter(a => a.state === 'idle');
  if (agents.length === 0) return null;

  let best: Agent | null = null;
  let bestScore = -1;

  for (const agent of agents) {
    const matchCount = requiredCapabilities.filter(c => agent.capabilities.includes(c)).length;
    const score = matchCount * 0.5 + agent.reputation * 0.3 + (1 - agent.load) * 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = agent;
    }
  }
  return best;
}

// Get multi-agent report
export function getMultiAgentCoreReport(state: MultiAgentCoreState): {
  totalAgents: number;
  activeAgents: number;
  totalMessages: number;
  averageLoad: number;
  averageSuccessRate: number;
  dominantRole: AgentRole | null;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAgents === 0) recommendations.push('No agents — register agents');
  if (state.averageLoad > 0.8) recommendations.push('High load — add more agents');
  if (state.averageSuccessRate < 0.5) recommendations.push('Low success rate — review agents');

  return {
    totalAgents: state.totalAgents,
    activeAgents: state.activeAgents,
    totalMessages: state.totalMessages,
    averageLoad: Math.round(state.averageLoad * 100) / 100,
    averageSuccessRate: Math.round(state.averageSuccessRate * 100) / 100,
    dominantRole: state.dominantRole,
    recommendations,
  };
}

// Recompute metrics
function recomputeMultiAgent(state: MultiAgentCoreState): MultiAgentCoreState {
  const agents = Array.from(state.agents.values());
  const active = agents.filter(a => a.state === 'busy' || a.state === 'idle');
  const averageLoad = agents.length > 0
    ? agents.reduce((s, a) => s + a.load, 0) / agents.length
    : 0;
  const averageSuccessRate = agents.length > 0
    ? agents.reduce((s, a) => s + a.successRate, 0) / agents.length
    : 0.7;

  let dominantRole: AgentRole | null = null;
  let maxCount = -1;
  const roleCounts = new Map<AgentRole, number>();
  agents.forEach(a => roleCounts.set(a.role, (roleCounts.get(a.role) || 0) + 1));
  roleCounts.forEach((count, role) => {
    if (count > maxCount) { maxCount = count; dominantRole = role; }
  });

  return { ...state, activeAgents: active.length, averageLoad, averageSuccessRate, dominantRole };
}

// Reset multi-agent state
export function resetMultiAgentCoreState(): MultiAgentCoreState {
  return createMultiAgentCoreState();
}