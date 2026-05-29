/**
 * NarrativeProgressionAnalyzer — V387
 * Story arc progression, three-act structure validation, chapter-to-chapter flow analysis.
 * Inspired by: ruflo (hierarchical decomposition), thunderbolt (feedback loops), generic-agent (goal tracking)
 */

export interface ActBreakdown {
  act1End: number  // chapter number
  act2End: number
  act3Start: number
}

export interface ChapterFlow {
  chapterId: string
  chapterNumber: number
  connectionsFrom: string[]  // chapters that lead to this
  connectionsTo: string[]    // chapters this leads to
  arcPosition: 'act1' | 'act2' | 'act3'
  pacingRating: number  // 0-100
  progressionScore: number  // 0-100 (how well story advances)
}

export interface ProgressionReport {
  totalChapters: number
  actBreakdown: ActBreakdown | null
  averagePacing: number
  averageProgression: number
  stagnationPoints: string[]  // chapters with low progression
  pacingIssues: string[]  // chapters with pacing problems
  recommendations: string[]
}

export interface NarrativeProgressionState {
  chapters: Record<string, ChapterFlow>
  actBreakdown: ActBreakdown | null
  arcType: ArcType
  progressionReport: ProgressionReport | null
  typeAlias: Record<string, unknown>
}

export type ArcType = 'three-act' | 'five-act' | 'hero-journey' | 'save-the-cat' | 'seven-point' | 'custom'

export function createEmptyState(): NarrativeProgressionState {
  return { chapters: {}, actBreakdown: null, arcType: 'three-act', progressionReport: null, typeAlias: {} }
}

export function registerChapter(
  state: NarrativeProgressionState,
  chapterId: string,
  chapterNumber: number,
  connectionsTo: string[] = [],
  pacingRating: number = 70,
  progressionScore: number = 70
): NarrativeProgressionState {
  // Determine arc position
  let arcPosition: ChapterFlow['arcPosition'] = 'act1'
  if (state.actBreakdown) {
    const { act1End, act2End } = state.actBreakdown
    if (chapterNumber > act2End) arcPosition = 'act3'
    else if (chapterNumber > act1End) arcPosition = 'act2'
  }
  
  // Calculate connections from
  const connectionsFrom: string[] = []
  for (const [cid, ch] of Object.entries(state.chapters)) {
    if (ch.connectionsTo.includes(chapterId)) {
      connectionsFrom.push(cid)
    }
  }
  
  const flow: ChapterFlow = { chapterId, chapterNumber, connectionsFrom, connectionsTo, arcPosition, pacingRating, progressionScore }
  const chapters = { ...state.chapters, [chapterId]: flow }
  
  return { ...state, chapters }
}

export function setActBreakdown(
  state: NarrativeProgressionState,
  act1End: number,
  act2End: number
): NarrativeProgressionState {
  const actBreakdown: ActBreakdown = { act1End, act2End, act3Start: act2End + 1 }
  
  // Update all chapters' arc positions
  const chapters: Record<string, ChapterFlow> = {}
  for (const [cid, ch] of Object.entries(state.chapters)) {
    let arcPosition: ChapterFlow['arcPosition'] = 'act1'
    if (ch.chapterNumber > act2End) arcPosition = 'act3'
    else if (ch.chapterNumber > act1End) arcPosition = 'act2'
    chapters[cid] = { ...ch, arcPosition }
  }
  
  return { ...state, actBreakdown, chapters }
}

export function generateProgressionReport(state: NarrativeProgressionState): ProgressionReport {
  const chapters = Object.values(state.chapters)
  const totalChapters = chapters.length
  
  if (totalChapters === 0) {
    return { totalChapters: 0, actBreakdown: null, averagePacing: 0, averageProgression: 0, stagnationPoints: [], pacingIssues: [], recommendations: [] }
  }
  
  const averagePacing = chapters.reduce((s, c) => s + c.pacingRating, 0) / totalChapters
  const averageProgression = chapters.reduce((s, c) => s + c.progressionScore, 0) / totalChapters
  
  const stagnationPoints = chapters.filter(c => c.progressionScore < 40).map(c => c.chapterId)
  const pacingIssues = chapters.filter(c => c.pacingRating < 40).map(c => c.chapterId)
  
  const recommendations: string[] = []
  if (stagnationPoints.length > 0) recommendations.push(`Revise ${stagnationPoints.length} chapters with low progression`)
  if (pacingIssues.length > 0) recommendations.push(`Adjust pacing in ${pacingIssues.length} chapters`)
  if (averageProgression > 70) recommendations.push('Strong story progression overall')
  if (state.actBreakdown) {
    const act1Chapters = chapters.filter(c => c.arcPosition === 'act1').length
    const act2Chapters = chapters.filter(c => c.arcPosition === 'act2').length
    const act3Chapters = chapters.filter(c => c.arcPosition === 'act3').length
    if (act2Chapters < act1Chapters) recommendations.push('Act 2 may be too short - expand the rising action')
    if (act3Chapters > act1Chapters * 1.5) recommendations.push('Act 3 may be too long - consider trimming')
  }
  
  return {
    totalChapters,
    actBreakdown: state.actBreakdown,
    averagePacing: Math.round(averagePacing),
    averageProgression: Math.round(averageProgression),
    stagnationPoints,
    pacingIssues,
    recommendations,
  }
}

export function analyzeArcPosition(state: NarrativeProgressionState, chapterId: string): {
  arcPosition: string
  shouldHaveClimax: boolean
  shouldHaveResolution: boolean
  isTurningPoint: boolean
} {
  const chapter = state.chapters[chapterId]
  if (!chapter) return { arcPosition: 'unknown', shouldHaveClimax: false, shouldHaveResolution: false, isTurningPoint: false }
  
  return {
    arcPosition: chapter.arcPosition,
    shouldHaveClimax: chapter.arcPosition === 'act3',
    shouldHaveResolution: chapter.arcPosition === 'act3',
    isTurningPoint: chapter.chapterNumber === state.actBreakdown?.act1End + 1 || chapter.chapterNumber === state.actBreakdown?.act2End + 1,
  }
}

export function compareActProgression(state: NarrativeProgressionState, act1: string, act2: string): {
  betterPacing: string
  betterProgression: string
  pacingDiff: number
  progressionDiff: number
} {
  const acts: Record<string, ChapterFlow['arcPosition']> = { act1: 'act1', act2: 'act2' }
  const act1Chapters = Object.values(state.chapters).filter(c => c.arcPosition === acts[act1])
  const act2Chapters = Object.values(state.chapters).filter(c => c.arcPosition === acts[act2])
  
  const avgPacing1 = act1Chapters.length > 0 ? act1Chapters.reduce((s, c) => s + c.pacingRating, 0) / act1Chapters.length : 0
  const avgPacing2 = act2Chapters.length > 0 ? act2Chapters.reduce((s, c) => s + c.pacingRating, 0) / act2Chapters.length : 0
  const avgProg1 = act1Chapters.length > 0 ? act1Chapters.reduce((s, c) => s + c.progressionScore, 0) / act1Chapters.length : 0
  const avgProg2 = act2Chapters.length > 0 ? act2Chapters.reduce((s, c) => s + c.progressionScore, 0) / act2Chapters.length : 0
  
  return {
    betterPacing: avgPacing1 > avgPacing2 ? act1 : act2,
    betterProgression: avgProg1 > avgProg2 ? act1 : act2,
    pacingDiff: Math.abs(avgPacing1 - avgPacing2),
    progressionDiff: Math.abs(avgProg1 - avgProg2),
  }
}
