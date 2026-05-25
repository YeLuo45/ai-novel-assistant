/**
 * Streaming Quality Monitor - V53
 * Real-time quality monitoring for writing stream
 */

import { hookManager } from '../hooks/HookManager'
import {
  type QualityStreamEvent,
  type QualityMetrics,
  type SentenceSuggestion,
  type SentenceFeedbackEntry,
  hashSentence,
  calculateMetrics,
  calculateOverallScore,
  qualityStreamDb,
  type QualityStreamLogEntry
} from './qualityStreamDb'

// Session context for tracking quality across chunks
interface QualitySession {
  sessionId: string
  accumulatedText: string
  lastChunkTime: number
  sentenceBuffer: string
  consecutiveLowQuality: number
  metricsHistory: QualityMetrics[]
}

// Configuration
const CHUNK_SIZE = 50           // tokens per chunk
const SESSION_TIMEOUT = 30000   // 30 seconds inactivity threshold
const LOW_QUALITY_THRESHOLD = 0.4
const CONSECUTIVE_LOW_COUNT = 3 // trigger intervention after 3 consecutive low quality

/**
 * Streaming Quality Monitor
 * Monitors writing quality in real-time, emits events for UI updates
 */
export class StreamingQualityMonitor {
  private sessions: Map<string, QualitySession> = new Map()
  private eventEmitter: Map<string, (event: QualityStreamEvent) => void> = new Map()

  /**
   * Create a new monitoring session
   */
  createSession(sessionId: string): void {
    this.sessions.set(sessionId, {
      sessionId,
      accumulatedText: '',
      lastChunkTime: Date.now(),
      sentenceBuffer: '',
      consecutiveLowQuality: 0,
      metricsHistory: []
    })
  }

  /**
   * Register event callback for a session
   */
  onSessionEvent(sessionId: string, callback: (event: QualityStreamEvent) => void): void {
    this.eventEmitter.set(sessionId, callback)
  }

  /**
   * Remove session and cleanup
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.eventEmitter.delete(sessionId)
  }

  /**
   * Process a text chunk and emit quality events
   */
  async processChunk(sessionId: string, chunk: string): Promise<QualityStreamEvent> {
    let session = this.sessions.get(sessionId)
    if (!session) {
      this.createSession(sessionId)
      session = this.sessions.get(sessionId)!
    }

    // Update session state
    session.lastChunkTime = Date.now()
    session.accumulatedText += chunk
    session.sentenceBuffer += chunk

    // Calculate metrics for the accumulated text
    const metrics = calculateMetrics(session.accumulatedText)
    const score = calculateOverallScore(metrics)

    // Track metrics history
    session.metricsHistory.push(metrics)
    if (session.metricsHistory.length > 20) {
      session.metricsHistory.shift()
    }

    // Determine event type
    let eventType: QualityStreamEvent['type'] = 'quality_update'
    let sentenceFeedback: SentenceSuggestion[] | undefined

    // Check if sentence is complete (ends with 。！？.!? or newline)
    const sentenceEndRegex = /[。！？.!?]\s*$/g
    const hasCompleteSentence = sentenceEndRegex.test(session.sentenceBuffer)

    if (hasCompleteSentence) {
      eventType = 'sentence_complete'
      // Extract complete sentences for analysis
      const sentenceParts = session.sentenceBuffer.split(/[。！？.!?]+/)
      const sentences = sentenceParts.filter(s => s.trim())
      const lastSentenceEnd = session.sentenceBuffer.search(/[。！？.!?]+[^\n]*$/)
      session.sentenceBuffer = lastSentenceEnd >= 0
        ? session.sentenceBuffer.substring(lastSentenceEnd + 1)
        : ''

      // Generate sentence-level feedback (mock for now, real LLM call in SentenceLevelFeedback)
      sentenceFeedback = await this.analyzeSentences(sentences)
    }

    // Check for threshold breach (low quality)
    if (score < LOW_QUALITY_THRESHOLD) {
      session.consecutiveLowQuality++
      if (session.consecutiveLowQuality >= CONSECUTIVE_LOW_COUNT) {
        eventType = 'threshold_breach'
      }
    } else {
      session.consecutiveLowQuality = 0
    }

    const event: QualityStreamEvent = {
      type: eventType,
      timestamp: Date.now(),
      score,
      metrics,
      accumulatedText: session.accumulatedText,
      sentenceFeedback
    }

    // Emit event to registered callback
    const callback = this.eventEmitter.get(sessionId)
    if (callback) {
      callback(event)
    }

    // Log to database
    await this.logEvent(sessionId, chunk, event)

    // Trigger hook if threshold breach
    if (eventType === 'threshold_breach') {
      await this.triggerThresholdBreachHook(sessionId, score)
    }

    // Also trigger quality:update hook on every update
    await hookManager.trigger('quality:update', {
      taskType: 'streaming',
      outcome: 'success',
      qualityScore: score,
    } as any)

    return event
  }

  /**
   * Process an async iterable stream of text chunks
   * Coroutine-style injection for writing editor
   */
  async *injectToEditor(
    sessionId: string,
    chunks: AsyncIterable<string>
  ): AsyncGenerator<QualityStreamEvent, void, unknown> {
    this.createSession(sessionId)

    try {
      for await (const chunk of chunks) {
        const event = await this.processChunk(sessionId, chunk)
        yield event
      }
    } finally {
      // Cleanup on stream end
      this.destroySession(sessionId)
    }
  }

  /**
   * Get current session state
   */
  getSessionState(sessionId: string): { score: number; metrics: QualityMetrics; history: QualityMetrics[] } | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const currentMetrics = calculateMetrics(session.accumulatedText)
    return {
      score: calculateOverallScore(currentMetrics),
      metrics: currentMetrics,
      history: session.metricsHistory
    }
  }

  /**
   * Simple sentence analysis (production uses LLM in SentenceLevelFeedback)
   */
  private async analyzeSentences(sentences: string[]): Promise<SentenceSuggestion[]> {
    const suggestions: SentenceSuggestion[] = []

    for (const sentence of sentences) {
      if (sentence.length < 5) continue

      // Check for repeated words
      const words = sentence.match(/[\u4e00-\u9fa5]{2,}/g) || []
      const wordFreq = new Map<string, number>()
      for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }

      for (const [word, count] of Array.from(wordFreq.entries())) {
        if (count >= 3 && word.length > 2) {
          suggestions.push({
            type: 'vocabulary_replacement',
            original: word,
            suggestion: `[建议替换重复词: ${word}]`,
            reason: `词语 "${word}" 在本句出现 ${count} 次`,
            confidence: 0.8
          })
        }
      }

      // Check for very long sentences
      if (sentence.length > 80) {
        suggestions.push({
          type: 'sentence_restructuring',
          original: sentence.substring(0, 30) + '...',
          suggestion: '建议拆分为多个短句',
          reason: '句子过长，建议在适当处断开',
          confidence: 0.7
        })
      }
    }

    return suggestions
  }

  /**
   * Log event to database
   */
  private async logEvent(
    sessionId: string,
    chunkText: string,
    event: QualityStreamEvent
  ): Promise<void> {
    const logEntry: QualityStreamLogEntry = {
      sessionId,
      timestamp: event.timestamp,
      chunkText,
      accumulatedText: event.accumulatedText,
      score: event.score,
      metrics: event.metrics,
      eventType: event.type
    }
    await qualityStreamDb.qualityStreamLogs.add(logEntry)
  }

  /**
   * Trigger threshold breach hook
   */
  private async triggerThresholdBreachHook(sessionId: string, score: number): Promise<void> {
    await hookManager.trigger('quality:threshold', {
      taskType: 'streaming',
      outcome: 'failure',
      qualityScore: score,
      error: `Quality score ${score} below threshold ${LOW_QUALITY_THRESHOLD}`
    } as any)
  }
}

// Singleton instance
export const streamingQualityMonitor = new StreamingQualityMonitor()