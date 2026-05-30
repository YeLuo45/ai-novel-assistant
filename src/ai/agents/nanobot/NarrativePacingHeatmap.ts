/**
 * NarrativePacingHeatmap — V421
 * Pacing heatmap generation, chapter rhythm analysis, narrative tempo visualization.
 * Inspired by: thunderbolt (visualization feedback), nanobot (distributed analysis), ruflo (hierarchical structure)
 */

export interface PacingPoint {
  chapterId: string
  position: number  // 0-100 (position in chapter)
  energy: number  // 0-100 (narrative energy level)
  pacingType: 'action' | 'reflection' | 'dialogue' | 'transition' | 'exposition'
}

export interface ChapterPacing {
  chapterId: string
  averageEnergy: number
  peakEnergy: number
  lowEnergy: number
  pacingTypeDistribution: Record<string, number>
  rhythmScore: number  // 0-100 (how consistent/good the rhythm is)
}

export interface PacingHeatmapReport {
  totalChapters: number
  overallRhythm: number
  pacingTypesUsed: string[]
  unbalancedChapters: string[]
  recommendations: string[]
}

export interface NarrativePacingState {
  points: PacingPoint[]
  chapters: ChapterPacing[]
  report: PacingHeatmapReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativePacingState {
  return { points: [], chapters: [], report: null, typeAlias: {} }
}

export function addPacingPoint(
  state: NarrativePacingState,
  chapterId: string,
  position: number,
  energy: number,
  pacingType: PacingPoint['pacingType']
): NarrativePacingState {
  const point: PacingPoint = { chapterId, position: Math.max(0, Math.min(100, position)), energy: Math.max(0, Math.min(100, energy)), pacingType }
  const points = [...state.points.filter(p => !(p.chapterId === chapterId && p.position === position)), point]
  return { ...state, points }
}

export function generateChapterPacing(state: NarrativePacingState, chapterId: string): ChapterPacing {
  const chapterPoints = state.points.filter(p => p.chapterId === chapterId)
  if (chapterPoints.length === 0) {
    return { chapterId, averageEnergy: 50, peakEnergy: 50, lowEnergy: 50, pacingTypeDistribution: {}, rhythmScore: 50 }
  }
  
  const energies = chapterPoints.map(p => p.energy)
  const averageEnergy = Math.round(energies.reduce((a, b) => a + b, 0) / energies.length)
  const peakEnergy = Math.max(...energies)
  const lowEnergy = Math.min(...energies)
  
  const pacingTypeDistribution: Record<string, number> = {}
  for (const p of chapterPoints) pacingTypeDistribution[p.pacingType] = (pacingTypeDistribution[p.pacingType] || 0) + 1
  
  // Rhythm score: good rhythm has variation but not chaos
  const energyVariance = energies.reduce((s, e) => s + Math.abs(e - averageEnergy), 0) / energies.length
  let rhythmScore = Math.max(0, 100 - energyVariance)
  if (chapterPoints.length < 3) rhythmScore -= 20
  
  return { chapterId, averageEnergy, peakEnergy, lowEnergy, pacingTypeDistribution, rhythmScore: Math.round(rhythmScore) }
}

export function analyzePacing(state: NarrativePacingState): NarrativePacingState {
  const chapterIds = [...new Set(state.points.map(p => p.chapterId))]
  const chapters = chapterIds.map(id => generateChapterPacing(state, id))
  
  const report: PacingHeatmapReport = {
    totalChapters: chapterIds.length,
    overallRhythm: chapters.length > 0 ? Math.round(chapters.reduce((s, c) => s + c.rhythmScore, 0) / chapters.length) : 50,
    pacingTypesUsed: [...new Set(state.points.map(p => p.pacingType))],
    unbalancedChapters: chapters.filter(c => c.peakEnergy - c.lowEnergy > 60).map(c => c.chapterId),
    recommendations: [],
  }
  
  if (report.overallRhythm < 50) report.recommendations.push('Poor overall rhythm - vary pacing more')
  if (report.unbalancedChapters.length > chapterIds.length * 0.3) {
    report.recommendations.push(`${report.unbalancedChapters.length} chapters have extreme energy swings`)
  }
  if (!report.pacingTypesUsed.includes('action')) report.recommendations.push('No high-energy action points - add some climax scenes')
  if (!report.pacingTypesUsed.includes('reflection')) report.recommendations.push('No reflective moments - add breathing room')
  if (report.overallRhythm > 75) report.recommendations.push('Excellent pacing rhythm - maintain consistency')
  
  return { ...state, chapters, report }
}

export function getChapterHeatmap(state: NarrativePacingState, chapterId: string): PacingPoint[] {
  return state.points.filter(p => p.chapterId === chapterId).sort((a, b) => a.position - b.position)
}

export function compareChapterRhythm(state: NarrativePacingState, ch1: string, ch2: string): {
  betterRhythm: string
  score1: number
  score2: number
} {
  const c1 = state.chapters.find(c => c.chapterId === ch1)
  const c2 = state.chapters.find(c => c.chapterId === ch2)
  if (!c1 || !c2) return { betterRhythm: ch1, score1: 0, score2: 0 }
  return { betterRhythm: c1.rhythmScore > c2.rhythmScore ? ch1 : ch2, score1: c1.rhythmScore, score2: c2.rhythmScore }
}
