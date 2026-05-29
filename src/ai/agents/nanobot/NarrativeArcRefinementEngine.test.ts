import { describe, it, expect } from 'vitest'
import {
  createEmptyArcRefinementState,
  createArc,
  addSegment,
  getArcIntegrity,
  getStructuralIssues,
  formatArcSummary,
  formatArcDashboard,
} from './NarrativeArcRefinementEngine'

describe('createEmptyArcRefinementState', () => {
  it('should create empty state', () => {
    const state = createEmptyArcRefinementState()
    expect(state.arcs.length).toBe(0)
    expect(state.overallIntegrity).toBe(100)
    expect(state.structuralIssues.length).toBe(0)
  })
})

describe('createArc', () => {
  it('should create arc with segments', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
    ])
    expect(state.arcs.length).toBe(1)
    expect(state.arcs[0].name).toBe('Main Arc')
  })

  it('should calculate integrity for valid arc', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
      { chapterStart: 9, chapterEnd: 10, phase: 'resolution' as const, intensity: 40, description: 'Resolution' },
    ])
    expect(state.overallIntegrity).toBe(100)
  })

  it('should detect missing phases', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Incomplete Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
    ])
    expect(state.arcs[0].integrityScore).toBeLessThan(100)
  })

  it('should detect climax at beginning', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Bad Arc', [
      { chapterStart: 1, chapterEnd: 2, phase: 'climax' as const, intensity: 90, description: 'Climax' },
      { chapterStart: 3, chapterEnd: 5, phase: 'rising' as const, intensity: 50, description: 'Rising' },
    ])
    expect(state.arcs[0].integrityScore).toBeLessThan(100)
  })
})

describe('addSegment', () => {
  it('should add segment to existing arc', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
    ])
    const arcId = state.arcs[0].arcId
    state = addSegment(state, arcId, { chapterStart: 9, chapterEnd: 10, phase: 'resolution' as const, intensity: 40, description: 'Resolution' })
    expect(state.arcs[0].segments.length).toBe(4)
  })

  it('should update current chapter', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
    ])
    const arcId = state.arcs[0].arcId
    state = addSegment(state, arcId, { chapterStart: 9, chapterEnd: 10, phase: 'resolution' as const, intensity: 40, description: 'Resolution' })
    expect(state.currentChapter).toBe(10)
  })
})

describe('getArcIntegrity', () => {
  it('should return 0 for unknown arc', () => {
    const state = createEmptyArcRefinementState()
    expect(getArcIntegrity(state, 'unknown')).toBe(0)
  })

  it('should return arc integrity score', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
      { chapterStart: 9, chapterEnd: 10, phase: 'resolution' as const, intensity: 40, description: 'Resolution' },
    ])
    expect(getArcIntegrity(state, state.arcs[0].arcId)).toBe(100)
  })
})

describe('getStructuralIssues', () => {
  it('should return empty for valid arcs', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
      { chapterStart: 9, chapterEnd: 10, phase: 'resolution' as const, intensity: 40, description: 'Resolution' },
    ])
    const issues = getStructuralIssues(state)
    expect(issues.length).toBe(0)
  })
})

describe('formatArcSummary', () => {
  it('should show arc count', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Arc 1', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
    ])
    state = createArc(state, 'Arc 2', [
      { chapterStart: 1, chapterEnd: 4, phase: 'setup' as const, intensity: 20, description: 'Setup' },
      { chapterStart: 5, chapterEnd: 7, phase: 'rising' as const, intensity: 55, description: 'Rising' },
      { chapterStart: 8, chapterEnd: 9, phase: 'climax' as const, intensity: 90, description: 'Climax' },
    ])
    const summary = formatArcSummary(state)
    expect(summary).toContain('Arcs: 2')
  })

  it('should show integrity', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Arc 1', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
    ])
    const summary = formatArcSummary(state)
    expect(summary).toContain('Overall Integrity:')
  })
})

describe('formatArcDashboard', () => {
  it('should show arc integrity details', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Main Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
      { chapterStart: 9, chapterEnd: 10, phase: 'resolution' as const, intensity: 40, description: 'Resolution' },
    ])
    const dashboard = formatArcDashboard(state)
    expect(dashboard).toContain('integrity=100')
  })

  it('should show arc name', () => {
    let state = createEmptyArcRefinementState()
    state = createArc(state, 'Hero Arc', [
      { chapterStart: 1, chapterEnd: 3, phase: 'setup' as const, intensity: 30, description: 'Setup' },
      { chapterStart: 4, chapterEnd: 6, phase: 'rising' as const, intensity: 60, description: 'Rising' },
      { chapterStart: 7, chapterEnd: 8, phase: 'climax' as const, intensity: 95, description: 'Climax' },
    ])
    const dashboard = formatArcDashboard(state)
    expect(dashboard).toContain('Hero Arc')
  })
})
