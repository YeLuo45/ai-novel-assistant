/**
 * PlotResolutionEngine - V180
 * Plot Thread Closure & Narrative Resolution Verification Engine
 * 
 * Design references:
 * - generic-agent: autonomous goal completion verification
 * - thunderbolt: feedback loops for narrative closure monitoring
 * - ruflo: hierarchical decomposition (main plot -> subplots -> threads)
 * - chatdev: multi-perspective resolution analysis
 */

export type PlotStatus = 'open' | 'foreshadowed' | 'active' | 'resolved' | 'abandoned'
export type PlotResolutionQuality = 'satisfying' | 'rushed' | 'deus_ex_machina' | 'unresolved'

export interface PlotThread {
  threadId: string
  name: string
  status: PlotStatus
  introducedChapter: number
  expectedResolutionChapter: number | null
  resolvedChapter: number | null
  resolutionQuality: PlotResolutionQuality | null
  keyEvents: string[]
  characters: string[]
}

export interface ResolutionMetrics {
  totalThreads: number
  resolvedThreads: number
  openThreads: number
  closureScore: number  // 0-100
  rushedResolutions: number
  danglingSubplots: string[]
}

export interface PlotResolutionState {
  threads: PlotThread[]
  currentChapter: number
  resolutionMetrics: ResolutionMetrics | null
}

function createThreadId(): string {
  return 'pt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyPlotResolutionState(): PlotResolutionState {
  return { threads: [], currentChapter: 0, resolutionMetrics: null }
}

export function introducePlotThread(
  state: PlotResolutionState,
  name: string,
  characters: string[],
  chapter: number,
  expectedResolutionChapter: number | null = null
): PlotResolutionState {
  const thread: PlotThread = {
    threadId: createThreadId(),
    name,
    status: 'open',
    introducedChapter: chapter,
    expectedResolutionChapter,
    resolvedChapter: null,
    resolutionQuality: null,
    keyEvents: ['introduced'],
    characters,
  }

  return {
    ...state,
    threads: [...state.threads, thread],
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

export function foreshadowPlotThread(state: PlotResolutionState, threadId: string, chapter: number): PlotResolutionState {
  const threads = state.threads.map(t =>
    t.threadId === threadId
      ? { ...t, status: 'foreshadowed' as PlotStatus, keyEvents: [...t.keyEvents, 'foreshadowed_ch_' + chapter] }
      : t
  )
  return { ...state, threads }
}

export function activatePlotThread(state: PlotResolutionState, threadId: string, chapter: number): PlotResolutionState {
  const threads = state.threads.map(t =>
    t.threadId === threadId
      ? { ...t, status: 'active' as PlotStatus, keyEvents: [...t.keyEvents, 'activated_ch_' + chapter] }
      : t
  )
  return { ...state, threads }
}

export function resolvePlotThread(
  state: PlotResolutionState,
  threadId: string,
  chapter: number,
  quality: PlotResolutionQuality
): PlotResolutionState {
  const threads = state.threads.map(t =>
    t.threadId === threadId
      ? { ...t, status: 'resolved' as PlotStatus, resolvedChapter: chapter, resolutionQuality: quality, keyEvents: [...t.keyEvents, 'resolved_ch_' + chapter] }
      : t
  )
  return {
    ...state,
    threads,
    currentChapter: Math.max(state.currentChapter, chapter),
    resolutionMetrics: null,  // invalidate cache
  }
}

export function calculateResolutionMetrics(state: PlotResolutionState): ResolutionMetrics {
  const threads = state.threads
  const resolvedThreads = threads.filter(t => t.status === 'resolved')
  const openThreads = threads.filter(t => t.status === 'open' || t.status === 'active' || t.status === 'foreshadowed')

  let closureScore = 100
  if (threads.length > 0) {
    closureScore = Math.round((resolvedThreads.length / threads.length) * 100)
    // Penalize for overdue threads
    for (const t of openThreads) {
      if (t.expectedResolutionChapter && t.expectedResolutionChapter < state.currentChapter) {
        closureScore = Math.max(0, closureScore - 15)
      }
    }
  }

  const rushedResolutions = resolvedThreads.filter(t => t.resolutionQuality === 'rushed').length
  const danglingSubplots = openThreads.filter(t => {
    // Consider a thread dangling if introduced more than 5 chapters ago and still open
    return state.currentChapter - t.introducedChapter > 5
  }).map(t => t.name)

  return {
    totalThreads: threads.length,
    resolvedThreads: resolvedThreads.length,
    openThreads: openThreads.length,
    closureScore,
    rushedResolutions,
    danglingSubplots,
  }
}

export function getOpenThreads(state: PlotResolutionState): PlotThread[] {
  return state.threads.filter(t => t.status === 'open' || t.status === 'active' || t.status === 'foreshadowed')
}

export function getResolvedThreads(state: PlotResolutionState): PlotThread[] {
  return state.threads.filter(t => t.status === 'resolved')
}

export function getThread(state: PlotResolutionState, threadId: string): PlotThread | null {
  return state.threads.find(t => t.threadId === threadId) || null
}

export function formatPlotResolutionSummary(state: PlotResolutionState): string {
  let s = '=== Plot Resolution Summary ===\n'
  s += 'Total Threads: ' + state.threads.length + '\n'
  s += 'Resolved: ' + state.threads.filter(t => t.status === 'resolved').length + '\n'
  s += 'Open: ' + state.threads.filter(t => t.status !== 'resolved').length + '\n'

  const metrics = calculateResolutionMetrics(state)
  s += 'Closure Score: ' + metrics.closureScore + '%\n'
  if (metrics.danglingSubplots.length > 0) {
    s += 'Dangling: ' + metrics.danglingSubplots.length + '\n'
  }
  return s
}

export function formatPlotResolutionDashboard(state: PlotResolutionState): string {
  let s = '=== Plot Resolution Dashboard ===\n'
  s += 'Chapter: ' + state.currentChapter + '\n'

  const resolved = state.threads.filter(t => t.status === 'resolved')
  const active = state.threads.filter(t => t.status === 'active' || t.status === 'open' || t.status === 'foreshadowed')

  if (resolved.length > 0) {
    s += '\n--- Resolved Plots ---\n'
    for (const t of resolved.slice(-5)) {
      s += '  [' + (t.resolutionQuality || 'unknown') + '] Ch ' + t.resolvedChapter + ': ' + t.name + '\n'
    }
  }

  if (active.length > 0) {
    s += '\n--- Active Plots (' + active.length + ') ---\n'
    for (const t of active.slice(-8)) {
      s += '  [' + t.status + '] Ch ' + t.introducedChapter + ': ' + t.name + '\n'
    }
  }

  const metrics = calculateResolutionMetrics(state)
  s += '\n--- Resolution Metrics ---\n'
  s += '  Closure: ' + metrics.closureScore + '%\n'
  s += '  Rushed: ' + metrics.rushedResolutions + '\n'
  if (metrics.danglingSubplots.length > 0) {
    s += '  Dangling: ' + metrics.danglingSubplots.join(', ') + '\n'
  }

  return s
}
