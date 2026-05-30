/**
 * NarrativeMemoryWeaver — V435
 * Narrative memory weaving, callback tracking, continuity management across large narratives.
 * Inspired by: chatdev (continuity), generic-agent (optimization), thunderbolt (feedback loops)
 */

export type CallbackType = 'literal' | 'thematic' | 'emotional' | 'ironic' | 'visual'

export interface NarrativeCallback {
  id: string
  originalChapter: number
  originalContext: string  // what was referenced
  callbackChapter: number | null  // when it returned
  callbackType: CallbackType
  callbackText: string  // how it returned
  satisfactionScore: number  // 0-100 (how well it paid off)
  importance: number  // 0-100
}

export interface ContinuityThread {
  id: string
  name: string  // e.g., 'the red dress', 'mentor death'
  chaptersTouched: number[]
  callbacks: NarrativeCallback[]
  isResolved: boolean
}

export interface MemoryWeaverReport {
  totalThreads: number
  activeThreads: number
  resolvedThreads: number
  totalCallbacks: number
  avgSatisfaction: number
  recommendations: string[]
}

export interface NarrativeMemoryState {
  threads: ContinuityThread[]
  callbacks: NarrativeCallback[]
  report: MemoryWeaverReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeMemoryState {
  return { threads: [], callbacks: [], report: null, typeAlias: {} }
}

export function plantCallback(
  state: NarrativeMemoryState,
  threadName: string,
  originalChapter: number,
  originalContext: string,
  callbackType: CallbackType,
  importance: number = 50
): NarrativeMemoryState {
  // Find or create thread
  let thread = state.threads.find(t => t.name.toLowerCase() === threadName.toLowerCase())
  if (!thread) {
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    thread = { id: threadId, name: threadName, chaptersTouched: [], callbacks: [], isResolved: false }
    state = { ...state, threads: [...state.threads, thread] }
  }
  
  const callback: NarrativeCallback = {
    id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    originalChapter,
    originalContext,
    callbackChapter: null,
    callbackType,
    callbackText: '',
    satisfactionScore: 0,
    importance,
  }
  
  const threads = state.threads.map(t => {
    if (t.id === thread!.id) {
      return { ...t, chaptersTouched: [...t.chaptersTouched.filter(c => c !== originalChapter), originalChapter].sort((a, b) => a - b), callbacks: [...t.callbacks, callback] }
    }
    return t
  })
  
  return { ...state, threads, callbacks: [...state.callbacks, callback] }
}

export function deliverCallback(
  state: NarrativeMemoryState,
  callbackId: string,
  callbackChapter: number,
  callbackText: string,
  satisfactionScore: number
): NarrativeMemoryState {
  const callbacks = state.callbacks.map(c => c.id === callbackId
    ? { ...c, callbackChapter, callbackText, satisfactionScore: Math.max(0, Math.min(100, satisfactionScore)) }
    : c
  )
  
  const threads = state.threads.map(t => {
    const hasCallback = t.callbacks.some(c => c.id === callbackId)
    if (hasCallback) {
      return { ...t, chaptersTouched: [...t.chaptersTouched.filter(c => c !== callbackChapter), callbackChapter].sort((a, b) => a - b) }
    }
    return t
  })
  
  return { ...state, callbacks, threads }
}

export function resolveThread(state: NarrativeMemoryState, threadId: string): NarrativeMemoryState {
  const threads = state.threads.map(t => t.id === threadId ? { ...t, isResolved: true } : t)
  return { ...state, threads }
}

export function generateMemoryReport(state: NarrativeMemoryState): MemoryWeaverReport {
  if (state.threads.length === 0) {
    return { totalThreads: 0, activeThreads: 0, resolvedThreads: 0, totalCallbacks: 0, avgSatisfaction: 0, recommendations: [] }
  }
  
  const totalThreads = state.threads.length
  const activeThreads = state.threads.filter(t => !t.isResolved).length
  const resolvedThreads = state.threads.filter(t => t.isResolved).length
  const totalCallbacks = state.callbacks.length
  const deliveredCallbacks = state.callbacks.filter(c => c.callbackChapter !== null)
  const avgSatisfaction = deliveredCallbacks.length > 0
    ? Math.round(deliveredCallbacks.reduce((s, c) => s + c.satisfactionScore, 0) / deliveredCallbacks.length)
    : 0
  
  const recommendations: string[] = []
  if (activeThreads > totalThreads * 0.7) {
    recommendations.push(`${activeThreads} unresolved threads - resolve some for closure`)
  }
  if (avgSatisfaction < 60 && deliveredCallbacks.length > 0) {
    recommendations.push('Low callback satisfaction - make callbacks more meaningful')
  }
  if (state.callbacks.filter(c => c.callbackChapter === null).length > totalCallbacks * 0.5) {
    recommendations.push('Many unfulfilled callbacks - deliver or remove them')
  }
  if (state.threads.some(t => t.callbacks.length > 5 && !t.isResolved)) {
    recommendations.push('Some threads have too many callbacks - resolve or cut')
  }
  if (avgSatisfaction > 80 && resolvedThreads > 0) {
    recommendations.push('Strong callback satisfaction - maintain this quality')
  }
  
  return { totalThreads, activeThreads, resolvedThreads, totalCallbacks, avgSatisfaction, recommendations }
}

export function getThreadByName(state: NarrativeMemoryState, name: string): ContinuityThread | null {
  return state.threads.find(t => t.name.toLowerCase() === name.toLowerCase()) || null
}

export function getUnresolvedCallbacks(state: NarrativeMemoryState): NarrativeCallback[] {
  return state.callbacks.filter(c => c.callbackChapter === null)
}

export function compareCallbackSatisfaction(state: NarrativeMemoryState, cbId1: string, cbId2: string): {
  moreSatisfying: string
  score1: number
  score2: number
} {
  const c1 = state.callbacks.find(c => c.id === cbId1)
  const c2 = state.callbacks.find(c => c.id === cbId2)
  if (!c1 || !c2) return { moreSatisfying: cbId1, score1: 0, score2: 0 }
  return { moreSatisfying: c1.satisfactionScore > c2.satisfactionScore ? cbId1 : cbId2, score1: c1.satisfactionScore, score2: c2.satisfactionScore }
}
