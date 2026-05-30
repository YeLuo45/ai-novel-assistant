/**
 * 实时干预机制 - 类型定义
 * V17 Phase 1
 */

export type ExecutionStatus = 
  | 'idle'
  | 'running'
  | 'paused'
  | 'waiting_approval'
  | 'user_reviewing'
  | 'resuming'
  | 'completed'

export type InterventionType =
  | 'agent_output'
  | 'conflict_detected'
  | 'threshold_exceeded'
  | 'manual_trigger'
  | 'scheduled_checkpoint'

export interface InterventionPoint {
  id: string
  type: InterventionType
  agentId: string | null
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  content: string
  suggestedEdit?: string
  originalOutput?: string
  userAction?: UserAction
  userComment?: string
  modifiedContent?: string
  createdAt: number
  resolvedAt?: number
}

export interface UserAction {
  type: 'approve' | 'reject' | 'modify' | 'rerun' | 'skip' | 'pause'
  targetAgent?: string
  modifiedContent?: string
  newPrompt?: string
  userComment?: string
}

export interface PauseCondition {
  id: string
  name: string
  description: string
  trigger: 'agent_complete' | 'conflict' | 'threshold' | 'manual'
  agentId?: string
  params: {
    afterCount?: number
    ifContentLengthOver?: number
    ifSeverityOver?: 'minor' | 'major' | 'critical'
    ifDetectedIssuesOver?: number
  }
}

export interface InterventionOption {
  id: string
  name: string
  action: UserAction
  keyboardShortcut?: string
  requiresComment?: boolean
}