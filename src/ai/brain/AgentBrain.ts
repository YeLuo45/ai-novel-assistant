/**
 * AgentBrain - V73
 * Multi-Agent Orchestration Brain - Meta-cognition system
 * 
 * Core components:
 * - TaskRouter: Routes tasks to specialized agents based on role + load
 * - BudgetManager: Tracks token budget per task and per day
 * - MessageBus: Inter-agent communication
 * - ConflictResolver: Resolves resource/goal conflicts between agents
 * - MetricsCollector: Collects brain performance metrics
 */

import type {
  AgentProfile,
  AgentRole,
  BrainTask,
  BrainDecision,
  InterAgentMessage,
  BudgetAllocation,
  BrainMetrics,
  ConflictReport,
  HandoffRequest,
  BudgetConfig,
  DailyBudget
} from './AgentBrainTypes'
import {
  DEFAULT_BUDGET_CONFIG,
  generateTaskId,
  generateMessageId,
  createDefaultAgentProfiles,
  selectBestAgent,
  calculateBudgetOverspend,
  estimateTaskTokens,
  createEmptyBrainMetrics
} from './AgentBrainTypes'

// ===============================================================================
// Events
// ===============================================================================

export type BrainEventType =
  | 'task-routed'
  | 'task-assigned'
  | 'task-completed'
  | 'task-failed'
  | 'message-sent'
  | 'message-received'
  | 'conflict-detected'
  | 'conflict-resolved'
  | 'handoff-initiated'
  | 'budget-warning'
  | 'budget-exceeded'

export interface BrainEvent {
  type: BrainEventType
  timestamp: number
  taskId?: string
  agentId?: string
  payload?: Record<string, unknown>
}

// ===============================================================================
// Task Router
// ===============================================================================

export class TaskRouter {
  private tasks: Map<string, BrainTask> = new Map()
  private eventListeners: Array<(event: BrainEvent) => void> = []

  /**
   * Submit a new task for routing
   */
  submitTask(params: {
    type: string
    priority?: BrainTask['priority']
    payload: unknown
    requiredRoles: AgentRole[]
    preferredRoles?: AgentRole[]
    budgetTokens?: number
    deadlineMs?: number
    metadata?: Record<string, unknown>
  }): BrainTask {
    const task: BrainTask = {
      id: generateTaskId(),
      type: params.type,
      priority: params.priority || 'normal',
      payload: params.payload,
      requiredRoles: params.requiredRoles,
      preferredRoles: params.preferredRoles || [],
      budgetTokens: params.budgetTokens || 5000,
      deadlineMs: params.deadlineMs || 300_000,
      createdAt: Date.now(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      metadata: params.metadata || {}
    }
    
    this.tasks.set(task.id, task)
    return task
  }

  /**
   * Route task to best available agent
   */
  routeTask(
    taskId: string,
    agentProfiles: Map<string, AgentProfile>
  ): BrainDecision | null {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'pending') return null

    task.status = 'routing'

    // Try preferred roles first, then required
    const preferredFirst = [...(task.preferredRoles || []), ...task.requiredRoles]
    const best = selectBestAgent(preferredFirst, agentProfiles, this.tasks)

    if (!best) {
      task.status = 'pending'  // Put back in queue
      return null
    }

    const selectedProfile = agentProfiles.get(best.agentId)!

    const decision: BrainDecision = {
      taskId,
      selectedAgentId: best.agentId,
      selectedRole: selectedProfile.role,
      reasoning: `Selected ${selectedProfile.name} with score ${best.score.toFixed(2)} (load: ${selectedProfile.currentLoad}/${selectedProfile.maxConcurrentTasks})`,
      confidence: best.score,
      alternativeAgents: [],
      estimatedTokens: estimateTaskTokens(task),
      estimatedLatencyMs: selectedProfile.avgLatencyMs,
      timestamp: Date.now()
    }

    // Build alternatives
    const allRoles = Array.from(new Set([...(task.preferredRoles || []), ...task.requiredRoles]))
    for (const role of allRoles) {
      if (role === selectedProfile.role) continue
      const alt = agentProfiles.get(role)
      if (!alt) continue
      if (alt.currentLoad >= alt.maxConcurrentTasks) continue
      
      const altLoadScore = 1 - (alt.currentLoad / Math.max(alt.maxConcurrentTasks, 1))
      const altScore = altLoadScore * 0.4 + alt.successRate * 0.35 + (1 - Math.min(alt.avgLatencyMs / 5000, 1)) * 0.25
      
      decision.alternativeAgents.push({
        agentId: role,
        role: alt.role,
        score: altScore
      })
    }

    // Sort alternatives by score desc
    decision.alternativeAgents.sort((a, b) => b.score - a.score)

    this.emit({
      type: 'task-routed',
      timestamp: Date.now(),
      taskId,
      agentId: best.agentId,
      payload: { decision }
    })

    return decision
  }

  /**
   * Mark task as assigned to agent
   */
  assignTask(taskId: string, agentId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'routing') return false

    task.status = 'assigned'
    task.assignedAgentId = agentId

    this.emit({
      type: 'task-assigned',
      timestamp: Date.now(),
      taskId,
      agentId
    })

    return true
  }

  /**
   * Mark task as running
   */
  startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'assigned') return false

    task.status = 'running'
    return true
  }

  /**
   * Complete a task with result
   */
  completeTask(taskId: string, result: unknown): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'running') return false

    task.status = 'completed'
    task.result = result

    this.emit({
      type: 'task-completed',
      timestamp: Date.now(),
      taskId,
      payload: { result }
    })

    return true
  }

  /**
   * Fail a task with error
   */
  failTask(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false

    task.attempts++
    task.error = error

    if (task.attempts >= task.maxAttempts) {
      task.status = 'failed'
      this.emit({
        type: 'task-failed',
        timestamp: Date.now(),
        taskId,
        payload: { error }
      })
      return false
    }

    // Retry - put back to pending
    task.status = 'pending'
    task.assignedAgentId = undefined

    return true
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    if (task.status === 'completed' || task.status === 'failed') return false

    task.status = 'cancelled'
    return true
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): BrainTask | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * Get all pending tasks
   */
  getPendingTasks(): BrainTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'pending')
  }

  /**
   * Get all tasks
   */
  getAllTasks(): BrainTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: BrainEvent) => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * Emit event
   */
  private emit(event: BrainEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// ===============================================================================
// Budget Manager
// ===============================================================================

export class BudgetManager {
  private config: BudgetConfig
  private taskAllocations: Map<string, BudgetAllocation> = new Map()
  private dailyBudgets: Map<string, DailyBudget> = new Map()
  private eventListeners: Array<(event: BrainEvent) => void> = []

  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = { ...DEFAULT_BUDGET_CONFIG, ...config }
  }

  /**
   * Get today's date string
   */
  private getDateKey(): string {
    return new Date().toISOString().slice(0, 10)
  }

  /**
   * Get or create today's budget
   */
  private getTodayBudget(): DailyBudget {
    const dateKey = this.getDateKey()
    if (!this.dailyBudgets.has(dateKey)) {
      this.dailyBudgets.set(dateKey, {
        date: dateKey,
        totalAllocated: this.config.maxTokensPerDay,
        totalSpent: 0,
        remaining: this.config.maxTokensPerDay,
        taskBreakdown: []
      })
    }
    return this.dailyBudgets.get(dateKey)!
  }

  /**
   * Allocate budget for a task
   */
  allocate(taskId: string, agentId: string, tokens: number): BudgetAllocation {
    const today = this.getTodayBudget()
    
    // Check remaining daily budget
    const canAllocate = Math.min(tokens, today.remaining)
    const overspend = tokens > canAllocate

    const allocation: BudgetAllocation = {
      taskId,
      agentId,
      allocatedTokens: canAllocate,
      spentTokens: 0,
      remainingTokens: canAllocate,
      overspend,
      priorityBoost: 0
    }

    // Add priority boost if overspending
    if (overspend) {
      allocation.priorityBoost = (tokens - canAllocate) / tokens
    }

    this.taskAllocations.set(taskId, allocation)
    
    // Update daily budget
    today.totalSpent += canAllocate
    today.remaining -= canAllocate
    today.taskBreakdown.push({ taskId, spent: canAllocate })

    if (overspend) {
      this.emit({
        type: 'budget-exceeded',
        timestamp: Date.now(),
        taskId,
        payload: { requested: tokens, allocated: canAllocate }
      })
    } else if (today.remaining / today.totalAllocated < this.config.warningThreshold) {
      this.emit({
        type: 'budget-warning',
        timestamp: Date.now(),
        payload: { remainingPercent: (today.remaining / today.totalAllocated).toFixed(2) }
      })
    }

    return allocation
  }

  /**
   * Spend tokens on a task
   */
  spend(taskId: string, tokens: number): boolean {
    const allocation = this.taskAllocations.get(taskId)
    if (!allocation) return false

    allocation.spentTokens += tokens
    allocation.remainingTokens = Math.max(0, allocation.remainingTokens - tokens)

    return true
  }

  /**
   * Get allocation for a task
   */
  getAllocation(taskId: string): BudgetAllocation | null {
    return this.taskAllocations.get(taskId) || null
  }

  /**
   * Check if task is over budget
   */
  isOverBudget(taskId: string): boolean {
    const allocation = this.taskAllocations.get(taskId)
    if (!allocation) return false
    return calculateBudgetOverspend(allocation.allocatedTokens, allocation.spentTokens, this.config)
  }

  /**
   * Get daily budget status
   */
  getDailyStatus(): { total: number; spent: number; remaining: number } {
    const today = this.getTodayBudget()
    return {
      total: today.totalAllocated,
      spent: today.totalSpent,
      remaining: today.remaining
    }
  }

  /**
   * Get remaining daily budget
   */
  getRemainingDaily(): number {
    return this.getTodayBudget().remaining
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: BrainEvent) => void): void {
    this.eventListeners.push(listener)
  }

  private emit(event: BrainEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// ===============================================================================
// Message Bus (Inter-Agent Communication)
// ===============================================================================

export class MessageBus {
  private messages: Map<string, InterAgentMessage[]> = new Map()
  private conversationIndex: Map<string, string[]> = new Map()
  private eventListeners: Array<(event: BrainEvent) => void> = []

  /**
   * Send a message from one agent to another
   */
  send(params: {
    fromAgentId: string
    fromRole: AgentRole
    toAgentId: string
    toRole: AgentRole | 'broadcast'
    type: InterAgentMessage['type']
    payload: unknown
    conversationId?: string
    replyTo?: string
  }): InterAgentMessage {
    const convId = params.conversationId || `conv_${Date.now()}`

    const message: InterAgentMessage = {
      id: generateMessageId(),
      fromAgentId: params.fromAgentId,
      fromRole: params.fromRole,
      toAgentId: params.toAgentId,
      toRole: params.toRole,
      type: params.type,
      payload: params.payload,
      conversationId: convId,
      replyTo: params.replyTo,
      timestamp: Date.now()
    }

    // Store message
    if (!this.messages.has(convId)) {
      this.messages.set(convId, [])
    }
    this.messages.get(convId)!.push(message)

    // Index conversation
    if (!this.conversationIndex.has(convId)) {
      this.conversationIndex.set(convId, [])
    }
    this.conversationIndex.get(convId)!.push(message.id)

    this.emit({
      type: 'message-sent',
      timestamp: Date.now(),
      agentId: params.fromAgentId,
      payload: { messageId: message.id, convId }
    })

    return message
  }

  /**
   * Get messages for a conversation
   */
  getMessages(conversationId: string): InterAgentMessage[] {
    return this.messages.get(conversationId) || []
  }

  /**
   * Get messages sent to a specific agent
   */
  getMessagesForAgent(agentId: string): InterAgentMessage[] {
    const result: InterAgentMessage[] = []
    for (const msgs of Array.from(this.messages.values())) {
      for (const msg of msgs) {
        if (msg.toAgentId === agentId || msg.toRole === 'broadcast') {
          result.push(msg)
        }
      }
    }
    return result
  }

  /**
   * Get message by ID
   */
  getMessage(messageId: string): InterAgentMessage | null {
    for (const msgs of Array.from(this.messages.values())) {
      for (const msg of msgs) {
        if (msg.id === messageId) return msg
      }
    }
    return null
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: BrainEvent) => void): void {
    this.eventListeners.push(listener)
  }

  private emit(event: BrainEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// ===============================================================================
// Conflict Resolver
// ===============================================================================

export class ConflictResolver {
  private conflicts: Map<string, ConflictReport> = new Map()
  private eventListeners: Array<(event: BrainEvent) => void> = []

  /**
   * Detect conflict between two tasks (same resource)
   */
  detectConflict(taskA: BrainTask, taskB: BrainTask): boolean {
    // Same entity target
    const entityA = taskA.metadata?.entityId as string | undefined
    const entityB = taskB.metadata?.entityId as string | undefined
    
    if (entityA && entityB && entityA === entityB) return true
    
    // Same type + overlapping deadline
    if (taskA.type === taskB.type) {
      const deadlineA = taskA.createdAt + taskA.deadlineMs
      const deadlineB = taskB.createdAt + taskB.deadlineMs
      if (Math.abs(deadlineA - deadlineB) < 60_000) return true
    }
    
    return false
  }

  /**
   * Resolve a detected conflict
   */
  resolve(
    taskA: BrainTask,
    taskB: BrainTask,
    agentProfiles: Map<string, AgentProfile>
  ): { winner: BrainTask; loser: BrainTask; reason: string } {
    // Priority wins first
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 }
    
    const priorityDiff = priorityOrder[taskA.priority] - priorityOrder[taskB.priority]
    
    let winner: BrainTask
    let loser: BrainTask
    let reason: string
    
    if (priorityDiff < 0) {
      winner = taskA
      loser = taskB
      reason = `Priority: ${taskA.priority} > ${taskB.priority}`
    } else if (priorityDiff > 0) {
      winner = taskB
      loser = taskA
      reason = `Priority: ${taskB.priority} > ${taskA.priority}`
    } else {
      // Equal priority - use success rate of assigned agent
      const profileA = agentProfiles.get(taskA.assignedAgentId || '')
      const profileB = agentProfiles.get(taskB.assignedAgentId || '')
      
      if (profileA && profileB) {
        if (profileA.successRate >= profileB.successRate) {
          winner = taskA
          loser = taskB
          reason = `Success rate: ${profileA.successRate.toFixed(2)} >= ${profileB.successRate.toFixed(2)}`
        } else {
          winner = taskB
          loser = taskA
          reason = `Success rate: ${profileB.successRate.toFixed(2)} > ${profileA.successRate.toFixed(2)}`
        }
      } else {
        // Fall back to creation time
        if (taskA.createdAt <= taskB.createdAt) {
          winner = taskA
          loser = taskB
          reason = 'Earlier creation time'
        } else {
          winner = taskB
          loser = taskA
          reason = 'Earlier creation time'
        }
      }
    }

    // Record conflict
    const report: ConflictReport = {
      taskId: `${winner.id}+${loser.id}`,
      conflictType: 'resource',
      involvedAgents: [winner.assignedAgentId as AgentRole, loser.assignedAgentId as AgentRole],
      description: `Tasks ${winner.id} and ${loser.id} conflicted on resource`,
      resolution: `Winner: ${winner.id} (${reason})`,
      timestamp: Date.now()
    }
    
    this.conflicts.set(report.taskId, report)

    this.emit({
      type: 'conflict-resolved',
      timestamp: Date.now(),
      taskId: winner.id,
      payload: { winner: winner.id, loser: loser.id, reason }
    })

    return { winner, loser, reason }
  }

  /**
   * Get all resolved conflicts
   */
  getConflicts(): ConflictReport[] {
    return Array.from(this.conflicts.values())
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: BrainEvent) => void): void {
    this.eventListeners.push(listener)
  }

  private emit(event: BrainEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// ===============================================================================
// Metrics Collector
// ===============================================================================

export class MetricsCollector {
  private metrics: BrainMetrics = createEmptyBrainMetrics()
  private routingTimes: number[] = []

  /**
   * Record a routing decision
   */
  recordRouting(timeMs: number): void {
    this.routingTimes.push(timeMs)
    
    // Keep last 100 routing times
    if (this.routingTimes.length > 100) {
      this.routingTimes.shift()
    }
  }

  /**
   * Record task status change
   */
  recordTaskStatus(task: BrainTask): void {
    this.metrics.totalTasksProcessed++
    if (this.metrics.tasksByStatus[task.status] !== undefined) {
      this.metrics.tasksByStatus[task.status]++
    }
    if (task.assignedAgentId) {
      const role = task.assignedAgentId as AgentRole
      if (this.metrics.tasksByRole[role] !== undefined) {
        this.metrics.tasksByRole[role]++
      }
    }
  }

  /**
   * Record token spend
   */
  recordTokens(tokens: number): void {
    this.metrics.totalTokensSpent += tokens
  }

  /**
   * Record agent load
   */
  recordAgentLoad(role: AgentRole, load: number): void {
    this.metrics.agentLoadDistribution[role] = load
  }

  /**
   * Record handoff
   */
  recordHandoff(): void {
    this.metrics.handoffsCompleted++
  }

  /**
   * Record conflict resolution
   */
  recordConflict(): void {
    this.metrics.conflictsResolved++
  }

  /**
   * Record budget overspend
   */
  recordOverspend(): void {
    this.metrics.budgetOverspendCount++
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): BrainMetrics {
    // Update average routing time
    if (this.routingTimes.length > 0) {
      const sum = this.routingTimes.reduce((a, b) => a + b, 0)
      this.metrics.averageRoutingTimeMs = sum / this.routingTimes.length
    }
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = createEmptyBrainMetrics()
    this.routingTimes = []
  }
}

// ===============================================================================
// Main AgentBrain (Facade)
// ===============================================================================

export class AgentBrain {
  readonly router: TaskRouter
  readonly budget: BudgetManager
  readonly messageBus: MessageBus
  readonly conflicts: ConflictResolver
  readonly metrics: MetricsCollector

  private agentProfiles: Map<string, AgentProfile>
  private eventListeners: Array<(event: BrainEvent) => void> = []

  constructor() {
    this.router = new TaskRouter()
    this.budget = new BudgetManager()
    this.messageBus = new MessageBus()
    this.conflicts = new ConflictResolver()
    this.metrics = new MetricsCollector()
    this.agentProfiles = createDefaultAgentProfiles()

    // Wire up event propagation
    const propagate = (e: BrainEvent) => this.emit(e)
    this.router.addListener(propagate)
    this.budget.addListener(propagate)
    this.messageBus.addListener(propagate)
    this.conflicts.addListener(propagate)
  }

  /**
   * Register or update an agent profile
   */
  registerAgent(profile: AgentProfile): void {
    this.agentProfiles.set(profile.role, profile)
  }

  /**
   * Get agent profile by role
   */
  getAgent(role: AgentRole): AgentProfile | undefined {
    return this.agentProfiles.get(role)
  }

  /**
   * Get all agent profiles
   */
  getAllAgents(): AgentProfile[] {
    return Array.from(this.agentProfiles.values())
  }

  /**
   * Update agent load
   */
  updateAgentLoad(role: AgentRole, load: number): void {
    const profile = this.agentProfiles.get(role)
    if (profile) {
      profile.currentLoad = load
      this.metrics.recordAgentLoad(role, load)
    }
  }

  /**
   * Submit and route a new task
   */
  submitAndRoute(params: {
    type: string
    priority?: BrainTask['priority']
    payload: unknown
    requiredRoles: AgentRole[]
    preferredRoles?: AgentRole[]
    budgetTokens?: number
    deadlineMs?: number
  }): { task: BrainTask; decision: BrainDecision | null } {
    const startTime = Date.now()
    const task = this.router.submitTask(params)
    const decision = this.router.routeTask(task.id, this.agentProfiles)

    this.metrics.recordRouting(Date.now() - startTime)

    if (decision) {
      // Allocate budget
      const tokens = decision.estimatedTokens
      this.budget.allocate(task.id, decision.selectedAgentId, tokens)
      
      // Assign task
      this.router.assignTask(task.id, decision.selectedAgentId)
      
      // Update agent load
      const profile = this.agentProfiles.get(decision.selectedAgentId)
      if (profile) {
        profile.currentLoad++
        profile.lastActiveAt = Date.now()
      }

      this.metrics.recordTaskStatus(task)
    }

    return { task, decision }
  }

  /**
   * Handle task completion
   */
  handleCompletion(taskId: string, result: unknown): void {
    this.router.completeTask(taskId, result)
    
    const task = this.router.getTask(taskId)
    if (task?.assignedAgentId) {
      const profile = this.agentProfiles.get(task.assignedAgentId)
      if (profile && profile.currentLoad > 0) {
        profile.currentLoad--
        profile.totalTasksCompleted++
      }
    }
  }

  /**
   * Handle task failure
   */
  handleFailure(taskId: string, error: string): boolean {
    const retryable = this.router.failTask(taskId, error)
    
    if (!retryable) {
      // Mark agent load decrease
      const task = this.router.getTask(taskId)
      if (task?.assignedAgentId) {
        const profile = this.agentProfiles.get(task.assignedAgentId)
        if (profile && profile.currentLoad > 0) {
          profile.currentLoad--
        }
      }
    }
    
    return retryable
  }

  /**
   * Send message between agents
   */
  sendMessage(params: {
    fromRole: AgentRole
    toRole: AgentRole | 'broadcast'
    type: InterAgentMessage['type']
    payload: unknown
    conversationId?: string
  }): InterAgentMessage {
    const fromProfile = Array.from(this.agentProfiles.values()).find(p => p.role === params.fromRole)
    
    return this.messageBus.send({
      fromAgentId: fromProfile?.name || params.fromRole,
      fromRole: params.fromRole,
      toAgentId: params.toRole === 'broadcast' ? 'broadcast' : params.toRole,
      toRole: params.toRole,
      type: params.type,
      payload: params.payload,
      conversationId: params.conversationId
    })
  }

  /**
   * Initiate handoff from one agent to another
   */
  initiateHandoff(params: {
    taskId: string
    fromRole: AgentRole
    toRole: AgentRole
    reason: string
    context: unknown
  }): HandoffRequest {
    const task = this.router.getTask(params.taskId)
    
    // Update from agent load
    const fromProfile = this.agentProfiles.get(params.fromRole)
    if (fromProfile && fromProfile.currentLoad > 0) {
      fromProfile.currentLoad--
    }
    
    // Assign to new agent
    const toProfile = this.agentProfiles.get(params.toRole)
    if (toProfile) {
      toProfile.currentLoad++
      toProfile.lastActiveAt = Date.now()
    }

    this.metrics.recordHandoff()

    return {
      taskId: params.taskId,
      fromAgentId: fromProfile?.name || params.fromRole,
      fromRole: params.fromRole,
      toRole: params.toRole,
      reason: params.reason,
      context: params.context,
      priority: task?.priority || 'normal'
    }
  }

  /**
   * Get brain status summary
   */
  getStatus(): Record<string, unknown> {
    return {
      totalAgents: this.agentProfiles.size,
      agentLoads: Array.from(this.agentProfiles.values()).map(p => ({
        role: p.role,
        name: p.name,
        currentLoad: p.currentLoad,
        maxConcurrentTasks: p.maxConcurrentTasks,
        successRate: p.successRate
      })),
      pendingTasks: this.router.getPendingTasks().length,
      totalTasks: this.router.getAllTasks().length,
      dailyBudget: this.budget.getDailyStatus(),
      metrics: this.metrics.getMetrics()
    }
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: BrainEvent) => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * Emit event
   */
  private emit(event: BrainEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// Export singleton
export const agentBrain = new AgentBrain()