/**
 * WriteChannel - Writing Progress Events
 * V42: Channel for tracking writing progress and text changes
 */

import { InMemoryChannel } from './Channel'

/**
 * Write event types
 */
export type WriteEventType = 
  | 'WRITE_START'
  | 'WRITE_PROGRESS'
  | 'WRITE_COMPLETE'
  | 'WRITE_PAUSE'
  | 'WRITE_RESUME'
  | 'TEXT_INSERT'
  | 'TEXT_DELETE'
  | 'TEXT_REPLACE'

/**
 * Write progress event payload
 */
export interface WriteProgressEvent {
  type: 'WRITE_PROGRESS'
  chapterId: number
  position: number
  bytesWritten: number
  totalBytes: number
  timestamp: number
}

export interface TextInsertEvent {
  type: 'TEXT_INSERT'
  chapterId: number
  position: number
  text: string
  timestamp: number
}

export interface TextDeleteEvent {
  type: 'TEXT_DELETE'
  chapterId: number
  position: number
  length: number
  deletedText: string
  timestamp: number
}

export interface TextReplaceEvent {
  type: 'TEXT_REPLACE'
  chapterId: number
  position: number
  oldLength: number
  newLength: number
  timestamp: number
}

export type WriteChannelEvent = 
  | { type: 'WRITE_START'; chapterId: number; timestamp: number }
  | { type: 'WRITE_COMPLETE'; chapterId: number; timestamp: number }
  | { type: 'WRITE_PAUSE'; chapterId: number; reason?: string; timestamp: number }
  | { type: 'WRITE_RESUME'; chapterId: number; timestamp: number }
  | WriteProgressEvent
  | TextInsertEvent
  | TextDeleteEvent
  | TextReplaceEvent

/**
 * WriteChannel - publishes writing progress events
 */
export class WriteChannel extends InMemoryChannel {
  constructor() {
    super('write', { logging: false })
  }

  /**
   * Emit a write start event
   */
  emitStart(chapterId: number): void {
    this.publish({ type: 'WRITE_START', chapterId, timestamp: Date.now() })
  }

  /**
   * Emit a write complete event
   */
  emitComplete(chapterId: number): void {
    this.publish({ type: 'WRITE_COMPLETE', chapterId, timestamp: Date.now() })
  }

  /**
   * Emit a write progress event
   */
  emitProgress(chapterId: number, position: number, bytesWritten: number, totalBytes: number): void {
    this.publish({
      type: 'WRITE_PROGRESS',
      chapterId,
      position,
      bytesWritten,
      totalBytes,
      timestamp: Date.now()
    })
  }

  /**
   * Emit a text insert event
   */
  emitInsert(chapterId: number, position: number, text: string): void {
    this.publish({
      type: 'TEXT_INSERT',
      chapterId,
      position,
      text,
      timestamp: Date.now()
    })
  }

  /**
   * Emit a text delete event
   */
  emitDelete(chapterId: number, position: number, length: number, deletedText: string): void {
    this.publish({
      type: 'TEXT_DELETE',
      chapterId,
      position,
      length,
      deletedText,
      timestamp: Date.now()
    })
  }
}

// Singleton instance
export const writeChannel = new WriteChannel()

export default writeChannel