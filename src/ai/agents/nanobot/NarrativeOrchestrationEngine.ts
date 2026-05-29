export interface PlotThread {
  threadId: string
  name: string
  priority: number  // 1-10
  status: 'active' | 'paused' | 'resolved'
  lastChapter: number
  coherenceScore: number  // 0-100
}

export interface NarrativeOrchestrationState {
  threads: PlotThread[]
  currentChapter: number
  overallCoherence: number  // 0-100
  activeThreadCount: number
}

function createThreadId(): string {
  return 'thread_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function calculateCoherence(thread: PlotThread, allThreads: PlotThread[]): number {
  let score = 80
  // Check for priority conflicts
  const higherPriority = allThreads.filter(t => t.priority > thread.priority && t.status === 'active')
  if (higherPriority.length > 3) score -= 10
  // Check for gap in chapters
  if (thread.lastChapter < allThreads[0]?.lastChapter - 2) score -= 15
  return Math.max(0, Math.min(100, score))
}

export function createEmptyOrchestrationState(): NarrativeOrchestrationState {
  return { threads: [], currentChapter: 0, overallCoherence: 100, activeThreadCount: 0 }
}

export function createThread(
  state: NarrativeOrchestrationState,
  name: string,
  priority: number = 5
): NarrativeOrchestrationState {
  const thread: PlotThread = {
    threadId: createThreadId(),
    name,
    priority,
    status: 'active',
    lastChapter: state.currentChapter,
    coherenceScore: 100,
  }

  const newThreads = [...state.threads, thread]
  const activeCount = newThreads.filter(t => t.status === 'active').length
  const avgCoherence = newThreads.length > 0
    ? Math.round(newThreads.reduce((sum, t) => sum + t.coherenceScore, 0) / newThreads.length)
    : 100

  return {
    ...state,
    threads: newThreads,
    activeThreadCount: activeCount,
    overallCoherence: avgCoherence,
  }
}

export function updateThreadProgress(
  state: NarrativeOrchestrationState,
  threadId: string,
  chapter: number
): NarrativeOrchestrationState {
  const newThreads = state.threads.map(t => {
    if (t.threadId === threadId) {
      const updated = { ...t, lastChapter: Math.max(t.lastChapter, chapter) }
      updated.coherenceScore = calculateCoherence(updated, state.threads)
      return updated
    }
    return t
  })

  const avgCoherence = newThreads.length > 0
    ? Math.round(newThreads.reduce((sum, t) => sum + t.coherenceScore, 0) / newThreads.length)
    : 100

  return {
    ...state,
    threads: newThreads,
    currentChapter: Math.max(state.currentChapter, chapter),
    overallCoherence: avgCoherence,
  }
}

export function resolveThread(
  state: NarrativeOrchestrationState,
  threadId: string
): NarrativeOrchestrationState {
  const newThreads = state.threads.map(t => {
    if (t.threadId === threadId) return { ...t, status: 'resolved' as const }
    return t
  })

  const activeCount = newThreads.filter(t => t.status === 'active').length

  return { ...state, threads: newThreads, activeThreadCount: activeCount }
}

export function getActiveThreads(state: NarrativeOrchestrationState): PlotThread[] {
  return state.threads.filter(t => t.status === 'active')
}

export function getThreadById(state: NarrativeOrchestrationState, threadId: string): PlotThread | null {
  return state.threads.find(t => t.threadId === threadId) || null
}

export function formatOrchestrationSummary(state: NarrativeOrchestrationState): string {
  let s = "=== Narrative Orchestration Summary ===" + "\n"
  s += "Threads: " + state.threads.length + " (active: " + state.activeThreadCount + ")\n"
  s += "Overall Coherence: " + state.overallCoherence + "\n"
  return s
}

export function formatOrchestrationDashboard(state: NarrativeOrchestrationState): string {
  let s = "=== Narrative Orchestration Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Threads: " + state.threads.length + " active=" + state.activeThreadCount + " coherence=" + state.overallCoherence + "\n"

  if (state.threads.length > 0) {
    s += "\n--- Active Threads ---" + "\n"
    for (const t of state.threads.filter(t => t.status === 'active').slice(0, 5)) {
      s += "  [" + t.priority + "] " + t.name + " ch" + t.lastChapter + " coherence=" + t.coherenceScore + "\n"
    }
  }

  return s
}
