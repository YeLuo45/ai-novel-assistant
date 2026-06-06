/**
 * V978 NarrativeMultiAgentEngine — Direction A Iter 7/15 (Round 5)
 * Multi-agent engine: multi-agent coordination + collaboration
 * Sources: chatdev multi-agent + nanobot swarm + thunderbolt
 */

export type AgentRole = 'planner' | 'writer' | 'editor' | 'critic' | 'researcher' | 'observer';
export type AgentState = 'idle' | 'working' | 'waiting' | 'blocked' | 'done';
export type MessageType = 'request' | 'response' | 'broadcast' | 'delegation' | 'feedback';

export interface NarrativeAgent {
  agentId: string;
  role: AgentRole;
  state: AgentState;
  capability: number;
  workload: number;
  successCount: number;
  failureCount: number;
  chapter: number;
}

export interface AgentMessage {
  messageId: string,
  fromId: string,
  toId: string,
  type: MessageType,
  content: string,
  priority: number,
  chapter: number,
}

export interface NarrativeMultiAgentEngineState {
  agents: Map<string, NarrativeAgent>;
  messages: Map<string, AgentMessage>;
  totalAgents: number;
  totalMessages: number;
  averageCapability: number;
  workloadDistribution: number;
  coordination: number;
  multiAgentMastery: number;
}

// Factory
export function createNarrativeMultiAgentEngineState(): NarrativeMultiAgentEngineState {
  return {
    agents: new Map(),
    messages: new Map(),
    totalAgents: 0,
    totalMessages: 0,
    averageCapability: 0.5,
    workloadDistribution: 0.5,
    coordination: 0.5,
    multiAgentMastery: 0.5,
  };
}

// Add agent
export function addNarrativeAgent(
  state: NarrativeMultiAgentEngineState,
  agentId: string,
  role: AgentRole,
  capability: number,
  chapter: number
): NarrativeMultiAgentEngineState {
  const agent: NarrativeAgent = { agentId, role, state: 'idle', capability, workload: 0, successCount: 0, failureCount: 0, chapter };
  const agents = new Map(state.agents).set(agentId, agent);
  return recomputeMultiAgent({ ...state, agents, totalAgents: agents.size });
}

// Record result
export function recordAgentResult(state: NarrativeMultiAgentEngineState, agentId: string, success: boolean): NarrativeMultiAgentEngineState {
  const agent = state.agents.get(agentId);
  if (!agent) return state;

  const updated: NarrativeAgent = success
    ? { ...agent, successCount: agent.successCount + 1, state: 'done' }
    : { ...agent, failureCount: agent.failureCount + 1, state: 'idle' };
  const agents = new Map(state.agents).set(agentId, updated);
  return recomputeMultiAgent({ ...state, agents });
}

// Send message
export function sendAgentMessage(
  state: NarrativeMultiAgentEngineState,
  messageId: string,
  fromId: string,
  toId: string,
  type: MessageType,
  content: string,
  priority: number,
  chapter: number
): NarrativeMultiAgentEngineState {
  const message: AgentMessage = { messageId, fromId, toId, type, content, priority, chapter };
  const messages = new Map(state.messages).set(messageId, message);
  return recomputeMultiAgent({ ...state, messages, totalMessages: messages.size });
}

// Get agents by role
export function getAgentsByRole(state: NarrativeMultiAgentEngineState, role: AgentRole): NarrativeAgent[] {
  return Array.from(state.agents.values()).filter(a => a.role === role);
}

// Get multi-agent report
export function getMultiAgentReport(state: NarrativeMultiAgentEngineState): {
  totalAgents: number;
  totalMessages: number;
  averageCapability: number;
  coordination: number;
  multiAgentMastery: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalAgents === 0) recommendations.push('No agents — add agents');
  if (state.coordination < 0.3) recommendations.push('Low coordination — improve');
  if (state.multiAgentMastery < 0.5) recommendations.push('Low mastery — develop');

  return {
    totalAgents: state.totalAgents,
    totalMessages: state.totalMessages,
    averageCapability: Math.round(state.averageCapability * 100) / 100,
    coordination: Math.round(state.coordination * 100) / 100,
    multiAgentMastery: Math.round(state.multiAgentMastery * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeMultiAgent(state: NarrativeMultiAgentEngineState): NarrativeMultiAgentEngineState {
  const agents = Array.from(state.agents.values());
  const averageCapability = agents.length === 0 ? 0.5
    : agents.reduce((s, a) => s + a.capability, 0) / agents.length;

  // Workload distribution: how balanced workloads are
  const workloads = agents.map(a => a.workload);
  const meanWorkload = workloads.length === 0 ? 0
    : workloads.reduce((s, w) => s + w, 0) / workloads.length;
  const variance = workloads.length === 0 ? 0
    : workloads.reduce((s, w) => s + Math.pow(w - meanWorkload, 2), 0) / workloads.length;
  const workloadDistribution = Math.max(0, 1 - variance);

  // Coordination: messages per agent
  const coordination = agents.length === 0 ? 0.5
    : Math.min(1, state.totalMessages / Math.max(1, agents.length * 2));

  const successRate = agents.length === 0 ? 0.5
    : agents.reduce((s, a) => s + a.successCount / Math.max(1, a.successCount + a.failureCount), 0) / agents.length;

  const multiAgentMastery = (averageCapability * 0.3 + coordination * 0.4 + successRate * 0.3);

  return { ...state, averageCapability, workloadDistribution, coordination, multiAgentMastery };
}

// Reset
export function resetNarrativeMultiAgentEngineState(): NarrativeMultiAgentEngineState {
  return createNarrativeMultiAgentEngineState();
}