/**
 * AdaptiveChapterFlowEngine — V511
 * Dynamic chapter structure adaptation, pacing redistribution, and section break optimization.
 * Inspired by: thunderbolt (feedback pipeline) + ruflo (hierarchical decomposition) + nanobot (mesh state)
 */

export type ChapterPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution' | 'hook'
export type SectionType = 'narrative' | 'dialogue' | 'action' | 'reflection' | 'description' | 'transition'
export type FlowIssue = ' pacing_slow' | 'pacing_fast' | 'sagging_middle' | 'abrupt_ending' | 'unbalanced'

export interface SectionBreak {
  id: string
  position: number  // 0-100 percentage in chapter
  type: SectionType
  content: string
  optimalLength: number  // optimal words for this section
  actualLength: number
  qualityScore: number
}

export interface ChapterFlow {
  id: string
  chapterNumber: number
  phase: ChapterPhase
  totalWords: number
  pacingScore: number  // 0-100
  sections: SectionBreak[]
  hookStrength: number  // 0-100, how compelling the chapter ending is
  emotionalArc: number[]  // intensity curve
  issues: FlowIssue[]
}

export interface EngagementSignal {
  chapterNumber: number
  dropOffRate: number  // 0-100, how many readers dropped off
  avgTimeSpent: number  // seconds
  peakMoment: number  // 0-100 position where most readers stopped
  replayRate: number  // 0-100, how often this chapter was re-read
}

export interface FlowAdaptation {
  id: string
  chapterNumber: number
  originalPhase: ChapterPhase
  newPhase: ChapterPhase
  sectionChanges: { sectionId: string, newPosition?: number, newLength?: number }[]
  pacingAdjustment: number  // delta
  timestamp: number
}

export interface ChapterFlowState {
  chapters: Record<string, ChapterFlow>
  engagementSignals: Record<string, EngagementSignal>
  adaptations: FlowAdaptation[]
  avgChapterPacing: number
  avgHookStrength: number
  commonIssues: { issue: FlowIssue, frequency: number }[]
}

export function createEmptyState(): ChapterFlowState {
  return {
    chapters: {},
    engagementSignals: {},
    adaptations: [],
    avgChapterPacing: 50,
    avgHookStrength: 50,
    commonIssues: []
  }
}

export function createChapterFlow(
  state: ChapterFlowState,
  chapterNumber: number,
  phase: ChapterPhase = 'rising',
  totalWords: number = 3000
): ChapterFlowState {
  const id = `flow_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const flow: ChapterFlow = {
    id,
    chapterNumber,
    phase,
    totalWords,
    pacingScore: 50,
    sections: [],
    hookStrength: 50,
    emotionalArc: [50, 60, 70, 80, 70, 50],
    issues: []
  }

  return {
    ...state,
    chapters: { ...state.chapters, [id]: flow }
  }
}

export function addSectionBreak(
  state: ChapterFlowState,
  chapterId: string,
  position: number,
  type: SectionType,
  content: string,
  optimalLength: number = 500
): ChapterFlowState {
  const chapter = state.chapters[chapterId]
  if (!chapter) return state

  const section: SectionBreak = {
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    position: Math.max(0, Math.min(100, position)),
    type,
    content,
    optimalLength,
    actualLength: content.split(/\s+/).length,
    qualityScore: 50
  }

  return {
    ...state,
    chapters: {
      ...state.chapters,
      [chapterId]: {
        ...chapter,
        sections: [...chapter.sections, section]
      }
    }
  }
}

export function setChapterPhase(
  state: ChapterFlowState,
  chapterId: string,
  phase: ChapterPhase
): ChapterFlowState {
  const chapter = state.chapters[chapterId]
  if (!chapter) return state

  return {
    ...state,
    chapters: { ...state.chapters, [chapterId]: { ...chapter, phase } }
  }
}

export function recordEngagementSignal(
  state: ChapterFlowState,
  chapterNumber: number,
  dropOffRate: number,
  avgTimeSpent: number,
  peakMoment: number,
  replayRate: number
): ChapterFlowState {
  const signal: EngagementSignal = {
    chapterNumber,
    dropOffRate: Math.max(0, Math.min(100, dropOffRate)),
    avgTimeSpent,
    peakMoment: Math.max(0, Math.min(100, peakMoment)),
    replayRate: Math.max(0, Math.min(100, replayRate))
  }

  return {
    ...state,
    engagementSignals: { ...state.engagementSignals, [chapterNumber]: signal }
  }
}

export function detectFlowIssues(
  state: ChapterFlowState,
  chapterId: string
): ChapterFlowState {
  const chapter = state.chapters[chapterId]
  if (!chapter) return state

  const issues: FlowIssue[] = []
  const signal = state.engagementSignals[chapter.chapterNumber]

  if (signal) {
    // High drop-off = pacing issue
    if (signal.dropOffRate > 70) issues.push(' pacing_slow')
    if (signal.dropOffRate < 20 && signal.avgTimeSpent < 60) issues.push('pacing_fast')

    // Peak moment early in chapter = sagging middle
    if (signal.peakMoment < 30 && chapter.totalWords > 2000) issues.push('sagging_middle')

    // Low hook strength = abrupt ending
    if (chapter.hookStrength < 40) issues.push('abrupt_ending')
  }

  // Check section balance
  if (chapter.sections.length > 0) {
    const dialogueSections = chapter.sections.filter(s => s.type === 'dialogue')
    const actionSections = chapter.sections.filter(s => s.type === 'action')
    if (dialogueSections.length > chapter.sections.length * 0.7) issues.push('unbalanced')
  }

  return {
    ...state,
    chapters: { ...state.chapters, [chapterId]: { ...chapter, issues } }
  }
}

export function adaptChapterFlow(
  state: ChapterFlowState,
  chapterId: string
): ChapterFlowState {
  const chapter = state.chapters[chapterId]
  if (!chapter) return state

  const signal = state.engagementSignals[chapter.chapterNumber]
  if (!signal) return state

  let newPhase = chapter.phase
  let pacingAdjustment = 0
  const sectionChanges: FlowAdaptation['sectionChanges'] = []

  // Adapt based on drop-off patterns
  if (signal.dropOffRate > 60) {
    pacingAdjustment = -10  // slow down
    // Shorten sections that are too long
    for (const section of chapter.sections) {
      if (section.actualLength > section.optimalLength * 1.5) {
        sectionChanges.push({ sectionId: section.id, newLength: Math.round(section.optimalLength * 1.2) })
      }
    }
  }

  if (signal.peakMoment < 30) {
    // Reader losing interest early - adjust phase
    if (chapter.phase === 'rising') newPhase = 'setup'
  }

  if (signal.replayRate > 50) {
    // High replay = compelling content, strengthen the hook
    pacingAdjustment = Math.max(pacingAdjustment, 5)
  }

  const adaptation: FlowAdaptation = {
    id: `adapt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chapterNumber: chapter.chapterNumber,
    originalPhase: chapter.phase,
    newPhase,
    sectionChanges,
    pacingAdjustment,
    timestamp: Date.now()
  }

  const updatedChapter = {
    ...chapter,
    phase: newPhase,
    pacingScore: Math.max(0, Math.min(100, chapter.pacingScore + pacingAdjustment)),
    issues: chapter.issues  // preserve issues
  }

  // Update common issues
  const issueCounts: Record<string, number> = {}
  for (const issue of chapter.issues) {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1
  }
  const commonIssues = Object.entries(issueCounts)
    .map(([issue, frequency]) => ({ issue: issue as FlowIssue, frequency }))
    .sort((a, b) => b.frequency - a.frequency)

  return {
    ...state,
    chapters: { ...state.chapters, [chapterId]: updatedChapter },
    adaptations: [...state.adaptations, adaptation],
    commonIssues
  }
}

export function optimizeSectionBreaks(
  state: ChapterFlowState,
  chapterId: string
): ChapterFlowState {
  const chapter = state.chapters[chapterId]
  if (!chapter || chapter.sections.length < 2) return state

  const sections = [...chapter.sections].sort((a, b) => a.position - b.position)
  const optimized: SectionBreak[] = []

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    // Ensure minimum 10% gap between sections
    const minPosition = i === 0 ? 0 : sections[i - 1].position + 10
    const newPosition = Math.max(section.position, minPosition)
    optimized.push({ ...section, position: newPosition })
  }

  return {
    ...state,
    chapters: { ...state.chapters, [chapterId]: { ...chapter, sections: optimized } }
  }
}

export function calculateHookStrength(
  state: ChapterFlowState,
  chapterId: string
): ChapterFlowState {
  const chapter = state.chapters[chapterId]
  if (!chapter) return state

  // Hook strength based on: unresolved tension + cliffhanger potential + question raised
  let hookScore = 50

  // Phase contributes to hook
  const phaseBonus: Record<ChapterPhase, number> = {
    setup: 10, rising: 15, climax: 25, falling: 20, resolution: -10, hook: 30
  }
  hookScore += phaseBonus[chapter.phase]

  // Sections with unresolved questions
  const transitionSections = chapter.sections.filter(s => s.type === 'transition')
  hookScore += transitionSections.length * 5

  // Sagging middle reduces hook
  if (chapter.issues.includes('sagging_middle')) hookScore -= 15

  hookScore = Math.max(0, Math.min(100, hookScore))

  return {
    ...state,
    chapters: { ...state.chapters, [chapterId]: { ...chapter, hookStrength: hookScore } }
  }
}

export function getChapterFlow(chapterState: ChapterFlowState, chapterNumber: number): ChapterFlow | null {
  return Object.values(chapterState.chapters).find(c => c.chapterNumber === chapterNumber) || null
}

export function getEngagementSignal(chapterState: ChapterFlowState, chapterNumber: number): EngagementSignal | null {
  return chapterState.engagementSignals[chapterNumber] || null
}

export function getFlowAdaptations(chapterState: ChapterFlowState, limit: number = 10): FlowAdaptation[] {
  return [...chapterState.adaptations]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

export function getChapterFlowSummary(state: ChapterFlowState): {
  totalChapters: number,
  avgPacing: number,
  avgHookStrength: number,
  commonIssues: { issue: FlowIssue, frequency: number }[],
  adaptationCount: number
} {
  const chapters = Object.values(state.chapters)
  const totalPacing = chapters.reduce((s, c) => s + c.pacingScore, 0)
  const totalHook = chapters.reduce((s, c) => s + c.hookStrength, 0)
  const count = chapters.length || 1

  return {
    totalChapters: chapters.length,
    avgPacing: Math.round(totalPacing / count),
    avgHookStrength: Math.round(totalHook / count),
    commonIssues: state.commonIssues.slice(0, 5),
    adaptationCount: state.adaptations.length
  }
}

export function compareChapterFlows(state: ChapterFlowState, ch1: number, ch2: number): {
  pacingDiff: number,
  hookDiff: number,
  wordCountDiff: number,
  phaseDiff: boolean
} {
  const c1 = getChapterFlow(state, ch1)
  const c2 = getChapterFlow(state, ch2)
  if (!c1 || !c2) return { pacingDiff: 0, hookDiff: 0, wordCountDiff: 0, phaseDiff: false }

  return {
    pacingDiff: c1.pacingScore - c2.pacingScore,
    hookDiff: c1.hookStrength - c2.hookStrength,
    wordCountDiff: c1.totalWords - c2.totalWords,
    phaseDiff: c1.phase !== c2.phase
  }
}