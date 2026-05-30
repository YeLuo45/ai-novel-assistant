/**
 * ReviewChannel - Review and Critique Events
 * V42: Channel for review and critique events
 */

import { InMemoryChannel } from './Channel'

/**
 * Review event types
 */
export type ReviewEventType = 
  | 'REVIEW_START'
  | 'REVIEW_COMPLETE'
  | 'REVIEW_ISSUE'
  | 'REVIEW_SUGGESTION'
  | 'REVIEW_APPROVE'
  | 'REVIEW_REJECT'

/**
 * Review start event
 */
export interface ReviewStartEvent {
  type: 'REVIEW_START'
  reviewId: string
  chapterId: number
  reviewer: 'plot' | 'style' | 'dialogue' | 'critic'
  timestamp: number
}

/**
 * Review complete event
 */
export interface ReviewCompleteEvent {
  type: 'REVIEW_COMPLETE'
  reviewId: string
  chapterId: number
  score: number
  duration: number
  timestamp: number
}

/**
 * Review issue event
 */
export interface ReviewIssueEvent {
  type: 'REVIEW_ISSUE'
  reviewId: string
  chapterId: number
  severity: 'critical' | 'major' | 'minor'
  category: string
  description: string
  position?: { start: number; end: number }
  timestamp: number
}

/**
 * Review suggestion event
 */
export interface ReviewSuggestionEvent {
  type: 'REVIEW_SUGGESTION'
  reviewId: string
  chapterId: number
  category: string
  suggestion: string
  currentText?: string
  suggestedText?: string
  timestamp: number
}

/**
 * Review approve event
 */
export interface ReviewApproveEvent {
  type: 'REVIEW_APPROVE'
  reviewId: string
  chapterId: number
  approver: string
  timestamp: number
}

/**
 * Review reject event
 */
export interface ReviewRejectEvent {
  type: 'REVIEW_REJECT'
  reviewId: string
  chapterId: number
  rejecter: string
  reason: string
  timestamp: number
}

export type ReviewChannelEvent = 
  | ReviewStartEvent
  | ReviewCompleteEvent
  | ReviewIssueEvent
  | ReviewSuggestionEvent
  | ReviewApproveEvent
  | ReviewRejectEvent

/**
 * ReviewChannel - publishes review and critique events
 */
export class ReviewChannel extends InMemoryChannel {
  constructor() {
    super('review', { logging: false })
  }

  emitStart(reviewId: string, chapterId: number, reviewer: 'plot' | 'style' | 'dialogue' | 'critic'): void {
    this.publish({ type: 'REVIEW_START', reviewId, chapterId, reviewer, timestamp: Date.now() })
  }

  emitComplete(reviewId: string, chapterId: number, score: number, duration: number): void {
    this.publish({ type: 'REVIEW_COMPLETE', reviewId, chapterId, score, duration, timestamp: Date.now() })
  }

  emitIssue(
    reviewId: string, 
    chapterId: number, 
    severity: 'critical' | 'major' | 'minor', 
    category: string, 
    description: string,
    position?: { start: number; end: number }
  ): void {
    this.publish({ type: 'REVIEW_ISSUE', reviewId, chapterId, severity, category, description, position, timestamp: Date.now() })
  }

  emitSuggestion(
    reviewId: string,
    chapterId: number,
    category: string,
    suggestion: string,
    currentText?: string,
    suggestedText?: string
  ): void {
    this.publish({ type: 'REVIEW_SUGGESTION', reviewId, chapterId, category, suggestion, currentText, suggestedText, timestamp: Date.now() })
  }

  emitApprove(reviewId: string, chapterId: number, approver: string): void {
    this.publish({ type: 'REVIEW_APPROVE', reviewId, chapterId, approver, timestamp: Date.now() })
  }

  emitReject(reviewId: string, chapterId: number, rejecter: string, reason: string): void {
    this.publish({ type: 'REVIEW_REJECT', reviewId, chapterId, rejecter, reason, timestamp: Date.now() })
  }
}

// Singleton instance
export const reviewChannel = new ReviewChannel()

export default reviewChannel