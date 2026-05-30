/**
 * NarrativeClueTracker — V405
 * Clue distribution analysis, mystery building, foreshadowing payoff tracking across chapters.
 * Inspired by: thunderbolt (feedback loops), generic-agent (validation), ruflo (hierarchical decomposition)
 */

export type ClueType = 'physical' | 'verbal' | 'behavioral' | 'circumstantial' | 'documentary' | 'testimonial'

export interface Clue {
  id: string
  type: ClueType
  description: string
  chapterPlanted: number
  chapterPayoff: number | null
  significance: number  // 0-100 (how important to the mystery)
  revelationImpact: number  // 0-100 (reader impact when revealed)
  subtleHint: string | null  // if this is a subtle hint vs obvious clue
}

export interface MysteryThread {
  id: string
  name: string
  clues: string[]  // clue IDs
  solved: boolean
  chapterSolved: number | null
  solutionRevealed: boolean
}

export interface ClueDistributionReport {
  totalClues: number
  totalMysteries: number
  solvedMysteries: number
  avgCluePerMystery: number
  unsolvedMysteries: MysteryThread[]
  recommendations: string[]
}

export interface NarrativeClueState {
  clues: Clue[]
  mysteries: MysteryThread[]
  distributionReport: ClueDistributionReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeClueState {
  return { clues: [], mysteries: [], distributionReport: null, typeAlias: {} }
}

export function plantClue(
  state: NarrativeClueState,
  type: ClueType,
  description: string,
  chapterPlanted: number,
  significance: number = 50,
  subtleHint: boolean = false
): NarrativeClueState {
  const id = `clue_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const clue: Clue = {
    id,
    type,
    description,
    chapterPlanted,
    chapterPayoff: null,
    significance,
    revelationImpact: Math.round(significance * 0.8),
    subtleHint: subtleHint ? `Hint at ch${chapterPlanted}` : null,
  }
  return { ...state, clues: [...state.clues, clue] }
}

export function registerMystery(
  state: NarrativeClueState,
  name: string,
  clueIds: string[]
): NarrativeClueState {
  const id = `mystery_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const mystery: MysteryThread = { id, name, clues: clueIds, solved: false, chapterSolved: null, solutionRevealed: false }
  return { ...state, mysteries: [...state.mysteries, mystery] }
}

export function addClueToMystery(
  state: NarrativeClueState,
  mysteryId: string,
  clueId: string
): NarrativeClueState {
  const mysteries = state.mysteries.map(m => m.id === mysteryId ? { ...m, clues: [...m.clues, clueId] } : m)
  return { ...state, mysteries }
}

export function solveMystery(
  state: NarrativeClueState,
  mysteryId: string,
  chapterSolved: number
): NarrativeClueState {
  let mysteries = state.mysteries.map(m => m.id === mysteryId ? { ...m, solved: true, chapterSolved } : m)
  
  // Mark clues as paid off
  const mystery = mysteries.find(m => m.id === mysteryId)
  const clues = state.clues.map(c => {
    if (mystery && mystery.clues.includes(c.id)) {
      return { ...c, chapterPayoff: chapterSolved }
    }
    return c
  })
  
  return { ...state, clues, mysteries }
}

export function revealSolution(
  state: NarrativeClueState,
  mysteryId: string
): NarrativeClueState {
  const mysteries = state.mysteries.map(m => m.id === mysteryId ? { ...m, solutionRevealed: true } : m)
  return { ...state, mysteries }
}

export function generateDistributionReport(state: NarrativeClueState): ClueDistributionReport {
  if (state.clues.length === 0) {
    return { totalClues: 0, totalMysteries: 0, solvedMysteries: 0, avgCluePerMystery: 0, unsolvedMysteries: [], recommendations: [] }
  }
  
  const totalClues = state.clues.length
  const totalMysteries = state.mysteries.length
  const solvedMysteries = state.mysteries.filter(m => m.solved).length
  const avgCluePerMystery = totalMysteries > 0 ? Math.round(totalClues / totalMysteries) : 0
  const unsolvedMysteries = state.mysteries.filter(m => !m.solved)
  
  // Find clues without payoff
  const unpayoffClues = state.clues.filter(c => !c.chapterPayoff)
  // Find overly obvious clues (high significance planted early)
  const obviousClues = state.clues.filter(c => c.significance > 70 && c.chapterPlanted < 3)
  
  const recommendations: string[] = []
  if (unpayoffClues.length > state.clues.length * 0.4) recommendations.push(`${unpayoffClues.length} clues still unpaid off - resolve them`)
  if (obviousClues.length > 0) recommendations.push('Some clues are too obvious - hide them better or delay revelation')
  if (avgCluePerMystery < 3 && totalMysteries > 2) recommendations.push('Each mystery needs more clues for satisfying payoff')
  if (solvedMysteries > unsolvedMysteries.length) recommendations.push('Good solving pace - maintain momentum')
  if (state.clues.filter(c => c.subtleHint).length < state.clues.length * 0.3) {
    recommendations.push('Add more subtle hints for smarter mystery building')
  }
  
  return { totalClues, totalMysteries, solvedMysteries, avgCluePerMystery, unsolvedMysteries, recommendations }
}

export function getClueProgress(state: NarrativeClueState, mysteryId: string): {
  planted: number
  paidOff: number
  progressPercent: number
} {
  const mystery = state.mysteries.find(m => m.id === mysteryId)
  if (!mystery) return { planted: 0, paidOff: 0, progressPercent: 0 }
  
  const mysteryClues = state.clues.filter(c => mystery.clues.includes(c.id))
  const planted = mysteryClues.length
  const paidOff = mysteryClues.filter(c => c.chapterPayoff !== null).length
  const progressPercent = planted > 0 ? Math.round((paidOff / planted) * 100) : 0
  
  return { planted, paidOff, progressPercent }
}
