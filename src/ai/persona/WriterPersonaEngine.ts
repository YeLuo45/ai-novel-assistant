/**
 * WriterPersonaEngine Types - V87
 * Author Personality-Aware Writing Style Adaptation
 * 
 * Learns and models the author's unique writing persona:
 * - Voice fingerprint (diction, syntax, rhythm patterns)
 * - Tonal signature (emotional range, humor quotient, formality level)
 * - Structural preferences (pacing, scene lengths, chapter structures)
 * - Genre adaptation (how persona adjusts across genres)
 * - Collaboration persona (how agent should style-match the author)
 * 
 * Inspired by chatdev's role specialization + ruflo's personality mapping.
 */

import type { SkillNode } from '../evolution/SkillGraph'

// ===============================================================================
// Voice & Style Types
// ===============================================================================

export interface VoiceMetrics {
  avgSentenceLength: number      // words per sentence
  vocabularyRichness: number    // unique words / total words
  paragraphLength: number       // avg sentences per paragraph
  dialogueRatio: number         // 0-1 proportion of dialogue
  descriptionDensity: number     // adjectives + adverbs per 100 words
  activeVoiceRatio: number      // 0-1 active vs passive voice
  rhythmScore: number          // 0-1 sense of cadence
  showVsTellRatio: number       // 0-1 show vs tell proportion
}

export interface TonalSignature {
  formalityLevel: number       // 0-1 formal to casual
  emotionalRange: number        // 0-1 restrained to intense
  humorQuotient: number         // 0-1 dry to comedic
  tensionTone: number           // 0-1 relaxed to suspenseful
  optimismBias: number          // 0-1 pessimistic to optimistic
  intimacyLevel: number         // 0-1 distant to intimate
}

export interface StructuralPreferences {
  avgChapterLength: number       // words per chapter
  sceneLengthPreference: 'short' | 'medium' | 'long'
  pacingProfile: number         // 0-1 slow to fast
  cliffhangerFrequency: number  // 0-1 rarely to often
  prologuePreference: boolean
  epiloguePreference: boolean
  multiPovPreference: boolean
  nonLinearPref: boolean        // flashbacks, non-chronological
}

export interface WriterPersona {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  voice: VoiceMetrics
  tone: TonalSignature
  structure: StructuralPreferences
  genreAdaptations: Map<string, PersonaAdaptation>
  strongestTraits: string[]
  growthAreas: string[]
  confidenceScore: number       // 0-100 how confident the model is
}

export interface PersonaAdaptation {
  genre: string
  voiceAdjustment: Partial<VoiceMetrics>
  toneAdjustment: Partial<TonalSignature>
  structureAdjustment: Partial<StructuralPreferences>
  sampleTexts: string[]
}

export interface WritingStyleAnalysis {
  authorId: string
  analyzedAt: number
  sourceTextLength: number
  voiceMetrics: VoiceMetrics
  tonalSignature: TonalSignature
  structuralPreferences: StructuralPreferences
  confidenceScore: number
  identifiedInfluences: string[]
  uniquenessScore: number      // 0-100 how original/distinctive
}

// ===============================================================================
// Style Matching Types
// =============================================================================

export interface StyleMatchResult {
  confidence: number            // 0-1 match confidence
  matchingTraits: string[]
  divergingTraits: string[]
  suggestions: string[]
  adaptationStrength: number     // 0-1 how much to style-match
}

export interface CollaborationStyle {
  agentShouldMatch: boolean
  matchAspects: ('voice' | 'tone' | 'structure' | 'all')[]
  autonomyLevel: number         // 0-1 how much agent can deviate
  interventionTriggers: string[] // when to ask author for input
}

// ===============================================================================
// Configuration
// ===============================================================================

export interface PersonaConfig {
  minTextSamples: number         // minimum texts to analyze for persona
  minWordsPerSample: number     // minimum words per sample
  confidenceThreshold: number    // 0-100 minimum confidence for style matching
  adaptationSpeed: number       // 0-1 how fast persona updates
  styleDriftWindow: number      // ms window to detect style drift
}

export const DEFAULT_PERSONA_CONFIG: PersonaConfig = {
  minTextSamples: 3,
  minWordsPerSample: 500,
  confidenceThreshold: 60,
  adaptationSpeed: 0.1,
  styleDriftWindow: 7 * 24 * 60 * 60 * 1000  // 7 days
}

// ===============================================================================
// Factory Functions
// ===============================================================================

/**
 * Create empty persona
 */
export function createEmptyPersona(id: string, name: string): WriterPersona {
  return {
    id,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    voice: {
      avgSentenceLength: 15,
      vocabularyRichness: 0.3,
      paragraphLength: 4,
      dialogueRatio: 0.3,
      descriptionDensity: 5,
      activeVoiceRatio: 0.7,
      rhythmScore: 0.5,
      showVsTellRatio: 0.5
    },
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
    confidenceScore: 0
  }
}

/**
 * Create neutral/default voice metrics
 */
export function createNeutralVoice(): VoiceMetrics {
  return {
    avgSentenceLength: 15,
    vocabularyRichness: 0.3,
    paragraphLength: 4,
    dialogueRatio: 0.3,
    descriptionDensity: 5,
    activeVoiceRatio: 0.7,
    rhythmScore: 0.5,
    showVsTellRatio: 0.5
  }
}

/**
 * Analyze text and extract voice metrics
 */
export function analyzeTextVoice(text: string): VoiceMetrics {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))

  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0
  const vocabularyRichness = words.length > 0 ? uniqueWords.size / words.length : 0

  // Paragraph length estimation
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  const paragraphLength = paragraphs.length > 0 ? sentences.length / paragraphs.length : 0

  // Dialogue ratio (rough estimate)
  const dialogueCount = (text.match(/"[^"]*"/g) || []).length
  const dialogueRatio = sentences.length > 0 ? dialogueCount / sentences.length : 0

  // Description density (adjectives + adverbs per 100 words)
  const adjAdvPattern = /\b(very|really|extremely|absolutely|quite|rather|somewhat|totally|completely|highly|deeply|rich|vast|great|small|large|big|tiny|old|young|beautiful|dark|bright|warm|cold|soft|hard|loud|quiet|fast|slow|strong|weak)\b/gi
  const descMatches = text.match(adjAdvPattern) || []
  const descriptionDensity = words.length > 0 ? (descMatches.length / words.length) * 100 : 0

  // Active voice ratio (simplified)
  const passivePattern = /\b(was|were|been|being|have been|had been|will be|would be|should be|could be)\b/gi
  const passiveMatches = text.match(passivePattern) || []
  const activeVoiceRatio = words.length > 0 ? 1 - (passiveMatches.length / words.length) : 0.7

  // Rhythm score (sentence length variance)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length)
  const meanLen = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(1, sentenceLengths.length)
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - meanLen, 2), 0) / Math.max(1, sentenceLengths.length)
  const rhythmScore = Math.min(1, Math.sqrt(variance) / 10)

  // Show vs tell (dialogue + sensory vs narrative summary)
  const sensoryPattern = /\b(saw|heard|smelled|felt|tasted|watched|noticed|observed|perceived|sensed)\b/gi
  const showMatches = text.match(sensoryPattern) || []
  const showVsTellRatio = words.length > 0 ? Math.min(1, (showMatches.length + dialogueCount * 2) / words.length * 5) : 0.5

  return {
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
    paragraphLength: Math.round(paragraphLength * 10) / 10,
    dialogueRatio: Math.round(dialogueRatio * 100) / 100,
    descriptionDensity: Math.round(descriptionDensity * 10) / 10,
    activeVoiceRatio: Math.max(0, Math.min(1, activeVoiceRatio)),
    rhythmScore: Math.max(0, Math.min(1, rhythmScore)),
    showVsTellRatio: Math.max(0, Math.min(1, showVsTellRatio))
  }
}

/**
 * Analyze text and extract tonal signature
 */
export function analyzeTextTone(text: string): TonalSignature {
  const lower = text.toLowerCase()

  // Formality (contractions, slang, formal markers)
  const contractions = (lower.match(/\b(n't|'re|'ve|'ll|'d)\b/g) || []).length
  const formalMarkers = (lower.match(/\b(therefore|furthermore|moreover|consequently|hereby|thereby|whereas|whereby)\b/g) || []).length
  const formalityLevel = contractions > 0 ? Math.max(0, 1 - contractions / 50) : 0.5

  // Emotional range (emotion words)
  const emotionWords = (lower.match(/\b(love|hate|fear|joy|sad|angry|excited|terrified|worried|hopeful|desperate|thrilled|devastated|ecstatic|miserable)\b/g) || []).length
  const emotionalRange = Math.min(1, emotionWords / 30)

  // Humor quotient (comedy markers)
  const humorMarkers = (lower.match(/\b(joke|funny|hilarious|comical|witty|sarcasm|satire|ironic|absurd|ridiculous|ludicrous)\b/g) || []).length
  const humorQuotient = Math.min(1, humorMarkers / 10)

  // Tension tone (suspense markers)
  const tensionMarkers = (lower.match(/\b(suddenly|unexpectedly|horror|terror|threat|danger|mystery|secret|cliff-hanger|unresolved|crisis|catastrophe)\b/g) || []).length
  const tensionTone = Math.min(1, tensionMarkers / 20)

  // Optimism bias
  const positiveWords = (lower.match(/\b(hope|joy|happiness|success|triumph|victory|triumphant|positive|bright|future|promise|breakthrough)\b/g) || []).length
  const negativeWords = (lower.match(/\b(fail|failure|despair|hopeless|tragic|tragedy|defeat|doom|doomed|failure|failed|lost)\b/g) || []).length
  const total = positiveWords + negativeWords + 1
  const optimismBias = positiveWords / total

  // Intimacy level (first-person, intimate settings)
  const firstPerson = (lower.match(/\b(i|me|my|mine|myself|we|our|us)\b/g) || []).length
  const intimacyLevel = Math.min(1, firstPerson / 50)

  return {
    formalityLevel: Math.round(formalityLevel * 100) / 100,
    emotionalRange: Math.round(emotionalRange * 100) / 100,
    humorQuotient: Math.round(humorQuotient * 100) / 100,
    tensionTone: Math.round(tensionTone * 100) / 100,
    optimismBias: Math.round(optimismBias * 100) / 100,
    intimacyLevel: Math.round(intimacyLevel * 100) / 100
  }
}

/**
 * Blend two voice metrics
 */
export function blendVoiceMetrics(base: VoiceMetrics, target: VoiceMetrics, strength: number): VoiceMetrics {
  const s = Math.max(0, Math.min(1, strength))
  const inv = 1 - s
  return {
    avgSentenceLength: base.avgSentenceLength * inv + target.avgSentenceLength * s,
    vocabularyRichness: base.vocabularyRichness * inv + target.vocabularyRichness * s,
    paragraphLength: base.paragraphLength * inv + target.paragraphLength * s,
    dialogueRatio: base.dialogueRatio * inv + target.dialogueRatio * s,
    descriptionDensity: base.descriptionDensity * inv + target.descriptionDensity * s,
    activeVoiceRatio: base.activeVoiceRatio * inv + target.activeVoiceRatio * s,
    rhythmScore: base.rhythmScore * inv + target.rhythmScore * s,
    showVsTellRatio: base.showVsTellRatio * inv + target.showVsTellRatio * s
  }
}

/**
 * Match agent output against author persona
 */
export function matchStyleToPersona(
  output: string,
  persona: WriterPersona
): StyleMatchResult {
  const outputVoice = analyzeTextVoice(output)
  const outputTone = analyzeTextTone(output)

  const matchingTraits: string[] = []
  const divergingTraits: string[] = []
  const suggestions: string[] = []

  // Voice matching
  const voiceDiff = Math.abs(outputVoice.avgSentenceLength - persona.voice.avgSentenceLength)
  if (voiceDiff < 3) {
    matchingTraits.push('sentence length')
  } else {
    divergingTraits.push('sentence length')
    suggestions.push(`Consider ${outputVoice.avgSentenceLength > persona.voice.avgSentenceLength ? 'shortening' : 'lengthening'} sentences`)
  }

  if (Math.abs(outputVoice.dialogueRatio - persona.voice.dialogueRatio) < 0.15) {
    matchingTraits.push('dialogue ratio')
  }

  if (Math.abs(outputVoice.activeVoiceRatio - persona.voice.activeVoiceRatio) < 0.2) {
    matchingTraits.push('active voice')
  }

  // Confidence calculation
  const matchRatio = matchingTraits.length / (matchingTraits.length + divergingTraits.length)
  const confidence = Math.round(matchRatio * 100) / 100

  // Adaptation strength based on confidence
  const adaptationStrength = confidence < 0.5 ? 0.8 : confidence < 0.75 ? 0.5 : 0.2

  return {
    confidence,
    matchingTraits,
    divergingTraits,
    suggestions,
    adaptationStrength
  }
}

/**
 * Build collaboration style from persona
 */
export function buildCollaborationStyle(persona: WriterPersona): CollaborationStyle {
  return {
    agentShouldMatch: persona.confidenceScore > 50,
    matchAspects: persona.confidenceScore > 70 ? ['all'] : ['voice', 'tone'],
    autonomyLevel: persona.confidenceScore > 80 ? 0.8 : persona.confidenceScore > 60 ? 0.5 : 0.3,
    interventionTriggers: [
      'when content diverges significantly from plot outline',
      'when writing quality drops below persona baseline',
      'when author explicitly requests review'
    ]
  }
}

/**
 * Format persona summary
 */
export function formatPersonaSummary(persona: WriterPersona): string {
  const lines = [
    `=== Writer Persona: ${persona.name} ===`,
    `Confidence: ${persona.confidenceScore}/100`,
    ``,
    `Voice:`,
    `  Avg Sentence Length: ${persona.voice.avgSentenceLength} words`,
    `  Vocabulary Richness: ${(persona.voice.vocabularyRichness * 100).toFixed(0)}%`,
    `  Dialogue Ratio: ${(persona.voice.dialogueRatio * 100).toFixed(0)}%`,
    `  Show vs Tell: ${(persona.voice.showVsTellRatio * 100).toFixed(0)}%`,
    ``,
    `Tone:`,
    `  Formality: ${(persona.tone.formalityLevel * 100).toFixed(0)}%`,
    `  Emotional Range: ${(persona.tone.emotionalRange * 100).toFixed(0)}%`,
    `  Humor: ${(persona.tone.humorQuotient * 100).toFixed(0)}%`,
    `  Tension: ${(persona.tone.tensionTone * 100).toFixed(0)}%`,
    ``,
    `Structure:`,
    `  Chapter Length: ~${persona.structure.avgChapterLength.toLocaleString()} words`,
    `  Pacing: ${persona.structure.pacingProfile < 0.4 ? 'slow' : persona.structure.pacingProfile > 0.6 ? 'fast' : 'moderate'}`,
    `  Cliffhangers: ${persona.structure.cliffhangerFrequency > 0.5 ? 'frequent' : 'occasional'}`,
    ``
  ]

  if (persona.strongestTraits.length > 0) {
    lines.push(`Strengths: ${persona.strongestTraits.join(', ')}`)
  }

  if (persona.growthAreas.length > 0) {
    lines.push(`Growth Areas: ${persona.growthAreas.join(', ')}`)
  }

  return lines.join('\n')
}