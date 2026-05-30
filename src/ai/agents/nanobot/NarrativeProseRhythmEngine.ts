/**
 * NarrativeProseRhythmEngine — V443
 * Prose rhythm analysis, sentence length variation, cadence patterns for narrative flow.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical decomposition), chatdev (pattern analysis)
 */

export type RhythmPattern = 'staccato' | 'flowing' | 'mixing' | 'monotone' | 'dramatic'
export type SentenceType = 'simple' | 'compound' | 'complex' | 'compound-complex'

export interface ProseSegment {
  id: string
  chapterId: string
  position: number  // 0-100
  sentenceCount: number
  avgSentenceLength: number
  rhythmPattern: RhythmPattern
  sentenceTypes: SentenceType[]
  paragraphCount: number
}

export interface RhythmReport {
  totalSegments: number
  rhythmDistribution: Record<RhythmPattern, number>
  avgSentenceLength: number
  dominantPattern: RhythmPattern | null
  recommendations: string[]
}

export interface NarrativeProseState {
  segments: ProseSegment[]
  report: RhythmReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeProseState {
  return { segments: [], report: null, typeAlias: {} }
}

export function analyzeProseSegment(
  state: NarrativeProseState,
  chapterId: string,
  position: number,
  sentenceCount: number,
  sentenceLengths: number[],
  paragraphCount: number
): NarrativeProseState {
  const id = `rhythm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const avgSentenceLength = sentenceLengths.length > 0
    ? Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length)
    : 0
  
  // Determine rhythm pattern
  let rhythmPattern: RhythmPattern = 'mixing'
  if (sentenceLengths.length > 0) {
    const maxLen = Math.max(...sentenceLengths)
    const minLen = Math.min(...sentenceLengths)
    const variance = maxLen - minLen
    
    if (variance < 5) rhythmPattern = 'monotone'
    else if (avgSentenceLength < 10) rhythmPattern = 'staccato'
    else if (avgSentenceLength > 25) rhythmPattern = 'flowing'
    else rhythmPattern = 'mixing'
  }
  
  // Analyze sentence type distribution
  const sentenceTypes: SentenceType[] = []
  for (const len of sentenceLengths) {
    if (len < 10) sentenceTypes.push('simple')
    else if (len < 20) sentenceTypes.push('compound')
    else if (len < 35) sentenceTypes.push('complex')
    else sentenceTypes.push('compound-complex')
  }
  
  const segment: ProseSegment = { id, chapterId, position, sentenceCount, avgSentenceLength, rhythmPattern, sentenceTypes, paragraphCount }
  
  // Replace if same chapter+position exists
  const segments = state.segments.filter(s => !(s.chapterId === chapterId && s.position === position))
  segments.push(segment)
  segments.sort((a, b) => a.chapterId < b.chapterId ? -1 : a.chapterId > b.chapterId ? 1 : a.position - b.position)
  
  return { ...state, segments }
}

export function generateRhythmReport(state: NarrativeProseState): RhythmReport {
  if (state.segments.length === 0) {
    return { totalSegments: 0, rhythmDistribution: { staccato: 0, flowing: 0, mixing: 0, monotone: 0, dramatic: 0 }, avgSentenceLength: 0, dominantPattern: null, recommendations: [] }
  }
  
  const rhythmDistribution: Record<RhythmPattern, number> = { staccato: 0, flowing: 0, mixing: 0, monotone: 0, dramatic: 0 }
  let totalLength = 0
  
  for (const seg of state.segments) {
    rhythmDistribution[seg.rhythmPattern]++
    totalLength += seg.avgSentenceLength
  }
  
  const avgSentenceLength = Math.round(totalLength / state.segments.length)
  const dominantEntry = Object.entries(rhythmDistribution).sort((a, b) => b[1] - a[1])[0]
  const dominantPattern = dominantEntry?.[1] > 0 ? dominantEntry[0] as RhythmPattern : null
  
  const recommendations: string[] = []
  if (rhythmDistribution['monotone'] > state.segments.length * 0.4) {
    recommendations.push('Prose rhythm too monotone - vary sentence length')
  }
  if (rhythmDistribution['staccato'] > state.segments.length * 0.5) {
    recommendations.push('Heavy staccato rhythm - consider adding flowing passages for contrast')
  }
  if (avgSentenceLength > 30) {
    recommendations.push('Sentences very long on average - break up for readability')
  }
  if (avgSentenceLength < 8) {
    recommendations.push('Sentences very short - vary with longer complex sentences')
  }
  if (rhythmDistribution['flowing'] === 0 && state.segments.length > 10) {
    recommendations.push('No flowing passages - add lyrical, flowing prose sections')
  }
  if (rhythmDistribution['mixing'] > state.segments.length * 0.6) {
    recommendations.push('Good rhythmic variety - maintain this balance')
  }
  
  return { totalSegments: state.segments.length, rhythmDistribution, avgSentenceLength, dominantPattern, recommendations }
}

export function getChapterRhythm(state: NarrativeProseState, chapterId: string): ProseSegment[] {
  return state.segments.filter(s => s.chapterId === chapterId)
}

export function compareRhythm(seg1: ProseSegment, seg2: ProseSegment): {
  moreStaccato: string
  len1: number
  len2: number
} {
  return {
    moreStaccato: seg1.avgSentenceLength < seg2.avgSentenceLength ? seg1.id : seg2.id,
    len1: seg1.avgSentenceLength,
    len2: seg2.avgSentenceLength,
  }
}
