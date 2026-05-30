/**
 * NarrativeStyleEngine — V475
 * Prose style analysis, sentence variation tracking, authorial voice consistency measurement.
 * Inspired by: chatdev (voice synthesis), generic-agent (optimization), ruflo (layered analysis)
 */

export type StylePeriod = 'early' | 'developing' | 'mature' | 'late'

export interface StyleMarker {
  id: string
  chapterNumber: number
  avgSentenceLength: number  // words
  vocabularyRichness: number  // 0-100
  paragraphDensity: number  // avg sentences per paragraph
  stylePeriod: StylePeriod
  voiceConsistency: number  // 0-100
}

export interface StyleReport {
  totalMarkers: number
  avgVocabularyRichness: number
  dominantPeriod: StylePeriod | null
  recommendations: string[]
}

export interface NarrativeStyleEngineState {
  markers: StyleMarker[]
  report: StyleReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeStyleEngineState {
  return { markers: [], report: null, typeAlias: {} }
}

export function recordStyleMarker(
  state: NarrativeStyleEngineState,
  chapter: number,
  avgSentenceLength: number,
  vocabularyRichness: number,
  paragraphDensity: number
): NarrativeStyleEngineState {
  const id = `style_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  let stylePeriod: StylePeriod = 'developing'
  if (chapter < 5) stylePeriod = 'early'
  else if (chapter < 15) stylePeriod = 'developing'
  else if (chapter < 25) stylePeriod = 'mature'
  else stylePeriod = 'late'
  
  const voiceConsistency = Math.max(20, Math.min(95, Math.round(75 + vocabularyRichness * 0.2 - Math.abs(avgSentenceLength - 18) * 1.5)))
  const marker: StyleMarker = { id, chapterNumber: chapter, avgSentenceLength: Math.max(1, avgSentenceLength), vocabularyRichness: Math.max(0, Math.min(100, vocabularyRichness)), paragraphDensity: Math.max(1, paragraphDensity), stylePeriod, voiceConsistency }
  const markers = [...state.markers, marker].sort((a, b) => a.chapterNumber - b.chapterNumber)
  return { ...state, markers }
}

export function generateStyleReport(state: NarrativeStyleEngineState): StyleReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, avgVocabularyRichness: 0, dominantPeriod: null, recommendations: [] }
  }
  const totalMarkers = state.markers.length
  const avgVocabularyRichness = Math.round(state.markers.reduce((s, m) => s + m.vocabularyRichness, 0) / totalMarkers)
  const periodCounts: Record<string, number> = {}
  for (const m of state.markers) periodCounts[m.stylePeriod] = (periodCounts[m.stylePeriod] || 0) + 1
  const dominantPeriod = Object.entries(periodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as StylePeriod || null
  const recommendations: string[] = []
  if (avgVocabularyRichness < 40) recommendations.push('Limited vocabulary richness - expand word choice')
  if (state.markers.some(m => m.voiceConsistency < 50)) recommendations.push('Voice inconsistency in some chapters - maintain style')
  if (state.markers.filter(m => m.stylePeriod === 'early').length > totalMarkers * 0.5) recommendations.push('Many early-period markers - consider stylistic growth')
  if (avgVocabularyRichness > 75) recommendations.push('Excellent vocabulary richness - sophisticated prose style')
  return { totalMarkers, avgVocabularyRichness, dominantPeriod, recommendations }
}

export function getChapterStyle(state: NarrativeStyleEngineState, chapter: number): StyleMarker | null {
  return state.markers.find(m => m.chapterNumber === chapter) || null
}
