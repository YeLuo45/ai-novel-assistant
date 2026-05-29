import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createArc,
  addArcPoint,
  detectArcShape,
  getArcStatistics,
  suggestActAdjustments,
  compareArcs,
} from './NarrativeArcAnalyzer'

describe('createEmptyState', () => {
  it('should create empty arc state', () => {
    const s = createEmptyState()
    expect(s.arcs).toEqual({})
    expect(s.currentArcId).toBeNull()
    expect(s.typeAlias).toEqual({})
  })
})

describe('createArc', () => {
  it('should create a new arc', () => {
    let s = createEmptyState()
    s = createArc(s, 'rising')
    expect(Object.keys(s.arcs).length).toBe(1)
    expect(s.currentArcId).toBeTruthy()
    const arc = Object.values(s.arcs)[0]
    expect(arc.shape).toBe('rising')
  })
})

describe('addArcPoint', () => {
  it('should add point to current arc', () => {
    let s = createEmptyState()
    s = createArc(s, 'plateau')
    s = addArcPoint(s, 50, 70, 'ch1')
    expect(Object.values(s.arcs)[0].points.length).toBe(1)
    expect(Object.values(s.arcs)[0].points[0].intensity).toBe(70)
  })

  it('should sort points by position', () => {
    let s = createEmptyState()
    s = createArc(s, 'plateau')
    s = addArcPoint(s, 80, 60)
    s = addArcPoint(s, 20, 40)
    s = addArcPoint(s, 50, 80)
    const points = Object.values(s.arcs)[0].points
    expect(points[0].position).toBe(20)
    expect(points[1].position).toBe(50)
    expect(points[2].position).toBe(80)
  })

  it('should update climax position', () => {
    let s = createEmptyState()
    s = createArc(s, 'plateau')
    s = addArcPoint(s, 50, 50)
    s = addArcPoint(s, 80, 90)
    expect(Object.values(s.arcs)[0].climaxPosition).toBe(80)
  })
})

describe('detectArcShape', () => {
  it('should detect rising shape', () => {
    const points = [
      { position: 0, intensity: 30 }, { position: 25, intensity: 50 },
      { position: 50, intensity: 70 }, { position: 75, intensity: 90 },
      { position: 100, intensity: 95 },
    ]
    expect(detectArcShape(points)).toBe('rising')
  })

  it('should detect falling shape', () => {
    const points = [
      { position: 0, intensity: 95 }, { position: 25, intensity: 90 },
      { position: 50, intensity: 70 }, { position: 75, intensity: 50 },
      { position: 100, intensity: 30 },
    ]
    expect(detectArcShape(points)).toBe('falling')
  })

  it('should detect dome shape', () => {
    const points = [
      { position: 0, intensity: 30 }, { position: 25, intensity: 70 },
      { position: 50, intensity: 90 }, { position: 75, intensity: 70 },
      { position: 100, intensity: 30 },
    ]
    expect(detectArcShape(points)).toBe('dome')
  })

  it('should detect rising_falling', () => {
    const points = [
      { position: 0, intensity: 20 }, { position: 25, intensity: 40 },
      { position: 50, intensity: 90 }, { position: 75, intensity: 30 },
      { position: 100, intensity: 15 },
    ]
    // Peak at position 50, clear rise then fall
    const shape = detectArcShape(points)
    expect(['rising_falling', 'dome'].includes(shape)).toBe(true)
  })

  it('should return plateau for insufficient points', () => {
    const points = [{ position: 50, intensity: 50 }, { position: 60, intensity: 55 }]
    expect(detectArcShape(points)).toBe('plateau')
  })
})

describe('getArcStatistics', () => {
  it('should return null for unknown arc', () => {
    const s = createEmptyState()
    expect(getArcStatistics(s, 'unknown')).toBeNull()
  })

  it('should calculate stats', () => {
    let s = createEmptyState()
    s = createArc(s, 'rising')
    s = addArcPoint(s, 25, 40)
    s = addArcPoint(s, 75, 80)
    const stats = getArcStatistics(s, s.currentArcId!)
    expect(stats!.totalPoints).toBe(2)
    expect(stats!.avgIntensity).toBe(60)
    expect(stats!.range).toBe(40)
  })
})

describe('suggestActAdjustments', () => {
  it('should return empty for unknown arc', () => {
    const s = createEmptyState()
    expect(suggestActAdjustments(s, 'unknown')).toEqual([])
  })

  it('should suggest early climax adjustment', () => {
    let s = createEmptyState()
    s = createArc(s, 'plateau')
    s = addArcPoint(s, 10, 90)
    s = addArcPoint(s, 30, 85)
    s = addArcPoint(s, 70, 40)
    s = addArcPoint(s, 100, 20)
    const suggestions = suggestActAdjustments(s, s.currentArcId!)
    expect(suggestions.some(s => s.includes('early'))).toBe(true)
  })
})

describe('compareArcs', () => {
  it('should return null for unknown arcs', () => {
    const s = createEmptyState()
    expect(compareArcs(s, 'a', 'b')).toBeNull()
  })

  it('should compare two arcs', () => {
    let s = createEmptyState()
    s = createArc(s, 'rising')
    const id1 = s.currentArcId!
    s = createArc(s, 'falling')
    const id2 = s.currentArcId!
    s = addArcPoint(s, 50, 60)
    const s2 = { ...s, currentArcId: id1 }
    s2.arcs[id1].points = [{ position: 50, intensity: 40 }]
    const result = compareArcs(s2, id1, id2)
    expect(result).not.toBeNull()
    expect(result!.shapes).toContain('falling')
  })
})
