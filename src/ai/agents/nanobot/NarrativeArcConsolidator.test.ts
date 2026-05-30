import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createArc,
  windUpArc,
  resolveArc,
  abandonArc,
  generateArcReport,
  getArcsByType,
  getUnresolvedArcs,
} from './NarrativeArcConsolidator'

describe('createEmptyState', () => {
  it('should create empty arc state', () => {
    const s = createEmptyState()
    expect(s.arcs).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('createArc', () => {
  it('should create an arc', () => {
    let s = createEmptyState()
    s = createArc(s, 'main', 'Hero Journey', [1, 5, 10])
    expect(s.arcs.length).toBe(1)
    expect(s.arcs[0].arcType).toBe('main')
    expect(s.arcs[0].status).toBe('active')
  })
})

describe('windUpArc', () => {
  it('should wind up an arc', () => {
    let s = createEmptyState()
    s = createArc(s, 'romantic', 'Romance Arc', [5, 10, 15])
    const arcId = s.arcs[0].id
    s = windUpArc(s, arcId, 85)
    expect(s.arcs[0].status).toBe('wound_up')
    expect(s.arcs[0].payoffWeight).toBe(85)
  })
})

describe('resolveArc', () => {
  it('should resolve an arc', () => {
    let s = createEmptyState()
    s = createArc(s, 'character', 'Growth Arc', [1, 20])
    const arcId = s.arcs[0].id
    s = windUpArc(s, arcId, 75)
    s = resolveArc(s, arcId, 90)
    expect(s.arcs[0].status).toBe('resolved')
    expect(s.arcs[0].emotionalResonance).toBe(90)
  })
})

describe('abandonArc', () => {
  it('should abandon an arc', () => {
    let s = createEmptyState()
    s = createArc(s, 'subplot', 'Dropped Subplot', [5, 8])
    const arcId = s.arcs[0].id
    s = abandonArc(s, arcId)
    expect(s.arcs[0].status).toBe('abandoned')
  })
})

describe('generateArcReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateArcReport(s)
    expect(report.totalArcs).toBe(0)
    expect(report.resolvedArcs).toBe(0)
  })

  it('should calculate stats', () => {
    let s = createEmptyState()
    s = createArc(s, 'main', 'Main', [1, 30])
    s = createArc(s, 'romantic', 'Romance', [5, 25])
    const mainId = s.arcs[0].id
    const romId = s.arcs[1].id
    s = windUpArc(s, mainId, 80)
    s = resolveArc(s, mainId, 85)
    s = windUpArc(s, romId, 75)
    s = resolveArc(s, romId, 80)
    const report = generateArcReport(s)
    expect(report.totalArcs).toBe(2)
    expect(report.resolvedArcs).toBe(2)
  })

  it('should warn about abandoned arcs', () => {
    let s = createEmptyState()
    s = createArc(s, 'main', 'Main', [1, 30])
    s = createArc(s, 'subplot', 'Sub', [5, 10])
    const subId = s.arcs[1].id
    s = abandonArc(s, subId)
    const report = generateArcReport(s)
    expect(report.abandonedArcs).toBe(1)
    expect(report.recommendations.some(r => r.includes('abandoned'))).toBe(true)
  })
})

describe('getArcsByType', () => {
  it('should filter by type', () => {
    let s = createEmptyState()
    s = createArc(s, 'main', 'Main Arc', [1, 30])
    s = createArc(s, 'romantic', 'Romance', [5, 20])
    const mainArcs = getArcsByType(s, 'main')
    expect(mainArcs.length).toBe(1)
    expect(mainArcs[0].name).toBe('Main Arc')
  })
})

describe('getUnresolvedArcs', () => {
  it('should return unresolved arcs', () => {
    let s = createEmptyState()
    s = createArc(s, 'main', 'Main', [1, 30])
    s = createArc(s, 'thematic', 'Theme', [5, 25])
    const mainId = s.arcs[0].id
    s = resolveArc(s, mainId, 85)
    const unresolved = getUnresolvedArcs(s)
    expect(unresolved.length).toBe(1)
    expect(unresolved[0].name).toBe('Theme')
  })
})
