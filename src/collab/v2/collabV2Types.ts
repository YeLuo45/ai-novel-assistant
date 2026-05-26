/**
 * Collaboration V2 Types - V60
 * Types for AgentProtocol, DynamicScheduler, CollaborationHub, WorkflowAnalyzer
 */

export type MessageType = 'task' | 'result' | 'heartbeat' | 'conflict' | 'resolve'
export type MessageStatus = 'pending' | 'delivered' | 'acknowledged' | 'failed'
export type AgentStatus = 'idle' | 'busy' | 'blocked' | 'offline'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed'
export type ConflictType = 'resource' | 'dependency' | 'data'

export interface AgentMessage {
  id: string
  from: string
  to: string
  type: MessageType
  payload: unknown
  timestamp: number
  status: MessageStatus
  retries: number
}

export interface ScheduledTask {
  id: string
  agentId: string
  priority: TaskPriority
  status: TaskStatus
  estimatedDuration: number
  actualDuration?: number
  retries: number
  maxRetries: number
  dependencies: string[]
  createdAt: number
  startedAt?: number
  completedAt?: number
}

export interface AgentState {
  id: string
  name: string
  status: AgentStatus
  currentTask?: string
  workload: number  // 0-100
  maxWorkload: number
  lastHeartbeat: number
  capabilities: string[]
}

export interface ConflictRecord {
  id: string
  type: ConflictType
  agents: string[]
  taskIds: string[]
  resolved: boolean
  resolution?: string
  detectedAt: number
  resolvedAt?: number
}

export interface WorkflowStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  queuedTasks: number
  runningTasks: number
  averageDuration: number
  bottleneckAgents: string[]
  efficiency: number  // 0-1
  totalMessages: number
  activeAgents: number
}

export interface SchedulerConfig {
  maxConcurrentTasks: number
  taskTimeout: number  // ms
  heartbeatInterval: number  // ms
  maxRetries: number
  loadBalanceThreshold: number  // 0-1
}

export interface CollaborationEvent {
  id: string
  type: 'task_created' | 'task_completed' | 'agent_busy' | 'conflict_detected' | 'conflict_resolved'
  timestamp: number
  data: unknown
}

// Agent Protocol Functions

export function createMessage(
  from: string,
  to: string,
  type: MessageType,
  payload: unknown
): AgentMessage {
  return {
    id: `${from}_${to}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    type,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0
  }
}

export function deliverMessage(msg: AgentMessage): AgentMessage {
  if (msg.status === 'pending') {
    return { ...msg, status: 'delivered' }
  }
  return msg
}

export function acknowledgeMessage(msg: AgentMessage): AgentMessage {
  return { ...msg, status: 'acknowledged' }
}

export function getMessagePriority(msg: AgentMessage): number {
  switch (msg.type) {
    case 'conflict': return 4
    case 'heartbeat': return 1
    case 'task': return 3
    case 'result': return 2
    case 'resolve': return 3
    default: return 2
  }
}

export function isMessageExpired(msg: AgentMessage, maxAge: number = 30000): boolean {
  return Date.now() - msg.timestamp > maxAge
}

export function extractMentions(text: string): string[] {
  const mentions = text.match(/@[\w]+/g) || []
  return mentions.map(m => m.slice(1))
}

// Dynamic Scheduler Functions

export function createTask(
  id: string,
  agentId: string,
  priority: TaskPriority = 'normal',
  estimatedDuration: number = 5000
): ScheduledTask {
  return {
    id,
    agentId,
    priority,
    status: 'queued',
    estimatedDuration,
    retries: 0,
    maxRetries: 3,
    dependencies: [],
    createdAt: Date.now()
  }
}

export function getTaskPriorityValue(priority: TaskPriority): number {
  switch (priority) {
    case 'urgent': return 4
    case 'high': return 3
    case 'normal': return 2
    case 'low': return 1
    default: return 2
  }
}

export function sortByPriority(tasks: ScheduledTask[]): ScheduledTask[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = getTaskPriorityValue(b.priority) - getTaskPriorityValue(a.priority)
    if (priorityDiff !== 0) return priorityDiff
    return a.createdAt - b.createdAt
  })
}

export function canAgentAcceptTask(agent: AgentState, task: ScheduledTask): boolean {
  if (agent.status === 'offline' || agent.status === 'blocked') return false
  if (agent.workload >= agent.maxWorkload) return false
  if (agent.status === 'busy' && agent.workload >= agent.maxWorkload * 0.8) return false
  return true
}

export function assignTaskToAgent(task: ScheduledTask, agent: AgentState): ScheduledTask {
  return {
    ...task,
    agentId: agent.id,
    status: 'running',
    startedAt: Date.now()
  }
}

export function completeTask(task: ScheduledTask, success: boolean): ScheduledTask {
  const now = Date.now()
  return {
    ...task,
    status: success ? 'completed' : 'failed',
    completedAt: now,
    actualDuration: task.startedAt ? now - task.startedAt : undefined
  }
}

export function shouldRetryTask(task: ScheduledTask): boolean {
  return task.retries < task.maxRetries && task.status === 'failed'
}

export function rescheduleTask(task: ScheduledTask): ScheduledTask {
  return {
    ...task,
    status: 'queued',
    retries: task.retries + 1,
    startedAt: undefined,
    completedAt: undefined
  }
}

export function getNextAvailableAgent(
  agents: AgentState[],
  task: ScheduledTask,
  config: SchedulerConfig
): AgentState | null {
  const available = agents
    .filter(a => a.status !== 'offline' && a.status !== 'blocked')
    .filter(a => a.workload < a.maxWorkload * config.loadBalanceThreshold)
    .filter(a => canAgentAcceptTask(a, task))

  if (available.length === 0) return null

  // Return agent with lowest workload
  return available.reduce((min, agent) =>
    agent.workload < min.workload ? agent : min
  )
}

export function detectWorkloadImbalance(agents: AgentState[]): string[] {
  if (agents.length < 2) return []

  const workloads = agents.map(a => a.workload)
  const avg = workloads.reduce((s, w) => s + w, 0) / workloads.length
  const threshold = avg * 0.5  // 50% deviation

  const imbalanced = agents
    .filter(a => Math.abs(a.workload - avg) > threshold)
    .map(a => a.id)

  return imbalanced
}

// Conflict Detection Functions

export function createConflict(
  type: ConflictType,
  agents: string[],
  taskIds: string[]
): ConflictRecord {
  return {
    id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    agents,
    taskIds,
    resolved: false,
    detectedAt: Date.now()
  }
}

export function resolveConflict(
  conflict: ConflictRecord,
  resolution: string
): ConflictRecord {
  return {
    ...conflict,
    resolved: true,
    resolution,
    resolvedAt: Date.now()
  }
}

export function detectResourceConflict(
  tasks: ScheduledTask[],
  resourceId: string
): ConflictRecord | null {
  const resourceTasks = tasks.filter(t =>
    t.status === 'running' &&
    t.id.includes(resourceId)
  )

  if (resourceTasks.length > 1) {
    const agentIds = resourceTasks.map(t => t.agentId)
    const seen = new Set<string>()
    const agents: string[] = []
    for (const id of agentIds) {
      if (!seen.has(id)) { seen.add(id); agents.push(id) }
    }
    if (agents.length > 1) {
      return createConflict('resource', agents, resourceTasks.map(t => t.id))
    }
  }

  return null
}

export function detectDependencyConflict(
  tasks: ScheduledTask[]
): ConflictRecord | null {
  const failedTasks = tasks.filter(t => t.status === 'failed')

  for (const failed of failedTasks) {
    const dependentTasks = tasks.filter(t =>
      t.dependencies.includes(failed.id) && t.status === 'queued'
    )

    if (dependentTasks.length > 0) {
      const depAgentIds = dependentTasks.map(t => t.agentId)
      const seen2 = new Set<string>()
      const uniqAgents: string[] = []
      for (const id of depAgentIds) {
        if (!seen2.has(id)) { seen2.add(id); uniqAgents.push(id) }
      }
      return createConflict(
        'dependency',
        uniqAgents,
        [failed.id, ...dependentTasks.map(t => t.id)]
      )
    }
  }

  return null
}

// Workflow Analysis Functions

export function calculateWorkflowStats(tasks: ScheduledTask[]): WorkflowStats {
  const completed = tasks.filter(t => t.status === 'completed')
  const failed = tasks.filter(t => t.status === 'failed')
  const queued = tasks.filter(t => t.status === 'queued')
  const running = tasks.filter(t => t.status === 'running')

  const durations = completed
    .filter(t => t.actualDuration !== undefined)
    .map(t => t.actualDuration!)

  const averageDuration = durations.length > 0
    ? durations.reduce((s, d) => s + d, 0) / durations.length
    : 0

  const agentWorkloads: Record<string, number> = {}
  for (const task of completed) {
    agentWorkloads[task.agentId] = (agentWorkloads[task.agentId] || 0) + 1
  }

  const maxCount = Math.max(...Object.values(agentWorkloads), 1)
  const bottleneckAgents = Object.entries(agentWorkloads)
    .filter(([, count]) => count >= maxCount * 0.8)
    .map(([id]) => id)

  const efficiency = tasks.length > 0
    ? completed.length / tasks.length
    : 0

  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    failedTasks: failed.length,
    queuedTasks: queued.length,
    runningTasks: running.length,
    averageDuration,
    bottleneckAgents,
    efficiency,
    totalMessages: tasks.length * 2,  // Estimate
    activeAgents: new Set(completed.map(t => t.agentId)).size
  }
}

export function detectBottleneck(stats: WorkflowStats): string | null {
  if (stats.efficiency < 0.5 && stats.failedTasks > 0) {
    return 'low_efficiency'
  }

  if (stats.bottleneckAgents.length > 0) {
    return stats.bottleneckAgents[0]
  }

  if (stats.queuedTasks > stats.runningTasks * 3) {
    return 'queue_overflow'
  }

  return null
}

export function suggestOptimization(stats: WorkflowStats): string[] {
  const suggestions: string[] = []

  if (stats.efficiency < 0.7) {
    suggestions.push('Consider increasing agent capacity or reducing task dependencies')
  }

  if (stats.bottleneckAgents.length > 0) {
    suggestions.push(`Agents ${stats.bottleneckAgents.join(', ')} are overloaded - consider adding more agents`)
  }

  if (stats.averageDuration > 30000) {
    suggestions.push('Average task duration is high - consider optimizing task拆分')
  }

  if (stats.failedTasks > stats.totalTasks * 0.1) {
    suggestions.push('Failure rate is above 10% - review task dependencies and timeouts')
  }

  return suggestions
}

export function getSystemHealth(stats: WorkflowStats): 'healthy' | 'warning' | 'critical' {
  if (stats.efficiency < 0.3 || stats.failedTasks > stats.totalTasks * 0.3) {
    return 'critical'
  }

  if (stats.efficiency < 0.6 || stats.bottleneckAgents.length > 0) {
    return 'warning'
  }

  return 'healthy'
}