/**
 * WritingSessionManager — V347
 * Context-aware writing session state management, tool call tracking,
 * stagnation detection, and session quality scoring.
 * Inspired by: generic-agent (autonomous planning), chatdev (context awareness)
 */

export interface ToolCall {
  id: string
  tool: string
  startTime: number
  endTime?: number
  success: boolean
  input?: Record<string, unknown>
  output?: unknown
}

export interface WritingSessionState {
  sessionId: string
  startTime: number
  endTime?: number
  toolCalls: ToolCall[]
  recentToolCalls: ToolCall[]
  stagnationCount: number
  lastQualityScore: number
  qualityHistory: number[]
  activeThreads: string[]
  contextWindows: ContextWindow[]
  typeAlias: Record<string, unknown>
}

export interface ContextWindow {
  threadId: string
  startTime: number
  contextSnapshot: string[]
  relevanceScore: number
}

export function createEmptyState(sessionId?: string): WritingSessionState {
  return {
    sessionId: sessionId || `session_${Date.now()}`,
    startTime: Date.now(),
    toolCalls: [],
    recentToolCalls: [],
    stagnationCount: 0,
    lastQualityScore: 0,
    qualityHistory: [],
    activeThreads: [],
    contextWindows: [],
    typeAlias: {},
  }
}

export function recordToolCall(
  state: WritingSessionState,
  tool: string,
  success: boolean,
  input?: Record<string, unknown>,
  output?: unknown
): WritingSessionState {
  const call: ToolCall = {
    id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tool,
    startTime: Date.now(),
    endTime: Date.now(),
    success,
    input,
    output,
  }
  const toolCalls = [...state.toolCalls, call]
  const recentToolCalls = toolCalls.slice(-20)
  return { ...state, toolCalls, recentToolCalls }
}

export function detectStagnation(state: WritingSessionState, qualityThreshold: number = 0.5): boolean {
  if (state.qualityHistory.length < 3) return false
  const recent = state.qualityHistory.slice(-3)
  return recent.every(q => q < qualityThreshold)
}

export function updateQualityScore(state: WritingSessionState, score: number): WritingSessionState {
  const qualityHistory = [...state.qualityHistory, score]
  const stagnationCount = detectStagnation({ ...state, qualityHistory }) ? state.stagnationCount + 1 : 0
  return { ...state, lastQualityScore: score, qualityHistory, stagnationCount }
}

export function flagExcessiveToolCalls(state: WritingSessionState, threshold: number = 40): boolean {
  if (state.toolCalls.length < 2) return false
  const recentWindow = state.toolCalls.slice(-20)
  const timeSpan = (recentWindow[recentWindow.length - 1].startTime - recentWindow[0].startTime) / 60000
  if (timeSpan < 1) return recentWindow.length > threshold / 2
  return recentWindow.length / timeSpan > threshold
}

export function getSessionDuration(state: WritingSessionState): number {
  const end = state.endTime || Date.now()
  return end - state.startTime
}

export function getToolCallFrequency(state: WritingSessionState): number {
  const duration = getSessionDuration(state) / 60000
  if (duration < 0.1) return state.toolCalls.length
  return state.toolCalls.length / duration
}

export function getSuccessfulCallRate(state: WritingSessionState): number {
  if (state.toolCalls.length === 0) return 0
  const successful = state.toolCalls.filter(c => c.success).length
  return successful / state.toolCalls.length
}

export function getContextRelevance(state: WritingSessionState, threadId: string): number {
  const window = state.contextWindows.find(w => w.threadId === threadId)
  return window?.relevanceScore || 0
}

export function getSessionQualityTrend(state: WritingSessionState): 'improving' | 'declining' | 'stable' {
  if (state.qualityHistory.length < 3) return 'stable'
  const recent = state.qualityHistory.slice(-3)
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  const older = state.qualityHistory.slice(-6, -3)
  if (older.length < 3) return 'stable'
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  const diff = avg - olderAvg
  if (diff > 0.05) return 'improving'
  if (diff < -0.05) return 'declining'
  return 'stable'
}

export function addActiveThread(state: WritingSessionState, threadId: string): WritingSessionState {
  if (state.activeThreads.includes(threadId)) return state
  return { ...state, activeThreads: [...state.activeThreads, threadId] }
}

export function pushContextWindow(
  state: WritingSessionState,
  threadId: string,
  snapshot: string[],
  relevanceScore: number
): WritingSessionState {
  const window: ContextWindow = { threadId, startTime: Date.now(), contextSnapshot: snapshot, relevanceScore }
  const contextWindows = [...state.contextWindows, window].slice(-50)
  return { ...state, contextWindows }
}

export function getSessionStatistics(state: WritingSessionState) {
  return {
    sessionId: state.sessionId,
    duration: getSessionDuration(state),
    totalCalls: state.toolCalls.length,
    callFrequency: getToolCallFrequency(state),
    successRate: getSuccessfulCallRate(state),
    qualityTrend: getSessionQualityTrend(state),
    stagnationCount: state.stagnationCount,
    activeThreads: state.activeThreads.length,
  }
}

export function shouldSuggestBreak(state: WritingSessionState): boolean {
  if (state.stagnationCount >= 3) return true
  if (state.toolCalls.length > 100 && getSuccessfulCallRate(state) < 0.5) return true
  return false
}

export function endSession(state: WritingSessionState): WritingSessionState {
  return { ...state, endTime: Date.now() }
}
