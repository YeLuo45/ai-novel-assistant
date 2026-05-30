import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerConflict,
  resolveConflict,
  escalateConflict,
  generateConflictReport,
  getCharacterConflicts,
  compareConflictIntensity,
} from './NarrativeConflictGraph'

describe('createEmptyState', () => {
  it('should create empty conflict state', () => {
    const s = createEmptyState()
    expect(s.edges).toEqual([])
    expect(s.nodes).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerConflict', () => {
  it('should register a new conflict', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 80, 1)
    expect(s.edges.length).toBe(1)
    expect(s.edges[0].intensity).toBe(80)
    expect(s.edges[0].resolutionStatus).toBe('unresolved')
  })

  it('should extend existing conflict', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 70, 1)
    s = registerConflict(s, 'hero', 'villain', 'physical', 80, 5)
    expect(s.edges.length).toBe(1)
    expect(s.edges[0].escalationLevel).toBe(2)
    expect(s.edges[0].chapters.length).toBe(2)
  })
})

describe('resolveConflict', () => {
  it('should resolve conflict', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 70, 1)
    const edgeId = s.edges[0].id
    s = resolveConflict(s, edgeId, 'resolved')
    expect(s.edges[0].resolutionStatus).toBe('resolved')
  })
})

describe('escalateConflict', () => {
  it('should escalate conflict', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 70, 1)
    const edgeId = s.edges[0].id
    s = escalateConflict(s, edgeId)
    expect(s.edges[0].escalationLevel).toBe(2)
  })

  it('should not exceed max level', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 70, 1)
    const edgeId = s.edges[0].id
    for (let i = 0; i < 6; i++) s = escalateConflict(s, edgeId)
    expect(s.edges[0].escalationLevel).toBe(5)
  })
})

describe('generateConflictReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateConflictReport(s)
    expect(report.totalConflicts).toBe(0)
    expect(report.centralFigures).toEqual([])
  })

  it('should identify central figures', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 80, 1)
    s = registerConflict(s, 'hero', 'mentor', 'emotional', 60, 2)
    s = registerConflict(s, 'hero', 'rival', 'resource', 70, 3)
    const report = generateConflictReport(s)
    expect(report.centralFigures).toContain('hero')
  })

  it('should count unresolved tensions', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 70, 1)
    const edgeId = s.edges[0].id
    s = resolveConflict(s, edgeId, 'resolved')
    s = registerConflict(s, 'hero', 'mentor', 'emotional', 60, 2)
    const report = generateConflictReport(s)
    expect(report.unresolvedTensions.length).toBe(1)
  })
})

describe('getCharacterConflicts', () => {
  it('should return character conflicts', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 80, 1)
    s = registerConflict(s, 'hero', 'mentor', 'emotional', 60, 2)
    const conflicts = getCharacterConflicts(s, 'hero')
    expect(conflicts.length).toBe(2)
  })
})

describe('compareConflictIntensity', () => {
  it('should compare intensities', () => {
    let s = createEmptyState()
    s = registerConflict(s, 'hero', 'villain', 'ideological', 80, 1)
    s = registerConflict(s, 'hero', 'mentor', 'emotional', 40, 2)
    const e1 = s.edges[0].id, e2 = s.edges[1].id
    const result = compareConflictIntensity(s, e1, e2)
    expect(result.moreIntense).toBe(e1)
    expect(result.intensity1).toBe(80)
  })
})
