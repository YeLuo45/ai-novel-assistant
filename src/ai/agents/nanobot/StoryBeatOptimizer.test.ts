import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  addBeat,
  createSequence,
  optimizeBeatOrder,
  calculatePacingScore,
  findOptimalBeatPlacement,
  balanceEmotionalTone,
  validateSequence,
  getSequenceSummary,
} from './StoryBeatOptimizer'
import type { StoryBeat } from './StoryBeatOptimizer'

const makeBeat = (id: string, type: StoryBeat['type'], importance = 5, duration = 1000): StoryBeat => ({
  beatId: id, type, importance, durationEstimate: duration, emotionalTone: 'neutral', characters: [], sceneId: 's1'
})

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.beatLibrary.size).toBe(0)
    expect(state.currentSequence).toBeNull()
    expect(state.typeAlias).toEqual({})
  })
})

describe('addBeat', () => {
  it('should add beat to library', () => {
    let state = createEmptyState()
    const beat = makeBeat('b1', 'hook')
    state = addBeat(state, beat)
    expect(state.beatLibrary.get('b1')).toEqual(beat)
  })
})

describe('createSequence', () => {
  it('should create sequence from beat IDs', () => {
    let state = createEmptyState()
    state = addBeat(state, makeBeat('b1', 'hook'))
    state = addBeat(state, makeBeat('b2', 'climax'))
    const seq = createSequence(state, ['b1', 'b2'])
    expect(seq).not.toBeNull()
    expect(seq!.beats.length).toBe(2)
  })

  it('should return null for unknown beat', () => {
    let state = createEmptyState()
    const seq = createSequence(state, ['unknown'])
    expect(seq).toBeNull()
  })
})

describe('optimizeBeatOrder', () => {
  it('should place hook first', () => {
    let state = createEmptyState()
    state = addBeat(state, makeBeat('climax', 'climax'))
    state = addBeat(state, makeBeat('hook', 'hook'))
    state = addBeat(state, makeBeat('resolution', 'resolution'))
    const result = optimizeBeatOrder(state, ['climax', 'hook', 'resolution'])
    expect(result.sequence.beats[0].type).toBe('hook')
  })

  it('should place climax at 75%', () => {
    let state = createEmptyState()
    for (const id of ['b1', 'b2', 'b3', 'b4']) {
      state = addBeat(state, makeBeat(id, 'complication'))
    }
    state = addBeat(state, makeBeat('climax', 'climax'))
    state = addBeat(state, makeBeat('hook', 'hook'))
    state = addBeat(state, makeBeat('resolution', 'resolution'))
    const result = optimizeBeatOrder(state, ['b1', 'b2', 'b3', 'b4', 'climax', 'hook', 'resolution'])
    const climaxIdx = result.sequence.beats.findIndex(b => b.type === 'climax')
    expect(climaxIdx).toBeGreaterThan(0)
  })

  it('should return improvements list', () => {
    let state = createEmptyState()
    const result = optimizeBeatOrder(state, [])
    expect(result.improvements.length).toBeGreaterThan(0)
  })
})

describe('calculatePacingScore', () => {
  it('should return 0 for empty sequence', () => {
    const score = calculatePacingScore({ beats: [], totalDuration: 0, pacingScore: 0, tensionArc: [] })
    expect(score).toBe(0)
  })

  it('should score high for complete structure', () => {
    const seq = {
      beats: [makeBeat('h', 'hook'), makeBeat('c', 'climax'), makeBeat('r', 'resolution')],
      totalDuration: 3000,
      pacingScore: 0,
      tensionArc: [30, 95, 20],
    }
    const score = calculatePacingScore(seq)
    expect(score).toBeGreaterThan(50)
  })
})

describe('findOptimalBeatPlacement', () => {
  it('should place hook at position 0', () => {
    let state = createEmptyState()
    state = addBeat(state, makeBeat('b1', 'complication'))
    state = addBeat(state, makeBeat('b2', 'climax'))
    const result = findOptimalBeatPlacement(state, 'b1', { beats: [makeBeat('b2', 'climax')], totalDuration: 1000, pacingScore: 50, tensionArc: [95] })
    expect(result.position).toBe(0)
  })

  it('should place climax at 75%', () => {
    let state = createEmptyState()
    state = addBeat(state, makeBeat('climax', 'climax'))
    const beats = [makeBeat('b1', 'complication'), makeBeat('b2', 'setup')]
    const result = findOptimalBeatPlacement(state, 'climax', { beats, totalDuration: 2000, pacingScore: 50, tensionArc: [50, 40] })
    expect(result.position).toBe(Math.floor(beats.length * 0.75))
  })
})

describe('balanceEmotionalTone', () => {
  it('should return balanced for empty sequence', () => {
    const result = balanceEmotionalTone({ beats: [], totalDuration: 0, pacingScore: 0, tensionArc: [] })
    expect(result.balanced).toBe(true)
  })
})

describe('validateSequence', () => {
  it('should return error for empty sequence', () => {
    const result = validateSequence({ beats: [], totalDuration: 0, pacingScore: 0, tensionArc: [] })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Empty sequence')
  })

  it('should warn about missing resolution', () => {
    const seq = {
      beats: [makeBeat('h', 'hook'), makeBeat('c', 'climax')],
      totalDuration: 2000, pacingScore: 50, tensionArc: [30, 95]
    }
    const result = validateSequence(seq)
    expect(result.warnings.some(w => w.includes('resolution'))).toBe(true)
  })

  it('should pass for complete structure', () => {
    const seq = {
      beats: [makeBeat('h', 'hook'), makeBeat('c', 'climax'), makeBeat('r', 'resolution')],
      totalDuration: 3000, pacingScore: 75, tensionArc: [30, 95, 20]
    }
    const result = validateSequence(seq)
    expect(result.valid).toBe(true)
  })
})

describe('getSequenceSummary', () => {
  it('should return summary for sequence', () => {
    const seq = {
      beats: [makeBeat('h', 'hook'), makeBeat('c', 'climax'), makeBeat('r', 'resolution')],
      totalDuration: 3000, pacingScore: 75, tensionArc: [30, 95, 20]
    }
    const summary = getSequenceSummary(seq)
    expect(summary.beatCount).toBe(3)
    expect(summary.structureQuality).toBe('complete')
  })
})
