/**
 * FederationTypes - V71
 * Federated Multi-Instance Collaboration types
 * 
 * Architecture:
 * - InstanceRegistry: Track all known instances
 * - InstanceCapability: Per-instance capability profile
 * - FederatedTask: Cross-instance task distribution
 * - VoteRecord: Weighted voting for decisions
 * - SkillShare: Skill transfer between instances
 * 
 * Inspired by ruflo-design Agent Federation + generic-agent Self-Evolution
 */

import type { Skill } from '../memory/MemoryManager'
import type { Device } from '../../offline/v2/offlineV2Types'

// ===============================================================================
// Instance Registry
// ===============================================================================

export type InstanceStatus = 
  | 'discovering'    // Discovering peers
  | 'idle'            // Ready to receive tasks
  | 'busy'            // Processing a task
  | 'offline'         // Temporarily unavailable
  | 'dead'            // Permanently unreachable

export type InstanceCapability = 
  | 'writing'         // Novel writing capability
  | 'review'          // Quality review capability
  | 'memory'          // Long-term memory
  | 'tool'            // Tool execution
  | 'evolution'       // Self-evolution capability
  | 'hooks'           // Hook system
  | 'mcp'             // MCP client
  | 'federation'      // Can participate in federation

export interface InstanceProfile {
  instanceId: string
  displayName: string
  deviceInfo: Device
  status: InstanceStatus
  capabilities: InstanceCapability[]
  currentLoad: number          // 0-1, how busy
  activeTasks: number          // Currently running tasks
  maxConcurrentTasks: number   // Max tasks can handle
  version: string              // Software version
  lastHeartbeat: number       // Last heartbeat timestamp
  metadata: Record<string, unknown>
}

export interface InstanceRegistry {
  localInstanceId: string
  instances: Map<string, InstanceProfile>
  lastUpdated: number
}

// ===============================================================================
// Federated Task
// ===============================================================================

export type FederatedTaskStatus = 
  | 'pending'         // Waiting to be assigned
  | 'assigned'        // Assigned to a remote instance
  | 'running'         // Remote is processing
  | 'completed'       // Successfully completed
  | 'failed'          // Failed on remote
  | 'timeout'         // No response in time
  | 'cancelled'       // Cancelled by sender

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'

export interface FederatedTask {
  id: string
  type: string
  payload: unknown
  priority: TaskPriority
  status: FederatedTaskStatus
  sourceInstanceId: string
  targetInstanceId: string | null  // null = broadcast
  createdAt: number
  assignedAt: number | null
  startedAt: number | null
  completedAt: number | null
  timeoutMs: number
  result: unknown | null
  error: string | null
  attempts: number
  maxAttempts: number
  requiredCapabilities: InstanceCapability[]
  metadata: Record<string, unknown>
}

export interface TaskAssignment {
  taskId: string
  instanceId: string
  assignedAt: number
  estimatedCompletionMs: number
}

// ===============================================================================
// Vote & Consensus
// ===============================================================================

export interface VoteRecord {
  id: string
  questionId: string
  voterInstanceId: string
  vote: 'approve' | 'reject' | 'abstain'
  weight: number           // Based on capability + reliability
  confidence: number       // 0-1, how confident
  reasoning: string | null
  timestamp: number
}

export interface ConsensusDecision {
  questionId: string
  votes: VoteRecord[]
  outcome: 'approved' | 'rejected' | 'tie' | 'no-quorum'
  approvedBy: string[]
  rejectedBy: string[]
  abstainedBy: string[]
  totalWeight: number
  threshold: number
  timestamp: number
  finalResult: unknown | null
}

// ===============================================================================
// Skill Sharing
// ===============================================================================

export interface SkillShareOffer {
  offerId: string
  offeringInstanceId: string
  skill: Skill
  quality: number         // 0-1, skill quality score
  usageCount: number      // How many times used successfully
  successRate: number     // Historical success rate
  offeredAt: number
  expiresAt: number
}

export interface SkillShareRequest {
  requestId: string
  requestingInstanceId: string
  skillType: string
  minQuality: number
  preferredInstanceId: string | null
  requestedAt: number
}

export interface SkillShareResponse {
  responseId: string
  offerId: string | null
  requestId: string
  respondingInstanceId: string
  accepted: boolean
  skill: Skill | null
  reason: string | null
  respondedAt: number
}

// ===============================================================================
// Heartbeat & Discovery
// ===============================================================================

export interface HeartbeatMessage {
  fromInstanceId: string
  timestamp: number
  sequenceNumber: number
  currentLoad: number
  activeTaskCount: number
  capabilities: InstanceCapability[]
}

export interface DiscoveryBroadcast {
  fromInstanceId: string
  timestamp: number
  version: string
  advertisedCapabilities: InstanceCapability[]
  relayUrl: string | null
}

// ===============================================================================
// Federation Config
// ===============================================================================

export interface FederationConfig {
  enabled: boolean
  instanceId: string
  instanceName: string
  discoveryIntervalMs: number       // How often to broadcast discovery
  heartbeatIntervalMs: number       // How often to send heartbeat
  heartbeatTimeoutMs: number        // Consider dead after this
  maxInstances: number             // Max instances to track
  relayUrl: string | null          // Optional relay server
  acceptTasks: boolean             // Whether to accept federated tasks
  taskTimeoutMs: number             // Default task timeout
  maxConcurrentTasks: number       // Max tasks to handle simultaneously
  voteThreshold: number            // Vote threshold for consensus (0-1)
  skillShareEnabled: boolean       // Enable skill sharing
  autoUpdateEnabled: boolean       // Auto-update when new version found
}

// Default config
export const DEFAULT_FEDERATION_CONFIG: FederationConfig = {
  enabled: true,
  instanceId: '',
  instanceName: 'AI-Novel-Assistant',
  discoveryIntervalMs: 30_000,       // 30 seconds
  heartbeatIntervalMs: 10_000,       // 10 seconds
  heartbeatTimeoutMs: 60_000,         // 1 minute
  maxInstances: 10,
  relayUrl: null,
  acceptTasks: true,
  taskTimeoutMs: 300_000,            // 5 minutes
  maxConcurrentTasks: 3,
  voteThreshold: 0.6,
  skillShareEnabled: true,
  autoUpdateEnabled: false
}

// ===============================================================================
// Helper Functions
// ===============================================================================

export function generateInstanceId(): string {
  return `instance_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateVoteId(): string {
  return `vote_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function calculateInstanceWeight(profile: InstanceProfile): number {
  let weight = 1.0
  
  // Capability bonus
  weight += profile.capabilities.length * 0.1
  
  // Reliability bonus (inverse of active tasks relative to max)
  const loadRatio = profile.activeTasks / Math.max(profile.maxConcurrentTasks, 1)
  weight += (1 - loadRatio) * 0.5
  
  // Online bonus
  if (profile.status === 'idle') weight += 0.3
  
  return Math.min(weight, 2.0)  // Cap at 2.0
}

export function selectBestInstance(
  instances: InstanceProfile[],
  requiredCapabilities: InstanceCapability[]
): InstanceProfile | null {
  const available = instances.filter(i => 
    i.status === 'idle' &&
    i.currentLoad < 0.8 &&
    requiredCapabilities.every(cap => i.capabilities.includes(cap))
  )
  
  if (available.length === 0) return null
  
  return available.sort((a, b) => 
    calculateInstanceWeight(b) - calculateInstanceWeight(a)
  )[0]
}

export function detectConflict(a: FederatedTask, b: FederatedTask): boolean {
  if (a.id === b.id) return false
  if (a.targetInstanceId !== b.targetInstanceId) return false
  if (a.status !== 'running' || b.status !== 'running') return false
  
  // Check if both are writing to the same entity
  const aPayload = a.payload as Record<string, unknown> | null
  const bPayload = b.payload as Record<string, unknown> | null
  
  if (!aPayload || !bPayload) return false
  
  return aPayload.entityId === bPayload.entityId && 
         aPayload.entityType === bPayload.entityType
}

export function mergeVotes(votes: VoteRecord[], threshold: number): ConsensusDecision {
  const questionId = votes[0]?.questionId || ''
  const approvedBy: string[] = []
  const rejectedBy: string[] = []
  const abstainedBy: string[] = []
  
  let totalWeight = 0
  let approvedWeight = 0
  let rejectedWeight = 0
  
  for (const vote of votes) {
    totalWeight += vote.weight
    
    if (vote.vote === 'approve') {
      approvedBy.push(vote.voterInstanceId)
      approvedWeight += vote.weight
    } else if (vote.vote === 'reject') {
      rejectedBy.push(vote.voterInstanceId)
      rejectedWeight += vote.weight
    } else {
      abstainedBy.push(vote.voterInstanceId)
    }
  }
  
  const approvedRatio = totalWeight > 0 ? approvedWeight / totalWeight : 0
  const rejectedRatio = totalWeight > 0 ? rejectedWeight / totalWeight : 0
  
  let outcome: ConsensusDecision['outcome']
  let finalResult: unknown | null = null
  
  if (approvedRatio >= threshold) {
    outcome = 'approved'
    finalResult = { approvedBy, approvedWeight, ratio: approvedRatio }
  } else if (rejectedRatio >= threshold) {
    outcome = 'rejected'
    finalResult = { rejectedBy, rejectedWeight, ratio: rejectedRatio }
  } else if (votes.length === 0) {
    outcome = 'no-quorum'
  } else {
    outcome = 'tie'
  }
  
  return {
    questionId,
    votes,
    outcome,
    approvedBy,
    rejectedBy,
    abstainedBy,
    totalWeight,
    threshold,
    timestamp: Date.now(),
    finalResult
  }
}

export function isInstanceHealthy(profile: InstanceProfile, config: FederationConfig): boolean {
  const now = Date.now()
  const heartbeatAge = now - profile.lastHeartbeat
  
  if (heartbeatAge > config.heartbeatTimeoutMs) return false
  if (profile.status === 'dead' || profile.status === 'offline') return false
  
  return true
}

export function shouldAcceptTask(
  profile: InstanceProfile,
  task: FederatedTask,
  config: FederationConfig
): boolean {
  if (!config.acceptTasks) return false
  if (profile.status !== 'idle') return false
  if (profile.currentLoad >= 0.9) return false
  if (profile.activeTasks >= profile.maxConcurrentTasks) return false
  
  // Check capabilities
  for (const cap of task.requiredCapabilities) {
    if (!profile.capabilities.includes(cap)) return false
  }
  
  return true
}