import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  plantForeshadow,
  payOffForeshadow,
  generateForeshadowReport,
  getPendingForeshadows,
  getForeshadowByType,
  getPayoffTiming,
} from './NarrativeForeshadowingWeaver'

describe('createEmptyState', () => {
  it('should create empty foreshadow state', () => {
    const s = createEmptyState()
    expect(s.instances).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('plantForeshadow', () => {
  it('should plant foreshadowing', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Strange omen', 'symbolic', 5, 75, 'narrator')
    expect(s.instances.length).toBe(1)
    expect(s.instances[0].isPaidOff).toBe(false)
    expect(s.instances[0].subtlety).toBe(75)
  })
})

describe('payOffForeshadow', () => {
  it('should mark foreshadowing as paid off', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Mysterious stranger', 'dialogue', 3, 60, 'hero')
    const foreshadowId = s.instances[0].id
    s = payOffForeshadow(s, foreshadowId, 25, 85)
    expect(s.instances[0].isPaidOff).toBe(true)
    expect(s.instances[0].chapterPayoff).toBe(25)
    expect(s.instances[0].effectiveness).toBe(85)
  })
})

describe('generateForeshadowReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateForeshadowReport(s)
    expect(report.totalForeshadows).toBe(0)
    expect(report.avgSubtlety).toBe(50)
  })

  it('should calculate stats', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Foreshadow 1', 'literal', 3, 70, 'hero')
    s = plantForeshadow(s, 'Foreshadow 2', 'symbolic', 5, 55, 'narrator')
    const fId2 = s.instances[1].id
    s = payOffForeshadow(s, fId2, 20, 80)
    const report = generateForeshadowReport(s)
    expect(report.totalForeshadows).toBe(2)
    expect(report.paidOffForeshadows).toBe(1)
    expect(report.pendingForeshadows).toBe(1)
  })

  it('should identify dense regions', () => {
    let s = createEmptyState()
    for (let i = 0; i < 4; i++) {
      s = plantForeshadow(s, `Foreshadow ${i}`, 'symbolic', 7, 60, 'hero')
    }
    const report = generateForeshadowReport(s)
    expect(report.denseRegions).toContain(7)
  })
})

describe('getPendingForeshadows', () => {
  it('should return unpaid foreshadows', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Pending', 'symbolic', 3, 60, 'hero')
    s = plantForeshadow(s, 'Paid', 'dialogue', 5, 70, 'hero')
    const paidId = s.instances[1].id
    s = payOffForeshadow(s, paidId, 20, 80)
    const pending = getPendingForeshadows(s)
    expect(pending.length).toBe(1)
    expect(pending[0].hint).toBe('Pending')
  })
})

describe('getForeshadowByType', () => {
  it('should filter by type', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Dialogue hint', 'dialogue', 2, 65, 'hero')
    s = plantForeshadow(s, 'Symbolic hint', 'symbolic', 4, 55, 'narrator')
    const dialogue = getForeshadowByType(s, 'dialogue')
    expect(dialogue.length).toBe(1)
    expect(dialogue[0].foreshadowType).toBe('dialogue')
  })
})

describe('getPayoffTiming', () => {
  it('should calculate timing', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Mystery', 'literal', 5, 80, 'hero')
    const fId = s.instances[0].id
    s = payOffForeshadow(s, fId, 20, 85)
    const timing = getPayoffTiming(s, fId)
    expect(timing).toBe(15)  // 20 - 5
  })

  it('should return null for unpaid', () => {
    let s = createEmptyState()
    s = plantForeshadow(s, 'Unpaid', 'symbolic', 3, 60, 'hero')
    const fId = s.instances[0].id
    expect(getPayoffTiming(s, fId)).toBeNull()
  })
})
