import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addBeat,
  createSequence,
  addBeatToSequence,
  calculateRhythmScore,
  optimizeBeatOrder,
  getBeatTypeDistribution,
  getMissingBeatTypes,
  recommendNextBeatType,
  suggestBeatsForChapter,
  analyzeBeatPacing,
  getBeatStatistics,
} from './StoryBeatOptimizer'

describe('createEmptyState', () => {
  it('should create empty optimizer state', () => {
    const s = createEmptyState()
    expect(s.beats).toEqual([])
    expect(s.sequences).toEqual([])
    expect(s.currentSequenceId).toBeNull()
    expect(s.typeAlias).toEqual({})
  })
})

describe('addBeat', () => {
  it('should add a beat with generated id', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'Opening hook', priority: 90, estimatedLength: 500 })
    expect(s.beats.length).toBe(1)
    expect(s.beats[0].id).toBeTruthy()
    expect(s.beats[0].type).toBe('hook')
  })
})

describe('createSequence', () => {
  it('should create a new sequence', () => {
    let s = createEmptyState()
    s = createSequence(s, 'three_act')
    expect(s.sequences.length).toBe(1)
    expect(s.sequences[0].structureType).toBe('three_act')
    expect(s.currentSequenceId).toBeTruthy()
  })
})

describe('addBeatToSequence', () => {
  it('should add beat to current sequence', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'Test', priority: 80, estimatedLength: 500 })
    const beatId = s.beats[0].id
    s = createSequence(s, 'three_act')
    s = addBeatToSequence(s, beatId)
    expect(s.sequences[0].beats.length).toBe(1)
    expect(s.sequences[0].totalEstimatedWords).toBe(500)
  })
})

describe('calculateRhythmScore', () => {
  it('should return 50 for insufficient beats', () => {
    const score = calculateRhythmScore([])
    expect(score).toBe(50)
  })

  it('should penalize missing hook at start', () => {
    const beats = [
      { id: '1', type: 'rising_action', description: 'Test', priority: 70, estimatedLength: 500 },
      { id: '2', type: 'climax', description: 'Test', priority: 80, estimatedLength: 500 },
      { id: '3', type: 'resolution', description: 'Test', priority: 60, estimatedLength: 500 },
    ]
    const score = calculateRhythmScore(beats)
    expect(score).toBeLessThan(70)
  })

  it('should give bonus for having climax', () => {
    const beats = [
      { id: '1', type: 'hook', description: 'Test', priority: 90, estimatedLength: 500 },
      { id: '2', type: 'climax', description: 'Test', priority: 80, estimatedLength: 500 },
      { id: '3', type: 'resolution', description: 'Test', priority: 60, estimatedLength: 500 },
    ]
    const score = calculateRhythmScore(beats)
    expect(score).toBeGreaterThan(65)
  })

  it('should penalize similar types in a row', () => {
    const beats = [
      { id: '1', type: 'hook', description: 'Test', priority: 90, estimatedLength: 500 },
      { id: '2', type: 'rising_action', description: 'Test', priority: 80, estimatedLength: 500 },
      { id: '3', type: 'rising_action', description: 'Test', priority: 75, estimatedLength: 500 },
      { id: '4', type: 'resolution', description: 'Test', priority: 60, estimatedLength: 500 },
    ]
    const score = calculateRhythmScore(beats)
    expect(score).toBeLessThan(75)
  })
})

describe('optimizeBeatOrder', () => {
  it('should place hook first', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'rising_action', description: 'R1', priority: 80, estimatedLength: 500 })
    s = addBeat(s, { type: 'hook', description: 'Hook', priority: 90, estimatedLength: 300 })
    s = addBeat(s, { type: 'climax', description: 'Climax', priority: 85, estimatedLength: 600 })
    const ids = s.beats.map(b => b.id)
    s = createSequence(s, 'three_act')
    for (const id of ids) s = addBeatToSequence(s, id)
    s = optimizeBeatOrder(s, s.currentSequenceId!)
    expect(s.sequences[0].beats[0].type).toBe('hook')
  })
})

describe('getBeatTypeDistribution', () => {
  it('should count beats by type', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'H', priority: 90, estimatedLength: 500 })
    s = addBeat(s, { type: 'rising_action', description: 'R', priority: 80, estimatedLength: 500 })
    s = addBeat(s, { type: 'rising_action', description: 'R2', priority: 75, estimatedLength: 500 })
    s = createSequence(s, 'three_act')
    for (const b of s.beats) s = addBeatToSequence(s, b.id)
    const dist = getBeatTypeDistribution(s, s.currentSequenceId!)
    expect(dist.hook).toBe(1)
    expect(dist.rising_action).toBe(2)
  })
})

describe('getMissingBeatTypes', () => {
  it('should identify missing types for three_act', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'H', priority: 90, estimatedLength: 500 })
    s = createSequence(s, 'three_act')
    s = addBeatToSequence(s, s.beats[0].id)
    const missing = getMissingBeatTypes(s, s.currentSequenceId!)
    expect(missing).toContain('rising_action')
    expect(missing).toContain('climax')
  })
})

describe('recommendNextBeatType', () => {
  it('should recommend hook if missing', () => {
    let s = createEmptyState()
    s = createSequence(s, 'three_act')
    const rec = recommendNextBeatType(s, s.currentSequenceId!)
    expect(rec).toBe('hook')
  })

  it('should recommend climax after rising_action', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'H', priority: 90, estimatedLength: 500 })
    s = addBeat(s, { type: 'rising_action', description: 'R', priority: 80, estimatedLength: 500 })
    s = createSequence(s, 'three_act')
    for (const b of s.beats) s = addBeatToSequence(s, b.id)
    const rec = recommendNextBeatType(s, s.currentSequenceId!)
    expect(rec).toBe('climax')
  })
})

describe('suggestBeatsForChapter', () => {
  it('should suggest fewer beats for short chapter', () => {
    const s = createEmptyState()
    const sug = suggestBeatsForChapter(s, 'ch1', 500)
    expect(sug.length).toBe(1)
    expect(sug[0].type).toBe('turning_point')
  })

  it('should suggest full structure for long chapter', () => {
    const s = createEmptyState()
    const sug = suggestBeatsForChapter(s, 'ch1', 3000)
    expect(sug.length).toBe(3)
    expect(sug[0].type).toBe('hook')
    expect(sug[1].type).toBe('rising_action')
    expect(sug[2].type).toBe('resolution')
  })
})

describe('analyzeBeatPacing', () => {
  it('should return balanced for good pacing', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'H', priority: 90, estimatedLength: 500 })
    s = addBeat(s, { type: 'rising_action', description: 'R', priority: 80, estimatedLength: 500 })
    s = addBeat(s, { type: 'climax', description: 'C', priority: 85, estimatedLength: 600 })
    s = addBeat(s, { type: 'falling_action', description: 'F', priority: 70, estimatedLength: 400 })
    s = addBeat(s, { type: 'resolution', description: 'Res', priority: 60, estimatedLength: 500 })
    s = createSequence(s, 'three_act')
    for (const b of s.beats) s = addBeatToSequence(s, b.id)
    const result = analyzeBeatPacing(s, s.currentSequenceId!)
    expect(result.balanced).toBe(true)
  })
})

describe('getBeatStatistics', () => {
  it('should return null for unknown sequence', () => {
    const s = createEmptyState()
    const stats = getBeatStatistics(s, 'unknown')
    expect(stats).toBeNull()
  })

  it('should return comprehensive statistics', () => {
    let s = createEmptyState()
    s = addBeat(s, { type: 'hook', description: 'H', priority: 90, estimatedLength: 500 })
    s = addBeat(s, { type: 'climax', description: 'C', priority: 85, estimatedLength: 600 })
    s = createSequence(s, 'three_act')
    for (const b of s.beats) s = addBeatToSequence(s, b.id)
    s = optimizeBeatOrder(s, s.currentSequenceId!)
    const stats = getBeatStatistics(s, s.currentSequenceId!)
    expect(stats).not.toBeNull()
    expect(stats!.totalBeats).toBe(2)
    expect(stats!.totalWords).toBe(1100)
  })
})
