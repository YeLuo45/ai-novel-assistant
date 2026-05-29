import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordToolCall,
  detectStagnation,
  updateQualityScore,
  flagExcessiveToolCalls,
  getSessionDuration,
  getToolCallFrequency,
  getSuccessfulCallRate,
  getContextRelevance,
  getSessionQualityTrend,
  addActiveThread,
  pushContextWindow,
  getSessionStatistics,
  shouldSuggestBreak,
  endSession,
} from './WritingSessionManager'

describe('createEmptyState', () => {
  it('should create empty session state', () => {
    const s = createEmptyState()
    expect(s.sessionId).toBeTruthy()
    expect(s.toolCalls).toEqual([])
    expect(s.stagnationCount).toBe(0)
    expect(s.typeAlias).toEqual({})
  })

  it('should accept custom session id', () => {
    const s = createEmptyState('my-session')
    expect(s.sessionId).toBe('my-session')
  })
})

describe('recordToolCall', () => {
  it('should add tool call to history', () => {
    let s = createEmptyState()
    s = recordToolCall(s, 'write', true, { text: 'hello' })
    expect(s.toolCalls.length).toBe(1)
    expect(s.recentToolCalls.length).toBe(1)
    expect(s.toolCalls[0].tool).toBe('write')
  })

  it('should track recent calls', () => {
    let s = createEmptyState()
    for (let i = 0; i < 25; i++) {
      s = recordToolCall(s, `tool${i}`, true)
    }
    expect(s.recentToolCalls.length).toBe(20)
    expect(s.toolCalls.length).toBe(25)
  })
})

describe('detectStagnation', () => {
  it('should return false for insufficient data', () => {
    const s = createEmptyState()
    expect(detectStagnation(s)).toBe(false)
  })

  it('should detect low quality streak', () => {
    let s = createEmptyState()
    s = updateQualityScore(s, 0.3)
    s = updateQualityScore(s, 0.3)
    s = updateQualityScore(s, 0.3)
    expect(detectStagnation(s)).toBe(true)
  })

  it('should not trigger on improving quality', () => {
    let s = createEmptyState()
    s = updateQualityScore(s, 0.8)
    s = updateQualityScore(s, 0.85)
    s = updateQualityScore(s, 0.9)
    expect(detectStagnation(s)).toBe(false)
  })
})

describe('updateQualityScore', () => {
  it('should update last score and history', () => {
    let s = createEmptyState()
    s = updateQualityScore(s, 0.75)
    expect(s.lastQualityScore).toBe(0.75)
    expect(s.qualityHistory.length).toBe(1)
  })

  it('should increment stagnation count on stagnation', () => {
    let s = createEmptyState()
    s = updateQualityScore(s, 0.3)
    s = updateQualityScore(s, 0.3)
    s = updateQualityScore(s, 0.3)
    expect(s.stagnationCount).toBe(1)
  })
})

describe('flagExcessiveToolCalls', () => {
  it('should return false for low call count', () => {
    const s = createEmptyState()
    expect(flagExcessiveToolCalls(s)).toBe(false)
  })

  it('should not flag under threshold', () => {
    let s = createEmptyState()
    for (let i = 0; i < 5; i++) {
      s = recordToolCall(s, 'tool', true)
    }
    expect(flagExcessiveToolCalls(s)).toBe(false)
  })
})

describe('getSessionDuration', () => {
  it('should return elapsed time', () => {
    let s = createEmptyState()
    s = { ...s, startTime: Date.now() - 60000 }
    expect(getSessionDuration(s)).toBeGreaterThanOrEqual(59000)
  })

  it('should use endTime when set', () => {
    let s = createEmptyState()
    s = { ...s, startTime: Date.now() - 120000, endTime: Date.now() - 60000 }
    expect(getSessionDuration(s)).toBe(60000)
  })
})

describe('getToolCallFrequency', () => {
  it('should return calls per minute', () => {
    let s = createEmptyState()
    s = { ...s, startTime: Date.now() - 60000 }
    s = recordToolCall(s, 'tool', true)
    s = recordToolCall(s, 'tool', true)
    const freq = getToolCallFrequency(s)
    expect(freq).toBeGreaterThan(0)
  })
})

describe('getSuccessfulCallRate', () => {
  it('should return 0 for empty session', () => {
    const s = createEmptyState()
    expect(getSuccessfulCallRate(s)).toBe(0)
  })

  it('should calculate success rate', () => {
    let s = createEmptyState()
    s = recordToolCall(s, 'tool', true)
    s = recordToolCall(s, 'tool', false)
    s = recordToolCall(s, 'tool', true)
    expect(getSuccessfulCallRate(s)).toBeCloseTo(0.667, 1)
  })
})

describe('getContextRelevance', () => {
  it('should return 0 for unknown thread', () => {
    const s = createEmptyState()
    expect(getContextRelevance(s, 'unknown')).toBe(0)
  })

  it('should return stored relevance', () => {
    let s = createEmptyState()
    s = pushContextWindow(s, 'thread1', ['context'], 0.85)
    expect(getContextRelevance(s, 'thread1')).toBe(0.85)
  })
})

describe('getSessionQualityTrend', () => {
  it('should return stable for insufficient data', () => {
    const s = createEmptyState()
    expect(getSessionQualityTrend(s)).toBe('stable')
  })

  it('should detect improving trend', () => {
    let s = createEmptyState()
    for (const q of [0.5, 0.52, 0.6, 0.68, 0.75, 0.82]) {
      s = updateQualityScore(s, q)
    }
    expect(getSessionQualityTrend(s)).toBe('improving')
  })

  it('should detect declining trend', () => {
    let s = createEmptyState()
    for (const q of [0.8, 0.75, 0.7, 0.65, 0.55, 0.45]) {
      s = updateQualityScore(s, q)
    }
    expect(getSessionQualityTrend(s)).toBe('declining')
  })
})

describe('addActiveThread', () => {
  it('should add new thread', () => {
    let s = createEmptyState()
    s = addActiveThread(s, 'thread1')
    expect(s.activeThreads).toContain('thread1')
  })

  it('should not add duplicate', () => {
    let s = createEmptyState()
    s = addActiveThread(s, 'thread1')
    s = addActiveThread(s, 'thread1')
    expect(s.activeThreads.length).toBe(1)
  })
})

describe('pushContextWindow', () => {
  it('should add context window', () => {
    let s = createEmptyState()
    s = pushContextWindow(s, 'thread1', ['ctx1', 'ctx2'], 0.8)
    expect(s.contextWindows.length).toBe(1)
    expect(s.contextWindows[0].relevanceScore).toBe(0.8)
  })

  it('should limit window count', () => {
    let s = createEmptyState()
    for (let i = 0; i < 55; i++) {
      s = pushContextWindow(s, `thread${i}`, [`ctx${i}`], 0.7)
    }
    expect(s.contextWindows.length).toBe(50)
  })
})

describe('getSessionStatistics', () => {
  it('should return comprehensive stats', () => {
    let s = createEmptyState()
    s = recordToolCall(s, 'tool', true)
    s = updateQualityScore(s, 0.8)
    const stats = getSessionStatistics(s)
    expect(stats.totalCalls).toBe(1)
    expect(stats.successRate).toBe(1)
  })
})

describe('shouldSuggestBreak', () => {
  it('should not suggest break for healthy session', () => {
    let s = createEmptyState()
    expect(shouldSuggestBreak(s)).toBe(false)
  })

  it('should suggest break after stagnation', () => {
    let s = createEmptyState()
    // 4 updates with consecutive low scores triggers stagnationCount >= 1
    for (let i = 0; i < 5; i++) {
      s = updateQualityScore(s, 0.3)
    }
    expect(shouldSuggestBreak(s)).toBe(true)
  })
})

describe('endSession', () => {
  it('should set endTime', () => {
    let s = createEmptyState()
    s = endSession(s)
    expect(s.endTime).toBeTruthy()
  })
})
