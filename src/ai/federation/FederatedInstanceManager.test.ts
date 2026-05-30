/**
 * FederatedInstanceManager Tests - V71
 * Tests for Federated Multi-Instance Collaboration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { Skill } from '../memory/MemoryManager'
import {
  // Types
  type InstanceProfile,
  type InstanceCapability,
  type FederatedTask,
  type FederatedTaskStatus,
  type VoteRecord,
  type ConsensusDecision,
  type SkillShareOffer,
  type SkillShareRequest,
  type FederationConfig,
  type TaskPriority,
  // Functions
  generateInstanceId,
  generateTaskId,
  generateVoteId,
  calculateInstanceWeight,
  selectBestInstance,
  detectConflict,
  mergeVotes,
  isInstanceHealthy,
  shouldAcceptTask,
  DEFAULT_FEDERATION_CONFIG
} from './FederationTypes'

import {
  FederatedInstanceManager,
  FederatedTaskManager,
  VotingConsensusManager,
  SkillSharingManager,
  InstanceRegistryManager
} from './FederatedInstanceManager'

// ===============================================================================
// FederationTypes Tests
// ===============================================================================

describe('FederationTypes Helpers', () => {
  describe('generateInstanceId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateInstanceId()
      const id2 = generateInstanceId()
      
      expect(id1).toMatch(/^instance_/)
      expect(id2).toMatch(/^instance_/)
      expect(id1).not.toBe(id2)
    })
  })

  describe('generateTaskId', () => {
    it('should generate task IDs', () => {
      const id = generateTaskId()
      expect(id).toMatch(/^task_/)
    })
  })

  describe('generateVoteId', () => {
    it('should generate vote IDs', () => {
      const id = generateVoteId()
      expect(id).toMatch(/^vote_/)
    })
  })

  describe('calculateInstanceWeight', () => {
    it('should calculate base weight', () => {
      const profile = createInstanceProfile({
        capabilities: ['writing'],
        currentLoad: 0,
        activeTasks: 0,
        maxConcurrentTasks: 3,
        status: 'idle'
      })
      
      const weight = calculateInstanceWeight(profile)
      expect(weight).toBeGreaterThan(1.0)
      expect(weight).toBeLessThanOrEqual(2.0)
    })

    it('should cap at 2.0', () => {
      const profile = createInstanceProfile({
        capabilities: ['writing', 'review', 'memory', 'tool', 'evolution', 'hooks', 'mcp', 'federation'],
        currentLoad: 0,
        activeTasks: 0,
        maxConcurrentTasks: 1,
        status: 'idle'
      })
      
      const weight = calculateInstanceWeight(profile)
      expect(weight).toBeLessThanOrEqual(2.0)
    })
  })

  describe('selectBestInstance', () => {
    it('should return null for empty array', () => {
      const result = selectBestInstance([], ['writing'])
      expect(result).toBeNull()
    })

    it('should prefer idle instance', () => {
      const idle = createInstanceProfile({ instanceId: 'idle', status: 'idle', capabilities: ['writing'] })
      const busy = createInstanceProfile({ instanceId: 'busy', status: 'busy', capabilities: ['writing'] })
      
      const result = selectBestInstance([idle, busy], ['writing'])
      expect(result?.instanceId).toBe('idle')
    })

    it('should filter by capability', () => {
      const capable = createInstanceProfile({ instanceId: 'capable', status: 'idle', capabilities: ['writing'] })
      const incapable = createInstanceProfile({ instanceId: 'incapable', status: 'idle', capabilities: [] })
      
      const result = selectBestInstance([capable, incapable], ['writing'])
      expect(result?.instanceId).toBe('capable')
    })

    it('should prefer lower load', () => {
      const low = createInstanceProfile({ instanceId: 'low', status: 'idle', currentLoad: 0.1, capabilities: ['writing'] })
      const high = createInstanceProfile({ instanceId: 'high', status: 'idle', currentLoad: 0.8, capabilities: ['writing'] })
      
      const result = selectBestInstance([low, high], ['writing'])
      expect(result?.instanceId).toBe('low')
    })
  })

  describe('detectConflict', () => {
    it('should detect conflict for same entity', () => {
      const taskA = createTask({ id: 'a', entityId: 'entity_1', entityType: 'chapter' })
      const taskB = createTask({ id: 'b', entityId: 'entity_1', entityType: 'chapter' })
      
      expect(detectConflict(taskA, taskB)).toBe(true)
    })

    it('should not detect conflict for different entities', () => {
      const taskA = createTask({ id: 'a', entityId: 'entity_1', entityType: 'chapter' })
      const taskB = createTask({ id: 'b', entityId: 'entity_2', entityType: 'chapter' })
      
      expect(detectConflict(taskA, taskB)).toBe(false)
    })

    it('should not detect conflict for same task', () => {
      const task = createTask({ id: 'a' })
      expect(detectConflict(task, task)).toBe(false)
    })
  })

  describe('mergeVotes', () => {
    it('should approve when threshold met', () => {
      const votes = [
        createVote({ weight: 0.5, vote: 'approve' }),
        createVote({ weight: 0.3, vote: 'approve' }),
        createVote({ weight: 0.2, vote: 'reject' })
      ]
      
      const decision = mergeVotes(votes, 0.6)
      
      expect(decision.outcome).toBe('approved')
    })

    it('should reject when threshold not met', () => {
      const votes = [
        createVote({ weight: 0.3, vote: 'approve' }),
        createVote({ weight: 0.5, vote: 'reject' })
      ]
      
      const decision = mergeVotes(votes, 0.6)
      
      expect(decision.outcome).toBe('rejected')
    })

    it('should handle tie', () => {
      const votes = [
        createVote({ weight: 0.5, vote: 'approve' }),
        createVote({ weight: 0.5, vote: 'reject' })
      ]
      
      const decision = mergeVotes(votes, 0.6)
      
      expect(decision.outcome).toBe('tie')
    })

    it('should handle no votes', () => {
      const decision = mergeVotes([], 0.6)
      
      expect(decision.outcome).toBe('no-quorum')
    })
  })

  describe('isInstanceHealthy', () => {
    it('should return false for dead instance', () => {
      const profile = createInstanceProfile({ status: 'dead' })
      expect(isInstanceHealthy(profile, DEFAULT_FEDERATION_CONFIG)).toBe(false)
    })

    it('should return false for offline instance', () => {
      const profile = createInstanceProfile({ status: 'offline' })
      expect(isInstanceHealthy(profile, DEFAULT_FEDERATION_CONFIG)).toBe(false)
    })

    it('should return true for idle instance with recent heartbeat', () => {
      const profile = createInstanceProfile({ status: 'idle' })
      expect(isInstanceHealthy(profile, DEFAULT_FEDERATION_CONFIG)).toBe(true)
    })
  })

  describe('shouldAcceptTask', () => {
    it('should accept when instance is idle and capable', () => {
      const profile = createInstanceProfile({ status: 'idle', currentLoad: 0.1, capabilities: ['writing'] })
      const task = createFederatedTask({ requiredCapabilities: ['writing'] })
      
      expect(shouldAcceptTask(profile, task, DEFAULT_FEDERATION_CONFIG)).toBe(true)
    })

    it('should reject when instance is busy', () => {
      const profile = createInstanceProfile({ status: 'busy', currentLoad: 0.1, capabilities: ['writing'] })
      const task = createFederatedTask({ requiredCapabilities: ['writing'] })
      
      expect(shouldAcceptTask(profile, task, DEFAULT_FEDERATION_CONFIG)).toBe(false)
    })

    it('should reject when task requires missing capability', () => {
      const profile = createInstanceProfile({ status: 'idle', currentLoad: 0.1, capabilities: [] })
      const task = createFederatedTask({ requiredCapabilities: ['writing'] })
      
      expect(shouldAcceptTask(profile, task, DEFAULT_FEDERATION_CONFIG)).toBe(false)
    })
  })
})

// ===============================================================================
// FederatedInstanceManager Tests
// ===============================================================================

describe('FederatedInstanceManager', () => {
  let manager: FederatedInstanceManager

  beforeEach(() => {
    manager = new FederatedInstanceManager({ instanceId: 'local_test', instanceName: 'Test Instance' })
  })

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(manager.getConfig().instanceId).toBe('local_test')
      expect(manager.getConfig().instanceName).toBe('Test Instance')
    })

    it('should use defaults for missing config', () => {
      const m = new FederatedInstanceManager()
      expect(m.getConfig().enabled).toBe(true)
      expect(m.getConfig().heartbeatIntervalMs).toBe(10_000)
    })
  })

  describe('getStatus', () => {
    it('should return status summary', () => {
      const status = manager.getStatus()
      
      expect(status).toHaveProperty('enabled')
      expect(status).toHaveProperty('localInstanceId')
      expect(status).toHaveProperty('remoteInstanceCount')
      expect(status).toHaveProperty('activeTasks')
    })
  })
})

describe('InstanceRegistryManager', () => {
  let registry: InstanceRegistryManager

  beforeEach(() => {
    registry = new InstanceRegistryManager()
    registry.initialize({ instanceId: 'local', instanceName: 'Local' })
  })

  describe('initialize', () => {
    it('should create local instance', () => {
      const local = registry.getLocalInstance()
      expect(local).not.toBeNull()
      expect(local?.instanceId).toBe('local')
    })
  })

  describe('getRemoteInstances', () => {
    it('should return empty initially', () => {
      expect(registry.getRemoteInstances()).toHaveLength(0)
    })
  })

  describe('registerInstance', () => {
    it('should register new remote instance', () => {
      const remote = createInstanceProfile({ instanceId: 'remote_1' })
      registry.registerInstance(remote)
      
      expect(registry.getRemoteInstances()).toHaveLength(1)
      expect(registry.getRemoteInstances()[0].instanceId).toBe('remote_1')
    })

    it('should update existing instance', () => {
      const remote1 = createInstanceProfile({ instanceId: 'remote_1', displayName: 'First' })
      registry.registerInstance(remote1)
      
      const remote2 = createInstanceProfile({ instanceId: 'remote_1', displayName: 'Updated' })
      registry.registerInstance(remote2)
      
      expect(registry.getRemoteInstances()).toHaveLength(1)
      expect(registry.getRemoteInstances()[0].displayName).toBe('Updated')
    })
  })

  describe('sendHeartbeat', () => {
    it('should return heartbeat message', () => {
      const msg = registry.sendHeartbeat()
      
      expect(msg).not.toBeNull()
      expect(msg?.fromInstanceId).toBe('local')
      expect(msg?.sequenceNumber).toBe(1)
    })
  })

  describe('processHeartbeat', () => {
    it('should update remote instance', () => {
      const remote = createInstanceProfile({ instanceId: 'remote_1' })
      registry.registerInstance(remote)
      
      registry.processHeartbeat({
        fromInstanceId: 'remote_1',
        timestamp: Date.now(),
        sequenceNumber: 1,
        currentLoad: 0.8,
        activeTaskCount: 2,
        capabilities: ['writing']
      })
      
      const instance = registry.getInstance('remote_1')
      expect(instance?.currentLoad).toBe(0.8)
      expect(instance?.activeTasks).toBe(2)
    })
  })
})

describe('FederatedTaskManager', () => {
  let registry: InstanceRegistryManager
  let taskManager: FederatedTaskManager

  beforeEach(() => {
    registry = new InstanceRegistryManager()
    registry.initialize({ instanceId: 'local', instanceName: 'Local' })
    taskManager = new FederatedTaskManager(registry)
  })

  describe('createTask', () => {
    it('should create federated task', () => {
      const task = taskManager.createTask({
        type: 'write-chapter',
        payload: { chapterId: 'ch_1', content: 'Hello world' }
      })
      
      expect(task.id).toMatch(/^task_/)
      expect(task.type).toBe('write-chapter')
      expect(task.status).toBe('pending')
    })

    it('should set default values', () => {
      const task = taskManager.createTask({ type: 'test' })
      
      expect(task.priority).toBe('normal')
      expect(task.maxAttempts).toBe(3)
      expect(task.timeoutMs).toBe(300_000)
    })

    it('should accept custom priority', () => {
      const task = taskManager.createTask({ type: 'test', priority: 'critical' })
      
      expect(task.priority).toBe('critical')
    })
  })

  describe('assignTask', () => {
    it('should return null when no instances available', () => {
      const task = taskManager.createTask({ type: 'test' })
      
      const result = taskManager.assignTask(task.id)
      
      expect(result).toBeNull()
    })

    it('should assign to available remote instance', () => {
      const remote = createInstanceProfile({
        instanceId: 'remote_1',
        status: 'idle',
        capabilities: ['writing'],
        currentLoad: 0.1
      })
      registry.registerInstance(remote)
      
      const task = taskManager.createTask({ type: 'test', requiredCapabilities: ['writing'] })
      const result = taskManager.assignTask(task.id)
      
      expect(result?.instanceId).toBe('remote_1')
      expect(taskManager.getTask(task.id)?.status).toBe('assigned')
    })
  })

  describe('completeTask', () => {
    it('should complete running task', () => {
      // Register a remote instance first so assignTask can work
      const remote = createInstanceProfile({
        instanceId: 'remote_task',
        status: 'idle',
        capabilities: ['writing'],
        currentLoad: 0.1
      })
      registry.registerInstance(remote)
      
      const task = taskManager.createTask({ type: 'test', payload: { data: 'test' }, requiredCapabilities: ['writing'] })
      const assigned = taskManager.assignTask(task.id)
      expect(assigned).not.toBeNull() // verify assignment succeeded
      
      taskManager.markRunning(task.id)
      
      const result = taskManager.completeTask(task.id, { output: 'success' })
      
      expect(result).toBe(true)
      expect(taskManager.getTask(task.id)?.status).toBe('completed')
      expect(taskManager.getTask(task.id)?.result).toEqual({ output: 'success' })
    })

    it('should not complete non-running task', () => {
      const task = taskManager.createTask({ type: 'test' })
      
      const result = taskManager.completeTask(task.id, { output: 'success' })
      
      expect(result).toBe(false)
    })
  })

  describe('failTask', () => {
    it('should retry when attempts < max', () => {
      const task = taskManager.createTask({ type: 'test', maxAttempts: 3 })
      taskManager.markRunning(task.id)
      
      const result = taskManager.failTask(task.id, 'error')
      
      expect(result).toBe(true)
      expect(taskManager.getTask(task.id)?.status).toBe('pending')
      expect(taskManager.getTask(task.id)?.attempts).toBe(1)
    })

    it('should mark failed when max attempts reached', () => {
      const task = taskManager.createTask({ type: 'test', maxAttempts: 1 })
      taskManager.markRunning(task.id)
      
      taskManager.failTask(task.id, 'error')
      taskManager.markRunning(task.id)
      const result = taskManager.failTask(task.id, 'error')
      
      expect(result).toBe(false)
      expect(taskManager.getTask(task.id)?.status).toBe('failed')
    })
  })

  describe('getTasksByStatus', () => {
    it('should filter by status', () => {
      taskManager.createTask({ type: 'test1' })
      taskManager.createTask({ type: 'test2' })
      taskManager.createTask({ type: 'test3' })
      
      expect(taskManager.getTasksByStatus('pending')).toHaveLength(3)
      expect(taskManager.getTasksByStatus('running')).toHaveLength(0)
    })
  })
})

describe('VotingConsensusManager', () => {
  let voting: VotingConsensusManager

  beforeEach(() => {
    voting = new VotingConsensusManager(0.6)
  })

  describe('submitVote', () => {
    it('should record vote', () => {
      const vote = voting.submitVote({
        questionId: 'q1',
        voterInstanceId: 'voter_1',
        vote: 'approve',
        weight: 0.5
      })
      
      expect(vote.id).toMatch(/^vote_/)
      expect(vote.questionId).toBe('q1')
      expect(vote.vote).toBe('approve')
    })
  })

  describe('checkConsensus', () => {
    it('should reach consensus with enough approvals', () => {
      voting.submitVote({ questionId: 'q1', voterInstanceId: 'v1', vote: 'approve', weight: 0.4 })
      voting.submitVote({ questionId: 'q1', voterInstanceId: 'v2', vote: 'approve', weight: 0.3 })
      
      const decision = voting.checkConsensus('q1')
      
      expect(decision.outcome).toBe('approved')
    })

    it('should not reach consensus without enough votes', () => {
      // No votes at all for q2 - should be no-quorum
      const decision = voting.checkConsensus('q2_no_votes')
      
      expect(decision.outcome).toBe('no-quorum')
    })
  })
})

describe('SkillSharingManager', () => {
  let skillSharing: SkillSharingManager

  beforeEach(() => {
    skillSharing = new SkillSharingManager()
  })

  describe('offerSkill', () => {
    it('should create offer', () => {
      const offer = skillSharing.offerSkill({
        offeringInstanceId: 'local',
        skill: { id: 'skill_1', name: 'Test Skill' } as Skill,
        quality: 0.9,
        usageCount: 100,
        successRate: 0.95
      })
      
      expect(offer.offerId).toMatch(/^offer_/)
      expect(offer.offeringInstanceId).toBe('local')
      expect(offer.quality).toBe(0.9)
    })
  })

  describe('requestSkill', () => {
    it('should create request', () => {
      const request = skillSharing.requestSkill({
        requestingInstanceId: 'local',
        skillType: 'writing'
      })
      
      expect(request.requestId).toMatch(/^req_/)
      expect(request.skillType).toBe('writing')
    })
  })

  describe('findMatchingOffers', () => {
    it('should filter by skill type', () => {
      skillSharing.offerSkill({
        offeringInstanceId: 'remote',
        skill: { id: 'skill_1', name: 'Writing Skill' } as Skill,
        quality: 0.9,
        usageCount: 100,
        successRate: 0.95
      })
      
      const request = skillSharing.requestSkill({
        requestingInstanceId: 'local',
        skillType: 'writing'
      })
      
      const matches = skillSharing.findMatchingOffers(request)
      expect(matches).toHaveLength(1)
    })
  })

  describe('acceptOffer', () => {
    it('should accept valid offer', () => {
      const offer = skillSharing.offerSkill({
        offeringInstanceId: 'remote',
        skill: { id: 'skill_1', name: 'Test Skill' } as Skill,
        quality: 0.9,
        usageCount: 100,
        successRate: 0.95
      })
      
      const response = skillSharing.acceptOffer(offer.offerId, 'local')
      
      expect(response.accepted).toBe(true)
      expect(response.skill?.id).toBe('skill_1')
    })

    it('should reject non-existent offer', () => {
      const response = skillSharing.acceptOffer('nonexistent', 'local')
      
      expect(response.accepted).toBe(false)
    })
  })
})

// ===============================================================================
// Helper Functions
// ===============================================================================

function createInstanceProfile(overrides: Partial<InstanceProfile> = {}): InstanceProfile {
  return {
    instanceId: 'test_instance',
    displayName: 'Test Instance',
    deviceInfo: {
      id: 'device_1',
      name: 'Test Device',
      lastSync: Date.now(),
      status: 'online',
      vectorClock: {},
      capabilities: []
    },
    status: 'idle',
    capabilities: ['writing', 'federation'],
    currentLoad: 0.3,
    activeTasks: 1,
    maxConcurrentTasks: 3,
    version: '1.0.0',
    lastHeartbeat: Date.now(),
    metadata: {},
    ...overrides
  }
}

function createTask(overrides: { id?: string; entityId?: string; entityType?: string } = {}): FederatedTask {
  return {
    id: overrides.id || 'task_1',
    type: 'test',
    payload: { entityId: overrides.entityId || 'entity_1', entityType: overrides.entityType || 'chapter' },
    priority: 'normal',
    status: 'running',
    sourceInstanceId: 'source',
    targetInstanceId: 'target',
    createdAt: Date.now(),
    assignedAt: Date.now(),
    startedAt: Date.now(),
    completedAt: null,
    timeoutMs: 300_000,
    result: null,
    error: null,
    attempts: 0,
    maxAttempts: 3,
    requiredCapabilities: [],
    metadata: {}
  }
}

function createFederatedTask(overrides: Partial<FederatedTask> = {}): FederatedTask {
  return {
    id: 'task_1',
    type: 'test',
    payload: null,
    priority: 'normal',
    status: 'pending',
    sourceInstanceId: 'source',
    targetInstanceId: null,
    createdAt: Date.now(),
    assignedAt: null,
    startedAt: null,
    completedAt: null,
    timeoutMs: 300_000,
    result: null,
    error: null,
    attempts: 0,
    maxAttempts: 3,
    requiredCapabilities: [],
    metadata: {},
    ...overrides
  }
}

function createVote(overrides: Partial<VoteRecord> = {}): VoteRecord {
  return {
    id: 'vote_1',
    questionId: 'q1',
    voterInstanceId: 'voter_1',
    vote: 'approve',
    weight: 1.0,
    confidence: 1.0,
    reasoning: null,
    timestamp: Date.now(),
    ...overrides
  }
}