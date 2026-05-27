/**
 * Collaboration V3 Types - V65
 * Types for CollaborationHubV3, WorkflowEngineV2, TaskSchedulerV2, WritingHeatmap
 */

// CollaborationHubV3
export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface AgentState {
  id: string
  name: string
  role: string
  status: 'idle' | 'busy' | 'blocked' | 'offline'
  workload: number  // 0-100
  skills: string[]
  currentTask?: string
  lastActive: number
}

export interface Message {
  id: string
  from: string
  to: string
  type: 'task' | 'result' | 'heartbeat' | 'conflict' | 'resolve'
  payload: unknown
  priority: 'low' | 'normal' | 'high' | 'critical'
  timestamp: number
  delivered: boolean
}

export interface CollaborationSession {
  id: string
  agents: AgentState[]
  activeTasks: ScheduledTask[]
  messages: Message[]
  startTime: number
  lastUpdate: number
  status: SessionStatus
}

export interface ScheduledTask {
  id: string
  agentId: string
  type: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  input: unknown
  output?: unknown
  createdAt: number
  startedAt?: number
  completedAt?: number
}

// WorkflowEngineV2
export type NodeType = 'agent' | 'checkpoint' | 'merge' | 'split' | 'start' | 'end'

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  config: AgentConfig
  inputs: string[]
  outputs: string[]
  position: { x: number; y: number }
  status: 'idle' | 'running' | 'completed' | 'blocked' | 'error'
}

export interface AgentConfig {
  agentId: string
  maxConcurrency: number
  timeout: number
  retryPolicy?: RetryPolicy
}

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
}

export interface WorkflowEdge {
  id: string
  from: string
  to: string
  condition?: string
  status: 'pending' | 'active' | 'completed' | 'blocked'
}

export interface Workflow {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  status: 'draft' | 'running' | 'paused' | 'completed'
  createdAt: number
  startedAt?: number
}

// TaskSchedulerV2
export interface TaskAssignment {
  taskId: string
  agentId: string
  score: number
  reason: string
}

export interface AgentMetrics {
  agentId: string
  tasksCompleted: number
  avgTaskDuration: number
  currentWorkload: number
  skills: string[]
  successRate: number
}

export interface LoadBalancingResult {
  agentId: string
  load: number
  delta: number  // change in load
}

// WritingHeatmap
export interface HeatmapCell {
  row: number
  col: number
  intensity: number  // 0-100
  label?: string
  tooltip?: string
}

export interface HeatmapConfig {
  rows: number
  cols: number
  title: string
  colorScale: 'red' | 'blue' | 'green' | 'purple'
}

// CollaborationHubV3 Functions

export function createSession(agents: AgentState[]): CollaborationSession {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    agents,
    activeTasks: [],
    messages: [],
    startTime: Date.now(),
    lastUpdate: Date.now(),
    status: 'active'
  }
}

export function updateSessionStatus(session: CollaborationSession, status: SessionStatus): CollaborationSession {
  return { ...session, status, lastUpdate: Date.now() }
}

export function addMessage(session: CollaborationSession, message: Message): CollaborationSession {
  return {
    ...session,
    messages: [...session.messages, message],
    lastUpdate: Date.now()
  }
}

export function createMessage(
  from: string,
  to: string,
  type: Message['type'],
  payload: unknown,
  priority: Message['priority'] = 'normal'
): Message {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    from,
    to,
    type,
    payload,
    priority,
    timestamp: Date.now(),
    delivered: false
  }
}

export function deliverMessage(session: CollaborationSession, messageId: string): CollaborationSession {
  const messages = session.messages.map(m =>
    m.id === messageId ? { ...m, delivered: true } : m
  )
  return { ...session, messages, lastUpdate: Date.now() }
}

export function broadcastMessage(session: CollaborationSession, message: Message, targetRoles?: string[]): CollaborationSession {
  const targets = targetRoles
    ? session.agents.filter(a => targetRoles.includes(a.role)).map(a => a.id)
    : session.agents.map(a => a.id)

  const newMessages = targets.map(targetId =>
    createMessage(message.from, targetId, message.type, message.payload, message.priority)
  )

  return {
    ...session,
    messages: [...session.messages, ...newMessages],
    lastUpdate: Date.now()
  }
}

export function getUndiveredMessages(session: CollaborationSession, agentId: string): Message[] {
  return session.messages.filter(m => m.to === agentId && !m.delivered)
}

export function prioritizeMessages(messages: Message[]): Message[] {
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
  return [...messages].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

export function countMessagesByType(session: CollaborationSession): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const msg of session.messages) {
    counts[msg.type] = (counts[msg.type] || 0) + 1
  }
  return counts
}

// WorkflowEngineV2 Functions

export function createWorkflow(name: string): Workflow {
  return {
    id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    nodes: [],
    edges: [],
    status: 'draft',
    createdAt: Date.now()
  }
}

export function addNode(workflow: Workflow, node: WorkflowNode): Workflow {
  return { ...workflow, nodes: [...workflow.nodes, node] }
}

export function removeNode(workflow: Workflow, nodeId: string): Workflow {
  return {
    ...workflow,
    nodes: workflow.nodes.filter(n => n.id !== nodeId),
    edges: workflow.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
  }
}

export function connectNodes(workflow: Workflow, fromId: string, toId: string, condition?: string): Workflow {
  const edge: WorkflowEdge = {
    id: `edge_${Date.now()}`,
    from: fromId,
    to: toId,
    condition,
    status: 'pending'
  }
  return { ...workflow, edges: [...workflow.edges, edge] }
}

export function updateNodeStatus(workflow: Workflow, nodeId: string, status: WorkflowNode['status']): Workflow {
  const nodes = workflow.nodes.map(n =>
    n.id === nodeId ? { ...n, status } : n
  )
  return { ...workflow, nodes }
}

export function detectCycle(workflow: Workflow): boolean {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(nodeId: string): boolean {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const outgoing = workflow.edges.filter(e => e.from === nodeId)
    for (const edge of outgoing) {
      if (!visited.has(edge.to)) {
        if (dfs(edge.to)) return true
      } else if (recursionStack.has(edge.to)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true
    }
  }

  return false
}

export function topologicalSort(workflow: Workflow): string[] | null {
  if (detectCycle(workflow)) return null

  const inDegree: Record<string, number> = {}
  for (const node of workflow.nodes) {
    inDegree[node.id] = 0
  }

  for (const edge of workflow.edges) {
    inDegree[edge.to] = (inDegree[edge.to] || 0) + 1
  }

  const queue: string[] = workflow.nodes.filter(n => inDegree[n.id] === 0).map(n => n.id)
  const sorted: string[] = []

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    sorted.push(nodeId)

    const outgoing = workflow.edges.filter(e => e.from === nodeId)
    for (const edge of outgoing) {
      inDegree[edge.to]--
      if (inDegree[edge.to] === 0) {
        queue.push(edge.to)
      }
    }
  }

  return sorted.length === workflow.nodes.length ? sorted : null
}

export function getActivePath(workflow: Workflow): string[] {
  const activeNodes = workflow.nodes.filter(n => n.status === 'running' || n.status === 'idle')
  return topologicalSort({ ...workflow, nodes: activeNodes }) || []
}

// TaskSchedulerV2 Functions

export function calculateAgentScore(
  agent: AgentState,
  metrics: AgentMetrics,
  task: ScheduledTask
): number {
  // Skill match: 0-40 points
  const skillMatch = task.type && agent.skills.includes(task.type) ? 40 : 0

  // Availability: 0-30 points (lower workload = higher score)
  const availability = Math.max(0, 30 - agent.workload)

  // Performance: 0-20 points (based on success rate)
  const performance = metrics.successRate * 0.2

  // Recency: 0-10 points (more recently active = higher)
  const hoursSinceActive = (Date.now() - agent.lastActive) / 3600000
  const recency = Math.max(0, 10 - hoursSinceActive)

  return skillMatch + availability + performance + recency
}

export function assignTask(
  task: ScheduledTask,
  agents: AgentState[],
  metrics: Record<string, AgentMetrics>
): TaskAssignment | null {
  let bestAgent: AgentState | null = null
  let bestScore = -1

  for (const agent of agents) {
    if (agent.status === 'offline' || agent.status === 'blocked') continue

    const agentMetrics = metrics[agent.id] || {
      agentId: agent.id,
      tasksCompleted: 0,
      avgTaskDuration: 0,
      currentWorkload: 0,
      skills: [],
      successRate: 0.5
    }

    const score = calculateAgentScore(agent, agentMetrics, task)
    if (score > bestScore) {
      bestScore = score
      bestAgent = agent
    }
  }

  if (!bestAgent) return null

  const reason = bestAgent.skills.includes(task.type || '')
    ? 'skill_match' : 'availability'

  return {
    taskId: task.id,
    agentId: bestAgent.id,
    score: bestScore,
    reason
  }
}

export function rebalanceLoad(agents: AgentState[], metrics: Record<string, AgentMetrics>): LoadBalancingResult[] {
  const results: LoadBalancingResult[] = []

  for (const agent of agents) {
    const agentMetrics = metrics[agent.id]
    if (!agentMetrics) continue

    const load = agentMetrics.currentWorkload
    results.push({
      agentId: agent.id,
      load,
      delta: load > 80 ? -10 : load < 20 ? 5 : 0
    })
  }

  return results.sort((a, b) => b.load - a.load)
}

export function findIdleAgents(agents: AgentState[]): AgentState[] {
  return agents.filter(a => a.status === 'idle' && a.workload < 50)
}

export function getTaskQueueLength(agents: AgentState[]): Record<string, number> {
  const queue: Record<string, number> = {}
  for (const agent of agents) {
    queue[agent.id] = 0
  }
  return queue
}

// WritingHeatmap Functions

export function createHeatmap(rows: number, cols: number, title: string): HeatmapConfig {
  return {
    rows,
    cols,
    title,
    colorScale: 'red'
  }
}

export function calculateCellIntensity(
  row: number,
  col: number,
  sessions: CollaborationSession[]
): number {
  let totalActivity = 0

  for (const session of sessions) {
    // Count messages in this cell region
    const cellMessages = session.messages.filter(m => {
      const msgTime = new Date(m.timestamp)
      // Simplified: just use row/col as time buckets
      return msgTime.getHours() % 24 === row
    })
    totalActivity += cellMessages.length
  }

  return Math.min(100, totalActivity)
}

export function generateHeatmapData(
  rows: number,
  cols: number,
  sessions: CollaborationSession[]
): HeatmapCell[] {
  const cells: HeatmapCell[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        row,
        col,
        intensity: calculateCellIntensity(row, col, sessions)
      })
    }
  }

  return cells
}

export function findHotspots(cells: HeatmapCell[], threshold = 70): HeatmapCell[] {
  return cells.filter(c => c.intensity >= threshold)
}

export function getIntensityColor(intensity: number, scale: HeatmapConfig['colorScale']): string {
  const colors = {
    red: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
    blue: ['#eff3ff', '#bdd7e7', '#6baed6', '#2171b5', '#08519c'],
    green: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'],
    purple: ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f']
  }

  const scaleColors = colors[scale]
  const index = Math.min(scaleColors.length - 1, Math.floor(intensity / 25))
  return scaleColors[index]
}

// Utility Functions

export function getSessionDuration(session: CollaborationSession): number {
  return Date.now() - session.startTime
}

export function getActiveAgentCount(session: CollaborationSession): number {
  return session.agents.filter(a => a.status !== 'offline').length
}

export function calculateThroughput(session: CollaborationSession): number {
  const durationHours = getSessionDuration(session) / 3600000
  if (durationHours === 0) return 0

  const completedTasks = session.activeTasks.filter(t => t.status === 'completed').length
  return completedTasks / durationHours
}

export function isSessionStalled(session: CollaborationSession, thresholdMs = 300000): boolean {
  return Date.now() - session.lastUpdate > thresholdMs
}

export function getBlockedAgents(session: CollaborationSession): AgentState[] {
  return session.agents.filter(a => a.status === 'blocked')
}

export function unblockAgent(agent: AgentState): AgentState {
  return { ...agent, status: 'idle' }
}