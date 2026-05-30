import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addMotifInstance,
  setArchetype,
  generateMotifReport,
  getMotifByName,
} from './NarrativeMotifEngine'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const s = createEmptyState()
    expect(s.motifs).toEqual([])
  })
})

describe('addMotifInstance', () => {
  it('should add motif instance', () => {
    let s = createEmptyState()
    s = addMotifInstance(s, 'journey', 5, 'road', 60, 'heroic')
    expect(s.motifs.length).toBe(1)
    expect(s.motifs[0].motifName).toBe('journey')
    expect(s.motifs[0].frequencyScore).toBe(10)
  })

  it('should accumulate instances', () => {
    let s = createEmptyState()
    s = addMotifInstance(s, 'journey', 5, 'road', 60, null)
    s = addMotifInstance(s, 'journey', 15, 'path', 70, null)
    s = addMotifInstance(s, 'journey', 25, 'trail', 80, null)
    expect(s.motifs[0].instances.length).toBe(3)
    expect(s.motifs[0].frequencyScore).toBe(30)
  })
})

describe('setArchetype', () => {
  it('should set cultural archetype', () => {
    let s = createEmptyState()
    s = addMotifInstance(s, 'journey', 5, 'road', 60, null)
    s = setArchetype(s, 'journey', 'heroic')
    const journey = getMotifByName(s, 'journey')
    expect(journey!.culturalArchetype).toBe('heroic')
  })
})

describe('generateMotifReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateMotifReport(s)
    expect(report.totalMotifs).toBe(0)
    expect(report.mostRecurring).toBeNull()
  })

  it('should identify most recurring motif', () => {
    let s = createEmptyState()
    s = addMotifInstance(s, 'journey', 5, 'road', 60, null)
    s = addMotifInstance(s, 'journey', 10, 'path', 70, null)
    s = addMotifInstance(s, 'death', 20, 'end', 50, null)
    const report = generateMotifReport(s)
    expect(report.totalMotifs).toBe(2)
    expect(report.mostRecurring).toBe('journey')
  })
})

describe('getMotifByName', () => {
  it('should return motif', () => {
    let s = createEmptyState()
    s = addMotifInstance(s, 'journey', 5, 'road', 60, null)
    const journey = getMotifByName(s, 'journey')
    expect(journey).not.toBeNull()
    expect(journey!.motifName).toBe('journey')
  })

  it('should return null for missing', () => {
    let s = createEmptyState()
    expect(getMotifByName(s, 'nonexistent')).toBeNull()
  })
})
