// NarrativeResolutionQualityEngine - V302: Story resolution quality & ending satisfaction analysis
// Inspired by: thunderbolt (feedback loops) + chatdev (outcome validation)

export type ResolutionType = 'satisfying' | 'bittersweet' | 'ambiguous' | 'deus_ex_machina' | 'rushed' | 'tragic'
export type ResolutionElement = 'plot_wrap' | 'character_closure' | 'thematic_payoff' | 'emotional_satisfaction' | 'loose_ends'

export interface ResolutionAssessment {
  chapter: number
  resolutionType: ResolutionType
  elements: { [key in ResolutionElement]: number }  // 0-100 score
  overallScore: number
  issues: string[]
}

export interface ResolutionQualityState {
  assessments: ResolutionAssessment[]
  currentChapter: number
  averageScore: number
  resolutionCount: { [key in ResolutionType]: number }
  commonIssues: string[]
}

export function createEmptyResolutionQualityState(): ResolutionQualityState {
  return {
    assessments: [],
    currentChapter: 0,
    averageScore: 0,
    resolutionCount: { satisfying: 0, bittersweet: 0, ambiguous: 0, deus_ex_machina: 0, rushed: 0, tragic: 0 },
    commonIssues: [],
  }
}

function computeOverallScore(elements: { [key in ResolutionElement]: number }): number {
  const values = Object.values(elements)
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

function detectResolutionType(elements: { [key in ResolutionElement]: number }): ResolutionType {
  const scores = Object.entries(elements).sort((a, b) => b[1] - a[1])
  const top = scores[0][1]
  const bottom = scores[scores.length - 1][1]

  if (top >= 85 && bottom >= 70) return 'satisfying'
  if (elements.plot_wrap >= 80 && elements.emotional_satisfaction < 60) return 'bittersweet'
  if (elements.loose_ends >= 40) return 'ambiguous'
  if (elements.plot_wrap >= 80 && scores[0][0] === 'plot_wrap' && scores.length > 2 && scores.every(s => s[0] === 'plot_wrap' || s[1] < 50)) return 'deus_ex_machina'
  if (elements.emotional_satisfaction < 50 && bottom < 40) return 'rushed'
  if (elements.emotional_satisfaction >= 70 && elements.character_closure < 50) return 'tragic'
  return 'satisfying'
}

function detectIssues(elements: { [key in ResolutionElement]: number }): string[] {
  const issues: string[] = []
  if (elements.plot_wrap < 60) issues.push('Incomplete plot resolution')
  if (elements.character_closure < 60) issues.push('Unresolved character arcs')
  if (elements.thematic_payoff < 60) issues.push('Thematic promises not fulfilled')
  if (elements.emotional_satisfaction < 60) issues.push('Emotional payoff lacking')
  if (elements.loose_ends > 40) issues.push('Loose ends remaining')
  return issues
}

export function assessResolution(
  state: ResolutionQualityState,
  chapter: number,
  plotWrap: number,
  characterClosure: number,
  thematicPayoff: number,
  emotionalSatisfaction: number,
  looseEnds: number
): ResolutionQualityState {
  const elements: { [key in ResolutionElement]: number } = {
    plot_wrap: Math.min(100, Math.max(0, plotWrap)),
    character_closure: Math.min(100, Math.max(0, characterClosure)),
    thematic_payoff: Math.min(100, Math.max(0, thematicPayoff)),
    emotional_satisfaction: Math.min(100, Math.max(0, emotionalSatisfaction)),
    loose_ends: Math.min(100, Math.max(0, looseEnds)),
  }

  const overallScore = computeOverallScore(elements)
  const resolutionType = detectResolutionType(elements)
  const issues = detectIssues(elements)

  const assessment: ResolutionAssessment = {
    chapter,
    resolutionType,
    elements,
    overallScore,
    issues,
  }

  const newAssessments = [...state.assessments, assessment]
  const totalScore = newAssessments.reduce((s, a) => s + a.overallScore, 0)
  const averageScore = Math.round(totalScore / newAssessments.length)

  const resolutionCount = { ...state.resolutionCount }
  resolutionCount[resolutionType]++

  const allIssues = newAssessments.flatMap(a => a.issues)
  const issueCounts: { [key: string]: number } = {}
  for (const issue of allIssues) {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1
  }
  const commonIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue)

  return {
    assessments: newAssessments,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageScore,
    resolutionCount,
    commonIssues,
  }
}

export function getResolutionAtChapter(state: ResolutionQualityState, chapter: number): ResolutionAssessment | null {
  return state.assessments.find(a => a.chapter === chapter) || null
}

export function getResolutionTrend(state: ResolutionQualityState): 'improving' | 'declining' | 'stable' {
  if (state.assessments.length < 2) return 'stable'
  const recent = state.assessments.slice(-3).map(a => a.overallScore)
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (last > first + 10) return 'improving'
  if (last < first - 10) return 'declining'
  return 'stable'
}

export function getResolutionDistribution(state: ResolutionQualityState): { [key in ResolutionType]: number } {
  return state.resolutionCount
}

export function formatResolutionQualitySummary(state: ResolutionQualityState): string {
  let s = "=== Narrative Resolution Quality Summary ===\n"
  s += "Assessments: " + state.assessments.length + "\n"
  s += "Average Score: " + state.averageScore + "\n"
  s += "Trend: " + getResolutionTrend(state) + "\n"
  return s
}

export function formatResolutionQualityDashboard(state: ResolutionQualityState): string {
  let s = "=== Narrative Resolution Quality Dashboard ===\n"
  s += "Assessments: " + state.assessments.length + " | Avg Score: " + state.averageScore + "\n"
  s += "Trend: " + getResolutionTrend(state) + "\n"

  if (state.assessments.length > 0) {
    s += "\n--- Resolution Types ---\n"
    for (const [type, count] of Object.entries(state.resolutionCount)) {
      if (count > 0) s += "  " + type + ": " + count + "\n"
    }
  }

  if (state.commonIssues.length > 0) {
    s += "\n--- Common Issues ---\n"
    for (const issue of state.commonIssues) {
      s += "  ⚠ " + issue + "\n"
    }
  }

  if (state.assessments.length > 0) {
    s += "\n--- Recent Assessments ---\n"
    for (const a of state.assessments.slice(-3)) {
      s += "  Ch" + a.chapter + ": " + a.resolutionType + " (score=" + a.overallScore + ")\n"
    }
  }
  return s
}