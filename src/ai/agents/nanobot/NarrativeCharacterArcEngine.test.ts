import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  startCharacterArc,
  advancePhase,
  generateCharacterArcReport,
  getCharacterArc,
} from './NarrativeCharacterArcEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.arcs).toEqual([])
  })
})

describe('startCharacterArc', () => {
  it('should start arc', () => {
    let s = createEmptyState()
    s = startCharacterArc(s, 'hero', 1)
    expect(s.arcs.length).toBe(1)
    expect(s.arcs[0].characterId).toBe('hero')
    expect(s.arcs[0].currentPhase).toBe('setup')
  })
})

describe('advancePhase', () => {
  it('should advance through phases', () => {
    let s = createEmptyState()
    s = startCharacterArc(s, 'hero', 1)
    s = advancePhase(s, 'hero', 'challenge', 10)
    s = advancePhase(s, 'hero', 'breakdown', 20)
    s = advancePhase(s, 'hero', 'transformation', 25)
    s = advancePhase(s, 'hero', 'integration', 30)
    expect(s.arcs[0].currentPhase).toBe('integration')
    expect(s.arcs[0].transformationScore).toBeGreaterThan(50)
  })
})

describe('generateCharacterArcReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateCharacterArcReport(s)
    expect(report.totalArcs).toBe(0)
    expect(report.fullyDeveloped).toBe(0)
  })

  it('should count fully developed arcs', () => {
    let s = createEmptyState()
    s = startCharacterArc(s, 'hero', 1)
    s = advancePhase(s, 'hero', 'challenge', 10)
    s = advancePhase(s, 'hero', 'breakdown', 20)
    s = advancePhase(s, 'hero', 'transformation', 25)
    s = advancePhase(s, 'hero', 'integration', 30)
    const report = generateCharacterArcReport(s)
    expect(report.totalArcs).toBe(1)
    expect(report.fullyDeveloped).toBe(1)
  })
})

describe('getCharacterArc', () => {
  it('should return character arc', () => {
    let s = createEmptyState()
    s = startCharacterArc(s, 'hero', 1)
    const arc = getCharacterArc(s, 'hero')
    expect(arc).not.toBeNull()
    expect(arc!.characterId).toBe('hero')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getCharacterArc(s, 'nonexistent')).toBeNull()
  })
})
