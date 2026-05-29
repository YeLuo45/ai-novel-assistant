import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  defineRelationship,
  recordInteraction,
  getRelationship,
  getTension,
  analyzeConflictPotential,
  getAlliedCharacters,
  getRivalCharacters,
  getRelationshipSummary,
} from './CharacterRelationshipAnalyzer'

describe('createEmptyState', () => {
  it('should create empty relationship state', () => {
    const s = createEmptyState()
    expect(s.relationships).toEqual({})
    expect(s.currentTensions).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('defineRelationship', () => {
  it('should define a relationship', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'ally', 50)
    const rel = getRelationship(s, 'alice', 'bob')
    expect(rel).not.toBeNull()
    expect(rel!.type).toBe('ally')
    expect(rel!.strength).toBe(50)
  })

  it('should be symmetric', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'enemy', -60)
    const rel = getRelationship(s, 'bob', 'alice')
    expect(rel).not.toBeNull()
    expect(rel!.strength).toBe(-60)
  })
})

describe('recordInteraction', () => {
  it('should record positive interaction', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'ally', 30)
    s = recordInteraction(s, 'alice', 'bob', 'positive', 'Worked together')
    const rel = getRelationship(s, 'alice', 'bob')
    expect(rel!.history.length).toBe(1)
    expect(rel!.strength).toBeGreaterThan(30)
  })

  it('should record negative interaction', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'rival', -30)
    s = recordInteraction(s, 'alice', 'bob', 'negative', 'Argued fiercely')
    const rel = getRelationship(s, 'alice', 'bob')
    expect(rel!.strength).toBeLessThan(-30)
  })
})

describe('getTension', () => {
  it('should return 0 for unknown pair', () => {
    const s = createEmptyState()
    expect(getTension(s, 'alice', 'bob')).toBe(0)
  })

  it('should track tension from negative strength', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'enemy', -80)
    // tension is based on negative strength: Math.abs(-80) = 80
    expect(getTension(s, 'alice', 'bob')).toBeGreaterThanOrEqual(50)
  })
})

describe('analyzeConflictPotential', () => {
  it('should return low for no relationship', () => {
    const s = createEmptyState()
    const result = analyzeConflictPotential(s, 'alice', 'bob')
    expect(result.potential).toBe('low')
  })

  it('should detect high potential from enemy type', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'enemy', -80)
    const result = analyzeConflictPotential(s, 'alice', 'bob')
    expect(['high', 'medium'].includes(result.potential)).toBe(true)
  })
})

describe('getAlliedCharacters', () => {
  it('should return empty for unknown character', () => {
    const s = createEmptyState()
    expect(getAlliedCharacters(s, 'unknown')).toEqual([])
  })

  it('should return allies for known character', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'ally', 50)
    s = defineRelationship(s, 'alice', 'charlie', 'enemy', -50)
    const allies = getAlliedCharacters(s, 'alice')
    expect(allies).toContain('bob')
    expect(allies).not.toContain('charlie')
  })
})

describe('getRivalCharacters', () => {
  it('should return rivals', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'rival', -40)
    const rivals = getRivalCharacters(s, 'alice')
    expect(rivals).toContain('bob')
  })
})

describe('getRelationshipSummary', () => {
  it('should return comprehensive summary', () => {
    let s = createEmptyState()
    s = defineRelationship(s, 'alice', 'bob', 'ally', 60)
    s = defineRelationship(s, 'alice', 'charlie', 'rival', -50)
    const summary = getRelationshipSummary(s, 'alice')
    expect(summary.totalRelationships).toBe(2)
    expect(summary.allies).toBe(1)
    expect(summary.rivals).toBe(1)
  })
})
