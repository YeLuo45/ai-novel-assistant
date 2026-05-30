/**
 * MessageBus barrel export
 * V36: Real-time collaboration MessageBus
 */

export { MessageBus, collaborationBus } from './MessageBus'
export { HeartbeatPlugin, heartbeatPlugin } from './plugins/HeartbeatPlugin'
export type {
  CollaborationEvent,
  AgentStatus,
  AgentInfo,
  ChapterDelta,
  Activity,
  ActivityType,
  ConflictInfo,
  Unsubscribe
} from './types'