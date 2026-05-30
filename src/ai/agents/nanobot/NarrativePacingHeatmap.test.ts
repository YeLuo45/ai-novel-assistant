import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addPacingPoint,
  generateChapterPacing,
  analyzePacing,
  getChapterHeatmap,
  compareChapterRhythm,
} from './NarrativePacingHeatmap'

describe('createEmptyState', () => {
  it('should create empty pacing state', () => {
    const s = createEmptyState()
    expect(s.points).toEqual([])
    expect(s.chapters).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('addPacingPoint', () => {
  it('should add pacing point', () => {
    let s = createEmptyState()
    s = addPacingPoint(s, 'ch1', 50, 80, 'action')
    expect(s.points.length).toBe(1)
    expect(s.points[0].energy).toBe(80)
  })

  it('should clamp values', () => {
    let s = createEmptyState()
    s = addPacingPoint(s, 'ch1', 150, 120, 'exposition')
    expect(s.points[0].position).toBe(100)
    expect(s.points[0].energy).toBe(100)
  })
})

describe('generateChapterPacing', () => {
  it('should return default for unknown chapter', () => {
    const s = createEmptyState()
    const pacing = generateChapterPacing(s, 'unknown')
    expect(pacing.averageEnergy).toBe(50)
    expect(pacing.rhythmScore).toBe(50)
  })

  it('should analyze chapter pacing', () => {
    let s = createEmptyState()
    s = addPacingPoint(s, 'ch1', 10, 30, 'reflection')
    s = addPacingPoint(s, 'ch1', 50, 70, 'action')
    s = addPacingPoint(s, 'ch1', 90, 50, 'dialogue')
    const pacing = generateChapterPacing(s, 'ch1')
    expect(pacing.averageEnergy).toBe(50)
    expect(pacing.peakEnergy).toBe(70)
    expect(pacing.lowEnergy).toBe(30)
  })
})

describe('analyzePacing', () => {
  it('should analyze all chapters', () => {
    let s = createEmptyState()
    s = addPacingPoint(s, 'ch1', 50, 60, 'action')
    s = addPacingPoint(s, 'ch2', 50, 40, 'reflection')
    s = analyzePacing(s)
    expect(s.report).not.toBeNull()
    expect(s.report!.totalChapters).toBe(2)
    expect(s.report!.pacingTypesUsed).toContain('action')
  })
})

describe('getChapterHeatmap', () => {
  it('should return sorted points', () => {
    let s = createEmptyState()
    s = addPacingPoint(s, 'ch1', 80, 70, 'action')
    s = addPacingPoint(s, 'ch1', 20, 40, 'reflection')
    const heatmap = getChapterHeatmap(s, 'ch1')
    expect(heatmap[0].position).toBe(20)
    expect(heatmap[1].position).toBe(80)
  })
})

describe('compareChapterRhythm', () => {
  it('should compare rhythm scores', () => {
    let s = createEmptyState()
    s = addPacingPoint(s, 'ch1', 10, 40, 'action')
    s = addPacingPoint(s, 'ch1', 30, 70, 'action')
    s = addPacingPoint(s, 'ch1', 50, 90, 'action')
    s = addPacingPoint(s, 'ch1', 70, 70, 'action')
    s = addPacingPoint(s, 'ch1', 90, 40, 'action')
    s = addPacingPoint(s, 'ch2', 50, 50, 'reflection')
    s = analyzePacing(s)
    const result = compareChapterRhythm(s, 'ch1', 'ch2')
    expect(result.betterRhythm).toBe('ch1')
    expect(result.score1).toBeGreaterThan(result.score2)
  })
})
