/**
 * NarrativeVoiceConsistencyEngine — V525
 * Maintains consistent narrative voice, style, and tone across all chapters.
 * Inspired by: claude-code (precise control) + chatdev (multi-agent voice)
 */

export interface NarrativeVoice {
  voiceId: string
  name: string
  perspective: 'first_person' | 'third_limited' | 'third_omniscient' | 'second_person'
  toneProfile: Record<string, number>  // adjective -> intensity (0-100)
  vocabularyLevel: number             // 1-10 (simple to literary)
  sentenceComplexity: number          // 1-10 (simple to complex)
  emotionalTemperature: number        // -100 (cold) to 100 (intense)
  pacingPreference: number            // 0 (meditative) to 100 (fast-paced)
  quirks: string[]                    // e.g., "uses metaphors", "short paragraphs"
}

export interface VoiceState {
  voices: Record<string, NarrativeVoice>
  activeVoice: string | null
  voiceTransitions: Array<{ chapter: number, fromVoice: string, toVoice: string, reason: string }>
  consistencyViolations: Array<{ chapter: number, page: number, description: string, severity: 'minor' | 'moderate' | 'major' }>
  currentPerspective: NarrativeVoice['perspective'] | null
}

export function createEmptyState(): VoiceState {
  return {
    voices: {},
    activeVoice: null,
    voiceTransitions: [],
    consistencyViolations: [],
    currentPerspective: null
  }
}

export function registerNarrativeVoice(state: VoiceState, voiceId: string, name: string, perspective: NarrativeVoice['perspective'], toneProfile: Record<string, number>, vocabularyLevel: number, sentenceComplexity: number, emotionalTemperature: number, pacingPreference: number, quirks: string[]): VoiceState {
  if (state.voices[voiceId]) return state
  
  return {
    ...state,
    voices: {
      ...state.voices,
      [voiceId]: { voiceId, name, perspective, toneProfile, vocabularyLevel, sentenceComplexity, emotionalTemperature, pacingPreference, quirks }
    }
  }
}

export function activateVoice(state: VoiceState, voiceId: string): VoiceState {
  if (!state.voices[voiceId]) return state
  const prev = state.activeVoice
  const transitions = prev && prev !== voiceId
    ? [...state.voiceTransitions, { chapter: 0, fromVoice: prev, toVoice: voiceId, reason: 'switch' }]
    : state.voiceTransitions
  
  return {
    ...state,
    activeVoice: voiceId,
    voiceTransitions: transitions,
    currentPerspective: state.voices[voiceId].perspective
  }
}

export function detectVoiceDeviation(state: VoiceState, chapter: number, page: number, perspective: NarrativeVoice['perspective'], vocabularyLevel: number, sentenceComplexity: number, emotionalTemperature: number): VoiceState {
  if (!state.activeVoice) return state
  const voice = state.voices[state.activeVoice]
  if (!voice) return state
  
  const violations = [...state.consistencyViolations]
  const descParts: string[] = []
  
  if (perspective !== voice.perspective) {
    descParts.push(`perspective is ${perspective}, expected ${voice.perspective}`)
  }
  if (Math.abs(vocabularyLevel - voice.vocabularyLevel) > 3) {
    descParts.push(`vocabulary level ${vocabularyLevel} far from ${voice.vocabularyLevel}`)
  }
  if (Math.abs(sentenceComplexity - voice.sentenceComplexity) > 4) {
    descParts.push(`sentence complexity ${sentenceComplexity} far from ${voice.sentenceComplexity}`)
  }
  if (Math.abs(emotionalTemperature - voice.emotionalTemperature) > 50) {
    descParts.push(`emotional temperature ${emotionalTemperature} far from ${voice.emotionalTemperature}`)
  }
  
  if (descParts.length > 0) {
    const severity: VoiceState['consistencyViolations'][0]['severity'] =
      descParts.length >= 3 ? 'major' : descParts.length >= 2 ? 'moderate' : 'minor'
    violations.push({ chapter, page, description: descParts.join('; '), severity })
  }
  
  return { ...state, consistencyViolations: violations }
}

export function getVoiceScore(state: VoiceState, voiceId: string): number {
  const voice = state.voices[voiceId]
  if (!voice) return 0
  const profileSum = Object.values(voice.toneProfile).reduce((s, v) => s + v, 0) / Math.max(Object.keys(voice.toneProfile).length, 1)
  const vocabScore = voice.vocabularyLevel * 10
  const complexityScore = voice.sentenceComplexity * 10
  return Math.round((profileSum + vocabScore + complexityScore) / 3)
}

export function compareVoices(state: VoiceState, voiceId1: string, voiceId2: string): number {
  const score1 = getVoiceScore(state, voiceId1)
  const score2 = getVoiceScore(state, voiceId2)
  return score1 - score2
}

export function blendVoices(state: VoiceState, sourceId: string, targetId: string, blendRatio: number): NarrativeVoice | null {
  const source = state.voices[sourceId]
  const target = state.voices[targetId]
  if (!source || !target) return null
  
  const ratio = Math.max(0, Math.min(1, blendRatio))
  const blended: NarrativeVoice = {
    voiceId: `${sourceId}_${targetId}_blend`,
    name: `${source.name} / ${target.name}`,
    perspective: ratio < 0.5 ? source.perspective : target.perspective,
    toneProfile: {},
    vocabularyLevel: Math.round(source.vocabularyLevel * (1 - ratio) + target.vocabularyLevel * ratio),
    sentenceComplexity: Math.round(source.sentenceComplexity * (1 - ratio) + target.sentenceComplexity * ratio),
    emotionalTemperature: source.emotionalTemperature * (1 - ratio) + target.emotionalTemperature * ratio,
    pacingPreference: source.pacingPreference * (1 - ratio) + target.pacingPreference * ratio,
    quirks: [...source.quirks, ...target.quirks].filter((q, i, arr) => arr.indexOf(q) === i)
  }
  
  for (const key of Array.from(new Set([...Object.keys(source.toneProfile), ...Object.keys(target.toneProfile)]))) {
    const sVal = source.toneProfile[key] || 0
    const tVal = target.toneProfile[key] || 0
    blended.toneProfile[key] = Math.round(sVal * (1 - ratio) + tVal * ratio)
  }
  
  return blended
}

export function getActiveVoice(state: VoiceState): NarrativeVoice | null {
  return state.activeVoice ? state.voices[state.activeVoice] : null
}

export function getVoiceById(state: VoiceState, voiceId: string): NarrativeVoice | null {
  return state.voices[voiceId] || null
}

export function getConsistencyViolations(state: VoiceState, minSeverity?: 'minor' | 'moderate' | 'major'): typeof state.consistencyViolations {
  if (!minSeverity) return state.consistencyViolations
  const severityOrder = ['minor', 'moderate', 'major']
  const minIdx = severityOrder.indexOf(minSeverity)
  return state.consistencyViolations.filter(v => severityOrder.indexOf(v.severity) >= minIdx)
}

export function getVoiceSummary(state: VoiceState): { totalVoices: number, activeVoice: string | null, totalViolations: number, majorViolations: number } {
  return {
    totalVoices: Object.keys(state.voices).length,
    activeVoice: state.activeVoice,
    totalViolations: state.consistencyViolations.length,
    majorViolations: state.consistencyViolations.filter(v => v.severity === 'major').length
  }
}

export function clearViolations(state: VoiceState): VoiceState {
  return { ...state, consistencyViolations: [] }
}

export function transferVoiceToChapter(state: VoiceState, voiceId: string, chapter: number, reason: string): VoiceState {
  if (!state.voices[voiceId]) return state
  const prev = state.activeVoice
  return {
    ...state,
    activeVoice: voiceId,
    currentPerspective: state.voices[voiceId].perspective,
    voiceTransitions: prev && prev !== voiceId
      ? [...state.voiceTransitions, { chapter, fromVoice: prev, toVoice: voiceId, reason }]
      : state.voiceTransitions
  }
}