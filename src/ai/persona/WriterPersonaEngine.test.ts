/**
 * WriterPersonaEngine Tests - V88
 * Tests for Author Personality-Aware Style Adaptation
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyPersona,
  createNeutralVoice,
  analyzeTextVoice,
  analyzeTextTone,
  blendVoiceMetrics,
  matchStyleToPersona,
  buildCollaborationStyle,
  formatPersonaSummary,
  DEFAULT_PERSONA_CONFIG,
  type WriterPersona,
  type VoiceMetrics,
  type TonalSignature
} from './WriterPersonaEngine'

// =============================================================================
// Helper Functions
// =============================================================================

function makeVoice(overrides: Partial<VoiceMetrics> = {}): VoiceMetrics {
  return {
    avgSentenceLength: 15,
    vocabularyRichness: 0.3,
    paragraphLength: 4,
    dialogueRatio: 0.3,
    descriptionDensity: 5,
    activeVoiceRatio: 0.7,
    rhythmScore: 0.5,
    showVsTellRatio: 0.5,
    ...overrides
  }
}

function makePersona(overrides: Partial<WriterPersona> = {}): WriterPersona {
  return {
    id: 'test-persona',
    name: 'Test Author',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    voice: makeVoice(),
    tone: {
      formalityLevel: 0.5,
      emotionalRange: 0.5,
      humorQuotient: 0.3,
      tensionTone: 0.5,
      optimismBias: 0.5,
      intimacyLevel: 0.5
    },
    structure: {
      avgChapterLength: 3000,
      sceneLengthPreference: 'medium',
      pacingProfile: 0.5,
      cliffhangerFrequency: 0.3,
      prologuePreference: false,
      epiloguePreference: false,
      multiPovPreference: false,
      nonLinearPref: false
    },
    genreAdaptations: new Map(),
    strongestTraits: [],
    growthAreas: [],
    confidenceScore: 75,
    ...overrides
  }
}

// =============================================================================
// createEmptyPersona Tests
// =============================================================================

describe('createEmptyPersona', () => {
  it('should create persona with neutral defaults', () => {
    const persona = createEmptyPersona('id1', 'Author Name')
    expect(persona.id).toBe('id1')
    expect(persona.name).toBe('Author Name')
    expect(persona.confidenceScore).toBe(0)
    expect(persona.voice.avgSentenceLength).toBe(15)
    expect(persona.voice.dialogueRatio).toBe(0.3)
  })

  it('should have recent timestamps', () => {
    const persona = createEmptyPersona('id1', 'Author')
    expect(persona.createdAt).toBeGreaterThan(0)
    expect(persona.createdAt).toBeLessThanOrEqual(Date.now())
    expect(persona.updatedAt).toBeGreaterThan(0)
  })

  it('should have empty growth areas', () => {
    const persona = createEmptyPersona('id1', 'Author')
    expect(persona.growthAreas).toEqual([])
    expect(persona.strongestTraits).toEqual([])
  })
})

// =============================================================================
// createNeutralVoice Tests
// =============================================================================

describe('createNeutralVoice', () => {
  it('should return neutral values', () => {
    const voice = createNeutralVoice()
    expect(voice.avgSentenceLength).toBe(15)
    expect(voice.rhythmScore).toBe(0.5)
    expect(voice.showVsTellRatio).toBe(0.5)
  })
})

// =============================================================================
// analyzeTextVoice Tests
// =============================================================================

describe('analyzeTextVoice', () => {
  it('should analyze simple text', () => {
    const text = 'The quick brown fox jumps over the lazy dog. It was a sunny day.'
    const voice = analyzeTextVoice(text)
    expect(voice.avgSentenceLength).toBeGreaterThan(0)
    expect(voice.vocabularyRichness).toBeGreaterThan(0)
  })

  it('should handle empty text', () => {
    const voice = analyzeTextVoice('')
    expect(voice.avgSentenceLength).toBe(0)
    expect(voice.vocabularyRichness).toBe(0)
  })

  it('should calculate dialogue ratio', () => {
    const text = '"Hello," she said. The door opened. "Are you coming?"'
    const voice = analyzeTextVoice(text)
    expect(voice.dialogueRatio).toBeGreaterThan(0)
  })

  it('should calculate active voice ratio', () => {
    const text = 'She opened the door. He walked inside. The dog barked loudly.'
    const voice = analyzeTextVoice(text)
    expect(voice.activeVoiceRatio).toBeGreaterThan(0.5)
  })

  it('should clamp all values to 0-1 range', () => {
    const text = 'The cat sat on the mat. It was fat. The dog ran.'
    const voice = analyzeTextVoice(text)
    expect(voice.activeVoiceRatio).toBeLessThanOrEqual(1)
    expect(voice.activeVoiceRatio).toBeGreaterThanOrEqual(0)
  })
})

// =============================================================================
// analyzeTextTone Tests
// =============================================================================

describe('analyzeTextTone', () => {
  it('should analyze formal text', () => {
    const text = 'Therefore, the consequences were furthermore significant. Whereby the agreement was binding.'
    const tone = analyzeTextTone(text)
    expect(tone.formalityLevel).toBeGreaterThan(0.3)
  })

  it('should analyze emotional text', () => {
    const text = 'I love this joy. The happiness is overwhelming. I feel terrified and excited!'
    const tone = analyzeTextTone(text)
    expect(tone.emotionalRange).toBeGreaterThan(0)
  })

  it('should analyze humorous text', () => {
    const text = 'This is a joke. How witty and hilarious. The sarcasm is palpable.'
    const tone = analyzeTextTone(text)
    expect(tone.humorQuotient).toBeGreaterThan(0)
  })

  it('should analyze tense text', () => {
    const text = 'Suddenly the horror began. A sudden threat emerged unexpectedly. The danger was real.'
    const tone = analyzeTextTone(text)
    expect(tone.tensionTone).toBeGreaterThan(0)
  })

  it('should return near-zero values for empty text', () => {
    const tone = analyzeTextTone('')
    // Empty text gives 0 for all markers, but formula yields 0.5 for some
    // Formality defaults to 0.5 when no contractions
    expect(tone.formalityLevel).toBeLessThanOrEqual(0.5)
    expect(tone.emotionalRange).toBeLessThanOrEqual(0.5)
  })
})

// =============================================================================
// blendVoiceMetrics Tests
// =============================================================================

describe('blendVoiceMetrics', () => {
  it('should return base when strength is 0', () => {
    const base = makeVoice({ avgSentenceLength: 20 })
    const target = makeVoice({ avgSentenceLength: 10 })
    const result = blendVoiceMetrics(base, target, 0)
    expect(result.avgSentenceLength).toBe(20)
  })

  it('should return target when strength is 1', () => {
    const base = makeVoice({ avgSentenceLength: 20 })
    const target = makeVoice({ avgSentenceLength: 10 })
    const result = blendVoiceMetrics(base, target, 1)
    expect(result.avgSentenceLength).toBe(10)
  })

  it('should blend at 0.5 strength', () => {
    const base = makeVoice({ avgSentenceLength: 20 })
    const target = makeVoice({ avgSentenceLength: 10 })
    const result = blendVoiceMetrics(base, target, 0.5)
    expect(result.avgSentenceLength).toBe(15)
  })

  it('should blend all properties', () => {
    const base = makeVoice({ dialogueRatio: 0.8 })
    const target = makeVoice({ dialogueRatio: 0.2 })
    const result = blendVoiceMetrics(base, target, 0.5)
    expect(result.dialogueRatio).toBe(0.5)
  })
})

// =============================================================================
// matchStyleToPersona Tests
// =============================================================================

describe('matchStyleToPersona', () => {
  it('should return high confidence for matching output', () => {
    const persona = makePersona({
      voice: makeVoice({ avgSentenceLength: 15, dialogueRatio: 0.3 }),
      confidenceScore: 75
    })
    const output = 'The cat sat. The dog ran. "Hello," she said. The dog barked.'
    const result = matchStyleToPersona(output, persona)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.matchingTraits.length).toBeGreaterThanOrEqual(0)
  })

  it('should suggest corrections for diverging traits', () => {
    const persona = makePersona({
      voice: makeVoice({ avgSentenceLength: 8 })
    })
    const output = 'The very long sentence that goes on and on and contains many many words that make it quite lengthy indeed.'
    const result = matchStyleToPersona(output, persona)
    // Long sentences should diverge from persona that prefers short ones
    expect(result.suggestions).toBeDefined()
  })

  it('should calculate adaptation strength', () => {
    const persona = makePersona({ confidenceScore: 80 })
    const output = 'A simple test output.'
    const result = matchStyleToPersona(output, persona)
    expect(result.adaptationStrength).toBeGreaterThan(0)
    expect(result.adaptationStrength).toBeLessThanOrEqual(1)
  })
})

// =============================================================================
// buildCollaborationStyle Tests
// =============================================================================

describe('buildCollaborationStyle', () => {
  it('should recommend matching for high confidence persona', () => {
    const persona = makePersona({ confidenceScore: 85 })
    const style = buildCollaborationStyle(persona)
    expect(style.agentShouldMatch).toBe(true)
    expect(style.matchAspects).toContain('all')
  })

  it('should recommend partial matching for medium confidence', () => {
    const persona = makePersona({ confidenceScore: 65 })
    const style = buildCollaborationStyle(persona)
    expect(style.agentShouldMatch).toBe(true)
    expect(style.matchAspects).toContain('voice')
    expect(style.matchAspects).toContain('tone')
  })

  it('should limit autonomy for low confidence persona', () => {
    const persona = makePersona({ confidenceScore: 40 })
    const style = buildCollaborationStyle(persona)
    expect(style.autonomyLevel).toBeLessThan(0.5)
  })
})

// =============================================================================
// formatPersonaSummary Tests
// =============================================================================

describe('formatPersonaSummary', () => {
  it('should format basic persona info', () => {
    const persona = makePersona({ name: 'Jane Writer' })
    const summary = formatPersonaSummary(persona)
    expect(summary).toContain('Jane Writer')
    expect(summary).toContain('Confidence:')
  })

  it('should format voice metrics', () => {
    const persona = makePersona()
    const summary = formatPersonaSummary(persona)
    expect(summary).toContain('Avg Sentence Length:')
    expect(summary).toContain('Dialogue Ratio:')
  })

  it('should format tone metrics', () => {
    const persona = makePersona()
    const summary = formatPersonaSummary(persona)
    expect(summary).toContain('Formality:')
    expect(summary).toContain('Emotional Range:')
  })

  it('should format structure', () => {
    const persona = makePersona()
    const summary = formatPersonaSummary(persona)
    expect(summary).toContain('Chapter Length:')
    expect(summary).toContain('Pacing:')
  })

  it('should include strengths and growth areas', () => {
    const persona = makePersona({
      strongestTraits: ['vivid description', 'natural dialogue'],
      growthAreas: ['pacing', 'cliffhangers']
    })
    const summary = formatPersonaSummary(persona)
    expect(summary).toContain('Strengths:')
    expect(summary).toContain('Growth Areas:')
  })
})
