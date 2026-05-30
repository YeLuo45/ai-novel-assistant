/**
 * NarrativeVoiceAnalyzer — V455
 * Narrative voice consistency, authorial presence analysis, tone maintenance across chapters.
 * Inspired by: chatdev (voice synthesis), thunderbolt (feedback loops), generic-agent (optimization)
 */

export type VoiceType = 'first_person' | 'third_limited' | 'third_omniscient' | 'second_person' | 'epistolary' | 'unreliable'

export interface VoiceMarker {
  id: string
  chapterNumber: number
  voiceType: VoiceType
  sentenceCount: number
  avgWordLength: number
  passiveVoiceRatio: number  // 0-100
  showDontTellRatio: number  // 0-100 (higher = more showing)
  dialogueRatio: number  // 0-100
  authorialIntrusion: number  // 0-100 (how much author comments)
  voiceConsistency: number  // 0-100
}

export interface VoiceReport {
  totalMarkers: number
  dominantVoice: VoiceType | null
  avgConsistency: number
  deviationChapters: number[]
  recommendations: string[]
}

export interface NarrativeVoiceState {
  markers: VoiceMarker[]
  report: VoiceReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeVoiceState {
  return { markers: [], report: null, typeAlias: {} }
}

export function addVoiceMarker(
  state: NarrativeVoiceState,
  chapterNumber: number,
  voiceType: VoiceType,
  sentenceCount: number,
  avgWordLength: number,
  passiveVoiceRatio: number,
  showDontTellRatio: number,
  dialogueRatio: number,
  authorialIntrusion: number
): NarrativeVoiceState {
  const id = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  // Consistency decreases with: high passive, low show/tell, high authorial intrusion
  let consistency = 80
  if (passiveVoiceRatio > 30) consistency -= (passiveVoiceRatio - 30) * 0.5
  if (showDontTellRatio < 40) consistency -= (40 - showDontTellRatio) * 0.3
  if (authorialIntrusion > 40) consistency -= (authorialIntrusion - 40) * 0.4
  if (dialogueRatio > 60) consistency -= (dialogueRatio - 60) * 0.2
  if (sentenceCount < 5) consistency -= 10
  consistency = Math.max(0, Math.min(100, consistency))
  
  const marker: VoiceMarker = { id, chapterNumber, voiceType, sentenceCount, avgWordLength, passiveVoiceRatio, showDontTellRatio, dialogueRatio, authorialIntrusion, voiceConsistency: consistency }
  
  const markers = state.markers.filter(m => m.chapterNumber !== chapterNumber)
  markers.push(marker)
  markers.sort((a, b) => a.chapterNumber - b.chapterNumber)
  
  return { ...state, markers }
}

export function detectDominantVoice(state: NarrativeVoiceState): VoiceType | null {
  if (state.markers.length === 0) return null
  const counts: Record<string, number> = {}
  for (const m of state.markers) {
    counts[m.voiceType] = (counts[m.voiceType] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as VoiceType || null
}

export function findVoiceDeviations(state: NarrativeVoiceState): number[] {
  if (state.markers.length < 2) return []
  const dominated = detectDominantVoice(state)
  if (!dominated) return []
  return state.markers.filter(m => m.voiceType !== dominated && Math.abs(m.voiceConsistency - state.markers[0].voiceConsistency) > 20).map(m => m.chapterNumber)
}

export function generateVoiceReport(state: NarrativeVoiceState): VoiceReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, dominantVoice: null, avgConsistency: 100, deviationChapters: [], recommendations: [] }
  }
  
  const totalMarkers = state.markers.length
  const dominantVoice = detectDominantVoice(state)
  const avgConsistency = Math.round(state.markers.reduce((s, m) => s + m.voiceConsistency, 0) / totalMarkers)
  const deviationChapters = findVoiceDeviations(state)
  
  const recommendations: string[] = []
  if (deviationChapters.length > 0) {
    recommendations.push(`${deviationChapters.length} chapters with voice deviation - review ${deviationChapters.join(', ')}`)
  }
  if (avgConsistency < 70) recommendations.push('Low voice consistency - maintain narrative voice throughout')
  if (state.markers.some(m => m.passiveVoiceRatio > 40)) {
    recommendations.push('High passive voice in some chapters - use active construction')
  }
  if (state.markers.some(m => m.showDontTellRatio < 30)) {
    recommendations.push('Tell-dominant chapters detected - add more showing, less telling')
  }
  if (dominantVoice === 'unreliable' && state.markers.length > 5) {
    recommendations.push('Unreliable narrator maintained well - ensure signals to reader')
  }
  if (avgConsistency > 90) recommendations.push('Excellent voice consistency - strong authorial presence')
  
  return { totalMarkers, dominantVoice, avgConsistency, deviationChapters, recommendations }
}

export function getChapterVoice(state: NarrativeVoiceState, chapter: number): VoiceMarker | null {
  return state.markers.find(m => m.chapterNumber === chapter) || null
}

export function compareChapterVoice(state: NarrativeVoiceState, ch1: number, ch2: number): {
  moreConsistent: number
  score1: number
  score2: number
} {
  const m1 = state.markers.find(m => m.chapterNumber === ch1)
  const m2 = state.markers.find(m => m.chapterNumber === ch2)
  if (!m1 || !m2) return { moreConsistent: ch1, score1: 0, score2: 0 }
  return { moreConsistent: m1.voiceConsistency > m2.voiceConsistency ? ch1 : ch2, score1: m1.voiceConsistency, score2: m2.voiceConsistency }
}
