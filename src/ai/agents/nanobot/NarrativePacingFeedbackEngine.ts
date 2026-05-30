// NarrativePacingFeedbackEngine - V298: Real-time pacing feedback & adjustment suggestions
// Inspired by: thunderbolt (feedback loops) + nanobot (distributed analysis)

export type PacingRhythm = 'fast' | 'moderate' | 'slow' | 'varied'
export type PacingIssue = 'rushed' | 'dragged' | 'uneven' | 'stagnant' | 'overwhelming'

export interface PacingSegment {
  chapter: number
  wordCount: number
  sceneCount: number
  actionDensity: number    // actions per 1000 words
  dialogRatio: number       // 0-1
  descriptionDensity: number // sentences describing/setting per 1000 words
  rhythm: PacingRhythm
  issues: PacingIssue[]
}

export interface PacingFeedbackState {
  segments: PacingSegment[]
  currentChapter: number
  averagePacing: number     // 0-100, higher = faster
  feedbackScore: number      // 0-100, overall pacing health
  adjustments: Array<{chapter: number; type: string; suggestion: string}>
}

export function createEmptyPacingFeedbackState(): PacingFeedbackState {
  return {
    segments: [],
    currentChapter: 0,
    averagePacing: 50,
    feedbackScore: 100,
    adjustments: [],
  }
}

function computeActionDensity(wordCount: number, actionCount: number): number {
  return Math.round((actionCount / Math.max(1, wordCount / 1000)) * 10) / 10
}

function detectRhythm(segment: PacingSegment): PacingRhythm {
  if (segment.actionDensity > 15 && segment.dialogRatio > 0.4) return 'fast'
  if (segment.actionDensity < 5 && segment.descriptionDensity > 20) return 'slow'
  if (segment.actionDensity > 10 || segment.dialogRatio > 0.35) return 'moderate'
  return 'varied'
}

function detectPacingIssues(segment: PacingSegment): PacingIssue[] {
  const issues: PacingIssue[] = []
  if (segment.wordCount > 5000 && segment.sceneCount < 3) issues.push('rushed')
  if (segment.wordCount < 1500 && segment.sceneCount > 5) issues.push('dragged')
  if (segment.actionDensity > 20) issues.push('overwhelming')
  if (segment.actionDensity < 3 && segment.dialogRatio < 0.2) issues.push('stagnant')
  if (issues.length === 0 && segment.rhythm === 'varied') issues.push('uneven')
  return issues
}

export function addPacingSegment(
  state: PacingFeedbackState,
  chapter: number,
  wordCount: number,
  sceneCount: number,
  actionCount: number,
  dialogWords: number,
  descriptionSentences: number
): PacingFeedbackState {
  const actionDensity = computeActionDensity(wordCount, actionCount)
  const dialogRatio = Math.round(dialogWords / Math.max(1, wordCount) * 100) / 100
  const descriptionDensity = Math.round(descriptionSentences / Math.max(1, wordCount / 1000) * 10) / 10

  const segment: PacingSegment = {
    chapter,
    wordCount,
    sceneCount,
    actionDensity,
    dialogRatio,
    descriptionDensity,
    rhythm: 'moderate',
    issues: [],
  }

  segment.rhythm = detectRhythm(segment)
  segment.issues = detectPacingIssues(segment)

  const newSegments = [...state.segments, segment]
  const totalPacing = newSegments.reduce((s, seg) => {
    let pace = 50
    if (seg.rhythm === 'fast') pace = 80
    if (seg.rhythm === 'slow') pace = 30
    if (seg.rhythm === 'varied') pace = 60
    return s + pace
  }, 0)
  const averagePacing = Math.round(totalPacing / newSegments.length)

  let feedbackScore = 100
  const issueCount = newSegments.reduce((s, seg) => s + seg.issues.length, 0)
  feedbackScore = Math.max(0, feedbackScore - issueCount * 10)

  const adjustments = [...state.adjustments]
  for (const seg of newSegments.slice(-3)) {
    if (seg.issues.includes('rushed')) {
      adjustments.push({ chapter: seg.chapter, type: 'expand', suggestion: 'Consider adding transitional scenes or expanding key moments' })
    }
    if (seg.issues.includes('dragged')) {
      adjustments.push({ chapter: seg.chapter, type: 'trim', suggestion: 'Consider trimming slow sections or merging scenes' })
    }
    if (seg.issues.includes('overwhelming')) {
      adjustments.push({ chapter: seg.chapter, type: 'balance', suggestion: 'Consider adding descriptive pauses between action sequences' })
    }
  }

  return {
    segments: newSegments,
    currentChapter: Math.max(state.currentChapter, chapter),
    averagePacing,
    feedbackScore: Math.min(100, feedbackScore),
    adjustments: adjustments.slice(-5),
  }
}

export function getPacingAtChapter(state: PacingFeedbackState, chapter: number): PacingSegment | null {
  return state.segments.find(s => s.chapter === chapter) || null
}

export function getRecentAdjustments(state: PacingFeedbackState): Array<{chapter: number; type: string; suggestion: string}> {
  return state.adjustments.slice(-3)
}

export function getPacingTrend(state: PacingFeedbackState): 'accelerating' | 'decelerating' | 'stable' {
  if (state.segments.length < 2) return 'stable'
  const last = state.segments[state.segments.length - 1]
  const prev = state.segments[state.segments.length - 2]
  const lastPace = last.actionDensity + last.dialogRatio * 30
  const prevPace = prev.actionDensity + prev.dialogRatio * 30
  if (lastPace > prevPace + 5) return 'accelerating'
  if (lastPace < prevPace - 5) return 'decelerating'
  return 'stable'
}

export function formatPacingFeedbackSummary(state: PacingFeedbackState): string {
  let s = "=== Narrative Pacing Feedback Summary ===\n"
  s += "Segments: " + state.segments.length + "\n"
  s += "Average Pacing: " + state.averagePacing + "\n"
  s += "Feedback Score: " + state.feedbackScore + "\n"
  return s
}

export function formatPacingFeedbackDashboard(state: PacingFeedbackState): string {
  let s = "=== Narrative Pacing Feedback Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Segments: " + state.segments.length + "\n"
  s += "Average Pacing: " + state.averagePacing + " | Feedback: " + state.feedbackScore + "\n"
  s += "Trend: " + getPacingTrend(state) + "\n"

  if (state.segments.length > 0) {
    s += "\n--- Recent Segments ---\n"
    for (const seg of state.segments.slice(-3)) {
      const issues = seg.issues.length > 0 ? " [" + seg.issues.join(',') + "]" : ""
      s += "  Ch" + seg.chapter + ": " + seg.wordCount + "w " + seg.sceneCount + "sc " + seg.rhythm + " rhythm" + issues + "\n"
    }
  }

  if (state.adjustments.length > 0) {
    s += "\n--- Recent Adjustments ---\n"
    for (const adj of state.adjustments.slice(-2)) {
      s += "  Ch" + adj.chapter + ": " + adj.type + " - " + adj.suggestion + "\n"
    }
  }
  return s
}