export type EndingType = 'open' | 'closed' | 'bittersweet' | 'tragic' | 'triumphant'

export interface UnresolvedThread {
  threadId: string
  setupChapter: number
  description: string
  importance: 'minor' | 'major'
}

export interface ResolvedThread {
  threadId: string
  setupChapter: number
  payoffChapter: number
  setupDescription: string
  payoffDescription: string
  qualityScore: number  // 0-100
}

export interface EndgameMetrics {
  resolutionScore: number  // 0-100
  foreshadowingRecallRate: number  // 0-100
  emotionalResonance: number  // 0-100
  endingType: EndingType
  unresolvedMajorThreads: number
  pacingScore: number  // 0-100
}

export interface NarrativeEndgameState {
  resolvedThreads: ResolvedThread[]
  unresolvedThreads: UnresolvedThread[]
  endingType: EndingType
  currentChapter: number
  totalChapters: number
  metrics: EndgameMetrics | null
}

function createThreadId(): string {
  return 'thr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectEndingType(text: string): EndingType {
  const lower = text.toLowerCase()
  if (lower.includes('happily ever after') || lower.includes('triumph')) return 'triumphant'
  if (lower.includes('tragedy') || lower.includes('death') && lower.includes('end')) return 'tragic'
  if (lower.includes('some questions') || lower.includes('unanswered')) return 'open'
  if (lower.includes('bittersweet') || lower.includes('mixed')) return 'bittersweet'
  return 'closed'
}

function assessPayoffQuality(setup: string, payoff: string): number {
  let score = 50
  if (setup.length > 20 && payoff.length > 20) score += 10
  const setupWords = new Set(setup.toLowerCase().split(' '))
  const payoffWords = new Set(payoff.toLowerCase().split(' '))
  const overlap = [...setupWords].filter(w => payoffWords.has(w) && w.length > 4)
  score += Math.min(overlap.length * 5, 20)
  if (payoff.includes('finally') || payoff.includes('in the end')) score += 10
  if (payoff.includes('unexpected') || payoff.includes('surprised')) score -= 10
  return Math.max(0, Math.min(100, score))
}

export function createEmptyEndgameState(): NarrativeEndgameState {
  return { resolvedThreads: [], unresolvedThreads: [], endingType: 'closed', currentChapter: 0, totalChapters: 10, metrics: null }
}

export function setupForeshadowing(state: NarrativeEndgameState, chapter: number, description: string, importance: 'minor' | 'major' = 'major'): NarrativeEndgameState {
  const thread: UnresolvedThread = { threadId: createThreadId(), setupChapter: chapter, description, importance }
  return { ...state, unresolvedThreads: [...state.unresolvedThreads, thread] }
}

export function resolveForeshadowing(state: NarrativeEndgameState, setupDescription: string, payoffChapter: number, payoffDescription: string): NarrativeEndgameState {
  // Find matching unresolved thread
  const matched = state.unresolvedThreads.find(t => t.description.includes(setupDescription.slice(0, 10)))
  const resolved: ResolvedThread = {
    threadId: matched?.threadId || createThreadId(),
    setupChapter: matched?.setupChapter || 1,
    payoffChapter,
    setupDescription,
    payoffDescription,
    qualityScore: assessPayoffQuality(setupDescription, payoffDescription),
  }

  const newResolved = [...state.resolvedThreads, resolved]
  const newUnresolved = matched
    ? state.unresolvedThreads.filter(t => t.threadId !== matched.threadId)
    : state.unresolvedThreads

  return { ...state, resolvedThreads: newResolved, unresolvedThreads: newUnresolved }
}

export function calculateMetrics(state: NarrativeEndgameState, endingText: string): NarrativeEndgameState {
  const total = state.resolvedThreads.length + state.unresolvedThreads.length
  const recallRate = total > 0 ? Math.round((state.resolvedThreads.length / total) * 100) : 0

  const avgQuality = state.resolvedThreads.length > 0
    ? Math.round(state.resolvedThreads.reduce((sum, t) => sum + t.qualityScore, 0) / state.resolvedThreads.length)
    : 0

  const resolutionScore = Math.round(avgQuality * 0.6 + recallRate * 0.4)
  const emotionalResonance = Math.min(100, resolutionScore + 10)
  const pacingScore = Math.round((state.currentChapter / state.totalChapters) * 100)

  const metrics: EndgameMetrics = {
    resolutionScore,
    foreshadowingRecallRate: recallRate,
    emotionalResonance,
    endingType: detectEndingType(endingText),
    unresolvedMajorThreads: state.unresolvedThreads.filter(t => t.importance === 'major').length,
    pacingScore,
  }

  return { ...state, metrics, endingType: metrics.endingType, currentChapter: Math.max(state.currentChapter, state.totalChapters) }
}

export function getResolutionScore(state: NarrativeEndgameState): number {
  return state.metrics?.resolutionScore || 0
}

export function getForeshadowingRecallRate(state: NarrativeEndgameState): number {
  return state.metrics?.foreshadowingRecallRate || 0
}

export function formatEndgameSummary(state: NarrativeEndgameState): string {
  let s = "=== Narrative Endgame Summary ===" + "\n"
  s += "Resolved: " + state.resolvedThreads.length + " | Unresolved: " + state.unresolvedThreads.length + "\n"
  s += "Ending Type: " + state.endingType + "\n"
  if (state.metrics) {
    s += "Resolution Score: " + state.metrics.resolutionScore + "\n"
    s += "Recall Rate: " + state.metrics.foreshadowingRecallRate + "%" + "\n"
  }
  return s
}

export function formatEndgameDashboard(state: NarrativeEndgameState): string {
  let s = "=== Endgame Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "/" + state.totalChapters + "\n"
  s += "Ending Type: " + state.endingType + "\n"
  if (state.metrics) {
    s += "Resolution: " + state.metrics.resolutionScore + " | Recall: " + state.metrics.foreshadowingRecallRate + "%" + "\n"
    s += "Emotional: " + state.metrics.emotionalResonance + " | Pacing: " + state.metrics.pacingScore + "\n"
    s += "Unresolved Major Threads: " + state.metrics.unresolvedMajorThreads + "\n"
  }
  if (state.resolvedThreads.length > 0) {
    s += "\n--- Resolved Threads ---" + "\n"
    for (const t of state.resolvedThreads.slice(0, 3)) {
      s += "  Ch " + t.setupChapter + " -> Ch " + t.payoffChapter + " quality=" + t.qualityScore + "\n"
    }
  }
  return s
}
