import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  analyzeDialogue,
  registerUniquePhrase,
  generateDialogueReport,
  getCharacterVoiceProfile,
} from './DialogueAuthenticityEngine'

describe('createEmptyState', () => {
  it('should create empty dialogue state', () => {
    const s = createEmptyState()
    expect(s.markers).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('analyzeDialogue', () => {
  it('should analyze dialogue lines', () => {
    let s = createEmptyState()
    const lines = ['Hello there.', 'How are you?', 'I am fine.']
    s = analyzeDialogue(s, 'hero', 'ch1', lines)
    expect(s.markers.length).toBe(1)
    expect(s.markers[0].characterId).toBe('hero')
  })

  it('should detect question frequency', () => {
    let s = createEmptyState()
    const lines = ['Who are you?', 'What is this?', 'Where are we?']
    s = analyzeDialogue(s, 'hero', 'ch1', lines)
    expect(s.markers[0].questionFrequency).toBeGreaterThan(50)
  })

  it('should detect formal speech', () => {
    let s = createEmptyState()
    const lines = ['Therefore, we must proceed accordingly.', 'However, there are considerations.']
    s = analyzeDialogue(s, 'mentor', 'ch1', lines)
    expect(s.markers[0].formalityLevel).toBeGreaterThan(50)
  })
})

describe('registerUniquePhrase', () => {
  it('should register unique phrase', () => {
    let s = createEmptyState()
    s = analyzeDialogue(s, 'hero', 'ch1', ['Hello world'])
    s = registerUniquePhrase(s, 'hero', 'May the force be with you')
    expect(s.markers[0].uniquePhrases).toContain('May the force be with you')
  })
})

describe('generateDialogueReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateDialogueReport(s)
    expect(report.totalDialogueMarkers).toBe(0)
    expect(report.avgAuthenticityScore).toBe(0)
  })

  it('should detect consistent dialogue', () => {
    let s = createEmptyState()
    s = analyzeDialogue(s, 'hero', 'ch1', ['Hello there.', 'How are you?'])
    s = analyzeDialogue(s, 'hero', 'ch2', ['Greetings.', 'How do you do?'])
    const report = generateDialogueReport(s)
    expect(report.charactersAnalyzed).toBe(1)
  })
})

describe('getCharacterVoiceProfile', () => {
  it('should return null for unknown character', () => {
    const s = createEmptyState()
    expect(getCharacterVoiceProfile(s, 'unknown')).toBeNull()
  })

  it('should aggregate voice profile', () => {
    let s = createEmptyState()
    s = analyzeDialogue(s, 'hero', 'ch1', ['Hello there.'])
    s = analyzeDialogue(s, 'hero', 'ch2', ['Greetings.'])
    const profile = getCharacterVoiceProfile(s, 'hero')
    expect(profile).not.toBeNull()
    expect(profile!.characterId).toBe('hero')
  })
})
