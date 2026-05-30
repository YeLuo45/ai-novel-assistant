/**
 * NarrativePacingEngine — V481
 * Pacing analysis, scene tempo tracking, chapter rhythm and narrative speed optimization.
 * Inspired by: thunderbolt (feedback), ruflo (layered analysis), chatdev (synthesis)
 */

export type PacingTempo = 'slow' | 'moderate' | 'fast' | 'intense'

export interface PacingMarker {
  id: string
  chapterNumber: number
  sceneNumber: number
  tempo: PacingTempo
  wordCount: number
  sceneDensity: number  // scenes per chapter
  pacingScore: number  // 0-100 (how engaging)
}

export interface PacingReport {
  totalMarkers: number
  avgPacing: number
  tempoBreakdown: Record<PacingTempo, number>
  recommendations: string[]
}

export interface NarrativePacingState {
  markers: PacingMarker[]
  report: PacingReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativePacingState {
  return { markers: [], report: null, typeAlias: {} }
}

export function markPacing(
  state: NarrativePacingState,
  chapter: number,
  sceneNumber: number,
  tempo: PacingTempo,
  wordCount: number,
  sceneDensity: number
): NarrativePacingState {
  const id = `pace_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const tempoScores: Record<string, number> = { slow: 40, moderate: 60, fast: 80, intense: 95 }
  const pacingScore = Math.min(100, tempoScores[tempo] + Math.min(10, wordCount / 200))
  const marker: PacingMarker = { id, chapterNumber: chapter, sceneNumber, tempo, wordCount: Math.max(0, wordCount), sceneDensity: Math.max(1, sceneDensity), pacingScore }
  const markers = [...state.markers, marker]
  return { ...state, markers }
}

export function generatePacingReport(state: NarrativePacingState): PacingReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, avgPacing: 0, tempoBreakdown: { slow: 0, moderate: 0, fast: 0, intense: 0 }, recommendations: [] }
  }
  const totalMarkers = state.markers.length
  const avgPacing = Math.round(state.markers.reduce((s, m) => s + m.pacingScore, 0) / totalMarkers)
  const tempoBreakdown: Record<string, number> = { slow: 0, moderate: 0, fast: 0, intense: 0 }
  for (const m of state.markers) tempoBreakdown[m.tempo]++
  const recommendations: string[] = []
  if (avgPacing < 50) recommendations.push('Slow overall pacing - consider tightening scenes')
  if (tempoBreakdown['slow'] > totalMarkers * 0.6) recommendations.push('Too many slow scenes - increase narrative momentum')
  if (tempoBreakdown['intense'] > totalMarkers * 0.3) recommendations.push('Many intense scenes - ensure contrast for impact')
  if (state.markers.some(m => m.wordCount > 5000)) recommendations.push('Some very long scenes - review for pacing issues')
  return { totalMarkers, avgPacing, tempoBreakdown: tempoBreakdown as Record<PacingTempo, number>, recommendations }
}

export function getChapterPacing(state: NarrativePacingState, chapter: number): PacingMarker[] {
  return state.markers.filter(m => m.chapterNumber === chapter)
}
