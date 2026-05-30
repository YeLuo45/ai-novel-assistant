/**
 * NarrativeArcEngine Tests - V159
 * Tests for Story Arc Tracking & Climax Prediction Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyArcState,
  createArc,
  registerArc,
  addSegment,
  detectCurrentPhase,
  calculateTension,
  predictClimax,
  updateArcPhase,
  recordClimax,
  validateArcStructure,
  incrementChapter,
  formatArcSummary,
  formatArcDashboard,
} from './NarrativeArcEngine'

describe('createEmptyArcState', () => {
  it('should create empty state', () => {
    const state = createEmptyArcState()
    expect(state.arcs.size).toBe(0)
    expect(state.chapterCount).toBe(0)
    expect(state.globalTensionCurve.length).toBe(0)
  })
})

describe('createArc', () => {
  it('should create narrative arc', () => {
    const arc = createArc('hero_1', 'hero', 'Hero Journey', 'Alice', 'courage')
    expect(arc.arcId).toBe('hero_1')
    expect(arc.arcType).toBe('hero')
    expect(arc.currentPhase).toBe('setup')
    expect(arc.segments.length).toBe(0)
  })
})

describe('registerArc', () => {
  it('should register arc in state', () => {
    let state = createEmptyArcState()
    const arc = createArc('hero_1', 'hero', 'Hero Journey', 'Alice', 'courage')
    state = registerArc(state, arc)
    expect(state.arcs.size).toBe(1)
  })

  it('should set current story id', () => {
    let state = createEmptyArcState()
    const arc = createArc('story1_hero', 'hero', 'Story', 'A', 'theme')
    state = registerArc(state, arc)
    expect(state.currentStoryId).toBe('story1')
  })
})

describe('addSegment', () => {
  it('should add segment to arc', () => {
    let state = createEmptyArcState()
    const arc = createArc('arc1', 'hero', 'Arc', 'A', 't')
    state = registerArc(state, arc)
    state = addSegment(state, 'arc1', { startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: ['intro'], characterFocus: ['A'] })
    
    const updated = state.arcs.get('arc1')!
    expect(updated.segments.length).toBe(1)
    expect(updated.segments[0].phase).toBe('setup')
  })

  it('should return unchanged state for unknown arc', () => {
    const state = createEmptyArcState()
    const result = addSegment(state, 'unknown', { startChapter: 1, endChapter: 3, phase: 'setup', tensionLevel: 10, keyEvents: [], characterFocus: [] })
    expect(result).toBe(state)
  })
})

describe('detectCurrentPhase', () => {
  it('should return setup for empty segments', () => {
    const phase = detectCurrentPhase([])
    expect(phase).toBe('setup')
  })

  it('should return last segment phase', () => {
    const phase = detectCurrentPhase([
      { segmentId: 's1', startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: [], characterFocus: [] },
      { segmentId: 's2', startChapter: 6, endChapter: 10, phase: 'rising', tensionLevel: 60, keyEvents: [], characterFocus: [] },
    ])
    expect(phase).toBe('rising')
  })
})

describe('calculateTension', () => {
  it('should return 0 for empty segments', () => {
    const tension = calculateTension([])
    expect(tension).toBe(0)
  })

  it('should return last segment tension', () => {
    const tension = calculateTension([
      { segmentId: 's1', startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: [], characterFocus: [] },
      { segmentId: 's2', startChapter: 6, endChapter: 10, phase: 'climax', tensionLevel: 95, keyEvents: [], characterFocus: [] },
    ])
    expect(tension).toBe(95)
  })
})

describe('predictClimax', () => {
  it('should predict hero arc climax at 70%', () => {
    let state = createEmptyArcState()
    state = { ...state, chapterCount: 20 }
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    const pred = predictClimax({ ...state, arcs: new Map([['arc1', arc]]) }, 'arc1')
    expect(pred).toBe(14)
  })

  it('should predict tragedy arc climax at 85%', () => {
    let state = createEmptyArcState()
    state = { ...state, chapterCount: 20 }
    const arc = createArc('arc2', 'tragedy', 'T', 'A', 't')
    const pred = predictClimax({ ...state, arcs: new Map([['arc2', arc]]) }, 'arc2')
    expect(pred).toBe(17)
  })

  it('should predict quest arc climax at 60%', () => {
    let state = createEmptyArcState()
    state = { ...state, chapterCount: 20 }
    const arc = createArc('arc3', 'quest', 'Q', 'A', 't')
    const pred = predictClimax({ ...state, arcs: new Map([['arc3', arc]]) }, 'arc3')
    expect(pred).toBe(12)
  })

  it('should return null for unknown arc', () => {
    const state = createEmptyArcState()
    const pred = predictClimax(state, 'unknown')
    expect(pred).toBeNull()
  })
})

describe('updateArcPhase', () => {
  it('should update phase and predict climax', () => {
    let state = createEmptyArcState()
    state = { ...state, chapterCount: 10 }
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    state = registerArc(state, arc)
    state = addSegment(state, 'arc1', { startChapter: 1, endChapter: 5, phase: 'rising', tensionLevel: 50, keyEvents: [], characterFocus: [] })
    state = updateArcPhase(state, 'arc1')
    
    const updated = state.arcs.get('arc1')!
    expect(updated.currentPhase).toBe('rising')
    expect(updated.projectedClimaxChapter).toBe(7)
  })

  it('should track tension curve', () => {
    let state = createEmptyArcState()
    state = { ...state, chapterCount: 3 }
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    state = registerArc(state, arc)
    state = addSegment(state, 'arc1', { startChapter: 1, endChapter: 3, phase: 'rising', tensionLevel: 45, keyEvents: [], characterFocus: [] })
    state = updateArcPhase(state, 'arc1')
    
    expect(state.globalTensionCurve.length).toBe(1)
    expect(state.globalTensionCurve[0].chapter).toBe(3)
  })
})

describe('recordClimax', () => {
  it('should record climax chapter', () => {
    let state = createEmptyArcState()
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    state = registerArc(state, arc)
    state = recordClimax(state, 'arc1', 15)
    
    const updated = state.arcs.get('arc1')!
    expect(updated.actualClimaxChapter).toBe(15)
  })
})

describe('validateArcStructure', () => {
  it('should pass valid arc with climax and resolution', () => {
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    arc.segments = [
      { segmentId: 's1', startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: [], characterFocus: [] },
      { segmentId: 's2', startChapter: 6, endChapter: 10, phase: 'rising', tensionLevel: 60, keyEvents: [], characterFocus: [] },
      { segmentId: 's3', startChapter: 11, endChapter: 15, phase: 'climax', tensionLevel: 95, keyEvents: [], characterFocus: [] },
      { segmentId: 's4', startChapter: 16, endChapter: 20, phase: 'resolution', tensionLevel: 30, keyEvents: [], characterFocus: [] },
    ]
    
    const result = validateArcStructure(arc)
    expect(result.valid).toBe(true)
  })

  it('should fail arc missing climax', () => {
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    arc.segments = [
      { segmentId: 's1', startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: [], characterFocus: [] },
      { segmentId: 's2', startChapter: 6, endChapter: 10, phase: 'rising', tensionLevel: 60, keyEvents: [], characterFocus: [] },
    ]
    
    const result = validateArcStructure(arc)
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('climax'))).toBeTruthy()
  })

  it('should fail arc with less than 3 segments', () => {
    const arc = createArc('arc1', 'hero', 'H', 'A', 't')
    arc.segments = [
      { segmentId: 's1', startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: [], characterFocus: [] },
      { segmentId: 's2', startChapter: 6, endChapter: 10, phase: 'climax', tensionLevel: 95, keyEvents: [], characterFocus: [] },
    ]
    
    const result = validateArcStructure(arc)
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.includes('3 segments'))).toBeTruthy()
  })
})

describe('incrementChapter', () => {
  it('should increment chapter count', () => {
    let state = createEmptyArcState()
    state = incrementChapter(state)
    state = incrementChapter(state)
    expect(state.chapterCount).toBe(2)
  })
})

describe('formatArcSummary', () => {
  it('should format arc summary', () => {
    const arc = createArc('arc1', 'hero', 'Hero Journey', 'Alice', 'courage')
    arc.segments = [
      { segmentId: 's1', startChapter: 1, endChapter: 5, phase: 'setup', tensionLevel: 20, keyEvents: [], characterFocus: [] },
      { segmentId: 's2', startChapter: 6, endChapter: 10, phase: 'climax', tensionLevel: 95, keyEvents: [], characterFocus: [] },
    ]
    
    const formatted = formatArcSummary(arc)
    expect(formatted).toContain('Hero Journey')
    expect(formatted).toContain('hero')
    expect(formatted).toContain('Alice')
  })
})

describe('formatArcDashboard', () => {
  it('should show arc count', () => {
    let state = createEmptyArcState()
    state = registerArc(state, createArc('arc1', 'hero', 'H1', 'A', 't'))
    state = registerArc(state, createArc('arc2', 'tragedy', 'T1', 'B', 't'))
    
    const dashboard = formatArcDashboard(state)
    expect(dashboard).toContain('Total Arcs: 2')
    expect(dashboard).toContain('H1')
    expect(dashboard).toContain('T1')
  })

  it('should show chapter count', () => {
    let state = createEmptyArcState()
    state = incrementChapter(state)
    state = incrementChapter(state)
    state = incrementChapter(state)
    
    const dashboard = formatArcDashboard(state)
    expect(dashboard).toContain('Chapter Count: 3')
  })
})
