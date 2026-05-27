/**
 * FederatedInstanceManager - V71
 * Multi-instance collaboration with task distribution, voting, and skill sharing
 * 
 * Features:
 * - InstanceRegistry: Track and heartbeat all known instances
 * - FederatedTask: Distribute tasks across instances
 * - VotingConsensus: Weighted vote for multi-instance decisions
 * - SkillShare: Share crystallized skills between instances
 * 
 * Inspired by ruflo-design Agent Federation + generic-agent Self-Evolution
 */

import type {
  InstanceProfile,
  InstanceCapability,
  InstanceStatus,
  FederatedTask,
  FederatedTaskStatus,
  TaskPriority,
  VoteRecord,
  ConsensusDecision,
  SkillShareOffer,
  SkillShareRequest,
  SkillShareResponse,
  HeartbeatMessage,
  DiscoveryBroadcast,
  FederationConfig
} from './FederationTypes'

import {
  DEFAULT_FEDERATION_CONFIG,
  generateInstanceId,
  generateTaskId,
  generateVoteId,
  calculateInstanceWeight,
  selectBestInstance,
  detectConflict,
  mergeVotes,
  isInstanceHealthy,
  shouldAcceptTask
} from './FederationTypes'

import type { Skill } from '../memory/MemoryManager'

// ===============================================================================
// Events
// ===============================================================================

export type FederationEventType =
  | 'instance-discovered'
  | 'instance-lost'
  | 'instance-status-change'
  | 'task-assigned'
  | 'task-completed'
  | 'task-failed'
  | 'vote-submitted'
  | 'consensus-reached'
  | 'skill-share-offered'
  | 'skill-share-accepted'

export interface FederationEvent {
  type: FederationEventType
  timestamp: number
  sourceInstanceId: string
  payload: Record<string, unknown>
}

// ===============================================================================
// Instance Registry Manager
// ===============================================================================

export class InstanceRegistryManager {
  private localInstance: InstanceProfile | null = null
  private remoteInstances: Map<string, InstanceProfile> = new Map()
  private eventListeners: Array<(event: FederationEvent) => void> = []
  private heartbeatSequence = 0

  /**
   * Initialize local instance
   */
  initialize(config: Partial<FederationConfig>): void {
    const fullConfig = { ...DEFAULT_FEDERATION_CONFIG, ...config }
    
    this.localInstance = {
      instanceId: fullConfig.instanceId || generateInstanceId(),
      displayName: fullConfig.instanceName,
      deviceInfo: {
        id: fullConfig.instanceId || generateInstanceId(),
        name: fullConfig.instanceName,
        lastSync: Date.now(),
        status: 'online',
        vectorClock: {},
        capabilities: fullConfig.acceptTasks ? ['federation'] : []
      },
      status: 'idle',
      capabilities: this.inferCapabilities(fullConfig),
      currentLoad: 0,
      activeTasks: 0,
      maxConcurrentTasks: fullConfig.maxConcurrentTasks,
      version: '1.0.0',
      lastHeartbeat: Date.now(),
      metadata: {}
    }
  }

  /**
   * Get local instance profile
   */
  getLocalInstance(): InstanceProfile | null {
    return this.localInstance
  }

  /**
   * Get all known remote instances
   */
  getRemoteInstances(): InstanceProfile[] {
    return Array.from(this.remoteInstances.values())
      .filter(i => isInstanceHealthy(i, DEFAULT_FEDERATION_CONFIG))
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): InstanceProfile | null {
    if (this.localInstance?.instanceId === instanceId) return this.localInstance
    return this.remoteInstances.get(instanceId) || null
  }

  /**
   * Register a new remote instance
   */
  registerInstance(profile: InstanceProfile): void {
    const existing = this.remoteInstances.get(profile.instanceId)
    
    if (existing) {
      // Update existing
      const statusChanged = existing.status !== profile.status
      this.remoteInstances.set(profile.instanceId, profile)
      
      if (statusChanged) {
        this.emit({
          type: 'instance-status-change',
          timestamp: Date.now(),
          sourceInstanceId: profile.instanceId,
          payload: { from: existing.status, to: profile.status }
        })
      }
    } else {
      // New instance
      this.remoteInstances.set(profile.instanceId, profile)
      this.emit({
        type: 'instance-discovered',
        timestamp: Date.now(),
        sourceInstanceId: profile.instanceId,
        payload: { displayName: profile.displayName, capabilities: profile.capabilities }
      })
    }
  }

  /**
   * Mark instance as dead/offline
   */
  markInstanceOffline(instanceId: string): void {
    const instance = this.getInstance(instanceId)
    if (!instance) return
    
    const prevStatus = instance.status
    instance.status = 'offline'
    
    this.emit({
      type: 'instance-status-change',
      timestamp: Date.now(),
      sourceInstanceId: instanceId,
      payload: { from: prevStatus, to: 'offline' }
    })
  }

  /**
   * Remove instance from registry
   */
  removeInstance(instanceId: string): void {
    const removed = this.remoteInstances.delete(instanceId)
    
    if (removed) {
      this.emit({
        type: 'instance-lost',
        timestamp: Date.now(),
        sourceInstanceId: instanceId,
        payload: {}
      })
    }
  }

  /**
   * Update local load
   */
  updateLocalLoad(load: number, activeTasks: number): void {
    if (this.localInstance) {
      this.localInstance.currentLoad = load
      this.localInstance.activeTasks = activeTasks
    }
  }

  /**
   * Send heartbeat (returns message to broadcast)
   */
  sendHeartbeat(): HeartbeatMessage | null {
    if (!this.localInstance) return null
    
    this.heartbeatSequence++
    this.localInstance.lastHeartbeat = Date.now()
    
    return {
      fromInstanceId: this.localInstance.instanceId,
      timestamp: Date.now(),
      sequenceNumber: this.heartbeatSequence,
      currentLoad: this.localInstance.currentLoad,
      activeTaskCount: this.localInstance.activeTasks,
      capabilities: this.localInstance.capabilities
    }
  }

  /**
   * Process incoming heartbeat
   */
  processHeartbeat(msg: HeartbeatMessage): void {
    if (msg.fromInstanceId === this.localInstance?.instanceId) return
    
    const existing = this.remoteInstances.get(msg.fromInstanceId)
    
    if (existing) {
      existing.lastHeartbeat = msg.timestamp
      existing.currentLoad = msg.currentLoad
      existing.activeTasks = msg.activeTaskCount
      existing.capabilities = msg.capabilities
      
      if (existing.status === 'offline' || existing.status === 'dead') {
        existing.status = 'idle'
        this.emit({
          type: 'instance-status-change',
          timestamp: Date.now(),
          sourceInstanceId: msg.fromInstanceId,
          payload: { from: existing.status, to: 'idle' }
        })
      }
    }
  }

  /**
   * Process discovery broadcast
   */
  processDiscovery(broadcast: DiscoveryBroadcast): void {
    if (broadcast.fromInstanceId === this.localInstance?.instanceId) return
    
    // Check if relay/broadcast - in a real system this would use WebRTC/p2p
    // For this implementation, we just register the instance
    const profile: InstanceProfile = {
      instanceId: broadcast.fromInstanceId,
      displayName: `Instance-${broadcast.fromInstanceId.slice(0, 8)}`,
      deviceInfo: {
        id: broadcast.fromInstanceId,
        name: 'Remote',
        lastSync: broadcast.timestamp,
        status: 'online',
        vectorClock: {},
        capabilities: []
      },
      status: 'idle',
      capabilities: broadcast.advertisedCapabilities,
      currentLoad: 0,
      activeTasks: 0,
      maxConcurrentTasks: 3,
      version: broadcast.version,
      lastHeartbeat: broadcast.timestamp,
      metadata: {}
    }
    
    this.registerInstance(profile)
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: FederationEvent) => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * Emit event
   */
  private emit(event: FederationEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }

  /**
   * Infer capabilities from config
   */
  private inferCapabilities(config: Partial<FederationConfig>): InstanceCapability[] {
    const caps: InstanceCapability[] = ['federation', 'tool']
    
    if (config.acceptTasks) {
      caps.push('writing', 'review')
    }
    
    return caps
  }
}

// ===============================================================================
// Federated Task Manager
// ===============================================================================

export class FederatedTaskManager {
  private tasks: Map<string, FederatedTask> = new Map()
  private instanceManager: InstanceRegistryManager

  constructor(instanceManager: InstanceRegistryManager) {
    this.instanceManager = instanceManager
  }

  /**
   * Create a new federated task
   */
  createTask(params: {
    type: string
    payload?: unknown
    priority?: TaskPriority
    targetInstanceId?: string | null
    requiredCapabilities?: InstanceCapability[]
    timeoutMs?: number
    maxAttempts?: number
  }): FederatedTask {
    const local = this.instanceManager.getLocalInstance()
    
    const task: FederatedTask = {
      id: generateTaskId(),
      type: params.type,
      payload: params.payload,
      priority: params.priority || 'normal',
      status: 'pending',
      sourceInstanceId: local?.instanceId || 'unknown',
      targetInstanceId: params.targetInstanceId ?? null,
      createdAt: Date.now(),
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      timeoutMs: params.timeoutMs || DEFAULT_FEDERATION_CONFIG.taskTimeoutMs,
      result: null,
      error: null,
      attempts: 0,
      maxAttempts: params.maxAttempts || 3,
      requiredCapabilities: params.requiredCapabilities || [],
      metadata: {}
    }
    
    this.tasks.set(task.id, task)
    return task
  }

  /**
   * Assign task to best available instance
   */
  assignTask(taskId: string): InstanceProfile | null {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'pending') return null
    
    const target = task.targetInstanceId
      ? this.instanceManager.getInstance(task.targetInstanceId)
      : selectBestInstance(this.instanceManager.getRemoteInstances(), task.requiredCapabilities)
    
    if (!target) return null
    
    task.status = 'assigned'
    task.targetInstanceId = target.instanceId
    task.assignedAt = Date.now()
    
    return target
  }

  /**
   * Mark task as running on remote
   */
  markRunning(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'assigned') return false
    
    task.status = 'running'
    task.startedAt = Date.now()
    return true
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, result: unknown): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'running') return false
    
    task.status = 'completed'
    task.result = result
    task.completedAt = Date.now()
    
    return true
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    
    task.attempts++
    
    if (task.attempts >= task.maxAttempts) {
      task.status = 'failed'
      task.error = error
      task.completedAt = Date.now()
      return false
    }
    
    // Retry
    task.status = 'pending'
    task.assignedAt = null
    task.startedAt = null
    
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
    task.completedAt = Date.now()
    
    return true
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): FederatedTask | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * Get all tasks
   */
  getAllTasks(): FederatedTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: FederatedTaskStatus): FederatedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status)
  }

  /**
   * Get tasks for local instance
   */
  getLocalTasks(): FederatedTask[] {
    const localId = this.instanceManager.getLocalInstance()?.instanceId
    return Array.from(this.tasks.values()).filter(t => 
      t.targetInstanceId === localId
    )
  }
}

// ===============================================================================
// Voting Consensus Manager
// ===============================================================================

export class VotingConsensusManager {
  private votes: Map<string, VoteRecord[]> = new Map()
  private decisions: Map<string, ConsensusDecision> = new Map()
  private voteThreshold: number

  constructor(voteThreshold = 0.6) {
    this.voteThreshold = voteThreshold
  }

  /**
   * Submit a vote
   */
  submitVote(params: {
    questionId: string
    voterInstanceId: string
    vote: 'approve' | 'reject' | 'abstain'
    weight?: number
    confidence?: number
    reasoning?: string | null
  }): VoteRecord {
    const vote: VoteRecord = {
      id: generateVoteId(),
      questionId: params.questionId,
      voterInstanceId: params.voterInstanceId,
      vote: params.vote,
      weight: params.weight ?? 1.0,
      confidence: params.confidence ?? 1.0,
      reasoning: params.reasoning ?? null,
      timestamp: Date.now()
    }
    
    if (!this.votes.has(params.questionId)) {
      this.votes.set(params.questionId, [])
    }
    
    this.votes.get(params.questionId)!.push(vote)
    
    return vote
  }

  /**
   * Check if consensus reached for a question
   */
  checkConsensus(questionId: string): ConsensusDecision {
    const existing = this.decisions.get(questionId)
    if (existing) return existing
    
    const questionVotes = this.votes.get(questionId) || []
    const decision = mergeVotes(questionVotes, this.voteThreshold)
    
    this.decisions.set(questionId, decision)
    
    return decision
  }

  /**
   * Get all votes for a question
   */
  getVotes(questionId: string): VoteRecord[] {
    return this.votes.get(questionId) || []
  }

  /**
   * Clear old votes (cleanup)
   */
  clearOldVotes(maxAgeMs: number): void {
    const cutoff = Date.now() - maxAgeMs
    
    for (const [questionId, votes] of this.votes.entries()) {
      const filtered = votes.filter(v => v.timestamp > cutoff)
      
      if (filtered.length === 0) {
        this.votes.delete(questionId)
      } else {
        this.votes.set(questionId, filtered)
      }
    }
  }
}

// ===============================================================================
// Skill Sharing Manager
// ===============================================================================

export class SkillSharingManager {
  private outgoingOffers: Map<string, SkillShareOffer> = new Map()
  private incomingOffers: Map<string, SkillShareOffer> = new Map()
  private pendingRequests: Map<string, SkillShareRequest> = new Map()
  private responses: Map<string, SkillShareResponse> = new Map()

  /**
   * Offer a skill to the federation
   */
  offerSkill(params: {
    offeringInstanceId: string
    skill: Skill
    quality: number
    usageCount: number
    successRate: number
    expiresInMs?: number
  }): SkillShareOffer {
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    const offer: SkillShareOffer = {
      offerId,
      offeringInstanceId: params.offeringInstanceId,
      skill: params.skill,
      quality: params.quality,
      usageCount: params.usageCount,
      successRate: params.successRate,
      offeredAt: Date.now(),
      expiresAt: Date.now() + (params.expiresInMs || 3_600_000)  // 1 hour default
    }
    
    this.outgoingOffers.set(offerId, offer)
    
    return offer
  }

  /**
   * Request a skill from the federation
   */
  requestSkill(params: {
    requestingInstanceId: string
    skillType: string
    minQuality?: number
    preferredInstanceId?: string | null
  }): SkillShareRequest {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    const request: SkillShareRequest = {
      requestId,
      requestingInstanceId: params.requestingInstanceId,
      skillType: params.skillType,
      minQuality: params.minQuality ?? 0.5,
      preferredInstanceId: params.preferredInstanceId ?? null,
      requestedAt: Date.now()
    }
    
    this.pendingRequests.set(requestId, request)
    
    return request
  }

  /**
   * Find best matching offers for a request
   */
  findMatchingOffers(request: SkillShareRequest): SkillShareOffer[] {
    const now = Date.now()
    
    return Array.from(this.outgoingOffers.values())
      .filter(offer => 
        offer.offeringInstanceId !== request.requestingInstanceId &&
        offer.expiresAt > now &&
        offer.quality >= request.minQuality
      )
      .sort((a, b) => b.quality - a.quality)
  }

  /**
   * Accept a skill share offer
   */
  acceptOffer(offerId: string, respondingInstanceId: string): SkillShareResponse {
    const offer = this.outgoingOffers.get(offerId)
    
    const response: SkillShareResponse = {
      responseId: `resp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      offerId,
      requestId: '',
      respondingInstanceId,
      accepted: !!offer,
      skill: offer?.skill ?? null,
      reason: offer ? null : 'Offer not found or expired',
      respondedAt: Date.now()
    }
    
    this.responses.set(response.responseId, response)
    
    // Remove offer after acceptance
    if (offer) {
      this.outgoingOffers.delete(offerId)
    }
    
    return response
  }

  /**
   * Get active offers count
   */
  getActiveOffersCount(): number {
    const now = Date.now()
    return Array.from(this.outgoingOffers.values()).filter(o => o.expiresAt > now).length
  }
}

// ===============================================================================
// Main FederatedInstanceManager (Facade)
// ===============================================================================

export class FederatedInstanceManager {
  readonly instances: InstanceRegistryManager
  readonly tasks: FederatedTaskManager
  readonly voting: VotingConsensusManager
  readonly skillSharing: SkillSharingManager
  
  private config: FederationConfig

  constructor(config: Partial<FederationConfig> = {}) {
    this.config = { ...DEFAULT_FEDERATION_CONFIG, ...config }
    
    this.instances = new InstanceRegistryManager()
    this.instances.initialize(this.config)
    
    this.tasks = new FederatedTaskManager(this.instances)
    this.voting = new VotingConsensusManager(this.config.voteThreshold)
    this.skillSharing = new SkillSharingManager()
  }

  /**
   * Get current config
   */
  getConfig(): FederationConfig {
    return { ...this.config }
  }

  /**
   * Get federation status summary
   */
  getStatus(): Record<string, unknown> {
    const remoteInstances = this.instances.getRemoteInstances()
    const totalWeight = remoteInstances.reduce((sum, i) => sum + calculateInstanceWeight(i), 0)
    
    return {
      enabled: this.config.enabled,
      localInstanceId: this.config.instanceId,
      remoteInstanceCount: remoteInstances.length,
      totalRemoteWeight: totalWeight,
      activeTasks: this.tasks.getTasksByStatus('running').length,
      pendingTasks: this.tasks.getTasksByStatus('pending').length,
      completedTasks: this.tasks.getTasksByStatus('completed').length,
      failedTasks: this.tasks.getTasksByStatus('failed').length,
      skillShareOffers: this.skillSharing.getActiveOffersCount()
    }
  }
}

// Export singleton
export const federatedInstanceManager = new FederatedInstanceManager()