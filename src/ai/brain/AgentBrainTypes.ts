/**
 * AgentBrain Types - V73
 * Multi-Agent Orchestration Brain - Meta-cognition system
 * 
 * Routes tasks to specialized sub-agents, manages budget, monitors performance,
 * handles inter-agent communication and conflict resolution
 */

export type AgentRole = 'writer' | 'reviewer' | 'worldbuilder' | 'character' | 'plotter' | 'editor' | 'researcher'

export interface AgentProfile {
  role: AgentRole
  name: string
  description: string
  capabilities: string[]
  maxConcurrentTasks: number
  currentLoad: number
  successRate: number
  avgLatencyMs: number
  totalTasksCompleted: number
  lastActiveAt: number
}

export interface BrainTask {
  id: string
  type: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  payload: unknown
  requiredRoles: AgentRole[]
  preferredRoles?: AgentRole[]
  budgetTokens: number
  deadlineMs: number
  createdAt: number
  assignedAgentId?: string
  status: 'pending' | 'routing' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: unknown
  error?: string
  attempts: number
  maxAttempts: number
  metadata: Record<string, unknown>
}

export interface BrainDecision {
  taskId: string
  selectedAgentId: string
  selectedRole: AgentRole
  reasoning: string
  confidence: number
  alternativeAgents: Array<{ agentId: string; role: AgentRole; score: number }>
  estimatedTokens: number
  estimatedLatencyMs: number
  timestamp: number
}

export interface InterAgentMessage {
  id: string
  fromAgentId: string
  fromRole: AgentRole
  toAgentId: string
  toRole: AgentRole | 'broadcast'
  type: 'request' | 'response' | 'handoff' | 'conflict' | 'sync' | 'alert'
  payload: unknown
  conversationId: string
  replyTo?: string
  timestamp: number
}

export interface BudgetAllocation {
  taskId: string
  agentId: string
  allocatedTokens: number
  spentTokens: number
  remainingTokens: number
  overspend: boolean
  priorityBoost: number
}

export interface BrainMetrics {
  totalTasksProcessed: number
  tasksByStatus: Record<BrainTask['status'], number>
  tasksByRole: Record<AgentRole, number>
  totalTokensSpent: number
  agentLoadDistribution: Record<AgentRole, number>
  averageRoutingTimeMs: number
  conflictsResolved: number
  handoffsCompleted: number
  budgetOverspendCount: number
}

export interface ConflictReport {
  taskId: string
  conflictType: 'resource' | 'goal' | 'knowledge' | 'priority'
  involvedAgents: AgentRole[]
  description: string
  resolution: string
  timestamp: number
}

export interface HandoffRequest {
  taskId: string
  fromAgentId: string
  fromRole: AgentRole
  toRole: AgentRole
  reason: string
  context: unknown
  priority: BrainTask['priority']
}

// ===============================================================================
// Budget Management
// ===============================================================================

export interface BudgetConfig {
  maxTokensPerTask: number
  maxTokensPerDay: number
  warningThreshold: number  // 0-1
  criticalThreshold: number  // 0-1
}

export interface DailyBudget {
  date: string
  totalAllocated: number
  totalSpent: number
  remaining: number
  taskBreakdown: Array<{ taskId: string; spent: number }>
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  maxTokensPerTask: 5000,
  maxTokensPerDay: 50000,
  warningThreshold: 0.7,
  criticalThreshold: 0.9
}

export function generateTaskId(): string {
  return `brain_task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createDefaultAgentProfiles(): Map<string, AgentProfile> {
  const profiles = new Map<string, AgentProfile>()
  
  const agents: AgentProfile[] = [
    {
      role: 'writer',
      name: 'Writer Agent',
      description: 'Generates narrative content, descriptions, dialogues',
      capabilities: ['creative-writing', 'dialogue', 'narrative', 'prose-style'],
      maxConcurrentTasks: 2,
      currentLoad: 0,
      successRate: 0.92,
      avgLatencyMs: 1200,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    },
    {
      role: 'reviewer',
      name: 'Reviewer Agent',
      description: 'Reviews content quality, consistency, style',
      capabilities: ['critique', 'style-check', 'consistency-review', 'quality-gate'],
      maxConcurrentTasks: 3,
      currentLoad: 0,
      successRate: 0.88,
      avgLatencyMs: 800,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    },
    {
      role: 'worldbuilder',
      name: 'World Builder Agent',
      description: 'Creates and maintains world settings, lore, rules',
      capabilities: ['world-creation', 'lore-development', 'consistency-enforcement', 'setting-design'],
      maxConcurrentTasks: 1,
      currentLoad: 0,
      successRate: 0.85,
      avgLatencyMs: 2000,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    },
    {
      role: 'character',
      name: 'Character Agent',
      description: 'Develops characters, arcs, relationships',
      capabilities: ['character-design', 'arc-development', 'relationship-mapping', 'motivation-analysis'],
      maxConcurrentTasks: 2,
      currentLoad: 0,
      successRate: 0.87,
      avgLatencyMs: 1500,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    },
    {
      role: 'plotter',
      name: 'Plotter Agent',
      description: 'Plans plots, pacing, narrative structure',
      capabilities: ['plot-planning', 'pacing-analysis', 'story-structure', 'twist-design'],
      maxConcurrentTasks: 1,
      currentLoad: 0,
      successRate: 0.83,
      avgLatencyMs: 1800,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    },
    {
      role: 'editor',
      name: 'Editor Agent',
      description: 'Edits and polishes final content',
      capabilities: ['line-editing', 'polishing', 'final-review', 'grammar-check'],
      maxConcurrentTasks: 2,
      currentLoad: 0,
      successRate: 0.95,
      avgLatencyMs: 900,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    },
    {
      role: 'researcher',
      name: 'Researcher Agent',
      description: 'Researches facts, settings, historical context',
      capabilities: ['fact-checking', 'research', 'historical accuracy', 'world-knowledge'],
      maxConcurrentTasks: 2,
      currentLoad: 0,
      successRate: 0.90,
      avgLatencyMs: 1100,
      totalTasksCompleted: 0,
      lastActiveAt: Date.now()
    }
  ]
  
  for (const agent of agents) {
    profiles.set(agent.role, agent)
  }
  
  return profiles
}

export function selectBestAgent(
  requiredRoles: AgentRole[],
  profiles: Map<string, AgentProfile>,
  tasks: Map<string, BrainTask>
): { agentId: string; score: number } | null {
  let best: { agentId: string; score: number } | null = null
  
  for (const role of requiredRoles) {
    const profile = profiles.get(role)
    if (!profile) continue
    if (profile.currentLoad >= profile.maxConcurrentTasks) continue
    
    // Calculate score: lower load + higher success + lower latency = better
    const loadScore = 1 - (profile.currentLoad / Math.max(profile.maxConcurrentTasks, 1))
    const successScore = profile.successRate
    const latencyScore = 1 - Math.min(profile.avgLatencyMs / 5000, 1)
    
    // Weighted score
    const score = loadScore * 0.4 + successScore * 0.35 + latencyScore * 0.25
    
    if (!best || score > best.score) {
      best = { agentId: role, score }
    }
  }
  
  return best
}

export function calculateBudgetOverspend(
  allocated: number,
  spent: number,
  config: BudgetConfig
): boolean {
  return spent > allocated * config.criticalThreshold
}

export function estimateTaskTokens(task: BrainTask): number {
  // Rough estimation based on task type and payload size
  const baseTokens: Record<string, number> = {
    'write-chapter': 3000,
    'write-scene': 800,
    'write-dialogue': 400,
    'review-content': 500,
    'build-world': 2000,
    'develop-character': 1500,
    'plan-plot': 1800,
    'edit-polish': 600,
    'research': 700
  }
  
  const estimated = baseTokens[task.type] || 500
  // Adjust for priority
  const multiplier = task.priority === 'critical' ? 1.5 
    : task.priority === 'high' ? 1.2 
    : 1.0
  
  return Math.min(estimated * multiplier, task.budgetTokens)
}

export function createEmptyBrainMetrics(): BrainMetrics {
  return {
    totalTasksProcessed: 0,
    tasksByStatus: {
      pending: 0, routing: 0, assigned: 0, running: 0,
      completed: 0, failed: 0, cancelled: 0
    },
    tasksByRole: {
      writer: 0, reviewer: 0, worldbuilder: 0, character: 0,
      plotter: 0, editor: 0, researcher: 0
    },
    totalTokensSpent: 0,
    agentLoadDistribution: {
      writer: 0, reviewer: 0, worldbuilder: 0, character: 0,
      plotter: 0, editor: 0, researcher: 0
    },
    averageRoutingTimeMs: 0,
    conflictsResolved: 0,
    handoffsCompleted: 0,
    budgetOverspendCount: 0
  }
}