/**
 * types.test.ts (V2326)
 *
 * 验证 Agent Runtime 核心类型 + 工具函数（35+ 断言）：
 * - 类型守卫（ALL_ARCHETYPES / ALL_CAPABILITY_TAGS 完整性）
 * - clamp01 边界
 * - normalizeTone / normalizeDecisionPolicy 默认值 + 钳制
 * - validateSoul 各类错误场景
 */

import { describe, it, expect } from 'vitest'
import {
  ALL_ARCHETYPES,
  ALL_CAPABILITY_TAGS,
  AGENT_RUNTIME_VERSION,
  DEFAULT_TONE,
  DEFAULT_DECISION_POLICY,
  clamp01,
  normalizeTone,
  normalizeDecisionPolicy,
  validateSoul,
  type AgentSoul,
  type TonalSignature,
  type DecisionPolicy,
  type AgentArchetype,
  type CapabilityTag,
} from './types'

describe('types — constants', () => {
  it('ALL_ARCHETYPES has exactly 6 entries', () => {
    expect(ALL_ARCHETYPES.length).toBe(6)
  })

  it('ALL_ARCHETYPES contains all required archetypes', () => {
    const expected: AgentArchetype[] = [
      'instructor', 'assistant', 'critic', 'reviewer', 'executor', 'specialist',
    ]
    for (const a of expected) {
      expect(ALL_ARCHETYPES).toContain(a)
    }
  })

  it('ALL_CAPABILITY_TAGS has 18 entries', () => {
    expect(ALL_CAPABILITY_TAGS.length).toBe(18)
  })

  it('ALL_CAPABILITY_TAGS has unique values', () => {
    const set = new Set(ALL_CAPABILITY_TAGS)
    expect(set.size).toBe(ALL_CAPABILITY_TAGS.length)
  })

  it('AGENT_RUNTIME_VERSION is 3.x', () => {
    expect(AGENT_RUNTIME_VERSION).toMatch(/^3\./)
  })

  it('DEFAULT_TONE is all 0.5', () => {
    expect(DEFAULT_TONE).toEqual({
      formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5,
    })
  })

  it('DEFAULT_DECISION_POLICY has riskTolerance 0.3', () => {
    expect(DEFAULT_DECISION_POLICY.riskTolerance).toBe(0.3)
    expect(DEFAULT_DECISION_POLICY.conservative).toBe(0.5)
  })
})

describe('types — clamp01', () => {
  it('clamps negatives to 0', () => {
    expect(clamp01(-0.1)).toBe(0)
    expect(clamp01(-100)).toBe(0)
  })

  it('clamps >1 to 1', () => {
    expect(clamp01(1.1)).toBe(1)
    expect(clamp01(999)).toBe(1)
  })

  it('passes 0-1 through', () => {
    expect(clamp01(0)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(1)).toBe(1)
  })

  it('treats NaN as 0', () => {
    expect(clamp01(NaN)).toBe(0)
  })
})

describe('types — normalizeTone', () => {
  it('returns DEFAULT_TONE for empty input', () => {
    expect(normalizeTone({})).toEqual(DEFAULT_TONE)
  })

  it('preserves provided values', () => {
    const input: Partial<TonalSignature> = { formality: 0.9, warmth: 0.1 }
    expect(normalizeTone(input)).toEqual({
      formality: 0.9, warmth: 0.1, intensity: 0.5, humor: 0.5, directness: 0.5,
    })
  })

  it('clamps out-of-range values', () => {
    expect(normalizeTone({ formality: 1.5, warmth: -0.2 })).toEqual({
      formality: 1, warmth: 0, intensity: 0.5, humor: 0.5, directness: 0.5,
    })
  })

  it('treats NaN as 0.5 default', () => {
    const r = normalizeTone({ formality: NaN })
    expect(r.formality).toBe(0.5)
  })
})

describe('types — normalizeDecisionPolicy', () => {
  it('returns DEFAULT_DECISION_POLICY for empty input', () => {
    expect(normalizeDecisionPolicy({})).toEqual(DEFAULT_DECISION_POLICY)
  })

  it('preserves provided values', () => {
    const r = normalizeDecisionPolicy({ conservative: 0.9, creative: 0.1 })
    expect(r.conservative).toBe(0.9)
    expect(r.creative).toBe(0.1)
    expect(r.riskTolerance).toBe(0.3)
  })

  it('clamps out-of-range', () => {
    const r = normalizeDecisionPolicy({ reviewThreshold: 2.0 })
    expect(r.reviewThreshold).toBe(1)
  })
})

describe('types — validateSoul', () => {
  const validSoul: Partial<AgentSoul> = {
    agentId: 'a1',
    archetype: 'critic',
    capabilities: ['plot', 'style'],
    memoryReadScope: 'self',
    memoryWriteScope: 'self',
    version: 1,
  }

  it('accepts a valid soul', () => {
    const r = validateSoul(validSoul)
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rejects missing agentId', () => {
    const r = validateSoul({ ...validSoul, agentId: '' })
    expect(r.valid).toBe(false)
    expect(r.errors[0].field).toBe('agentId')
  })

  it('rejects unknown archetype', () => {
    const r = validateSoul({ ...validSoul, archetype: 'alien' as AgentArchetype })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.field === 'archetype')).toBe(true)
  })

  it('rejects empty capabilities', () => {
    const r = validateSoul({ ...validSoul, capabilities: [] })
    expect(r.valid).toBe(false)
  })

  it('rejects unknown capability tag', () => {
    const r = validateSoul({ ...validSoul, capabilities: ['unknown-thing' as CapabilityTag] })
    expect(r.valid).toBe(false)
  })

  it('rejects invalid memoryReadScope', () => {
    const r = validateSoul({ ...validSoul, memoryReadScope: 'invalid' as 'self' })
    expect(r.valid).toBe(false)
  })

  it('rejects invalid memoryWriteScope', () => {
    const r = validateSoul({ ...validSoul, memoryWriteScope: 'invalid' as 'self' })
    expect(r.valid).toBe(false)
  })

  it('rejects non-positive version', () => {
    const r = validateSoul({ ...validSoul, version: 0 })
    expect(r.valid).toBe(false)
  })

  it('rejects non-integer version', () => {
    const r = validateSoul({ ...validSoul, version: 1.5 })
    expect(r.valid).toBe(false)
  })

  it('accumulates multiple errors', () => {
    const r = validateSoul({ agentId: '', archetype: 'bad' as AgentArchetype, capabilities: [] })
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })
})
