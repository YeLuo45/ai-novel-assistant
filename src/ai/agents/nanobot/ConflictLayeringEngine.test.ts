import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  introduceConflict,
  escalateConflict,
  layerConflict,
  resolveConflict,
  generateLayeringAnalysis,
  getConflictStack,
  compareConflictIntensity,
} from './ConflictLayeringEngine'

describe('createEmptyState', () => {
  it('should create empty conflict state', () => {
    const s = createEmptyState()
    expect(s.conflicts).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('introduceConflict', () => {
  it('should introduce a conflict', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'internal', ['hero'], 1, 40)
    expect(s.conflicts.length).toBe(1)
    expect(s.conflicts[0].type).toBe('internal')
    expect(s.conflicts[0].intensity).toBe(40)
  })

  it('should introduce multiple conflicts', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'interpersonal', ['hero', 'villain'], 1)
    s = introduceConflict(s, 'societal', ['world'], 2)
    expect(s.conflicts.length).toBe(2)
  })
})

describe('escalateConflict', () => {
  it('should escalate conflict intensity', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'conflict', ['hero'], 1, 30)
    const conflictId = s.conflicts[0].id
    s = escalateConflict(s, conflictId, 20)
    expect(s.conflicts[0].intensity).toBe(50)
    expect(s.conflicts[0].escalationCount).toBe(1)
  })

  it('should cap intensity at 100', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'conflict', ['hero'], 1, 90)
    const conflictId = s.conflicts[0].id
    s = escalateConflict(s, conflictId, 30)
    expect(s.conflicts[0].intensity).toBe(100)
  })
})

describe('layerConflict', () => {
  it('should create linked layered conflict', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'interpersonal', ['hero', 'villain'], 1, 50)
    const conflictId = s.conflicts[0].id
    s = layerConflict(s, conflictId, 'internal', 'hero')
    expect(s.conflicts.length).toBe(2)
    expect(s.conflicts[1].type).toBe('internal')
  })
})

describe('resolveConflict', () => {
  it('should resolve a conflict', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'conflict', ['hero'], 1, 50)
    const conflictId = s.conflicts[0].id
    s = resolveConflict(s, conflictId, 10, 'Hero wins')
    expect(s.conflicts[0].chapterEnd).toBe(10)
    expect(s.conflicts[0].resolutionApproach).toBe('Hero wins')
  })
})

describe('generateLayeringAnalysis', () => {
  it('should return empty analysis', () => {
    const s = createEmptyState()
    const analysis = generateLayeringAnalysis(s)
    expect(analysis.totalConflicts).toBe(0)
  })

  it('should identify dominant conflict type', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'internal', ['hero'], 1)
    s = introduceConflict(s, 'internal', ['hero'], 2)
    s = introduceConflict(s, 'environmental', ['world'], 3)
    const analysis = generateLayeringAnalysis(s)
    expect(analysis.dominantConflictType).toBe('internal')
  })
})

describe('getConflictStack', () => {
  it('should return conflicts active at chapter', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'conflict', ['hero'], 2, 50)
    const conflicts = getConflictStack(s, 3)
    expect(conflicts.length).toBe(1)
  })

  it('should exclude resolved conflicts', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'conflict', ['hero'], 1, 50)
    const conflictId = s.conflicts[0].id
    s = resolveConflict(s, conflictId, 5, 'Done')
    const conflicts = getConflictStack(s, 10)
    expect(conflicts.length).toBe(0)
  })
})

describe('compareConflictIntensity', () => {
  it('should return 0 for unknown conflicts', () => {
    const s = createEmptyState()
    expect(compareConflictIntensity(s, 'unknown', 'also_unknown')).toBe(0)
  })

  it('should compare intensities', () => {
    let s = createEmptyState()
    s = introduceConflict(s, 'conflict', ['hero'], 1, 60)
    s = introduceConflict(s, 'conflict', ['villain'], 2, 40)
    const diff = compareConflictIntensity(s, s.conflicts[0].id, s.conflicts[1].id)
    expect(diff).toBe(20)
  })
})
