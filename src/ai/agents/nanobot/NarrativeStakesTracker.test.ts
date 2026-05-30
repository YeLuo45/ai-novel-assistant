import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  raiseStakes,
  resolveStakes,
  escalateStakes,
  generateStakesReport,
  getActiveStakes,
  getStakesByLevel,
  compareStakesSeverity,
} from './NarrativeStakesTracker'

describe('createEmptyState', () => {
  it('should create empty stakes state', () => {
    const s = createEmptyState()
    expect(s.stakes).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('raiseStakes', () => {
  it('should raise stakes', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Save the kingdom', 'worldly', 5, 90, 85, 'hero')
    expect(s.stakes.length).toBe(1)
    expect(s.stakes[0].isActive).toBe(true)
    expect(s.stakes[0].intensity).toBe(90)
  })
})

describe('resolveStakes', () => {
  it('should resolve stakes', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Defeat villain', 'personal', 3, 70, 80, 'hero')
    const stakesId = s.stakes[0].id
    s = resolveStakes(s, stakesId, 25)
    expect(s.stakes[0].isActive).toBe(false)
    expect(s.stakes[0].chapterResolved).toBe(25)
  })
})

describe('escalateStakes', () => {
  it('should escalate active stakes', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Win tournament', 'communal', 4, 60, 50, 'hero')
    const stakesId = s.stakes[0].id
    s = escalateStakes(s, stakesId, 25)
    expect(s.stakes[0].intensity).toBe(85)
  })

  it('should cap at 100', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Epic battle', 'worldly', 5, 90, 95, 'hero')
    const stakesId = s.stakes[0].id
    s = escalateStakes(s, stakesId, 20)
    expect(s.stakes[0].intensity).toBe(100)
  })
})

describe('generateStakesReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateStakesReport(s)
    expect(report.totalStakes).toBe(0)
    expect(report.activeStakes).toBe(0)
  })

  it('should calculate stats', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Stakes 1', 'personal', 3, 80, 70, 'hero')
    s = raiseStakes(s, 'Stakes 2', 'worldly', 5, 90, 85, 'hero')
    const stakesId2 = s.stakes[1].id
    s = resolveStakes(s, stakesId2, 20)
    const report = generateStakesReport(s)
    expect(report.totalStakes).toBe(2)
    expect(report.activeStakes).toBe(1)
    expect(report.resolvedStakes).toBe(1)
  })

  it('should identify highest stakes', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Low stakes', 'personal', 2, 40, 30, 'hero')
    s = raiseStakes(s, 'High stakes', 'worldly', 5, 95, 90, 'hero')
    const report = generateStakesReport(s)
    expect(report.highestStakes).toContain('High stakes')
  })
})

describe('getActiveStakes', () => {
  it('should return active stakes only', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Active stake', 'personal', 3, 70, 60, 'hero')
    s = raiseStakes(s, 'Resolved stake', 'personal', 4, 60, 50, 'hero')
    const resolvedId = s.stakes[1].id
    s = resolveStakes(s, resolvedId, 20)
    const active = getActiveStakes(s)
    expect(active.length).toBe(1)
  })
})

describe('getStakesByLevel', () => {
  it('should filter by level', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Personal thing', 'personal', 2, 50, 40, 'hero')
    s = raiseStakes(s, 'World event', 'worldly', 5, 85, 80, 'hero')
    const worldly = getStakesByLevel(s, 'worldly')
    expect(worldly.length).toBe(1)
    expect(worldly[0].stakeLevel).toBe('worldly')
  })
})

describe('compareStakesSeverity', () => {
  it('should compare severity', () => {
    let s = createEmptyState()
    s = raiseStakes(s, 'Minor', 'personal', 2, 50, 30, 'hero')
    s = raiseStakes(s, 'Severe', 'worldly', 5, 90, 95, 'hero')
    const [id1, id2] = [s.stakes[0].id, s.stakes[1].id]
    const result = compareStakesSeverity(s, id1, id2)
    expect(result.moreSevere).toBe(id2)
    expect(result.severity2).toBe(95)
  })
})
