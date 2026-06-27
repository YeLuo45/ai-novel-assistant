/**
 * bridge.test.ts (V2345) — 验证 bridge 模块导出
 */

import { describe, it, expect } from 'vitest'
import * as Bridge from './bridge'

describe('bridge — exports', () => {
  it('exports BaseAgentAdapter', () => {
    expect(typeof Bridge.BaseAgentAdapter).toBe('function')
    expect(typeof Bridge.adaptLegacyBaseAgent).toBe('function')
    expect(typeof Bridge.isLegacyBaseAgent).toBe('function')
  })

  it('exports NanobotAdapter', () => {
    expect(typeof Bridge.NanobotAdapter).toBe('function')
    expect(typeof Bridge.adaptNanobot).toBe('function')
    expect(typeof Bridge.isNanobotClass).toBe('function')
    expect(typeof Bridge.listNanobotMethods).toBe('function')
  })

  it('exports PersonaBridge functions', () => {
    expect(typeof Bridge.mapVoiceAndToneToSoulTone).toBe('function')
    expect(typeof Bridge.fromWriterPersona).toBe('function')
    expect(typeof Bridge.applyWriterPersonaToSoul).toBe('function')
    expect(typeof Bridge.deriveSoulFromPersona).toBe('function')
  })

  it('exports MemoryBridge functions', () => {
    expect(typeof Bridge.mapLevelToTable).toBe('function')
    expect(typeof Bridge.logLegacyAccess).toBe('function')
    expect(typeof Bridge.namespaceKey).toBe('function')
    expect(typeof Bridge.planMigration).toBe('function')
    expect(typeof Bridge.applyMigration).toBe('function')
  })

  it('BRIDGE_MODULE_VERSION is 1.x', () => {
    expect(Bridge.BRIDGE_MODULE_VERSION).toMatch(/^1\./)
  })
})

describe('bridge — integration smoke', () => {
  it('PersonaBridge → AgentSoul → MemoryScope end-to-end', () => {
    const persona: Bridge.WriterPersonaLike = {
      id: 'p1',
      name: 'Test',
      voice: {
        avgSentenceLength: 10, vocabularyRichness: 0.5, paragraphLength: 3,
        dialogueRatio: 0.3, descriptionDensity: 0.4, activeVoiceRatio: 0.6,
        rhythmScore: 0.5, showVsTellRatio: 0.7,
      },
      tone: {
        formalityLevel: 0.7, emotionalRange: 0.5, humorQuotient: 0.4,
        tensionTone: 0.4, optimismBias: 0.6, intimacyLevel: 0.5,
      },
      structure: {
        avgChapterLength: 3000, sceneLengthPreference: 'medium', pacingProfile: 0.5,
        cliffhangerFrequency: 0.3, prologuePreference: false, epiloguePreference: false,
        multiPovPreference: false, nonLinearPref: false,
      },
    }
    const soul = Bridge.fromWriterPersona(persona, { agentId: 's1' })
    expect(soul.agentId).toBe('s1')
    expect(soul.metadata.writerPersonaId).toBe('p1')
  })
})
