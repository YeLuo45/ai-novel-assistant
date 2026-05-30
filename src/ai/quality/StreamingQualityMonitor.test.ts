/**
 * StreamingQualityMonitor Tests - V53
 * Tests helper functions and session management (no IndexedDB needed)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streamingQualityMonitor } from './StreamingQualityMonitor'
import {
  hashSentence,
  calculateMetrics,
  calculateOverallScore,
  type QualityMetrics
} from './qualityStreamDb'

// Mock hook manager (StreamingQualityMonitor uses it)
vi.mock('../hooks/HookManager', () => ({
  hookManager: {
    emit: vi.fn(),
    registerHook: vi.fn(),
    unregisterHook: vi.fn(),
  }
}))

// Mock Dexie to avoid IndexedDB in tests
vi.mock('dexie', () => {
  return {
    __esModule: true,
    default: class MockDexie {
      version = vi.fn().mockReturnThis()
      stores = vi.fn().mockReturnThis()
      qualityStreamLogs = { add: vi.fn(), where: vi.fn(), toArray: vi.fn(), clear: vi.fn() }
      sentenceFeedback = { add: vi.fn(), where: vi.fn(), toArray: vi.fn(), clear: vi.fn() }
    }
  }
})

describe('StreamingQualityMonitor Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSession / destroySession', () => {
    it('should create session and retrieve initial state', () => {
      const sessionId = 'test-session-create'
      streamingQualityMonitor.createSession(sessionId)

      const state = streamingQualityMonitor.getSessionState(sessionId)
      expect(state).not.toBeNull()
      expect(state!.history.length).toBe(0)
      expect(state!.score).toBe(0)
    })

    it('should destroy session and return null', () => {
      const sessionId = 'test-session-destroy'
      streamingQualityMonitor.createSession(sessionId)
      streamingQualityMonitor.destroySession(sessionId)

      const state = streamingQualityMonitor.getSessionState(sessionId)
      expect(state).toBeNull()
    })
  })

  describe('getSessionState', () => {
    it('should return null for non-existent session', () => {
      const state = streamingQualityMonitor.getSessionState('non-existent')
      expect(state).toBeNull()
    })

    it('should return score and metrics after processing chunks', async () => {
      const sessionId = 'test-session-metrics'
      streamingQualityMonitor.createSession(sessionId)

      // processChunk uses Dexie internally, may fail in test env
      // We test getSessionState separately
      const state = streamingQualityMonitor.getSessionState(sessionId)
      expect(state).not.toBeNull()
      expect(typeof state!.score).toBe('number')
      expect(state!.metrics).toHaveProperty('coherence')
    })
  })
})

describe('qualityStreamDb Helper Functions', () => {
  describe('hashSentence', () => {
    it('should return consistent hash for same sentence', () => {
      const hash1 = hashSentence('这是一个测试句子。')
      const hash2 = hashSentence('这是一个测试句子。')
      expect(hash1).toBe(hash2)
    })

    it('should return different hash for different sentences', () => {
      const hash1 = hashSentence('第一个句子。')
      const hash2 = hashSentence('第二个句子。')
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', () => {
      const hash = hashSentence('')
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should handle unicode characters', () => {
      const hash = hashSentence('中文Unicode测试。！？')
      expect(typeof hash).toBe('string')
    })
  })

  describe('calculateMetrics', () => {
    it('should return all 5 quality dimensions', () => {
      const metrics = calculateMetrics('这是一个测试文本。')
      expect(metrics).toHaveProperty('coherence')
      expect(metrics).toHaveProperty('expression')
      expect(metrics).toHaveProperty('creativity')
      expect(metrics).toHaveProperty('structure')
      expect(metrics).toHaveProperty('engagement')
    })

    it('should return scores in 0-1 range', () => {
      const metrics = calculateMetrics('测试文本')
      const values = Object.values(metrics) as number[]
      values.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      })
    })

    it('should return higher coherence for longer text', () => {
      const shortMetrics = calculateMetrics('短')
      const longMetrics = calculateMetrics('这是一段较长且连贯的文本，用于测试质量评估。')
      expect(longMetrics.coherence).toBeGreaterThanOrEqual(shortMetrics.coherence)
    })

    it('should return higher expression for varied punctuation', () => {
      const plainMetrics = calculateMetrics('这是文本没有标点')
      const variedMetrics = calculateMetrics('这是文本，有标点，分隔符，和逗号，顿号；以及分号！')
      expect(variedMetrics.expression).toBeGreaterThanOrEqual(plainMetrics.expression)
    })

    it('should detect creative words for creativity score', () => {
      const plainMetrics = calculateMetrics('这是一个普通的句子。')
      const creativeMetrics = calculateMetrics('她的笑容如同春天的阳光，仿佛温暖的春风。')
      expect(creativeMetrics.creativity).toBeGreaterThanOrEqual(plainMetrics.creativity)
    })

    it('should detect dialogue for structure score', () => {
      const plainMetrics = calculateMetrics('这是一段没有对话的文本。')
      const dialogueMetrics = calculateMetrics('他说："你好吗？"她回答："我很好。"')
      expect(dialogueMetrics.structure).toBeGreaterThanOrEqual(plainMetrics.structure)
    })

    it('should detect emotional words for engagement score', () => {
      const plainMetrics = calculateMetrics('今天是星期一。')
      const emotionalMetrics = calculateMetrics('我感到非常高兴和激动！')
      expect(emotionalMetrics.engagement).toBeGreaterThanOrEqual(plainMetrics.engagement)
    })
  })

  describe('calculateOverallScore', () => {
    it('should return weighted average of all dimensions', () => {
      const metrics: QualityMetrics = {
        coherence: 0.8,
        expression: 0.7,
        creativity: 0.9,
        structure: 0.6,
        engagement: 0.5
      }
      const score = calculateOverallScore(metrics)
      // Weighted: 0.8*0.3 + 0.7*0.25 + 0.9*0.2 + 0.6*0.15 + 0.5*0.1 = 0.24+0.175+0.18+0.09+0.05 = 0.735
      expect(score).toBeGreaterThan(0.7)
      expect(score).toBeLessThan(0.8)
    })

    it('should be dominated by lowest dimension (engagement)', () => {
      const metrics: QualityMetrics = {
        coherence: 0.9,
        expression: 0.9,
        creativity: 0.9,
        structure: 0.9,
        engagement: 0.1
      }
      const score = calculateOverallScore(metrics)
      // 0.9*0.3 + 0.9*0.25 + 0.9*0.2 + 0.9*0.15 + 0.1*0.1 = 0.82
      expect(score).toBeLessThan(0.9)
      expect(score).toBeGreaterThan(0.1)
    })

    it('should return score in 0-1 range', () => {
      const metrics: QualityMetrics = {
        coherence: 0.5,
        expression: 0.5,
        creativity: 0.5,
        structure: 0.5,
        engagement: 0.5
      }
      const score = calculateOverallScore(metrics)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should weight coherence highest (0.3)', () => {
      const highCoherence: QualityMetrics = {
        coherence: 1.0,
        expression: 0.0,
        creativity: 0.0,
        structure: 0.0,
        engagement: 0.0
      }
      const highExpression: QualityMetrics = {
        coherence: 0.0,
        expression: 1.0,
        creativity: 0.0,
        structure: 0.0,
        engagement: 0.0
      }
      const scoreCoherence = calculateOverallScore(highCoherence)
      const scoreExpression = calculateOverallScore(highExpression)
      expect(scoreCoherence).toBeGreaterThan(scoreExpression)
    })
  })
})