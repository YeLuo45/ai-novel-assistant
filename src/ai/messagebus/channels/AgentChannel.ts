/**
 * AgentChannel - Agent Status Events
 * V42: Channel for agent state and status events
 */

import { InMemoryChannel } from './Channel'
import type { AgentStatus } from '../types'

/**
 * Agent event types
 */
export type AgentEventType =
  | 'AGENT_REGISTER'
  | 'AGENT_UNREGISTER'
  | 'AGENT_STATUS_CHANGE'
  | 'AGENT_TASK_START'
  | 'AGENT_TASK_COMPLETE'
  | 'AGENT_TASK_FAIL'
  | 'AGENT_THINK_START'
  | 'AGENT_THINK_END'
  | 'AGENT_ACT_START'
  | 'AGENT_ACT_END'

/**
 * Agent register event
 */
export interface AgentRegisterEvent {
  type: 'AGENT_REGISTER'
  agentId: string
  agentName: string
  role: string
  timestamp: number
}

/**
 * Agent unregister event
 */
export interface AgentUnregisterEvent {
  type: 'AGENT_UNREGISTER'
  agentId: string
  timestamp: number
}

/**
 * Agent status change event
 */
export interface AgentStatusChangeEvent {
  type: 'AGENT_STATUS_CHANGE'
  agentId: string
  status: AgentStatus
  previousStatus?: AgentStatus
  timestamp: number
}

/**
 * Agent task start event
 */
export interface AgentTaskStartEvent {
  type: 'AGENT_TASK_START'
  agentId: string
  taskId: string
  taskType: string
  timestamp: number
}

/**
 * Agent task complete event
 */
export interface AgentTaskCompleteEvent {
  type: 'AGENT_TASK_COMPLETE'
  agentId: string
  taskId: string
  duration: number
  output?: string
  timestamp: number
}

/**
 * Agent task fail event
 */
export interface AgentTaskFailEvent {
  type: 'AGENT_TASK_FAIL'
  agentId: string
  taskId: string
  error: string
  timestamp: number
}

/**
 * Agent think start event
 */
export interface AgentThinkStartEvent {
  type: 'AGENT_THINK_START'
  agentId: string
  context: Record<string, unknown>
  timestamp: number
}

/**
 * Agent think end event
 */
export interface AgentThinkEndEvent {
  type: 'AGENT_THINK_END'
  agentId: string
  duration: number
  output: string
  timestamp: number
}

/**
 * Agent act start event
 */
export interface AgentActStartEvent {
  type: 'AGENT_ACT_START'
  agentId: string
  action: string
  timestamp: number
}

/**
 * Agent act end event
 */
export interface AgentActEndEvent {
  type: 'AGENT_ACT_END'
  agentId: string
  action: string
  duration: number
  success: boolean
  timestamp: number
}

export type AgentChannelEvent = 
  | AgentRegisterEvent
  | AgentUnregisterEvent
  | AgentStatusChangeEvent
  | AgentTaskStartEvent
  | AgentTaskCompleteEvent
  | AgentTaskFailEvent
  | AgentThinkStartEvent
  | AgentThinkEndEvent
  | AgentActStartEvent
  | AgentActEndEvent

/**
 * AgentChannel - publishes agent status and lifecycle events
 */
export class AgentChannel extends InMemoryChannel {
  constructor() {
    super('agent', { logging: false })
  }

  emitRegister(agentId: string, agentName: string, role: string): void {
    this.publish({ type: 'AGENT_REGISTER', agentId, agentName, role, timestamp: Date.now() })
  }

  emitUnregister(agentId: string): void {
    this.publish({ type: 'AGENT_UNREGISTER', agentId, timestamp: Date.now() })
  }

  emitStatusChange(agentId: string, status: AgentStatus, previousStatus?: AgentStatus): void {
    this.publish({ type: 'AGENT_STATUS_CHANGE', agentId, status, previousStatus, timestamp: Date.now() })
  }

  emitTaskStart(agentId: string, taskId: string, taskType: string): void {
    this.publish({ type: 'AGENT_TASK_START', agentId, taskId, taskType, timestamp: Date.now() })
  }

  emitTaskComplete(agentId: string, taskId: string, duration: number, output?: string): void {
    this.publish({ type: 'AGENT_TASK_COMPLETE', agentId, taskId, duration, output, timestamp: Date.now() })
  }

  emitTaskFail(agentId: string, taskId: string, error: string): void {
    this.publish({ type: 'AGENT_TASK_FAIL', agentId, taskId, error, timestamp: Date.now() })
  }

  emitThinkStart(agentId: string, context: Record<string, unknown>): void {
    this.publish({ type: 'AGENT_THINK_START', agentId, context, timestamp: Date.now() })
  }

  emitThinkEnd(agentId: string, duration: number, output: string): void {
    this.publish({ type: 'AGENT_THINK_END', agentId, duration, output, timestamp: Date.now() })
  }

  emitActStart(agentId: string, action: string): void {
    this.publish({ type: 'AGENT_ACT_START', agentId, action, timestamp: Date.now() })
  }

  emitActEnd(agentId: string, action: string, duration: number, success: boolean): void {
    this.publish({ type: 'AGENT_ACT_END', agentId, action, duration, success, timestamp: Date.now() })
  }
}

// Singleton instance
export const agentChannel = new AgentChannel()

export default agentChannel