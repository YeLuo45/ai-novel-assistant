/**
 * ChapterChannel - Chapter Events
 * V42: Channel for chapter lifecycle events
 */

import { InMemoryChannel } from './Channel'
import type { ChapterDelta } from '../types'

/**
 * Chapter event types
 */
export type ChapterEventType = 
  | 'CHAPTER_CREATE'
  | 'CHAPTER_UPDATE'
  | 'CHAPTER_DELETE'
  | 'CHAPTER_REORDER'
  | 'CHAPTER_SELECT'
  | 'CHAPTER_LOCK'
  | 'CHAPTER_UNLOCK'
  | 'CHAPTER_SAVE'
  | 'CHAPTER_LOAD'

/**
 * Chapter event payloads
 */
export interface ChapterCreateEvent {
  type: 'CHAPTER_CREATE'
  chapterId: number
  title: string
  parentId?: number
  timestamp: number
}

export interface ChapterUpdateEvent {
  type: 'CHAPTER_UPDATE'
  chapterId: number
  changes: {
    title?: string
    content?: string
    metadata?: Record<string, unknown>
  }
  timestamp: number
}

export interface ChapterDeleteEvent {
  type: 'CHAPTER_DELETE'
  chapterId: number
  title: string
  timestamp: number
}

export interface ChapterReorderEvent {
  type: 'CHAPTER_REORDER'
  chapterId: number
  oldIndex: number
  newIndex: number
  timestamp: number
}

export interface ChapterSelectEvent {
  type: 'CHAPTER_SELECT'
  chapterId: number
  timestamp: number
}

export interface ChapterLockEvent {
  type: 'CHAPTER_LOCK'
  chapterId: number
  lockedBy: string
  timestamp: number
}

export interface ChapterUnlockEvent {
  type: 'CHAPTER_UNLOCK'
  chapterId: number
  timestamp: number
}

export type ChapterChannelEvent = 
  | ChapterCreateEvent
  | ChapterUpdateEvent
  | ChapterDeleteEvent
  | ChapterReorderEvent
  | ChapterSelectEvent
  | ChapterLockEvent
  | ChapterUnlockEvent
  | { type: 'CHAPTER_SAVE'; chapterId: number; timestamp: number }
  | { type: 'CHAPTER_LOAD'; chapterId: number; timestamp: number }

/**
 * ChapterChannel - publishes chapter lifecycle events
 */
export class ChapterChannel extends InMemoryChannel {
  constructor() {
    super('chapter', { logging: false })
  }

  emitCreate(chapterId: number, title: string, parentId?: number): void {
    this.publish({ type: 'CHAPTER_CREATE', chapterId, title, parentId, timestamp: Date.now() })
  }

  emitUpdate(chapterId: number, delta: ChapterDelta): void {
    this.publish({ type: 'CHAPTER_UPDATE', chapterId, delta })
  }

  emitDelete(chapterId: number, title: string): void {
    this.publish({ type: 'CHAPTER_DELETE', chapterId, title, timestamp: Date.now() })
  }

  emitReorder(chapterId: number, oldIndex: number, newIndex: number): void {
    this.publish({ type: 'CHAPTER_REORDER', chapterId, oldIndex, newIndex, timestamp: Date.now() })
  }

  emitSelect(chapterId: number): void {
    this.publish({ type: 'CHAPTER_SELECT', chapterId, timestamp: Date.now() })
  }

  emitLock(chapterId: number, lockedBy: string): void {
    this.publish({ type: 'CHAPTER_LOCK', chapterId, lockedBy, timestamp: Date.now() })
  }

  emitUnlock(chapterId: number): void {
    this.publish({ type: 'CHAPTER_UNLOCK', chapterId, timestamp: Date.now() })
  }
}

// Singleton instance
export const chapterChannel = new ChapterChannel()

export default chapterChannel