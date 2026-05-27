/**
 * AgentBrain Tests - V73
 * Tests for Multi-Agent Orchestration Brain
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { AgentRole, BrainTask, BrainMetrics } from './AgentBrainTypes'
import {
  // Types
  type AgentProfile,
  type BrainDecision,
  type InterAgentMessage,
  type BudgetAllocation,
  type ConflictReport,
  type HandoffRequest,
  type BudgetConfig,
  // Functions
  createDefaultAgentProfiles,
  generateTaskId,
  generateMessageId,
  selectBestAgent,
  calculateBudgetOverspend,
  estimateTaskTokens,
  createEmptyBrainMetrics,
  DEFAULT_BUDGET_CONFIG
} from './AgentBrainTypes'

import {
  AgentBrain,
  TaskRouter,
  BudgetManager,
  MessageBus,
  ConflictResolver,
  MetricsCollector
} from './AgentBrain'

// ===============================================================================
// AgentBrainTypes Tests
// ===============================================================================

describe('AgentBrainTypes', () => {
  describe('generateTaskId', () => {
    it('should generate unique task IDs', () => {
      const id1 = generateTaskId()
      const id2 = generateTaskId()
      expect(id1).toMatch(/^brain_task_/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('generateMessageId', () => {
    it('should generate unique message IDs', () => {
      const id1 = generateMessageId()
      const id2 = generateMessageId()
      expect(id1).toMatch(/^msg_/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('createDefaultAgentProfiles', () => {
    it('should create 7 agent profiles', () => {
      const profiles = createDefaultAgentProfiles()
      expect(profiles.size).toBe(7)
    })

    it('should include writer, reviewer, worldbuilder, character, plotter, editor, researcher', () => {
      const profiles = createDefaultAgentProfiles()
      const roles: AgentRole[] = ['writer', 'reviewer', 'worldbuilder', 'character', 'plotter', 'editor', 'researcher']
      for (const role of roles) {
        expect(profiles.has(role)).toBe(true)
      }
    })

    it('should have valid profiles with capabilities', () => {
      const profiles = createDefaultAgentProfiles()
      for (const profile of profiles.values()) {
        expect(profile.role).toBeDefined()
        expect(profile.name).toBeDefined()
        expect(Array.isArray(profile.capabilities)).toBe(true)
        expect(profile.maxConcurrentTasks).toBeGreaterThan(0)
        expect(profile.successRate).toBeGreaterThan(0)
        expect(profile.successRate).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('selectBestAgent', () => {
    it('should return null for empty profiles', () => {
      const profiles = new Map()
      const tasks = new Map()
      const result = selectBestAgent(['writer'], profiles, tasks)
      expect(result).toBeNull()
    })

    it('should skip if load >= max', () => {
      const profiles = createDefaultAgentProfiles()
      const writer = profiles.get('writer')!
      writer.currentLoad = writer.maxConcurrentTasks  // Maxed out
      
      const tasks = new Map()
      const result = selectBestAgent(['writer'], profiles, tasks)
      expect(result).toBeNull()
    })

    it('should select idle agent over busy', () => {
      const profiles = createDefaultAgentProfiles()
      const writer = profiles.get('writer')!
      const reviewer = profiles.get('reviewer')!
      writer.currentLoad = 0
      reviewer.currentLoad = 2
      
      const tasks = new Map()
      const result = selectBestAgent(['writer', 'reviewer'], profiles, tasks)
      expect(result?.agentId).toBe('writer')
    })

    it('should pick highest score', () => {
      const profiles = createDefaultAgentProfiles()
      
      const tasks = new Map()
      const result = selectBestAgent(['writer', 'editor'], profiles, tasks)
      expect(result).not.toBeNull()
      expect(['writer', 'editor']).toContain(result!.agentId)
    })
  })

  describe('calculateBudgetOverspend', () => {
    it('should return false when under threshold', () => {
      expect(calculateBudgetOverspend(1000, 800, DEFAULT_BUDGET_CONFIG)).toBe(false)
    })

    it('should return true when over critical threshold', () => {
      expect(calculateBudgetOverspend(1000, 950, DEFAULT_BUDGET_CONFIG)).toBe(true)
    })
  })

  describe('estimateTaskTokens', () => {
    it('should estimate write-chapter', () => {
      const task = createBrainTask({ type: 'write-chapter' })
      expect(estimateTaskTokens(task)).toBe(3000)
    })

    it('should estimate review-content', () => {
      const task = createBrainTask({ type: 'review-content' })
      expect(estimateTaskTokens(task)).toBe(500)
    })

    it('should apply critical priority multiplier', () => {
      const task = createBrainTask({ type: 'write-chapter', priority: 'critical' })
      expect(estimateTaskTokens(task)).toBe(4500)  // 3000 * 1.5
    })

    it('should fallback to 500 for unknown type', () => {
      const task = createBrainTask({ type: 'unknown-type' })
      expect(estimateTaskTokens(task)).toBe(500)
    })
  })

  describe('createEmptyBrainMetrics', () => {
    it('should have all task status counts at zero', () => {
      const metrics = createEmptyBrainMetrics()
      const statuses = ['pending', 'routing', 'assigned', 'running', 'completed', 'failed', 'cancelled']
      for (const status of statuses) {
        expect(metrics.tasksByStatus[status as keyof typeof metrics.tasksByStatus]).toBe(0)
      }
    })

    it('should have all role counts at zero', () => {
      const metrics = createEmptyBrainMetrics()
      const roles: AgentRole[] = ['writer', 'reviewer', 'worldbuilder', 'character', 'plotter', 'editor', 'researcher']
      for (const role of roles) {
        expect(metrics.tasksByRole[role]).toBe(0)
        expect(metrics.agentLoadDistribution[role]).toBe(0)
      }
    })
  })
})

// ===============================================================================
// TaskRouter Tests
// ===============================================================================

describe('TaskRouter', () => {
  let router: TaskRouter

  beforeEach(() => {
    router = new TaskRouter()
  })

  describe('submitTask', () => {
    it('should create task with auto-generated ID', () => {
      const task = router.submitTask({
        type: 'write-chapter',
        payload: { chapterId: 'ch_1' },
        requiredRoles: ['writer']
      })
      
      expect(task.id).toMatch(/^brain_task_/)
      expect(task.type).toBe('write-chapter')
      expect(task.status).toBe('pending')
      expect(task.priority).toBe('normal')
    })

    it('should set custom priority', () => {
      const task = router.submitTask({
        type: 'write-chapter',
        payload: {},
        requiredRoles: ['writer'],
        priority: 'critical'
      })
      
      expect(task.priority).toBe('critical')
    })

    it('should set deadline and budget', () => {
      const task = router.submitTask({
        type: 'write-chapter',
        payload: {},
        requiredRoles: ['writer'],
        budgetTokens: 10000,
        deadlineMs: 600000
      })
      
      expect(task.budgetTokens).toBe(10000)
      expect(task.deadlineMs).toBe(600000)
    })
  })

  describe('routeTask', () => {
    it('should route to best available agent', () => {
      const profiles = createDefaultAgentProfiles()
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      
      const decision = router.routeTask(task.id, profiles)
      
      expect(decision).not.toBeNull()
      expect(decision!.selectedAgentId).toBe('writer')
      expect(decision!.taskId).toBe(task.id)
    })

    it('should return null for non-existent task', () => {
      const profiles = createDefaultAgentProfiles()
      const result = router.routeTask('nonexistent', profiles)
      expect(result).toBeNull()
    })
  })

  describe('assignTask', () => {
    it('should assign routed task', () => {
      const profiles = createDefaultAgentProfiles()
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      router.routeTask(task.id, profiles)
      
      const result = router.assignTask(task.id, 'writer')
      
      expect(result).toBe(true)
      expect(router.getTask(task.id)?.status).toBe('assigned')
    })
  })

  describe('completeTask', () => {
    it('should complete running task', () => {
      const profiles = createDefaultAgentProfiles()
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      router.routeTask(task.id, profiles)
      router.assignTask(task.id, 'writer')
      router.startTask(task.id)
      
      const result = router.completeTask(task.id, { output: 'done' })
      
      expect(result).toBe(true)
      expect(router.getTask(task.id)?.status).toBe('completed')
      expect(router.getTask(task.id)?.result).toEqual({ output: 'done' })
    })
  })

  describe('failTask', () => {
    it('should retry when attempts < max', () => {
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      router.routeTask(task.id, createDefaultAgentProfiles())
      router.assignTask(task.id, 'writer')
      router.startTask(task.id)
      
      const result = router.failTask(task.id, 'error')
      
      expect(result).toBe(true)  // Can retry
      expect(router.getTask(task.id)?.attempts).toBe(1)
    })

    it('should mark failed when max attempts reached', () => {
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      task.maxAttempts = 1
      router.routeTask(task.id, createDefaultAgentProfiles())
      router.assignTask(task.id, 'writer')
      router.startTask(task.id)
      
      router.failTask(task.id, 'error')
      router.startTask(task.id)
      const result = router.failTask(task.id, 'error')
      
      expect(result).toBe(false)
      expect(router.getTask(task.id)?.status).toBe('failed')
    })
  })

  describe('cancelTask', () => {
    it('should cancel pending task', () => {
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      
      const result = router.cancelTask(task.id)
      
      expect(result).toBe(true)
      expect(router.getTask(task.id)?.status).toBe('cancelled')
    })

    it('should not cancel completed task', () => {
      const task = router.submitTask({ type: 'write-chapter', payload: {}, requiredRoles: ['writer'] })
      router.routeTask(task.id, createDefaultAgentProfiles())
      router.assignTask(task.id, 'writer')
      router.startTask(task.id)
      router.completeTask(task.id, {})
      
      const result = router.cancelTask(task.id)
      
      expect(result).toBe(false)
    })
  })
})

// ===============================================================================
// BudgetManager Tests
// ===============================================================================

describe('BudgetManager', () => {
  let budget: BudgetManager

  beforeEach(() => {
    budget = new BudgetManager()
  })

  describe('allocate', () => {
    it('should allocate budget', () => {
      const result = budget.allocate('task_1', 'writer', 1000)
      
      expect(result.taskId).toBe('task_1')
      expect(result.allocatedTokens).toBe(1000)
      expect(result.remainingTokens).toBe(1000)
      expect(result.overspend).toBe(false)
    })

    it('should detect overspend', () => {
      const result = budget.allocate('task_1', 'writer', 60000)  // More than daily total
      
      expect(result.overspend).toBe(true)
      expect(result.allocatedTokens).toBeLessThan(60000)
    })
  })

  describe('spend', () => {
    it('should track spending', () => {
      budget.allocate('task_1', 'writer', 1000)
      
      const result = budget.spend('task_1', 300)
      
      expect(result).toBe(true)
      const alloc = budget.getAllocation('task_1')
      expect(alloc?.spentTokens).toBe(300)
      expect(alloc?.remainingTokens).toBe(700)
    })

    it('should reject unknown task', () => {
      const result = budget.spend('nonexistent', 100)
      expect(result).toBe(false)
    })
  })

  describe('isOverBudget', () => {
    it('should return false for normal allocation', () => {
      budget.allocate('task_1', 'writer', 1000)
      budget.spend('task_1', 500)
      
      expect(budget.isOverBudget('task_1')).toBe(false)
    })

    it('should return true when over critical threshold', () => {
      budget.allocate('task_1', 'writer', 1000)
      budget.spend('task_1', 950)  // 95% > 90% threshold
      
      expect(budget.isOverBudget('task_1')).toBe(true)
    })
  })

  describe('getDailyStatus', () => {
    it('should return daily totals', () => {
      const status = budget.getDailyStatus()
      
      expect(status.total).toBe(50000)
      expect(status.spent).toBe(0)
      expect(status.remaining).toBe(50000)
    })

    it('should reflect allocations', () => {
      budget.allocate('task_1', 'writer', 3000)
      budget.allocate('task_2', 'editor', 2000)
      
      const status = budget.getDailyStatus()
      expect(status.spent).toBe(5000)
      expect(status.remaining).toBe(45000)
    })
  })
})

// ===============================================================================
// MessageBus Tests
// ===============================================================================

describe('MessageBus', () => {
  let bus: MessageBus

  beforeEach(() => {
    bus = new MessageBus()
  })

  describe('send', () => {
    it('should send message and return it', () => {
      const msg = bus.send({
        fromAgentId: 'Writer Agent',
        fromRole: 'writer',
        toAgentId: 'Reviewer Agent',
        toRole: 'reviewer',
        type: 'request',
        payload: { content: 'Please review' }
      })
      
      expect(msg.id).toMatch(/^msg_/)
      expect(msg.type).toBe('request')
      expect(msg.payload).toEqual({ content: 'Please review' })
    })

    it('should generate conversation ID if not provided', () => {
      const msg = bus.send({
        fromAgentId: 'Writer Agent',
        fromRole: 'writer',
        toAgentId: 'Reviewer Agent',
        toRole: 'reviewer',
        type: 'request',
        payload: {}
      })
      
      expect(msg.conversationId).toMatch(/^conv_/)
    })
  })

  describe('getMessages', () => {
    it('should return messages for conversation', () => {
      bus.send({ fromAgentId: 'A', fromRole: 'writer', toAgentId: 'B', toRole: 'reviewer', type: 'request', payload: {} })
      bus.send({ fromAgentId: 'B', fromRole: 'reviewer', toAgentId: 'A', toRole: 'writer', type: 'response', payload: {}, conversationId: 'conv_test' })
      
      const messages = bus.getMessages('conv_test')
      expect(messages.length).toBe(1)  // Only messages in conv_test
    })
  })

  describe('getMessagesForAgent', () => {
    it('should return messages for specific agent', () => {
      bus.send({ fromAgentId: 'Writer', fromRole: 'writer', toAgentId: 'Reviewer', toRole: 'reviewer', type: 'request', payload: {} })
      
      const messages = bus.getMessagesForAgent('Reviewer')
      expect(messages.length).toBe(1)
      expect(messages[0].toAgentId).toBe('Reviewer')
    })

    it('should include broadcast messages', () => {
      bus.send({ fromAgentId: 'Brain', fromRole: 'editor', toAgentId: 'broadcast', toRole: 'broadcast', type: 'sync', payload: {} })
      
      const messages = bus.getMessagesForAgent('Writer')
      expect(messages.length).toBe(1)
    })
  })
})

// ===============================================================================
// ConflictResolver Tests
// ===============================================================================

describe('ConflictResolver', () => {
  let resolver: ConflictResolver

  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  describe('detectConflict', () => {
    it('should detect same entity', () => {
      const now = Date.now()
      const taskA = createBrainTask({ id: 'task_a', metadata: { entityId: 'chapter_1' }, createdAt: now })
      const taskB = createBrainTask({ id: 'task_b', metadata: { entityId: 'chapter_1' }, createdAt: now + 100000 })  // Different enough deadline
      
      expect(resolver.detectConflict(taskA, taskB)).toBe(true)
    })

    it('should not detect different entities with different deadlines', () => {
      const now = Date.now()
      const taskA = createBrainTask({ id: 'task_a', metadata: { entityId: 'chapter_1' }, createdAt: now, deadlineMs: 300000 })
      const taskB = createBrainTask({ id: 'task_b', metadata: { entityId: 'chapter_2' }, createdAt: now + 200000, deadlineMs: 300000 })  // 200s apart deadline
      
      expect(resolver.detectConflict(taskA, taskB)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should resolve by priority', () => {
      const profiles = createDefaultAgentProfiles()
      const taskA = createBrainTask({ id: 'task_a', priority: 'critical' })
      const taskB = createBrainTask({ id: 'task_b', priority: 'low' })
      
      const result = resolver.resolve(taskA, taskB, profiles)
      
      expect(result.winner.id).toBe('task_a')
      expect(result.loser.id).toBe('task_b')
    })
  })
})

// ===============================================================================
// MetricsCollector Tests
// ===============================================================================

describe('MetricsCollector', () => {
  let metrics: MetricsCollector

  beforeEach(() => {
    metrics = new MetricsCollector()
  })

  describe('recordRouting', () => {
    it('should track routing time', () => {
      metrics.recordRouting(15)
      metrics.recordRouting(25)
      
      const m = metrics.getMetrics()
      expect(m.averageRoutingTimeMs).toBe(20)
    })
  })

  describe('recordTaskStatus', () => {
    it('should increment task status counts', () => {
      const task = createBrainTask({ id: 'task_1' })
      task.status = 'completed'
      
      metrics.recordTaskStatus(task)
      
      const m = metrics.getMetrics()
      expect(m.totalTasksProcessed).toBe(1)
      expect(m.tasksByStatus.completed).toBe(1)
    })
  })

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.recordRouting(100)
      const task = createBrainTask({ id: 'task_1' })
      task.status = 'completed'
      metrics.recordTaskStatus(task)
      
      metrics.reset()
      
      const m = metrics.getMetrics()
      expect(m.totalTasksProcessed).toBe(0)
      expect(m.averageRoutingTimeMs).toBe(0)
    })
  })
})

// ===============================================================================
// AgentBrain Integration Tests
// ===============================================================================

describe('AgentBrain', () => {
  let brain: AgentBrain

  beforeEach(() => {
    brain = new AgentBrain()
  })

  describe('submitAndRoute', () => {
    it('should create and route task', () => {
      const { task, decision } = brain.submitAndRoute({
        type: 'write-chapter',
        payload: { chapterId: 'ch_1' },
        requiredRoles: ['writer']
      })
      
      expect(task.id).toMatch(/^brain_task_/)
      expect(decision).not.toBeNull()
      expect(decision!.selectedAgentId).toBe('writer')
    })

    it('should allocate budget on routing', () => {
      const { task } = brain.submitAndRoute({
        type: 'write-chapter',
        payload: {},
        requiredRoles: ['writer']
      })
      
      const alloc = brain.budget.getAllocation(task.id)
      expect(alloc).not.toBeNull()
      expect(alloc!.allocatedTokens).toBeGreaterThan(0)
    })
  })

  describe('handleCompletion', () => {
    it('should mark task completed and update agent load', () => {
      const { task } = brain.submitAndRoute({
        type: 'write-chapter',
        payload: {},
        requiredRoles: ['writer']
      })
      
      // Need to start the task first before completing
      brain.router.startTask(task.id)
      brain.handleCompletion(task.id, { output: 'done' })
      
      const updated = brain.router.getTask(task.id)
      expect(updated?.status).toBe('completed')
    })
  })

  describe('sendMessage', () => {
    it('should send inter-agent message', () => {
      const msg = brain.sendMessage({
        fromRole: 'writer',
        toRole: 'reviewer',
        type: 'request',
        payload: { content: 'Review this' }
      })
      
      expect(msg.id).toMatch(/^msg_/)
      expect(msg.type).toBe('request')
    })
  })

  describe('getStatus', () => {
    it('should return comprehensive status', () => {
      const status = brain.getStatus()
      
      expect(status).toHaveProperty('totalAgents')
      expect(status).toHaveProperty('pendingTasks')
      expect(status).toHaveProperty('dailyBudget')
      expect(status).toHaveProperty('metrics')
      expect(Array.isArray(status.agentLoads as unknown[])).toBe(true)
    })
  })
})

// ===============================================================================
// Helper Functions
// ===============================================================================

function createBrainTask(overrides: Partial<BrainTask> = {}): BrainTask {
  return {
    id: 'test_task',
    type: 'write-chapter',
    priority: 'normal',
    payload: null,
    requiredRoles: ['writer'],
    budgetTokens: 5000,
    deadlineMs: 300000,
    createdAt: Date.now(),
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    metadata: {},
    ...overrides
  }
}