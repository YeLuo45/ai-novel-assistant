import { describe, it, expect } from 'vitest'
import {
  createEmptyVoiceConsistencyState,
  registerCharacter,
  recordVoiceSample,
  getConsistencyScore,
  formatVoiceSummary,
  formatVoiceDashboard,
} from './VoiceConsistencyEngine'

describe('createEmptyVoiceConsistencyState', () => {
  it('should create empty state', () => {
    const state = createEmptyVoiceConsistencyState()
    expect(state.samples.length).toBe(0)
    expect(state.profiles.size).toBe(0)
    expect(state.averageConsistency).toBe(100)
  })
})

describe('registerCharacter', () => {
  it('should register character with voice profile', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like to discuss this matter with you')
    expect(state.profiles.size).toBe(1)
    expect(state.profiles.get('alice')).not.toBeUndefined()
  })

  it('should set vocabulary level', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'The sophisticated deliberation was quite comprehensive')
    expect(state.profiles.get('alice')?.vocabularyLevel).toBeGreaterThan(5)
  })

  it('should detect formal speech traits', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'Therefore, I would appreciate your consideration')
    const traits = state.profiles.get('alice')?.speechTraits || []
    expect(traits.length).toBeGreaterThan(0)
  })

  it('should set formality level', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would indeed appreciate your consideration')
    expect(state.profiles.get('alice')?.formalityLevel).toBeGreaterThan(5)
  })

  it('should set sentence length', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'The weather is nice today.')
    expect(state.profiles.get('alice')?.sentenceLengthAvg).toBeGreaterThan(0)
  })
})

describe('recordVoiceSample', () => {
  it('should add voice sample for registered character', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like to discuss this')
    state = recordVoiceSample(state, 'alice', 1, 'I would indeed appreciate your consideration')
    expect(state.samples.length).toBe(1)
  })

  it('should return unchanged state for unregistered character', () => {
    let state = createEmptyVoiceConsistencyState()
    const newState = recordVoiceSample(state, 'unknown', 1, 'Some text')
    expect(newState.samples.length).toBe(0)
  })

  it('should calculate consistency score', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would indeed appreciate your consideration')
    state = recordVoiceSample(state, 'alice', 1, 'I would indeed appreciate your consideration')
    expect(state.samples[0].consistencyScore).toBeGreaterThan(70)
  })

  it('should update current chapter', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    state = recordVoiceSample(state, 'alice', 5, 'I would indeed appreciate your consideration')
    expect(state.currentChapter).toBe(5)
  })

  it('should update average consistency', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    state = recordVoiceSample(state, 'alice', 1, 'I would indeed appreciate your consideration')
    expect(state.averageConsistency).toBeGreaterThan(0)
  })
})

describe('getConsistencyScore', () => {
  it('should return 100 for character with no samples', () => {
    const state = createEmptyVoiceConsistencyState()
    expect(getConsistencyScore(state, 'unknown')).toBe(100)
  })

  it('should return average consistency for character', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    const formalText = 'I would indeed appreciate your consideration'
    state = registerCharacter(state, 'alice', formalText)
    state = recordVoiceSample(state, 'alice', 1, formalText)
    state = recordVoiceSample(state, 'alice', 2, formalText)
    expect(getConsistencyScore(state, 'alice')).toBeGreaterThanOrEqual(80)
  })
})

describe('formatVoiceSummary', () => {
  it('should show character count', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    state = registerCharacter(state, 'bob', 'Yeah I kinda wanna talk')
    const summary = formatVoiceSummary(state)
    expect(summary).toContain('Characters: 2')
  })

  it('should show sample count', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    state = recordVoiceSample(state, 'alice', 1, 'I would indeed appreciate your consideration')
    const summary = formatVoiceSummary(state)
    expect(summary).toContain('Samples: 1')
  })

  it('should show average consistency', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    state = recordVoiceSample(state, 'alice', 1, 'I would indeed appreciate your consideration')
    const summary = formatVoiceSummary(state)
    expect(summary).toContain('Avg Consistency:')
  })
})

describe('formatVoiceDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    state = recordVoiceSample(state, 'alice', 3, 'I would indeed appreciate your consideration')
    const dashboard = formatVoiceDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show character voices', () => {
    let state = createEmptyVoiceConsistencyState()
    state = registerCharacter(state, 'alice', 'I would like this')
    const dashboard = formatVoiceDashboard(state)
    expect(dashboard).toContain('Character Voices')
    expect(dashboard).toContain('alice')
  })
})
