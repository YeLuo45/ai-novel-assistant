export interface ClimaxCandidate {
  candidateId: string
  chapter: number
  type: string
  intensity: number  // 0-100
  buildUpQuality: number  // 0-100
  payoffQuality: number  // 0-100
  reason: string
}

export interface ClimaxPlacementState {
  candidates: ClimaxCandidate[]
  selectedClimax: ClimaxCandidate | null
  currentChapter: number
  storyLength: number
  optimalPosition: number  // percentage (0.6-0.8 typical)
}

function createCandidateId(): string {
  return 'cl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectClimaxType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('battle') || lower.includes('fight')) return 'action'
  if (lower.includes('revelation') || lower.includes('truth')) return 'revelation'
  if (lower.includes('death') || lower.includes('loss')) return 'tragedy'
  if (lower.includes('union') || lower.includes('confession')) return 'romantic'
  if (lower.includes('decision') || lower.includes('choice')) return 'decision'
  if (lower.includes('triumph') || lower.includes('victory')) return 'triumph'
  return 'general'
}

function assessBuildUpQuality(text: string): number {
  const lower = text.toLowerCase()
  let score = 50
  if (lower.includes('tension') || lower.includes('building')) score += 15
  if (lower.includes('rising')) score += 15
  if (lower.includes('growing')) score += 10
  if (lower.includes('ominous')) score += 10
  if (lower.includes('quiet') || lower.includes('calm')) score -= 20
  return Math.max(0, Math.min(100, score))
}

function assessPayoffQuality(text: string): number {
  const lower = text.toLowerCase()
  let score = 50
  if (lower.includes('climax') || lower.includes('peak')) score += 20
  if (lower.includes('confrontation')) score += 15
  if (lower.includes('resolution')) score += 10
  if (lower.includes('finally')) score += 10
  return Math.max(0, Math.min(100, score))
}

export function createEmptyClimaxPlacementState(): ClimaxPlacementState {
  return { candidates: [], selectedClimax: null, currentChapter: 0, storyLength: 10, optimalPosition: 0.7 }
}

export function registerClimaxCandidate(
  state: ClimaxPlacementState,
  chapter: number,
  text: string,
  reason: string
): ClimaxPlacementState {
  const type = detectClimaxType(text)
  const buildUp = assessBuildUpQuality(text)
  const payoff = assessPayoffQuality(text)
  const intensity = Math.round((buildUp + payoff) / 2)

  const candidate: ClimaxCandidate = {
    candidateId: createCandidateId(),
    chapter,
    type,
    intensity,
    buildUpQuality: buildUp,
    payoffQuality: payoff,
    reason,
  }

  return {
    ...state,
    candidates: [...state.candidates, candidate],
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

export function selectOptimalClimax(state: ClimaxPlacementState): ClimaxPlacementState {
  if (state.candidates.length === 0) return state

  const optimal = state.candidates.reduce((best, c) => {
    const bestScore = best.intensity * 0.4 + best.buildUpQuality * 0.3 + best.payoffQuality * 0.3
    const cScore = c.intensity * 0.4 + c.buildUpQuality * 0.3 + c.payoffQuality * 0.3
    return cScore > bestScore ? c : best
  })

  return { ...state, selectedClimax: optimal }
}

export function getClimaxPosition(state: ClimaxPlacementState): { chapter: number; percentage: number } | null {
  if (!state.selectedClimax) return null
  const percentage = state.storyLength > 0 ? state.selectedClimax.chapter / state.storyLength : 0.5
  return { chapter: state.selectedClimax.chapter, percentage: Math.round(percentage * 100) / 100 }
}

export function isClimaxWellPlaced(state: ClimaxPlacementState): boolean {
  if (!state.selectedClimax) return false
  const pct = state.storyLength > 0 ? state.selectedClimax.chapter / state.storyLength : 0
  return pct >= 0.6 && pct <= 0.9
}

export function formatClimaxSummary(state: ClimaxPlacementState): string {
  let s = "=== Climax Placement Summary ===" + "\n"
  s += "Candidates: " + state.candidates.length + "\n"
  s += "Optimal Position: " + Math.round(state.optimalPosition * 100) + "%" + "\n"
  s += "Story Length: " + state.storyLength + " chapters" + "\n"
  return s
}

export function formatClimaxDashboard(state: ClimaxPlacementState): string {
  let s = "=== Climax Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Story Length: " + state.storyLength + " chapters" + "\n"
  s += "Optimal Position: " + Math.round(state.optimalPosition * 100) + "%" + "\n"

  if (state.selectedClimax) {
    const pos = getClimaxPosition(state)
    s += "\n--- Selected Climax ---" + "\n"
    s += "  Chapter: " + state.selectedClimax.chapter + " (" + (pos?.percentage * 100).toFixed(0) + "%)" + "\n"
    s += "  Type: " + state.selectedClimax.type + " | Intensity: " + state.selectedClimax.intensity + "\n"
    s += "  Well Placed: " + isClimaxWellPlaced(state) + "\n"
  }

  if (state.candidates.length > 0) {
    s += "\n--- All Candidates ---" + "\n"
    for (const c of state.candidates) {
      s += "  Ch " + c.chapter + " [" + c.type + "] intensity=" + c.intensity + "\n"
    }
  }

  return s
}
