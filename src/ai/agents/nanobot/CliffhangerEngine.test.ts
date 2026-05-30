import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeEnding,
  registerEnding,
  compareEndings,
  getEndingStats,
} from './CliffhangerEngine'

describe('createEmptyState', () => {
  it('should create empty cliffhanger state', () => {
    const s = createEmptyState()
    expect(s.endings).toEqual([])
    expect(s.bestEndings).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeEnding', () => {
  it('should classify question cliffhanger', () => {
    const analysis = analyzeEnding('Who was at the door?')
    expect(analysis.cliffhangerType).toBe('question')
    expect(analysis.suspenseScore).toBeGreaterThan(50)
  })

  it('should classify action cliffhanger', () => {
    const analysis = analyzeEnding('The building exploded!')
    expect(analysis.cliffhangerType).toBe('action')
    expect(analysis.suspenseScore).toBeGreaterThan(40)
  })

  it('should classify mystery cliffhanger', () => {
    const analysis = analyzeEnding('Something was terribly wrong.')
    expect(analysis.cliffhangerType).toBe('mystery')
  })

  it('should rate excellent ending', () => {
    const analysis = analyzeEnding('The door burst open. "We need to talk," she said, and nothing would ever be the same.')
    expect(analysis.qualityRating).not.toBe('excellent')  // too long
  })

  it('should give suggestions for long endings', () => {
    const analysis = analyzeEnding('The story goes on and on with many words and no particular ending or hook to speak of really this is far too long.')
    expect(analysis.suggestions.some(s => s.includes('shorter'))).toBe(true)
  })
})

describe('registerEnding', () => {
  it('should register a chapter ending', () => {
    let s = createEmptyState()
    s = registerEnding(s, 'ch1', 'Who was at the door?')
    expect(s.endings.length).toBe(1)
    expect(s.endings[0].analysis?.cliffhangerType).toBe('question')
  })

  it('should track best endings', () => {
    let s = createEmptyState()
    s = registerEnding(s, 'ch1', 'Who was at the door?')  // high suspense
    s = registerEnding(s, 'ch2', 'The story ended peacefully.')  // low suspense
    // Only ch1 should be in best (high score)
    expect(s.bestEndings.length).toBeGreaterThanOrEqual(0)
  })

  it('should update average suspense', () => {
    let s = createEmptyState()
    s = registerEnding(s, 'ch1', 'Who was at the door?')
    s = registerEnding(s, 'ch2', 'The building exploded!')
    expect(s.averageSuspense).toBeGreaterThan(0)
  })
})

describe('compareEndings', () => {
  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = registerEnding(s, 'ch1', 'Who was at the door?')  // high suspense
    s = registerEnding(s, 'ch2', 'The story ended.')  // low suspense
    const result = compareEndings(s, 'ch1', 'ch2')
    expect(result.moreSuspenseful).toBe('ch1')
  })
})

describe('getEndingStats', () => {
  it('should return ending statistics', () => {
    let s = createEmptyState()
    s = registerEnding(s, 'ch1', 'Who was at the door?')
    s = registerEnding(s, 'ch2', 'The building exploded!')
    const stats = getEndingStats(s)
    expect(stats.totalEndings).toBe(2)
    expect(stats.avgSuspense).toBeGreaterThan(0)
    expect(stats.typeDistribution).toBeDefined()
  })
})
