export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'flashback' | 'time_skip'

export interface SceneTransition {
  transitionId: string
  fromChapter: number
  toChapter: number
  transitionType: TransitionType
  qualityScore: number  // 0-100
  momentumDelta: number  // -100 to +100
  hookQuality: number  // 0-100
}

export interface SceneTransitionState {
  transitions: SceneTransition[]
  currentChapter: number
  averageMomentum: number
  momentumBreaks: number[]  // chapters where momentum drops
}

function createTransitionId(): string {
  return 'trans_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessTransitionQuality(fromText: string, toText: string): number {
  let score = 60  // baseline

  // Check for cliffhanger preservation
  const fromQuestions = (fromText.match(/\?/g) || []).length
  const toAnswerQuestions = toText.includes('answer') || toText.includes('reveal') || toText.includes('finally')

  if (fromQuestions > 0 && !toAnswerQuestions) {
    score -= 15  // dangling question
  }

  // Check for topic shift smoothness
  const fromWords = new Set(fromText.toLowerCase().split(/\s+/).slice(0, 10))
  const toWords = toText.toLowerCase().split(/\s+/)
  let overlapCount = 0
  for (const word of toWords.slice(0, 10)) {
    if (fromWords.has(word)) overlapCount++
  }

  if (overlapCount >= 3) {
    score += 20  // smooth transition
  } else if (overlapCount === 0 && toText.length > 20) {
    score -= 20  // jarring transition
  }

  // Check for parallel structure
  if (fromText.includes('.') && toText.includes('.')) {
    score += 10  // parallel structure maintained
  }

  return Math.max(0, Math.min(100, score))
}

function assessMomentumDelta(qualityScore: number, transitionType: TransitionType): number {
  let delta = 0

  if (qualityScore >= 80) {
    delta += 15
  } else if (qualityScore >= 60) {
    delta += 5
  } else if (qualityScore < 40) {
    delta -= 20
  }

  switch (transitionType) {
    case 'cut': delta += 5; break
    case 'dissolve': delta += 0; break
    case 'fade': delta -= 5; break
    case 'flashback': delta -= 10; break
    case 'time_skip': delta -= 5; break
  }

  return Math.max(-100, Math.min(100, delta))
}

function assessHookQuality(text: string): number {
  let score = 30

  // Cliffhanger indicators
  if (text.includes('?') && text.length < 60) score += 25
  if (text.includes('!') && text.length < 40) score += 20

  // Curiosity builders
  if (text.includes('but') && text.includes('never')) score += 15
  if (text.includes('until') && text.includes('would')) score += 15

  // Tension builders
  if (text.includes('sudden') || text.includes('unexpected')) score += 10

  // Questions at the end
  const trimmed = text.trim()
  if (trimmed.endsWith('?')) score += 10

  return Math.max(0, Math.min(100, score))
}

export function createEmptySceneTransitionState(): SceneTransitionState {
  return { transitions: [], currentChapter: 0, averageMomentum: 50, momentumBreaks: [] }
}

export function recordTransition(
  state: SceneTransitionState,
  fromChapter: number,
  toChapter: number,
  fromText: string,
  toText: string,
  transitionType: TransitionType
): SceneTransitionState {
  const qualityScore = assessTransitionQuality(fromText, toText)
  const momentumDelta = assessMomentumDelta(qualityScore, transitionType)
  const hookQuality = assessHookQuality(fromText)

  const transition: SceneTransition = {
    transitionId: createTransitionId(),
    fromChapter,
    toChapter,
    transitionType,
    qualityScore,
    momentumDelta,
    hookQuality,
  }

  const newTransitions = [...state.transitions, transition]
  const avgMomentum = Math.max(0, Math.min(100, state.averageMomentum + momentumDelta))

  // Detect momentum breaks (drop > 30)
  const momentumBreaks = [...state.momentumBreaks]
  if (state.averageMomentum - avgMomentum > 30) {
    momentumBreaks.push(fromChapter)
  }

  return {
    ...state,
    transitions: newTransitions,
    currentChapter: Math.max(state.currentChapter, toChapter),
    averageMomentum: Math.round(avgMomentum),
    momentumBreaks,
  }
}

export function getTransitionAtChapter(state: SceneTransitionState, chapter: number): SceneTransition | null {
  return state.transitions.find(t => t.fromChapter === chapter || t.toChapter === chapter) || null
}

export function getMomentumBreaks(state: SceneTransitionState): number[] {
  return state.momentumBreaks
}

export function formatTransitionSummary(state: SceneTransitionState): string {
  let s = "=== Scene Transition Summary ===" + "\n"
  s += "Transitions: " + state.transitions.length + "\n"
  s += "Avg Momentum: " + state.averageMomentum + "\n"
  s += "Momentum Breaks: " + state.momentumBreaks.length + "\n"
  return s
}

export function formatTransitionDashboard(state: SceneTransitionState): string {
  let s = "=== Scene Transition Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Transitions: " + state.transitions.length + " | Avg Momentum: " + state.averageMomentum + "\n"

  if (state.transitions.length > 0) {
    s += "\n--- Recent Transitions ---" + "\n"
    for (const t of state.transitions.slice(-4)) {
      s += "  Ch" + t.fromChapter + "→" + t.toChapter + " [" + t.transitionType + "] quality=" + t.qualityScore + " hook=" + t.hookQuality + "\n"
    }
  }

  if (state.momentumBreaks.length > 0) {
    s += "\n--- Momentum Breaks ---" + "\n"
    for (const ch of state.momentumBreaks.slice(-3)) {
      s += "  Chapter " + ch + "\n"
    }
  }

  return s
}
