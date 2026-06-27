/**
 * PersonaBridge.ts (V2343)
 *
 * 旧 WriterPersonaEngine（V87）→ 新 soul.persona.tone 的桥接层。
 *
 * 关键映射：
 *   WriterPersona.voice.*     → AgentSoul.persona.tone
 *   WriterPersona.tone.*      → AgentSoul.persona.tone (直接对应)
 *   WriterPersona.structure.* → AgentSoul.metadata
 *   WriterPersona.genreAdaptations → AgentSoul.metadata
 *
 * 设计：
 * - 不修改 WriterPersona
 * - 提供 fromWriterPersona(persona) → partial Soul input
 * - 提供 applyWriterPersonaToSoul(soul, persona) → bumpVersion + tone 覆盖
 */

import type { AgentSoul, TonalSignature, DecisionPolicy } from './types'
import { cloneSoul, createSoul, bumpVersion, type CreateSoulInput } from './AgentSoul'

// =============================================================================
// 1. WriterPersona 类型（duck typing，避免硬依赖旧模块）
// =============================================================================

export interface VoiceMetricsLike {
  avgSentenceLength: number
  vocabularyRichness: number
  paragraphLength: number
  dialogueRatio: number
  descriptionDensity: number
  activeVoiceRatio: number
  rhythmScore: number
  showVsTellRatio: number
}

export interface TonalSignatureLike {
  formalityLevel: number
  emotionalRange: number
  humorQuotient: number
  tensionTone: number
  optimismBias: number
  intimacyLevel: number
}

export interface StructuralPreferencesLike {
  avgChapterLength: number
  sceneLengthPreference: 'short' | 'medium' | 'long'
  pacingProfile: number
  cliffhangerFrequency: number
  prologuePreference: boolean
  epiloguePreference: boolean
  multiPovPreference: boolean
  nonLinearPref: boolean
}

export interface WriterPersonaLike {
  id: string
  name: string
  voice: VoiceMetricsLike
  tone: TonalSignatureLike
  structure: StructuralPreferencesLike
  /** 简化：genreAdaptations 不直接映射到 soul，作为 metadata */
}

// =============================================================================
// 2. 映射函数
// =============================================================================

/** WriterPersona.voice + tone → AgentSoul TonalSignature (0-1 归一化) */
export function mapVoiceAndToneToSoulTone(p: WriterPersonaLike): TonalSignature {
  // voice 字段已经在 0-1 范围（比例类），tone 字段也是 0-1
  return {
    formality: clamp01Mapped(p.tone.formalityLevel),
    warmth: clamp01Mapped(p.tone.intimacyLevel),
    intensity: clamp01Mapped(p.tone.emotionalRange),
    humor: clamp01Mapped(p.tone.humorQuotient),
    // directness = 反向 optimismBias（高乐观 = 低直接）
    directness: clamp01Mapped(1 - p.tone.optimismBias),
  }
}

/** WriterPersona.voice → DecisionPolicy (启发式) */
export function mapVoiceToDecisionPolicy(p: WriterPersonaLike): DecisionPolicy {
  return {
    conservative: clamp01Mapped(1 - p.voice.showVsTellRatio), // 偏 show = 偏 non-conservative
    creative: clamp01Mapped(p.voice.vocabularyRichness),     // 词汇丰富 = 高 creative
    reviewThreshold: clamp01Mapped(1 - p.voice.activeVoiceRatio), // 主动语态高 = 不需多 review
    riskTolerance: clamp01Mapped(p.voice.rhythmScore),       // 节奏感 = 高 risk tolerance
  }
}

/** WriterPersona.structure → soul metadata */
export function mapStructureToMetadata(p: WriterPersonaLike): Record<string, unknown> {
  return {
    sourceWriterPersonaId: p.id,
    avgChapterLength: p.structure.avgChapterLength,
    sceneLengthPreference: p.structure.sceneLengthPreference,
    pacingProfile: p.structure.pacingProfile,
    cliffhangerFrequency: p.structure.cliffhangerFrequency,
    multiPovPreference: p.structure.multiPovPreference,
    nonLinearPref: p.structure.nonLinearPref,
  }
}

// =============================================================================
// 3. 转换函数
// =============================================================================

/** WriterPersona → partial CreateSoulInput */
export function fromWriterPersona(
  persona: WriterPersonaLike,
  overrides: Partial<CreateSoulInput> & { agentId: string },
): AgentSoul {
  return createSoul({
    agentId: overrides.agentId,
    archetype: overrides.archetype ?? 'instructor',
    displayName: overrides.displayName ?? persona.name,
    capabilities: overrides.capabilities ?? ['style', 'voice'],
    tone: mapVoiceAndToneToSoulTone(persona),
    decisionPolicy: mapVoiceToDecisionPolicy(persona),
    principles: overrides.principles ?? [`Embody the voice of ${persona.name}`],
    memoryReadScope: overrides.memoryReadScope ?? 'team',
    memoryWriteScope: overrides.memoryWriteScope ?? 'self',
    metadata: {
      ...overrides.metadata,
      ...mapStructureToMetadata(persona),
      writerPersonaId: persona.id,
    },
  })
}

/** 已有 soul 套用 WriterPersona（返回 bumped version） */
export function applyWriterPersonaToSoul(
  soul: AgentSoul,
  persona: WriterPersonaLike,
): AgentSoul {
  return bumpVersion(soul, {
    displayName: soul.persona.displayName === soul.persona.tagline
      ? persona.name
      : soul.persona.displayName,
    tone: mapVoiceAndToneToSoulTone(persona),
    decisionPolicy: mapVoiceToDecisionPolicy(persona),
    metadata: {
      ...soul.metadata,
      ...mapStructureToMetadata(persona),
      writerPersonaId: persona.id,
    },
  })
}

/** 克隆 soul 并应用 WriterPersona（用于派生） */
export function deriveSoulFromPersona(
  parent: AgentSoul,
  persona: WriterPersonaLike,
  overrides: Partial<CreateSoulInput> = {},
): AgentSoul {
  const derived = cloneSoul(parent, {
    ...overrides,
    agentId: overrides.agentId ?? `${parent.agentId}-${persona.id}`,
    parentOf: parent.agentId,
  })
  return applyWriterPersonaToSoul(derived, persona)
}

// =============================================================================
// 4. 内部
// =============================================================================

function clamp01Mapped(n: number): number {
  if (Number.isNaN(n)) return 0.5
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/** 检测是否是 WriterPersona 对象（duck typing） */
export function isWriterPersona(obj: unknown): obj is WriterPersonaLike {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return false
  if (!o.voice || !o.tone || !o.structure) return false
  return true
}
