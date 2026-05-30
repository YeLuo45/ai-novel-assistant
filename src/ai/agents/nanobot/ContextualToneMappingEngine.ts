/**
 * ContextualToneMappingEngine — V517
 * Dynamic narrative voice mapping based on scene context, character relationships, and emotional atmosphere.
 * Inspired by: claude-code (precise control) + generic-agent (adaptive goals)
 */

export type NarrativeVoice = 'omniscient' | 'limited' | 'first_person' | 'dramatic' | 'objective'
export type EmotionalAtmosphere = 'tense' | 'romantic' | 'mysterious' | 'joyful' | 'melancholic' | 'violent' | 'peaceful' | 'nostalgic'
export type ToneModifier = 'sarcastic' | 'lyrical' | 'clipped' | 'flowing' | 'staccato' | 'contemplative' | 'urgent'
export type CharacterRelationship = 'ally' | 'enemy' | 'neutral' | 'romantic' | 'familial' | 'rival'

export interface SceneContext {
  sceneId: string
  location: string
  timeOfDay: string
  emotionalAtmosphere: EmotionalAtmosphere
  dominantEmotions: string[]
  relationshipContext: Record<string, CharacterRelationship>  // characterId -> relationship
  povCharacter?: string
}

export interface ToneMapping {
  id: string
  sceneId: string
  baseVoice: NarrativeVoice
  toneModifiers: ToneModifier[]
  vocabularyComplexity: number      // 0-100, simple to literary
  sentenceLengthAverage: number      // words per sentence
  dialogueToNarrationRatio: number  // 0-1
  emotionalDistance: number          // 0-100, intimate to distant
  descriptiveDensity: number         // 0-100, sparse to rich
  pacingTempo: number               // 0-100, slow contemplative to fast action
  customAdjustments: Record<string, number>
}

export interface CharacterVoiceProfile {
  characterId: string
  preferredVoice: NarrativeVoice
  typicalModifiers: ToneModifier[]
  speechPatterns: string[]          // characteristic phrases
  vocabularyRange: [number, number] // complexity range
  emotionExpressionStyle: 'internal' | 'external' | 'mixed'
}

export interface VoiceTransition {
  id: string
  fromSceneId: string
  toSceneId: string
  transitionType: 'abrupt' | 'gradual' | 'interpolated'
  interpolationSteps: number        // for gradual transitions
  blendingFactors: Record<string, number> // how much each factor blends
}

export interface ToneState {
  sceneContexts: Record<string, SceneContext>
  currentMappings: Record<string, ToneMapping>
  characterProfiles: Record<string, CharacterVoiceProfile>
  transitions: Record<string, VoiceTransition>
  defaultVoice: NarrativeVoice
  avgVocabularyComplexity: number
  totalSceneShifts: number
}

export function createEmptyState(defaultVoice: NarrativeVoice = 'limited'): ToneState {
  return {
    sceneContexts: {},
    currentMappings: {},
    characterProfiles: {},
    transitions: {},
    defaultVoice,
    avgVocabularyComplexity: 50,
    totalSceneShifts: 0
  }
}

// --- Context Registration ---

export function registerSceneContext(
  state: ToneState,
  sceneId: string,
  location: string,
  timeOfDay: string,
  emotionalAtmosphere: EmotionalAtmosphere,
  dominantEmotions: string[],
  relationshipContext: Record<string, CharacterRelationship> = {},
  povCharacter?: string
): ToneState {
  const context: SceneContext = {
    sceneId,
    location,
    timeOfDay,
    emotionalAtmosphere,
    dominantEmotions,
    relationshipContext,
    povCharacter
  }

  return {
    ...state,
    sceneContexts: { ...state.sceneContexts, [sceneId]: context }
  }
}

export function registerCharacterProfile(
  state: ToneState,
  characterId: string,
  preferredVoice: NarrativeVoice,
  typicalModifiers: ToneModifier[] = [],
  speechPatterns: string[] = [],
  vocabularyRange: [number, number] = [40, 70],
  emotionExpressionStyle: 'internal' | 'external' | 'mixed' = 'mixed'
): ToneState {
  const profile: CharacterVoiceProfile = {
    characterId,
    preferredVoice,
    typicalModifiers,
    speechPatterns,
    vocabularyRange,
    emotionExpressionStyle
  }

  return {
    ...state,
    characterProfiles: { ...state.characterProfiles, [characterId]: profile }
  }
}

// --- Tone Mapping Generation ---

export function generateToneMapping(
  state: ToneState,
  sceneId: string
): ToneState {
  const context = state.sceneContexts[sceneId]
  if (!context) return state

  const baseVoice = inferBaseVoice(context)
  const toneModifiers = inferToneModifiers(context)
  const vocabularyComplexity = inferVocabularyComplexity(context)
  const sentenceLengthAverage = inferSentenceLength(context, baseVoice)
  const dialogueToNarrationRatio = inferDialogueRatio(context)
  const emotionalDistance = inferEmotionalDistance(context)
  const descriptiveDensity = inferDescriptiveDensity(context)
  const pacingTempo = inferPacingTempo(context)

  const mapping: ToneMapping = {
    id: `map_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sceneId,
    baseVoice,
    toneModifiers,
    vocabularyComplexity,
    sentenceLengthAverage,
    dialogueToNarrationRatio,
    emotionalDistance,
    descriptiveDensity,
    pacingTempo,
    customAdjustments: {}
  }

  return {
    ...state,
    currentMappings: { ...state.currentMappings, [sceneId]: mapping },
    totalSceneShifts: state.totalSceneShifts + 1
  }
}

function inferBaseVoice(context: SceneContext): NarrativeVoice {
  if (context.povCharacter) return 'limited'
  switch (context.emotionalAtmosphere) {
    case 'mysterious': return 'omniscient'
    case 'romantic': return 'limited'
    default: return 'limited'
  }
}

function inferToneModifiers(context: SceneContext): ToneModifier[] {
  const mods: ToneModifier[] = []
  if (context.emotionalAtmosphere === 'tense') mods.push('clipped', 'urgent')
  if (context.emotionalAtmosphere === 'peaceful') mods.push('flowing', 'contemplative')
  if (context.emotionalAtmosphere === 'joyful') mods.push('lyrical')
  if (context.emotionalAtmosphere === 'violent') mods.push('staccato')
  if (context.emotionalAtmosphere === 'mysterious') mods.push('staccato')
  if (context.timeOfDay === 'night') mods.push('contemplative')
  return mods
}

function inferVocabularyComplexity(context: SceneContext): number {
  const baseMap: Record<EmotionalAtmosphere, number> = {
    tense: 55, romantic: 65, mysterious: 75, joyful: 45,
    melancholic: 70, violent: 50, peaceful: 50, nostalgic: 80
  }
  return baseMap[context.emotionalAtmosphere] || 50
}

function inferSentenceLength(context: SceneContext, voice: NarrativeVoice): number {
  const base: Record<NarrativeVoice, number> = {
    omniscient: 22, limited: 18, first_person: 15, dramatic: 12, objective: 14
  }
  return base[voice] || 18
}

function inferDialogueRatio(context: SceneContext): number {
  if (context.emotionalAtmosphere === 'romantic') return 0.5
  if (context.emotionalAtmosphere === 'tense' || context.emotionalAtmosphere === 'violent') return 0.3
  if (context.emotionalAtmosphere === 'peaceful') return 0.2
  return 0.35
}

function inferEmotionalDistance(context: SceneContext): number {
  if (context.emotionalAtmosphere === 'romantic') return 25  // intimate
  if (context.emotionalAtmosphere === 'mysterious') return 60
  if (context.emotionalAtmosphere === 'peaceful') return 70
  return 40
}

function inferDescriptiveDensity(context: SceneContext): number {
  if (context.emotionalAtmosphere === 'peaceful') return 60
  if (context.emotionalAtmosphere === 'nostalgic') return 75
  if (context.emotionalAtmosphere === 'violent' || context.emotionalAtmosphere === 'tense') return 30
  return 45
}

function inferPacingTempo(context: SceneContext): number {
  const tempoMap: Record<EmotionalAtmosphere, number> = {
    tense: 75, romantic: 40, mysterious: 50, joyful: 55,
    melancholic: 30, violent: 90, peaceful: 25, nostalgic: 35
  }
  return tempoMap[context.emotionalAtmosphere] || 50
}

// --- Voice Transitions ---

export function createVoiceTransition(
  state: ToneState,
  fromSceneId: string,
  toSceneId: string,
  transitionType: 'abrupt' | 'gradual' | 'interpolated' = 'gradual'
): ToneState {
  const id = `trans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const transition: VoiceTransition = {
    id,
    fromSceneId,
    toSceneId,
    transitionType,
    interpolationSteps: transitionType === 'gradual' ? 5 : transitionType === 'interpolated' ? 10 : 1,
    blendingFactors: {
      vocabularyComplexity: 0.3,
      sentenceLength: 0.2,
      emotionalDistance: 0.3,
      pacingTempo: 0.2
    }
  }

  return {
    ...state,
    transitions: { ...state.transitions, [id]: transition }
  }
}

export function interpolateTone(
  fromMapping: ToneMapping,
  toMapping: ToneMapping,
  step: number,
  totalSteps: number
): Partial<ToneMapping> {
  const ratio = step / totalSteps

  return {
    vocabularyComplexity: Math.round(fromMapping.vocabularyComplexity + (toMapping.vocabularyComplexity - fromMapping.vocabularyComplexity) * ratio),
    sentenceLengthAverage: Math.round(fromMapping.sentenceLengthAverage + (toMapping.sentenceLengthAverage - fromMapping.sentenceLengthAverage) * ratio),
    emotionalDistance: Math.round(fromMapping.emotionalDistance + (toMapping.emotionalDistance - fromMapping.emotionalDistance) * ratio),
    pacingTempo: Math.round(fromMapping.pacingTempo + (toMapping.pacingTempo - fromMapping.pacingTempo) * ratio),
    dialogueToNarrationRatio: Math.round((fromMapping.dialogueToNarrationRatio + (toMapping.dialogueToNarrationRatio - fromMapping.dialogueToNarrationRatio) * ratio) * 100) / 100,
    descriptiveDensity: Math.round(fromMapping.descriptiveDensity + (toMapping.descriptiveDensity - fromMapping.descriptiveDensity) * ratio)
  }
}

// --- Custom Adjustments ---

export function applyToneAdjustment(
  state: ToneState,
  sceneId: string,
  parameter: string,
  value: number
): ToneState {
  const mapping = state.currentMappings[sceneId]
  if (!mapping) return state

  return {
    ...state,
    currentMappings: {
      ...state.currentMappings,
      [sceneId]: {
        ...mapping,
        customAdjustments: { ...mapping.customAdjustments, [parameter]: value }
      }
    }
  }
}

// --- Query Functions ---

export function getToneMapping(state: ToneState, sceneId: string): ToneMapping | null {
  return state.currentMappings[sceneId] || null
}

export function getSceneContext(state: ToneState, sceneId: string): SceneContext | null {
  return state.sceneContexts[sceneId] || null
}

export function getCharacterVoice(state: ToneState, characterId: string): CharacterVoiceProfile | null {
  return state.characterProfiles[characterId] || null
}

export function getVoiceTransition(state: ToneState, fromSceneId: string, toSceneId: string): VoiceTransition | null {
  return Object.values(state.transitions).find(t => t.fromSceneId === fromSceneId && t.toSceneId === toSceneId) || null
}

export function getToneSummary(state: ToneState): {
  totalScenes: number,
  dominantVoice: NarrativeVoice,
  avgVocabularyComplexity: number,
  totalSceneShifts: number,
  transitionCount: number
} {
  const mappings = Object.values(state.currentMappings)
  const voiceCounts: Record<string, number> = {}
  for (const m of mappings) {
    voiceCounts[m.baseVoice] = (voiceCounts[m.baseVoice] || 0) + 1
  }
  const dominantVoice = Object.entries(voiceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as NarrativeVoice || state.defaultVoice

  return {
    totalScenes: mappings.length,
    dominantVoice,
    avgVocabularyComplexity: state.avgVocabularyComplexity,
    totalSceneShifts: state.totalSceneShifts,
    transitionCount: Object.keys(state.transitions).length
  }
}

export function compareToneMappings(map1: ToneMapping, map2: ToneMapping): {
  voiceMatch: boolean,
  modifierOverlap: number,
  complexityDiff: number,
  pacingDiff: number
} {
  const overlap = map1.toneModifiers.filter(m => map2.toneModifiers.includes(m)).length

  return {
    voiceMatch: map1.baseVoice === map2.baseVoice,
    modifierOverlap: overlap,
    complexityDiff: Math.abs(map1.vocabularyComplexity - map2.vocabularyComplexity),
    pacingDiff: Math.abs(map1.pacingTempo - map2.pacingTempo)
  }
}