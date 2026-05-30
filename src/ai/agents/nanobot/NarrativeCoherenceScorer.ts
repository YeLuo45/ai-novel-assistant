// NarrativeCoherenceScorer - V284: Narrative coherence comprehensive scoring
export interface NarrativeElement {
  elementType: 'plot' | 'character' | 'world'
  chapter: string
  eventType: string
  subject: string
  score: number
}

export interface NarrativeCoherenceState {
  plotElements: NarrativeElement[]
  characterStates: NarrativeElement[]
}

export function createEmptyCoherenceState(): NarrativeCoherenceState {
  return { plotElements: [], characterStates: [] }
}

export function addNarrativeElement(
  state: NarrativeCoherenceState,
  elementType: 'plot' | 'character',
  chapter: string,
  eventType: string,
  subject: string,
  score: number
): NarrativeCoherenceState {
  const el: NarrativeElement = { elementType, chapter, eventType, subject, score }
  if (elementType === 'plot') return { ...state, plotElements: [...state.plotElements, el] }
  return { ...state, characterStates: [...state.characterStates, el] }
}

export function scorePlotCoherence(state: NarrativeCoherenceState): number {
  if (state.plotElements.length === 0) return 0
  return Math.round(state.plotElements.reduce((s, e) => s + e.score, 0) / state.plotElements.length)
}

export function scoreCharacterCoherence(state: NarrativeCoherenceState): number {
  if (state.characterStates.length === 0) return 0
  return Math.round(state.characterStates.reduce((s, e) => s + e.score, 0) / state.characterStates.length)
}

export function getOverallCoherenceScore(state: NarrativeCoherenceState): number {
  const plot = scorePlotCoherence(state)
  const character = scoreCharacterCoherence(state)
  if (state.plotElements.length === 0 && state.characterStates.length === 0) return 0
  const total = state.plotElements.length + state.characterStates.length
  if (total === 0) return 0
  return Math.round((plot * state.plotElements.length + character * state.characterStates.length) / total)
}

export function formatCoherenceSummary(state: NarrativeCoherenceState): string {
  return "Plot: " + state.plotElements.length + " | Character: " + state.characterStates.length + "\n"
}

export function formatCoherenceDashboard(state: NarrativeCoherenceState): string {
  const overall = getOverallCoherenceScore(state)
  return "Overall: " + overall + " | Plot: " + scorePlotCoherence(state) + " | Character: " + scoreCharacterCoherence(state) + "\n"
}
