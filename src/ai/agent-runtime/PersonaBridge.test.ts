/**
 * PersonaBridge.test.ts (V2343) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  mapVoiceAndToneToSoulTone,
  mapVoiceToDecisionPolicy,
  mapStructureToMetadata,
  fromWriterPersona,
  applyWriterPersonaToSoul,
  deriveSoulFromPersona,
  isWriterPersona,
  type WriterPersonaLike,
} from './PersonaBridge'
import { createSoul } from './AgentSoul'

const makePersona = (overrides: Partial<WriterPersonaLike> = {}): WriterPersonaLike => ({
  id: 'p1',
  name: 'Test Writer',
  voice: {
    avgSentenceLength: 12,
    vocabularyRichness: 0.7,
    paragraphLength: 4,
    dialogueRatio: 0.3,
    descriptionDensity: 0.5,
    activeVoiceRatio: 0.7,
    rhythmScore: 0.6,
    showVsTellRatio: 0.6,
  },
  tone: {
    formalityLevel: 0.8,
    emotionalRange: 0.5,
    humorQuotient: 0.3,
    tensionTone: 0.4,
    optimismBias: 0.6,
    intimacyLevel: 0.5,
  },
  structure: {
    avgChapterLength: 3000,
    sceneLengthPreference: 'medium',
    pacingProfile: 0.5,
    cliffhangerFrequency: 0.4,
    prologuePreference: false,
    epiloguePreference: true,
    multiPovPreference: false,
    nonLinearPref: false,
  },
  ...overrides,
})

describe('mapVoiceAndToneToSoulTone', () => {
  it('maps all 5 fields', () => {
    const tone = mapVoiceAndToneToSoulTone(makePersona())
    expect(tone).toHaveProperty('formality')
    expect(tone).toHaveProperty('warmth')
    expect(tone).toHaveProperty('intensity')
    expect(tone).toHaveProperty('humor')
    expect(tone).toHaveProperty('directness')
  })

  it('formality = tone.formalityLevel', () => {
    expect(mapVoiceAndToneToSoulTone(makePersona()).formality).toBe(0.8)
  })

  it('warmth = tone.intimacyLevel', () => {
    expect(mapVoiceAndToneToSoulTone(makePersona()).warmth).toBe(0.5)
  })

  it('directness = 1 - optimismBias', () => {
    expect(mapVoiceAndToneToSoulTone(makePersona()).directness).toBe(0.4)
  })

  it('clamps out-of-range', () => {
    const p = makePersona({ tone: { ...makePersona().tone, formalityLevel: 1.5 } })
    expect(mapVoiceAndToneToSoulTone(p).formality).toBe(1)
  })

  it('NaN → 0.5', () => {
    const p = makePersona({ tone: { ...makePersona().tone, formalityLevel: NaN } })
    expect(mapVoiceAndToneToSoulTone(p).formality).toBe(0.5)
  })
})

describe('mapVoiceToDecisionPolicy', () => {
  it('maps all 4 fields', () => {
    const dp = mapVoiceToDecisionPolicy(makePersona())
    expect(dp).toHaveProperty('conservative')
    expect(dp).toHaveProperty('creative')
    expect(dp).toHaveProperty('reviewThreshold')
    expect(dp).toHaveProperty('riskTolerance')
  })

  it('creative = vocabularyRichness', () => {
    expect(mapVoiceToDecisionPolicy(makePersona()).creative).toBe(0.7)
  })

  it('conservative = 1 - showVsTellRatio', () => {
    expect(mapVoiceToDecisionPolicy(makePersona()).conservative).toBe(0.4)
  })
})

describe('mapStructureToMetadata', () => {
  it('includes all structure fields', () => {
    const m = mapStructureToMetadata(makePersona())
    expect(m.avgChapterLength).toBe(3000)
    expect(m.sceneLengthPreference).toBe('medium')
    expect(m.sourceWriterPersonaId).toBe('p1')
  })
})

describe('fromWriterPersona', () => {
  it('creates a soul with persona-driven tone', () => {
    const s = fromWriterPersona(makePersona(), { agentId: 's1' })
    expect(s.agentId).toBe('s1')
    expect(s.persona.displayName).toBe('Test Writer')
    expect(s.persona.tone.formality).toBe(0.8)
    expect(s.metadata.writerPersonaId).toBe('p1')
  })

  it('respects explicit overrides', () => {
    const s = fromWriterPersona(makePersona(), { agentId: 's2', archetype: 'critic' })
    expect(s.archetype).toBe('critic')
  })
})

describe('applyWriterPersonaToSoul', () => {
  it('bumps version', () => {
    const original = createSoul({
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'Original',
      capabilities: ['plot'],
    })
    const after = applyWriterPersonaToSoul(original, makePersona())
    expect(after.version).toBe(original.version + 1)
  })

  it('updates tone', () => {
    const original = createSoul({
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'Original',
      capabilities: ['plot'],
    })
    const after = applyWriterPersonaToSoul(original, makePersona())
    expect(after.persona.tone.formality).toBe(0.8)
  })

  it('preserves agentId', () => {
    const original = createSoul({
      agentId: 'a1',
      archetype: 'critic',
      displayName: 'Original',
      capabilities: ['plot'],
    })
    const after = applyWriterPersonaToSoul(original, makePersona())
    expect(after.agentId).toBe('a1')
  })
})

describe('deriveSoulFromPersona', () => {
  it('records parentOf in metadata', () => {
    const parent = createSoul({
      agentId: 'parent-1',
      archetype: 'critic',
      displayName: 'Parent',
      capabilities: ['plot'],
    })
    const child = deriveSoulFromPersona(parent, makePersona())
    expect(child.metadata.parentOf).toBe('parent-1')
  })

  it('applies persona tone to derived', () => {
    const parent = createSoul({
      agentId: 'p',
      archetype: 'critic',
      displayName: 'P',
      capabilities: ['plot'],
    })
    const child = deriveSoulFromPersona(parent, makePersona())
    expect(child.persona.tone.formality).toBe(0.8)
  })

  it('respects overrides', () => {
    const parent = createSoul({
      agentId: 'p',
      archetype: 'critic',
      displayName: 'P',
      capabilities: ['plot'],
    })
    const child = deriveSoulFromPersona(parent, makePersona(), { agentId: 'custom' })
    expect(child.agentId).toBe('custom')
  })
})

describe('isWriterPersona', () => {
  it('detects valid persona', () => {
    expect(isWriterPersona(makePersona())).toBe(true)
  })

  it('rejects null', () => {
    expect(isWriterPersona(null)).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(isWriterPersona({ id: 'a', name: 'b' })).toBe(false)
  })

  it('rejects without voice', () => {
    expect(isWriterPersona({ id: 'a', name: 'b', tone: {}, structure: {} })).toBe(false)
  })
})
