/**
 * NarrativeVoiceConsistencyEngine Tests - V167
 * Tests for Character Voice Consistency & Dialogue Pattern Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyVoiceState,
  createVoiceProfile,
  registerCharacter,
  recordDialogue,
  detectVoiceDrift,
  checkAllDrift,
  compareCharacterVoices,
  formatVoiceProfile,
  formatVoiceDashboard,
} from './NarrativeVoiceConsistencyEngine'

describe('createEmptyVoiceState', () => {
  it('should create empty state', () => {
    const state = createEmptyVoiceState()
    expect(state.profiles.size).toBe(0)
    expect(state.dialogues.size).toBe(0)
    expect(state.globalConsistencyScore).toBe(100)
  })
})

describe('createVoiceProfile', () => {
  it('should create profile with defaults', () => {
    const profile = createVoiceProfile('char_1', 'Alice')
    expect(profile.characterId).toBe('char_1')
    expect(profile.characterName).toBe('Alice')
    expect(profile.formalityLevel).toBe(50)
    expect(profile.vocabularyTypes).toContain('casual')
  })
})

describe('registerCharacter', () => {
  it('should register character', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'hero', 'Hero Character')
    expect(state.profiles.size).toBe(1)
    expect(state.profiles.get('hero')?.characterName).toBe('Hero Character')
  })
})

describe('recordDialogue', () => {
  it('should reject unregistered character', () => {
    const state = createEmptyVoiceState()
    const result = recordDialogue(state, 'unknown', 'Hello there')
    expect(result).toBe(state)
  })

  it('should record dialogue and update profile', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'alice', 'Alice')
    state = recordDialogue(state, 'alice', 'I am so happy to see you today! This is wonderful!')
    expect(state.dialogues.get('alice')?.length).toBe(1)
    expect(state.profiles.get('alice')?.exclamationFrequency).toBeGreaterThan(0.05)
  })

  it('should track emotional tone', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'bob', 'Bob')
    state = recordDialogue(state, 'bob', 'I feel so sad and miserable today. My heart is filled with grief.')
    const entry = state.dialogues.get('bob')?.[0]
    expect(entry?.emotionalTone).toBeLessThan(0)
  })

  it('should detect vocabulary types', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'scholar', 'Scholar')
    state = recordDialogue(state, 'scholar', 'Therefore, we must implement systematic methodology and utilize proper algorithms.')
    const entry = state.dialogues.get('scholar')?.[0]
    expect(entry?.vocabularyTypes).toContain('formal')
    expect(entry?.vocabularyTypes).toContain('technical')
  })
})

describe('detectVoiceDrift', () => {
  it('should return consistent for insufficient data', () => {
    const state = createEmptyVoiceState()
    const status = detectVoiceDrift(state, 'char1')
    expect(status).toBe('consistent')
  })

  it('should detect consistent voice', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'protagonist', 'Protagonist')
    // Record multiple similar dialogues
    for (let i = 0; i < 10; i++) {
      state = { ...state, currentChapter: i + 1 }
      state = recordDialogue(state, 'protagonist', 'I walked through the forest. The trees swayed gently. I felt peaceful and calm.')
    }
    const status = detectVoiceDrift(state, 'protagonist')
    expect(status).toBe('consistent')
  })

  it('should detect drifting voice', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'hero', 'Hero')
    // First 10 chapters - positive consistent tone
    for (let i = 0; i < 10; i++) {
      state = { ...state, currentChapter: i + 1 }
      state = recordDialogue(state, 'hero', 'I feel so happy and wonderful today! The world is beautiful and I am joyful! Everything makes me glad!')
    }
    // Next 10 chapters - completely different negative tone
    for (let i = 10; i < 20; i++) {
      state = { ...state, currentChapter: i + 1 }
      state = recordDialogue(state, 'hero', 'I am angry! I hate this! This is terrible! I despise everything! I am furious and rage!')
    }
    const status = detectVoiceDrift(state, 'hero')
    expect(status).toBe('inconsistent')
  })
})

describe('checkAllDrift', () => {
  it('should update global consistency score', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'alice', 'Alice')
    state = registerCharacter(state, 'bob', 'Bob')
    for (let i = 0; i < 15; i++) {
      state = { ...state, currentChapter: i + 1 }
      state = recordDialogue(state, 'alice', 'Hello! How are you today? I am happy!')
      state = recordDialogue(state, 'bob', 'Good day. How do you do?')
    }
    state = checkAllDrift(state)
    expect(state.globalConsistencyScore).toBeGreaterThan(0)
  })

  it('should generate drift alerts', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'wandering', 'Wandering Character')
    // Create severe drift
    for (let i = 0; i < 10; i++) {
      state = { ...state, currentChapter: i + 1 }
      state = recordDialogue(state, 'wandering', 'I am happy and joyful. Everything is wonderful. I feel so glad and pleased!')
    }
    for (let i = 10; i < 20; i++) {
      state = { ...state, currentChapter: i + 1 }
      state = recordDialogue(state, 'wandering', 'I am angry and furious and rage. I hate this. Everything is terrible. I despise everything!')
    }
    state = checkAllDrift(state)
    expect(state.driftAlerts.length).toBeGreaterThan(0)
  })
})

describe('compareCharacterVoices', () => {
  it('should compare two character voices', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'formal', 'Formal Character')
    state = registerCharacter(state, 'casual', 'Casual Character')
    state = { ...state, profiles: new Map([
      ['formal', { ...state.profiles.get('formal')!, formalityLevel: 85, avgSentenceLength: 25 }],
      ['casual', { ...state.profiles.get('casual')!, formalityLevel: 25, avgSentenceLength: 12 }],
    ])}
    const result = compareCharacterVoices(state, 'formal', 'casual')
    expect(result.similarity).toBeLessThan(100)
    expect(result.differences.length).toBeGreaterThan(0)
  })

  it('should handle unknown characters', () => {
    const state = createEmptyVoiceState()
    const result = compareCharacterVoices(state, 'a', 'b')
    expect(result.similarity).toBe(0)
    expect(result.differences[0]).toContain('not found')
  })
})

describe('formatVoiceProfile', () => {
  it('should format voice profile', () => {
    const profile = createVoiceProfile('hero', 'Hero')
    const formatted = formatVoiceProfile(profile)
    expect(formatted).toContain('Hero')
    expect(formatted).toContain('Formality')
    expect(formatted).toContain('50%')
  })

  it('should show signature phrases', () => {
    const profile = createVoiceProfile('villain', 'Villain')
    profile.commonPhrases = ['said nothing', 'walked away', 'darkness falls']
    const formatted = formatVoiceProfile(profile)
    expect(formatted).toContain('said nothing')
  })
})

describe('formatVoiceDashboard', () => {
  it('should show character count', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'a', 'A')
    state = registerCharacter(state, 'b', 'B')
    const dashboard = formatVoiceDashboard(state)
    expect(dashboard).toContain('Characters Registered: 2')
  })

  it('should show global consistency', () => {
    const state = createEmptyVoiceState()
    const dashboard = formatVoiceDashboard(state)
    expect(dashboard).toContain('Global Consistency: 100%')
  })

  it('should show drift alerts', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'drifter', 'Drifter')
    state = { ...state, driftAlerts: [{ characterId: 'drifter', chapter: 5, severity: 60, reason: 'Voice drift detected' }] }
    const dashboard = formatVoiceDashboard(state)
    expect(dashboard).toContain('Drift Alerts')
    expect(dashboard).toContain('Drifter')
  })

  it('should show character voices', () => {
    let state = createEmptyVoiceState()
    state = registerCharacter(state, 'alice', 'Alice')
    state = registerCharacter(state, 'bob', 'Bob')
    const dashboard = formatVoiceDashboard(state)
    expect(dashboard).toContain('Alice')
    expect(dashboard).toContain('Bob')
  })
})
