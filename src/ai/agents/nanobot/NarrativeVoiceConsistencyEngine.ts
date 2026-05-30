/**
 * NarrativeVoiceConsistencyEngine — V393
 * Narrative voice and tone consistency tracking across chapters, revision passes, and authorial intent.
 * Inspired by: chatdev (multi-perspective), generic-agent (validation), thunderbolt (feedback loops)
 */

export type VoiceQuality = 'formal' | 'casual' | 'poetic' | 'sparse' | 'descriptive' | 'conversational' | 'mixed'

export interface VoiceMarker {
  chapterId: string
  formalityLevel: number  // 0-100 (0=casual, 100=formal)
  sentenceComplexity: number  // 0-100 (average sentence length)
  vocabularyRichness: number  // 0-100
  pacingTone: 'fast' | 'moderate' | 'slow'
  emotionalTemperature: number  // 0-100 (how emotionally charged)
  voiceQuality: VoiceQuality
}

export interface VoiceConsistencyReport {
  overallConsistency: number  // 0-100
  chaptersAnalyzed: number
  inconsistentChapters: string[]
  dominantFormality: number
  dominantPacing: string
  recommendations: string[]
}

export interface NarrativeVoiceState {
  markers: VoiceMarker[]
  consistencyReport: VoiceConsistencyReport | null
  targetVoice: VoiceMarker | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeVoiceState {
  return { markers: [], consistencyReport: null, targetVoice: null, typeAlias: {} }
}

function detectVoiceQuality(formality: number, complexity: number, richness: number, emotional: number): VoiceQuality {
  if (formality > 70 && complexity > 60 && richness > 60) return 'formal'
  if (formality < 40 && complexity < 40) return 'casual'
  if (richness > 70 && emotional > 60) return 'poetic'
  if (complexity < 30 && formality < 40) return 'sparse'
  if (richness > 50 && complexity > 50) return 'descriptive'
  if (formality < 30 && emotional > 40) return 'conversational'
  return 'mixed'
}

export function analyzeVoice(
  state: NarrativeVoiceState,
  chapterId: string,
  avgSentenceLength: number,
  uniqueWordRatio: number,
  emotionallyChargedWordCount: number,
  totalWords: number
): NarrativeVoiceState {
  const formalityLevel = Math.min(100, Math.max(0, 50 + (avgSentenceLength - 15) * 3 + (uniqueWordRatio - 0.3) * 200))
  const sentenceComplexity = Math.min(100, avgSentenceLength * 3)
  const vocabularyRichness = Math.min(100, uniqueWordRatio * 150)
  const emotionalTemperature = Math.min(100, (emotionallyChargedWordCount / Math.max(1, totalWords)) * 1000)
  
  const pacingTone: VoiceMarker['pacingTone'] = avgSentenceLength < 10 ? 'fast' : avgSentenceLength < 20 ? 'moderate' : 'slow'
  
  const voiceQuality = detectVoiceQuality(formalityLevel, sentenceComplexity, vocabularyRichness, emotionalTemperature)
  
  const marker: VoiceMarker = {
    chapterId,
    formalityLevel: Math.round(formalityLevel),
    sentenceComplexity: Math.round(sentenceComplexity),
    vocabularyRichness: Math.round(vocabularyRichness),
    pacingTone,
    emotionalTemperature: Math.round(emotionalTemperature),
    voiceQuality,
  }
  
  const markers = [...state.markers.filter(m => m.chapterId !== chapterId), marker]
  
  return { ...state, markers }
}

export function setTargetVoice(
  state: NarrativeVoiceState,
  formalityLevel: number,
  sentenceComplexity: number,
  vocabularyRichness: number,
  pacingTone: VoiceMarker['pacingTone'],
  emotionalTemperature: number
): NarrativeVoiceState {
  const voiceQuality = detectVoiceQuality(formalityLevel, sentenceComplexity, vocabularyRichness, emotionalTemperature)
  const targetVoice: VoiceMarker = {
    chapterId: '__target__',
    formalityLevel,
    sentenceComplexity,
    vocabularyRichness,
    pacingTone,
    emotionalTemperature,
    voiceQuality,
  }
  return { ...state, targetVoice }
}

export function generateConsistencyReport(state: NarrativeVoiceState): VoiceConsistencyReport {
  if (state.markers.length === 0) {
    return { overallConsistency: 100, chaptersAnalyzed: 0, inconsistentChapters: [], dominantFormality: 50, dominantPacing: 'moderate', recommendations: [] }
  }
  
  const formalityValues = state.markers.map(m => m.formalityLevel)
  const dominantFormality = Math.round(formalityValues.reduce((a, b) => a + b, 0) / formalityValues.length)
  
  const pacingCounts: Record<string, number> = { fast: 0, moderate: 0, slow: 0 }
  for (const m of state.markers) pacingCounts[m.pacingTone]++
  const dominantPacing = Object.entries(pacingCounts).sort((a, b) => b[1] - a[1])[0][0] as VoiceMarker['pacingTone']
  
  // Find inconsistent chapters
  const inconsistentChapters: string[] = []
  for (const marker of state.markers) {
    if (state.targetVoice) {
      const diff = Math.abs(marker.formalityLevel - state.targetVoice.formalityLevel)
      if (diff > 25) inconsistentChapters.push(marker.chapterId)
    }
  }
  
  const avgFormality = dominantFormality
  let consistency = 100
  for (const marker of state.markers) {
    consistency -= Math.abs(marker.formalityLevel - avgFormality) * 0.5
  }
  if (state.targetVoice) {
    for (const marker of state.markers) {
      const targetDiff = Math.abs(marker.formalityLevel - state.targetVoice.formalityLevel) +
        Math.abs(marker.sentenceComplexity - state.targetVoice.sentenceComplexity) +
        Math.abs(marker.vocabularyRichness - state.targetVoice.vocabularyRichness)
      consistency -= targetDiff * 0.1
    }
  }
  
  consistency = Math.max(0, Math.min(100, consistency))
  
  const recommendations: string[] = []
  if (inconsistentChapters.length > 0) recommendations.push(`Revise voice in ${inconsistentChapters.length} inconsistent chapters`)
  if (consistency < 70) recommendations.push('Consider establishing a more consistent narrative voice')
  if (state.targetVoice && consistency > 85) recommendations.push('Voice consistency is strong - maintain current approach')
  if (!state.targetVoice) recommendations.push('Set a target voice profile to track consistency')
  
  return {
    overallConsistency: Math.round(consistency),
    chaptersAnalyzed: state.markers.length,
    inconsistentChapters,
    dominantFormality,
    dominantPacing,
    recommendations,
  }
}

export function compareChapterVoice(state: NarrativeVoiceState, ch1: string, ch2: string): {
  moreFormal: string
  moreComplex: string
  moreEmotional: string
} {
  const m1 = state.markers.find(m => m.chapterId === ch1)
  const m2 = state.markers.find(m => m.chapterId === ch2)
  if (!m1 || !m2) return { moreFormal: ch1, moreComplex: ch1, moreEmotional: ch1 }
  return {
    moreFormal: m1.formalityLevel > m2.formalityLevel ? ch1 : ch2,
    moreComplex: m1.sentenceComplexity > m2.sentenceComplexity ? ch1 : ch2,
    moreEmotional: m1.emotionalTemperature > m2.emotionalTemperature ? ch1 : ch2,
  }
}
