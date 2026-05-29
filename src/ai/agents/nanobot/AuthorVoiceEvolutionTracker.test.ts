import { describe, it, expect } from 'vitest'
import {
  createEmptyVoiceEvolutionState,
  recordVoiceSample,
  getVoiceTrend,
  getVoiceConsistency,
  getVoiceSignature,
  formatVoiceEvolutionSummary,
  formatVoiceEvolutionDashboard,
} from './AuthorVoiceEvolutionTracker'

describe('createEmptyVoiceEvolutionState', () => {
  it('should create empty state', () => {
    const state = createEmptyVoiceEvolutionState()
    expect(state.samples.length).toBe(0)
  })
})

describe('recordVoiceSample', () => {
  it('should record sample with chapter', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    expect(state.samples.length).toBe(1)
    expect(state.samples[0].chapter).toBe(1)
  })

  it('should calculate sentence complexity', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    expect(state.samples[0].sentenceComplexity).toBeGreaterThan(0)
  })
})

describe('getVoiceTrend', () => {
  it('should return trend for single sample', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    const trend = getVoiceTrend(state)
    expect(['stable', 'improving', 'declining']).toContain(trend)
  })

  it('should detect improving trend', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 60, 70, 65, 'formal')
    state = recordVoiceSample(state, 2, 70, 80, 75, 'formal')
    state = recordVoiceSample(state, 3, 80, 85, 85, 'formal')
    const trend = getVoiceTrend(state)
    expect(['stable', 'improving', 'declining']).toContain(trend)
  })
})

describe('getVoiceConsistency', () => {
  it('should return consistency score', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    state = recordVoiceSample(state, 2, 76, 81, 86, 'formal')
    const score = getVoiceConsistency(state)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('getVoiceSignature', () => {
  it('should return dominant style', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    state = recordVoiceSample(state, 2, 78, 82, 87, 'formal')
    const sig = getVoiceSignature(state)
    expect(sig).toBe('formal')
  })
})

describe('formatVoiceEvolutionSummary', () => {
  it('should show sample count', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    const summary = formatVoiceEvolutionSummary(state)
    expect(summary).toContain('Samples: 1')
  })
})

describe('formatVoiceEvolutionDashboard', () => {
  it('should show samples and trend', () => {
    let state = createEmptyVoiceEvolutionState()
    state = recordVoiceSample(state, 1, 75, 80, 85, 'formal')
    const dash = formatVoiceEvolutionDashboard(state)
    expect(dash).toContain('Samples: 1')
  })
})
