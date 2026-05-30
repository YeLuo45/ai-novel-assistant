/**
 * NarrativeSyntaxEngine — V491
 * Syntax analysis, sentence structure patterns, complexity tracking and readability metrics.
 * Inspired by: ruflo (layered analysis), chatdev (synthesis), generic-agent (optimization)
 */

export type SentenceType = 'simple' | 'compound' | 'complex' | 'compound-complex'
export type SyntaxPattern = 'paratactic' | 'hypotactic' | 'mixed'

export interface SyntaxMarker {
  id: string
  chapter: number
  avgSentenceLength: number  // words
  sentenceTypeDistribution: Record<SentenceType, number>
  syntaxPattern: SyntaxPattern
  complexityScore: number  // 0-100
  readabilityIndex: number  // 0-100 (higher = more readable)
}

export interface SyntaxReport {
  totalMarkers: number
  avgComplexity: number
  avgReadability: number
  recommendations: string[]
}

export interface NarrativeSyntaxState {
  markers: SyntaxMarker[]
  report: SyntaxReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeSyntaxState {
  return { markers: [], report: null, typeAlias: {} }
}

export function analyzeSyntax(
  state: NarrativeSyntaxState,
  chapter: number,
  avgSentenceLength: number,
  sentenceTypeDistribution: Record<SentenceType, number>,
  syntaxPattern: SyntaxPattern
): NarrativeSyntaxState {
  const id = `syn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const complexityScore = Math.min(100, Math.round(avgSentenceLength * 2.5 + (sentenceTypeDistribution['compound-complex'] || 0) * 5))
  const readabilityIndex = Math.max(20, Math.min(100, 100 - avgSentenceLength * 2 - complexityScore * 0.3))
  const marker: SyntaxMarker = { id, chapter, avgSentenceLength: Math.max(1, avgSentenceLength), sentenceTypeDistribution, syntaxPattern, complexityScore, readabilityIndex }
  const markers = [...state.markers, marker].sort((a, b) => a.chapter - b.chapter)
  return { ...state, markers }
}

export function generateSyntaxReport(state: NarrativeSyntaxState): SyntaxReport {
  if (state.markers.length === 0) {
    return { totalMarkers: 0, avgComplexity: 0, avgReadability: 100, recommendations: [] }
  }
  const totalMarkers = state.markers.length
  const avgComplexity = Math.round(state.markers.reduce((s, m) => s + m.complexityScore, 0) / totalMarkers)
  const avgReadability = Math.round(state.markers.reduce((s, m) => s + m.readabilityIndex, 0) / totalMarkers)
  const recommendations: string[] = []
  if (avgReadability < 50) recommendations.push('Low readability - simplify sentence structures')
  if (avgComplexity > 80) recommendations.push('Very high complexity - vary sentence length for flow')
  if (state.markers.some(m => m.avgSentenceLength > 30)) recommendations.push('Some very long sentences - break up for clarity')
  if (avgReadability > 75) recommendations.push('Good readability - clear prose style')
  return { totalMarkers, avgComplexity, avgReadability, recommendations }
}

export function getChapterSyntax(state: NarrativeSyntaxState, chapter: number): SyntaxMarker | null {
  return state.markers.find(m => m.chapter === chapter) || null
}
