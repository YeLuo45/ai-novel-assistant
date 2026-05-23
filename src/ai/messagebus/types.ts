/**
 * Collaboration Event Types for MessageBus
 * V36: Real-time collaboration + MessageBus architecture
 */

/**
 * Agent status types
 */
export type AgentStatus = 'online' | 'busy' | 'offline' | 'thinking'

/**
 * Agent state information
 */
export interface AgentInfo {
  id: string
  name: string
  role: string
  status: AgentStatus
  lastHeartbeat: number
  currentTask?: string
}

/**
 * Chapter delta for incremental updates
 */
export interface ChapterDelta {
  chapterId: number
  position: number
  oldLength: number
  newLength: number
  deltaText?: string
  timestamp: number
  authorId: string
}

/**
 * Activity types
 */
export type ActivityType = 
  | 'edit_chapter'
  | 'create_chapter'
  | 'delete_chapter'
  | 'move_chapter'
  | 'update_outline'
  | 'agent_thinking'
  | 'agent_idle'
  | 'conflict_resolved'
  | 'user_activity'

/**
 * Activity record
 */
export interface Activity {
  id: string
  type: ActivityType
  userId: string
  userName: string
  targetId?: number
  targetName?: string
  description: string
  timestamp: number
  metadata?: Record<string, unknown>
}

/**
 * Conflict information
 */
export interface ConflictInfo {
  id: string
  chapterId: number
  position: number
  length: number
  type: 'edit_conflict' | 'delete_conflict' | 'concurrent_edit'
  detectedAt: number
  resolvedAt?: number
  resolvedBy?: string
  ourVersion: string
  theirVersion: string
}

/**
 * Collaboration events that flow through MessageBus
 */
export type CollaborationEvent =
  | { type: 'AGENT_STATUS_CHANGE'; agentId: string; status: AgentStatus; agentInfo?: Partial<AgentInfo> }
  | { type: 'CHAPTER_UPDATE'; chapterId: number; delta: ChapterDelta }
  | { type: 'WRITER_ACTIVITY'; userId: string; activity: Activity }
  | { type: 'CONFLICT_DETECTED'; conflict: ConflictInfo }
  | { type: 'CONFLICT_RESOLVED'; conflictId: string }
  | { type: 'HEARTBEAT'; agentId: string; timestamp: number }
  | { type: 'AGENT_REGISTER'; agentInfo: AgentInfo }
  | { type: 'AGENT_UNREGISTER'; agentId: string }

/**
 * Event unsubscribe function
 */
export type Unsubscribe = () => void