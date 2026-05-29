export type PlotHoleType = 'timeline_contradiction' | 'character_knowledge' | 'cause_effect' | 'motivation_gap' | 'object_discrepancy' | 'world_rule_violation'

export interface PlotHole {
  holeId: string
  type: PlotHoleType
  chapter: number
  severity: number  // 0-100
  description: string
  relatedChapters: number[]
}

export interface PlotHoleState {
  holes: PlotHole[]
  currentChapter: number
  overallIntegrityScore: number  // 0-100
  criticalHoles: number  // holes with severity >= 70
}

function createHoleId(): string {
  return 'hole_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyPlotHoleState(): PlotHoleState {
  return { holes: [], currentChapter: 0, overallIntegrityScore: 100, criticalHoles: 0 }
}

export function detectPlotHole(
  state: PlotHoleState,
  chapter: number,
  type: PlotHoleType,
  severity: number,
  description: string,
  relatedChapters: number[] = []
): PlotHoleState {
  const hole: PlotHole = {
    holeId: createHoleId(),
    type,
    chapter,
    severity: Math.max(0, Math.min(100, severity)),
    description,
    relatedChapters,
  }

  const newHoles = [...state.holes, hole]
  const criticalHoles = newHoles.filter(h => h.severity >= 70).length
  const avgSeverity = newHoles.reduce((s, h) => s + h.severity, 0) / newHoles.length
  const integrityScore = Math.max(0, Math.round(100 - avgSeverity))

  return {
    ...state,
    holes: newHoles,
    currentChapter: chapter,
    overallIntegrityScore: integrityScore,
    criticalHoles,
  }
}

export function getHolesByChapter(state: PlotHoleState, chapter: number): PlotHole[] {
  return state.holes.filter(h => h.chapter === chapter || h.relatedChapters.includes(chapter))
}

export function getHolesByType(state: PlotHoleState, type: PlotHoleType): PlotHole[] {
  return state.holes.filter(h => h.type === type)
}

export function getOverallIntegrity(state: PlotHoleState): number {
  return state.overallIntegrityScore
}

export function formatPlotHoleSummary(state: PlotHoleState): string {
  let s = "=== Plot Hole Detection Summary ===" + "\n"
  s += "Total Holes: " + state.holes.length + "\n"
  s += "Integrity Score: " + state.overallIntegrityScore + "\n"
  s += "Critical Holes: " + state.criticalHoles + "\n"
  return s
}

export function formatPlotHoleDashboard(state: PlotHoleState): string {
  let s = "=== Plot Hole Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Integrity: " + state.overallIntegrityScore + " | Critical: " + state.criticalHoles + "\n"

  if (state.holes.length > 0) {
    s += "\n--- Recent Holes ---" + "\n"
    for (const h of state.holes.slice(-5)) {
      const flag = h.severity >= 70 ? " [CRITICAL]" : ""
      s += "  Ch" + h.chapter + " [" + h.type + "] severity=" + h.severity + flag + "\n"
    }
  }

  return s
}
