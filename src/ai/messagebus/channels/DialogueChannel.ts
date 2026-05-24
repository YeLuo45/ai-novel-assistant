/**
 * DialogueChannel - Dialogue Events
 * V42: Channel for dialogue and conversation events
 */

import { InMemoryChannel } from './Channel'

/**
 * Dialogue event types
 */
export type DialogueEventType = 
  | 'DIALOGUE_START'
  | 'DIALOGUE_END'
  | 'DIALOGUE_TURN'
  | 'DIALOGUE_EMOTION'
  | 'DIALOGUE_INTERRUPT'
  | 'DIALOGUE_RESUME'

/**
 * Dialogue start event
 */
export interface DialogueStartEvent {
  type: 'DIALOGUE_START'
  dialogueId: string
  characters: string[]
  chapterId: number
  timestamp: number
}

/**
 * Dialogue end event
 */
export interface DialogueEndEvent {
  type: 'DIALOGUE_END'
  dialogueId: string
  duration: number
  turnCount: number
  timestamp: number
}

/**
 * Dialogue turn event
 */
export interface DialogueTurnEvent {
  type: 'DIALOGUE_TURN'
  dialogueId: string
  character: string
  content: string
  turnIndex: number
  timestamp: number
}

/**
 * Dialogue emotion event
 */
export interface DialogueEmotionEvent {
  type: 'DIALOGUE_EMOTION'
  dialogueId: string
  character: string
  emotion: string
  intensity: number
  timestamp: number
}

/**
 * Dialogue interrupt event
 */
export interface DialogueInterruptEvent {
  type: 'DIALOGUE_INTERRUPT'
  dialogueId: string
  interruptedBy: string
  reason?: string
  timestamp: number
}

/**
 * Dialogue resume event
 */
export interface DialogueResumeEvent {
  type: 'DIALOGUE_RESUME'
  dialogueId: string
  resumedBy: string
  timestamp: number
}

export type DialogueChannelEvent = 
  | DialogueStartEvent
  | DialogueEndEvent
  | DialogueTurnEvent
  | DialogueEmotionEvent
  | DialogueInterruptEvent
  | DialogueResumeEvent

/**
 * DialogueChannel - publishes dialogue and conversation events
 */
export class DialogueChannel extends InMemoryChannel {
  constructor() {
    super('dialogue', { logging: false })
  }

  emitStart(dialogueId: string, characters: string[], chapterId: number): void {
    this.publish({ type: 'DIALOGUE_START', dialogueId, characters, chapterId, timestamp: Date.now() })
  }

  emitEnd(dialogueId: string, duration: number, turnCount: number): void {
    this.publish({ type: 'DIALOGUE_END', dialogueId, duration, turnCount, timestamp: Date.now() })
  }

  emitTurn(dialogueId: string, character: string, content: string, turnIndex: number): void {
    this.publish({ type: 'DIALOGUE_TURN', dialogueId, character, content, turnIndex, timestamp: Date.now() })
  }

  emitEmotion(dialogueId: string, character: string, emotion: string, intensity: number): void {
    this.publish({ type: 'DIALOGUE_EMOTION', dialogueId, character, emotion, intensity, timestamp: Date.now() })
  }

  emitInterrupt(dialogueId: string, interruptedBy: string, reason?: string): void {
    this.publish({ type: 'DIALOGUE_INTERRUPT', dialogueId, interruptedBy, reason, timestamp: Date.now() })
  }

  emitResume(dialogueId: string, resumedBy: string): void {
    this.publish({ type: 'DIALOGUE_RESUME', dialogueId, resumedBy, timestamp: Date.now() })
  }
}

// Singleton instance
export const dialogueChannel = new DialogueChannel()

export default dialogueChannel