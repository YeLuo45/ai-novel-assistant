/**
 * Collaboration V2 Tests - V60
 * Tests for AgentProtocol, DynamicScheduler, CollaborationHub, WorkflowAnalyzer
 */

import { describe, it, expect } from 'vitest'
import {
  createMessage,
  deliverMessage,
  acknowledgeMessage,
  getMessagePriority,
  isMessageExpired,
  extractMentions,
  createTask,
  getTaskPriorityValue,
  sortByPriority,
  canAgentAcceptTask,
  assignTaskToAgent,
  completeTask,
  shouldRetryTask,
  rescheduleTask,
  getNextAvailableAgent,
  detectWorkloadImbalance,
  createConflict,
  resolveConflict,
  detectResourceConflict,
  detectDependencyConflict,
  calculateWorkflowStats,
  detectBottleneck,
  suggestOptimization,
  getSystemHealth,
  type AgentMessage,
  type AgentState,
  type ScheduledTask,
  type SchedulerConfig
} from './collabV2Types'

const createAgent = (overrides: Partial<AgentState> = {}): AgentState => ({
  id: 'agent_1',
  name: 'Test Agent',
  status: 'idle',
  workload: 30,
  maxWorkload: 100,
  lastHeartbeat: Date.now(),
  capabilities: ['writing', 'editing'],
  ...overrides
})

const DEFAULT_CONFIG: SchedulerConfig = {
  maxConcurrentTasks: 5,
  taskTimeout: 30000,
  heartbeatInterval: 5000,
  maxRetries: 3,
  loadBalanceThreshold: 0.8
}

describe('AgentProtocol', () => {
  it('should create a valid message', () => {
    const msg = createMessage('agent_1', 'agent_2', 'task', { content: 'test' })
    expect(msg.from).toBe('agent_1')
    expect(msg.to).toBe('agent_2')
    expect(msg.type).toBe('task')
    expect(msg.status).toBe('pending')
    expect(msg.retries).toBe(0)
  })

  it('should deliver a pending message', () => {
    const msg = createMessage('a', 'b', 'task', {})
    const delivered = deliverMessage(msg)
    expect(delivered.status).toBe('delivered')
  })

  it('should acknowledge a delivered message', () => {
    const msg = createMessage('a', 'b', 'task', {})
    const delivered = deliverMessage(msg)
    const acked = acknowledgeMessage(delivered)
    expect(acked.status).toBe('acknowledged')
  })

  it('should prioritize conflict messages highest', () => {
    expect(getMessagePriority({ type: 'conflict' } as AgentMessage)).toBe(4)
    expect(getMessagePriority({ type: 'task' } as AgentMessage)).toBe(3)
    expect(getMessagePriority({ type: 'heartbeat' } as AgentMessage)).toBe(1)
  })

  it('should detect expired messages', () => {
    const oldMsg = createMessage('a', 'b', 'task', {})
    oldMsg.timestamp = Date.now() - 60000
    expect(isMessageExpired(oldMsg, 30000)).toBe(true)
    expect(isMessageExpired(oldMsg, 120000)).toBe(false)
  })

  it('should extract mentions from text', () => {
    expect(extractMentions('Hello @alice and @bob!')).toEqual(['alice', 'bob'])
    expect(extractMentions('No mentions here')).toEqual([])
  })
})

describe('Task Priority', () => {
  it('should return correct priority values', () => {
    expect(getTaskPriorityValue('urgent')).toBe(4)
    expect(getTaskPriorityValue('high')).toBe(3)
    expect(getTaskPriorityValue('normal')).toBe(2)
    expect(getTaskPriorityValue('low')).toBe(1)
  })

  it('should sort tasks by priority and time', () => {
    const tasks = [
      createTask('t1', 'a', 'low'),
      createTask('t2', 'a', 'urgent'),
      createTask('t3', 'a', 'high')
    ]
    const sorted = sortByPriority(tasks)
    expect(sorted[0].priority).toBe('urgent')
    expect(sorted[1].priority).toBe('high')
    expect(sorted[2].priority).toBe('low')
  })
})

describe('DynamicScheduler', () => {
  it('should detect when agent can accept task', () => {
    const agent = createAgent({ status: 'idle', workload: 50 })
    const task = createTask('t1', 'agent_1')
    expect(canAgentAcceptTask(agent, task)).toBe(true)
  })

  it('should reject task for overloaded agent', () => {
    const agent = createAgent({ status: 'busy', workload: 100 })
    const task = createTask('t2', 'agent_1')
    expect(canAgentAcceptTask(agent, task)).toBe(false)
  })

  it('should reject task for offline agent', () => {
    const agent = createAgent({ status: 'offline' })
    const task = createTask('t3', 'agent_1')
    expect(canAgentAcceptTask(agent, task)).toBe(false)
  })

  it('should assign task to agent', () => {
    const task = createTask('t4', 'agent_1')
    const agent = createAgent()
    const assigned = assignTaskToAgent(task, agent)
    expect(assigned.status).toBe('running')
    expect(assigned.startedAt).toBeDefined()
  })

  it('should complete task successfully', () => {
    const task = createTask('t5', 'agent_1')
    task.startedAt = Date.now() - 5000
    const completed = completeTask(task, true)
    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()
    expect(completed.actualDuration).toBeGreaterThan(0)
  })

  it('should mark task as failed when completeTask called with false', () => {
    const task = createTask('t6', 'agent_1')
    task.startedAt = Date.now() - 5000
    const failed = completeTask(task, false)
    expect(failed.status).toBe('failed')
  })

  it('should determine if task should retry', () => {
    const task = createTask('t7', 'agent_1')
    expect(shouldRetryTask(task)).toBe(false)
    task.retries = 3
    expect(shouldRetryTask(task)).toBe(false)
  })

  it('should reschedule failed task with incremented retry', () => {
    const task = createTask('t8', 'agent_1')
    task.retries = 1
    const rescheduled = rescheduleTask(task)
    expect(rescheduled.status).toBe('queued')
    expect(rescheduled.retries).toBe(2)
  })

  it('should find next available agent by lowest workload', () => {
    const agents = [
      createAgent({ id: 'a1', workload: 20 }),
      createAgent({ id: 'a2', workload: 80 }),
      createAgent({ id: 'a3', workload: 50 })
    ]
    const task = createTask('t9', 'a1', 'high')
    const selected = getNextAvailableAgent(agents, task, DEFAULT_CONFIG)
    expect(selected?.id).toBe('a1')
  })

  it('should return null when no agent available', () => {
    const agents = [
      createAgent({ id: 'a1', status: 'offline' }),
      createAgent({ id: 'a2', workload: 100 })
    ]
    const task = createTask('t10', 'agent_1')
    const selected = getNextAvailableAgent(agents, task, DEFAULT_CONFIG)
    expect(selected).toBeNull()
  })

  it('should detect workload imbalance', () => {
    const agents = [
      createAgent({ id: 'a1', workload: 10 }),
      createAgent({ id: 'a2', workload: 90 }),
      createAgent({ id: 'a3', workload: 50 })
    ]
    const imbalanced = detectWorkloadImbalance(agents)
    expect(imbalanced.length).toBeGreaterThan(0)
  })
})

describe('Conflict Detection', () => {
  it('should create conflict record', () => {
    const conflict = createConflict('resource', ['a1', 'a2'], ['t1', 't2'])
    expect(conflict.type).toBe('resource')
    expect(conflict.agents).toEqual(['a1', 'a2'])
    expect(conflict.resolved).toBe(false)
  })

  it('should resolve conflict with resolution text', () => {
    const conflict = createConflict('resource', ['a1', 'a2'], ['t1'])
    const resolved = resolveConflict(conflict, 'Agent a1 got priority')
    expect(resolved.resolved).toBe(true)
    expect(resolved.resolution).toBe('Agent a1 got priority')
    expect(resolved.resolvedAt).toBeDefined()
  })

  it('should detect resource conflict between multiple agents', () => {
    const tasks: ScheduledTask[] = [
      { ...createTask('r1_t1', 'a1'), status: 'running' },
      { ...createTask('r1_t2', 'a2'), status: 'running' }
    ]
    const conflict = detectResourceConflict(tasks, 'r1')
    expect(conflict).not.toBeNull()
    expect(conflict!.type).toBe('resource')
  })

  it('should not detect conflict for same agent', () => {
    const tasks: ScheduledTask[] = [
      { ...createTask('r1_t1', 'a1'), status: 'running' },
      { ...createTask('r1_t2', 'a1'), status: 'running' }
    ]
    const conflict = detectResourceConflict(tasks, 'r1')
    expect(conflict).toBeNull()
  })

  it('should detect dependency conflict', () => {
    const tasks: ScheduledTask[] = [
      { ...createTask('failed_task', 'a1'), status: 'failed', dependencies: [] },
      { ...createTask('dep_task', 'a2', 'normal'), status: 'queued', dependencies: ['failed_task'] }
    ]
    const conflict = detectDependencyConflict(tasks)
    expect(conflict).not.toBeNull()
    expect(conflict!.type).toBe('dependency')
  })
})

describe('Workflow Analysis', () => {
  it('should calculate workflow stats', () => {
    const tasks: ScheduledTask[] = [
      { ...createTask('t1', 'a1'), status: 'completed', actualDuration: 5000 },
      { ...createTask('t2', 'a2'), status: 'completed', actualDuration: 6000 },
      { ...createTask('t3', 'a1'), status: 'failed' },
      { ...createTask('t4', 'a2'), status: 'queued' },
      { ...createTask('t5', 'a1'), status: 'running' }
    ]
    const stats = calculateWorkflowStats(tasks)
    expect(stats.totalTasks).toBe(5)
    expect(stats.completedTasks).toBe(2)
    expect(stats.failedTasks).toBe(1)
    expect(stats.queuedTasks).toBe(1)
    expect(stats.runningTasks).toBe(1)
    expect(stats.averageDuration).toBe(5500)
  })

  it('should detect bottleneck from stats', () => {
    const stats = {
      totalTasks: 10,
      completedTasks: 2,
      failedTasks: 1,
      queuedTasks: 5,
      runningTasks: 2,
      averageDuration: 5000,
      bottleneckAgents: ['a1', 'a2'],
      efficiency: 0.2,
      totalMessages: 20,
      activeAgents: 3
    }
    expect(detectBottleneck(stats)).toBeTruthy()
  })

  it('should suggest optimizations', () => {
    const stats = {
      totalTasks: 10,
      completedTasks: 3,
      failedTasks: 3,
      queuedTasks: 2,
      runningTasks: 2,
      averageDuration: 60000,
      bottleneckAgents: ['a1'],
      efficiency: 0.3,
      totalMessages: 20,
      activeAgents: 2
    }
    const suggestions = suggestOptimization(stats)
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('should return healthy status for good metrics', () => {
    const stats = {
      totalTasks: 10,
      completedTasks: 9,
      failedTasks: 0,
      queuedTasks: 1,
      runningTasks: 0,
      averageDuration: 5000,
      bottleneckAgents: [],
      efficiency: 0.9,
      totalMessages: 20,
      activeAgents: 2
    }
    expect(getSystemHealth(stats)).toBe('healthy')
  })

  it('should return critical for poor efficiency', () => {
    const stats = {
      totalTasks: 10,
      completedTasks: 1,
      failedTasks: 5,
      queuedTasks: 2,
      runningTasks: 2,
      averageDuration: 5000,
      bottleneckAgents: [],
      efficiency: 0.1,
      totalMessages: 20,
      activeAgents: 2
    }
    expect(getSystemHealth(stats)).toBe('critical')
  })

  it('should return warning for moderate issues', () => {
    const stats = {
      totalTasks: 10,
      completedTasks: 5,
      failedTasks: 1,
      queuedTasks: 3,
      runningTasks: 1,
      averageDuration: 5000,
      bottleneckAgents: ['a1'],
      efficiency: 0.5,
      totalMessages: 20,
      activeAgents: 2
    }
    expect(getSystemHealth(stats)).toBe('warning')
  })
})

describe('Integration', () => {
  it('should handle full workflow', () => {
    const agents = [
      createAgent({ id: 'writer', workload: 20 }),
      createAgent({ id: 'editor', workload: 40 }),
      createAgent({ id: 'reviewer', workload: 10 })
    ]

    const tasks = [
      createTask('write_ch1', 'writer', 'high'),
      createTask('edit_ch1', 'editor', 'normal'),
      createTask('review_ch1', 'reviewer', 'normal')
    ]
    tasks[0].dependencies = []
    tasks[1].dependencies = ['write_ch1']
    tasks[2].dependencies = ['edit_ch1']

    const assigned = assignTaskToAgent(tasks[0], agents[0])
    expect(assigned.status).toBe('running')

    const completed = completeTask(assigned, true)
    expect(completed.status).toBe('completed')

    const remaining = tasks.filter(t => t.id !== 'write_ch1')
    const sorted = sortByPriority(remaining)
    expect(sorted.length).toBe(2)
  })
})