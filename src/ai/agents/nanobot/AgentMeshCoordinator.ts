/**
 * AgentMeshCoordinator - V118
 * Distributed Multi-Agent Mesh Coordination System
 * 
 * Inspired by:
 * - nanobot: distributed mesh agents, autonomous specialization
 * - chatdev: multi-agent coordination and role specialization
 * - thunderbolt: pipeline architecture, feedback loops
 * 
 * Provides:
 * - Message routing between agents in a mesh topology
 * - Dynamic role assignment and specialization
 * - Self-organizing agent behavior based on workload
 * - Heartbeat-based health monitoring
 * - Mesh-wide broadcast and targeted messaging
 */

import type { WritingSessionState } from '../../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export type AgentRole =
  | 'writer'
  | 'reviewer'
  | 'worldbuilder'
  | 'character_agent'
  | 'plotter'
  | 'editor'
  | 'researcher'
  | 'coordinator'

export type AgentStatus = 'idle' | 'active' | 'busy' | 'offline'

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical'

export interface MeshAgent {
  id: string
  role: AgentRole
  status: AgentStatus
  capabilities: string[]
  specializations: string[]
  workload: number                  // 0-100
  successRate: number               // 0-1
  totalTasks: number
  failedTasks: number
  lastActiveTime: number
  isOnline: boolean
}

export interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string | 'mesh' | 'role:*' | 'coordinator'
  content: any
  priority: MessagePriority
  timestamp: number
  replyTo?: string
  headers: Record<string, string>
}

export interface MeshCoordinationState {
  agents: Map<string, MeshAgent>
  agentRegistry: Map<string, string[]>  // role -> agentIds
  messages: AgentMessage[]
  messageQueue: AgentMessage[]
  totalMessages: number
  meshHealth: number                   // 0-100
  coordinators: Set<string>
  pendingMessages: number
  broadcastCount: number
  deliveredCount: number
  failedDeliveryCount: number
}

export interface MeshConfig {
  maxQueueSize: number
  messageRetention: number
  heartbeatIntervalMs: number
  offlineThresholdMs: number
  maxWorkload: number
  enableAutoSpecialization: boolean
  coordinatorElectionStrategy: 'first_available' | 'lowest_workload' | 'random'
}

export const DEFAULT_MESH_CONFIG: MeshConfig = {
  maxQueueSize: 1000,
  messageRetention: 100,
  heartbeatIntervalMs: 30000,
  offlineThresholdMs: 60000,
  maxWorkload: 100,
  enableAutoSpecialization: true,
  coordinatorElectionStrategy: 'lowest_workload',
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyMeshCoordinationState(): MeshCoordinationState {
  return {
    agents: new Map(),
    agentRegistry: new Map(),
    messages: [],
    messageQueue: [],
    totalMessages: 0,
    meshHealth: 100,
    coordinators: new Set(),
    pendingMessages: 0,
    broadcastCount: 0,
    deliveredCount: 0,
    failedDeliveryCount: 0,
  }
}

// =============================================================================
// Agent Registration
// =============================================================================

export function registerAgent(
  state: MeshCoordinationState,
  agent: MeshAgent
): MeshCoordinationState {
  const newAgents = new Map(state.agents)
  newAgents.set(agent.id, { ...agent })

  // Register by role
  const newRegistry = new Map(state.agentRegistry)
  const existing = newRegistry.get(agent.role) ?? []
  if (!existing.includes(agent.id)) {
    newRegistry.set(agent.role, [...existing, agent.id])
  }

  return { ...state, agents: newAgents, agentRegistry: newRegistry }
}

export function unregisterAgent(state: MeshCoordinationState, agentId: string): MeshCoordinationState {
  const agent = state.agents.get(agentId)
  if (!agent) return state

  const newAgents = new Map(state.agents)
  newAgents.delete(agentId)

  // Remove from registry
  const newRegistry = new Map(state.agentRegistry)
  const existing = newRegistry.get(agent.role) ?? []
  newRegistry.set(agent.role, existing.filter(id => id !== agentId))

  // Remove from coordinators
  const newCoordinators = new Set(state.coordinators)
  newCoordinators.delete(agentId)

  return { ...state, agents: newAgents, agentRegistry: newRegistry, coordinators: newCoordinators }
}

export function updateAgentStatus(
  state: MeshCoordinationState,
  agentId: string,
  status: AgentStatus
): MeshCoordinationState {
  const agent = state.agents.get(agentId)
  if (!agent) return state

  const newAgents = new Map(state.agents)
  newAgents.set(agentId, {
    ...agent,
    status,
    lastActiveTime: status === 'offline' ? agent.lastActiveTime : Date.now(),
    isOnline: status !== 'offline',
  })

  return { ...state, agents: newAgents }
}

export function updateAgentWorkload(
  state: MeshCoordinationState,
  agentId: string,
  workload: number
): MeshCoordinationState {
  const agent = state.agents.get(agentId)
  if (!agent) return state

  const newAgents = new Map(state.agents)
  newAgents.set(agentId, {
    ...agent,
    workload: Math.max(0, Math.min(100, workload)),
  })

  return { ...state, agents: newAgents }
}

export function recordTaskResult(
  state: MeshCoordinationState,
  agentId: string,
  success: boolean
): MeshCoordinationState {
  const agent = state.agents.get(agentId)
  if (!agent) return state

  const newAgents = new Map(state.agents)
  newAgents.set(agentId, {
    ...agent,
    totalTasks: agent.totalTasks + 1,
    failedTasks: agent.failedTasks + (success ? 0 : 1),
    successRate: (agent.totalTasks + 1) > 0
      ? ((agent.successRate * agent.totalTasks) + (success ? 1 : 0)) / (agent.totalTasks + 1)
      : success ? 1 : 0,
  })

  return { ...state, agents: newAgents }
}

// =============================================================================
// Message Routing
// =============================================================================

export function sendMessage(
  state: MeshCoordinationState,
  message: Omit<AgentMessage, 'id' | 'timestamp'>
): MeshCoordinationState {
  const fullMessage: AgentMessage = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  }

  const newMessages = [...state.messages, fullMessage]
  const newQueue = [...state.messageQueue, fullMessage]

  return {
    ...state,
    messages: newMessages.slice(-DEFAULT_MESH_CONFIG.messageRetention),
    messageQueue: newQueue.slice(-DEFAULT_MESH_CONFIG.maxQueueSize),
    totalMessages: state.totalMessages + 1,
    pendingMessages: state.pendingMessages + 1,
  }
}

export function deliverMessages(state: MeshCoordinationState): MeshCoordinationState {
  const delivered: string[] = []
  const failed: string[] = []
  const pending = state.messageQueue.filter(m => {
    if (m.toAgentId === 'mesh' || m.toAgentId === 'role:*') {
      return true
    }
    return state.agents.has(m.toAgentId)
  })

  const remaining = state.messageQueue.filter(m => {
    if (pending.includes(m)) return false
    // Check if target agent exists
    if (m.toAgentId !== 'mesh' && m.toAgentId !== 'role:*' && m.toAgentId !== 'coordinator') {
      const agent = state.agents.get(m.toAgentId)
      if (!agent || !agent.isOnline) {
        failed.push(m.id)
        return true // keep in queue for retry
      }
    }
    return false
  })

  return {
    ...state,
    messageQueue: remaining,
    pendingMessages: remaining.length,
    deliveredCount: state.deliveredCount + delivered.length,
    failedDeliveryCount: state.failedDeliveryCount + failed.length,
    broadcastCount: state.broadcastCount + pending.filter(m => m.toAgentId === 'mesh').length,
  }
}

// =============================================================================
// Role-Based Selection
// =============================================================================

export function selectAgentByRole(state: MeshCoordinationState, role: AgentRole): string | null {
  const agentIds = state.agentRegistry.get(role) ?? []
  const available = agentIds
    .map(id => state.agents.get(id))
    .filter(a => a && a.isOnline && a.status !== 'offline' && a.workload < 100)

  if (available.length === 0) return null

  // Select agent with lowest workload
  return available.sort((a, b) => a!.workload - b!.workload)[0]!.id
}

export function selectCoordinator(state: MeshCoordinationState): string | null {
  // Strategy: lowest workload coordinator
  const onlineCoordinators = Array.from(state.coordinators)
    .map(id => state.agents.get(id))
    .filter(a => a && a.isOnline && a.workload < 100)

  if (onlineCoordinators.length > 0) {
    return onlineCoordinators.sort((a, b) => a!.workload - b!.workload)[0]!.id
  }

  // Fallback: any online agent
  const anyOnline = Array.from(state.agents.values()).filter(a => a.isOnline)
  if (anyOnline.length > 0) {
    return anyOnline.sort((a, b) => a.workload - b.workload)[0].id
  }

  return null
}

export function getAgentsByRole(state: MeshCoordinationState, role: AgentRole): MeshAgent[] {
  const agentIds = state.agentRegistry.get(role) ?? []
  return agentIds.map(id => state.agents.get(id)).filter((a): a is MeshAgent => a !== undefined)
}

export function getAvailableAgents(state: MeshCoordinationState): MeshAgent[] {
  return Array.from(state.agents.values()).filter(a => a.isOnline && a.status !== 'offline')
}

// =============================================================================
// Auto-Specialization
// =============================================================================

export function autoSpecializeAgent(
  state: MeshCoordinationState,
  agentId: string,
  specialization: string
): MeshCoordinationState {
  const agent = state.agents.get(agentId)
  if (!agent) return state

  const newAgents = new Map(state.agents)
  newAgents.set(agentId, {
    ...agent,
    specializations: [...new Set([...agent.specializations, specialization])],
  })

  return { ...state, agents: newAgents }
}

export function detectIdleAgents(state: MeshCoordinationState): string[] {
  return Array.from(state.agents.values())
    .filter(a => a.isOnline && a.status === 'idle' && a.totalTasks < 3)
    .map(a => a.id)
}

// =============================================================================
// Mesh Health
// =============================================================================

export function calculateMeshHealth(state: MeshCoordinationState): number {
  const agents = Array.from(state.agents.values())
  if (agents.length === 0) return 0

  const onlineCount = agents.filter(a => a.isOnline).length
  const onlineRatio = onlineCount / agents.length

  const avgSuccessRate = agents.reduce((s, a) => s + a.successRate, 0) / agents.length

  const workloadBalance = 1 - (agents.reduce((s, a) => s + Math.abs(a.workload - 50), 0) / agents.length / 50)

  return Math.round(
    (onlineRatio * 0.4 + avgSuccessRate * 0.3 + workloadBalance * 0.3) * 100
  )
}

// =============================================================================
// Formatters
// =============================================================================

export function formatMeshSummary(state: MeshCoordinationState): string {
  const agents = Array.from(state.agents.values())
  const online = agents.filter(a => a.isOnline).length

  const lines = [
    '=== Agent Mesh Summary ===',
    `Total Agents: ${agents.length} | Online: ${online}`,
    `Mesh Health: ${state.meshHealth}/100`,
    `Messages: ${state.totalMessages} total, ${state.pendingMessages} pending`,
    `Broadcasts: ${state.broadcastCount} | Delivered: ${state.deliveredCount}`,
    '',
    '--- Agents by Role ---',
  ]

  for (const [role, ids] of state.agentRegistry.entries()) {
    lines.push(`  ${role}: ${ids.length} agent(s)`)
  }

  return lines.join('\n')
}

export function formatAgentDetails(state: MeshCoordinationState, agentId: string): string {
  const agent = state.agents.get(agentId)
  if (!agent) return `Agent ${agentId} not found`

  return [
    `=== Agent: ${agent.id} ===`,
    `Role: ${agent.role} | Status: ${agent.status}`,
    `Online: ${agent.isOnline} | Workload: ${agent.workload}%`,
    `Success Rate: ${(agent.successRate * 100).toFixed(1)}%`,
    `Tasks: ${agent.totalTasks} total, ${agent.failedTasks} failed`,
    `Specializations: ${agent.specializations.join(', ') || '(none)'}`,
    `Last Active: ${new Date(agent.lastActiveTime).toLocaleTimeString()}`,
  ].join('\n')
}

export function formatMessageQueue(state: MeshCoordinationState): string {
  const lines = [
    `=== Message Queue (${state.messageQueue.length} pending) ===`,
  ]

  for (const msg of state.messageQueue.slice(0, 10)) {
    lines.push(
      `[${msg.priority}] ${msg.fromAgentId} → ${msg.toAgentId}: ${JSON.stringify(msg.content).slice(0, 50)}`
    )
  }

  return lines.join('\n')
}