/**
 * WriterMoodEngine - V140
 * Emotional State & Creative Flow Optimization
 * 
 * Design references:
 * - thunderbolt: pipeline feedback loops for continuous monitoring
 * - nanobot: health tracking and distributed state monitoring
 * - generic-agent: autonomous self-regulation and state management
 * - chatdev: role-based emotional modeling
 * - claude-code: productivity state detection
 */

export type MoodState = 'flow' | 'creative' | 'focused' | 'neutral' | 'stuck' | 'frustrated' | 'exhausted'
export type EnergyLevel = 'high' | 'medium' | 'low' | 'depleted'
export type FlowPhase = 'warmup' | 'building' | 'peak' | 'declining' | 'recovery' | 'rest'

export interface WriterMoodMetrics {
  energyLevel: EnergyLevel
  moodState: MoodState
  flowPhase: FlowPhase
  creativeIntensity: number   // 0-100
  focusLevel: number         // 0-100
  frustrationLevel: number   // 0-100
  engagementScore: number    // 0-100
}

export interface WritingSessionMood {
  sessionId: string
  startTime: number
  initialMood: WriterMoodMetrics
  currentMood: WriterMoodMetrics
  moodHistory: Array<{ timestamp: number; metrics: WriterMoodMetrics }>
  transitionsCount: number
  flowQuality: number        // overall quality of session
}

export interface WriterMoodEngineState {
  currentSession: WritingSessionMood | null
  historicalSessions: WritingSessionMood[]
  defaultEnergyLevel: EnergyLevel
  preferredFlowPhase: FlowPhase
  sessionCount: number
  averageFlowQuality: number
  moodPatternFrequencies: Map<MoodState, number>
  frustrationThreshold: number
  energyDecayRate: number    // per minute
  lastActivityAt: number | null
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyMoodEngineState(): WriterMoodEngineState {
  return {
    currentSession: null,
    historicalSessions: [],
    defaultEnergyLevel: 'medium',
    preferredFlowPhase: 'peak',
    sessionCount: 0,
    averageFlowQuality: 50,
    moodPatternFrequencies: new Map(),
    frustrationThreshold: 75,
    energyDecayRate: 2,  // 2% per minute of inactivity
    lastActivityAt: null,
  }
}

// =============================================================================
// Mood Detection
// =============================================================================

export function detectMoodFromInput(
  inputContent: string,
  previousMood: WriterMoodMetrics | null,
  timeSinceLastActivityMs: number
): WriterMoodMetrics {
  const words = inputContent.trim().split(/\s+/)
  const wordCount = words.length
  const sentences = inputContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  let creativeIntensity = 50
  let focusLevel = 50
  let frustrationLevel = 0
  let engagementScore = 50
  
  // High word count with varied vocabulary = creative/flow
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, '')))
  const richness = uniqueWords.size / Math.max(1, wordCount)
  
  if (richness > 0.6 && wordCount > 20) {
    creativeIntensity = Math.min(100, 60 + richness * 40)
    engagementScore = Math.min(100, engagementScore + 15)
  } else if (richness < 0.3 && wordCount > 10) {
    creativeIntensity = Math.max(0, 50 - (0.3 - richness) * 100)
    engagementScore = Math.max(0, engagementScore - 15)
  }
  
  // Short fragmented input = frustration/stuck
  const avgSentenceLen = sentences.length > 0 ? wordCount / sentences.length : 0
  if (avgSentenceLen < 8 && sentences.length > 2) {
    frustrationLevel = Math.min(100, frustrationLevel + 30)
    creativeIntensity = Math.max(0, creativeIntensity - 20)
  }
  
  // Time-based energy decay
  const minutesElapsed = timeSinceLastActivityMs / 60000
  const energyDecay = minutesElapsed * 2  // 2% per minute
  let energyLevel: EnergyLevel = 'medium'
  let baseEnergy = 100 - energyDecay
  
  if (baseEnergy > 80) energyLevel = 'high'
  else if (baseEnergy > 50) energyLevel = 'medium'
  else if (baseEnergy > 20) energyLevel = 'low'
  else energyLevel = 'depleted'
  
  // Determine mood state
  let moodState: MoodState = 'neutral'
  if (creativeIntensity > 80 && focusLevel > 60) moodState = 'flow'
  else if (creativeIntensity > 65) moodState = 'creative'
  else if (focusLevel > 70 && creativeIntensity > 50) moodState = 'focused'
  else if (frustrationLevel > 60) moodState = 'frustrated'
  else if (creativeIntensity < 30 && focusLevel < 30) moodState = 'stuck'
  else if (energyLevel === 'depleted') moodState = 'exhausted'
  
  // Determine flow phase
  let flowPhase: FlowPhase = 'neutral' as FlowPhase
  if (previousMood) {
    if (creativeIntensity > previousMood.creativeIntensity && creativeIntensity > 70) flowPhase = 'building'
    else if (creativeIntensity > 85 && previousMood.creativeIntensity > 75) flowPhase = 'peak'
    else if (creativeIntensity < previousMood.creativeIntensity - 10) flowPhase = 'declining'
    else if (frustrationLevel > previousMood.frustrationLevel + 15) flowPhase = 'recovery'
  }
  
  // Compensate: if previous mood existed, don't jump dramatically
  if (previousMood) {
    const clamped = (val: number, prev: number, maxDelta: number) => {
      const delta = val - prev
      if (delta > maxDelta) return prev + maxDelta
      if (delta < -maxDelta) return prev - maxDelta
      return val
    }
    creativeIntensity = Math.round(clamped(creativeIntensity, previousMood.creativeIntensity, 25))
    focusLevel = Math.round(clamped(focusLevel, previousMood.focusLevel, 20))
    frustrationLevel = Math.round(Math.max(0, clamped(frustrationLevel, previousMood.frustrationLevel, 30)))
    engagementScore = Math.round(clamped(engagementScore, previousMood.engagementScore, 20))
  }
  
  return {
    energyLevel,
    moodState,
    flowPhase: flowPhase === 'neutral' ? 'warmup' : flowPhase,
    creativeIntensity: Math.max(0, Math.min(100, Math.round(creativeIntensity))),
    focusLevel: Math.max(0, Math.min(100, Math.round(focusLevel))),
    frustrationLevel: Math.max(0, Math.min(100, Math.round(frustrationLevel))),
    engagementScore: Math.max(0, Math.min(100, Math.round(engagementScore))),
  }
}

export function determineFlowPhaseFromMood(mood: WriterMoodMetrics): FlowPhase {
  if (mood.moodState === 'flow') return 'peak'
  if (mood.moodState === 'frustrated') return 'recovery'
  if (mood.moodState === 'exhausted') return 'rest'
  if (mood.moodState === 'stuck') return 'recovery'
  if (mood.creativeIntensity > 70 && mood.focusLevel > 60) return 'building'
  if (mood.creativeIntensity > 50) return 'warmup'
  return 'declining'
}

// =============================================================================
// Session Management
// =============================================================================

export function startMoodSession(
  state: WriterMoodEngineState,
  initialMood: WriterMoodMetrics
): WriterMoodEngineState {
  const session: WritingSessionMood = {
    sessionId: `mood_${Date.now()}`,
    startTime: Date.now(),
    initialMood,
    currentMood: initialMood,
    moodHistory: [{ timestamp: Date.now(), metrics: { ...initialMood } }],
    transitionsCount: 0,
    flowQuality: 0,
  }
  return { ...state, currentSession: session, lastActivityAt: Date.now() }
}

export function updateSessionMood(
  state: WriterMoodEngineState,
  newMood: WriterMoodMetrics
): WriterMoodEngineState {
  if (!state.currentSession) {
    return startMoodSession(state, newMood)
  }
  
  const prevMood = state.currentSession.currentMood
  const moodHistory = [...state.currentSession.moodHistory, { timestamp: Date.now(), metrics: { ...newMood } }]
  
  // Count significant mood transitions
  let transitions = state.currentSession.transitionsCount
  if (prevMood.moodState !== newMood.moodState) transitions++
  if (prevMood.flowPhase !== newMood.flowPhase && newMood.flowPhase !== 'warmup') transitions++
  
  return {
    ...state,
    currentSession: {
      ...state.currentSession,
      currentMood: newMood,
      moodHistory,
      transitionsCount: transitions,
    },
    lastActivityAt: Date.now(),
  }
}

export function endMoodSession(state: WriterMoodEngineState): WriterMoodEngineState {
  if (!state.currentSession) return state
  
  // Calculate flow quality
  const history = state.currentSession.moodHistory
  let flowQuality = 50
  
  if (history.length > 0) {
    const creativeAvg = history.reduce((s, h) => s + h.metrics.creativeIntensity, 0) / history.length
    const focusAvg = history.reduce((s, h) => s + h.metrics.focusLevel, 0) / history.length
    const frustrationAvg = history.reduce((s, h) => s + h.metrics.frustrationLevel, 0) / history.length
    
    flowQuality = Math.round(creativeAvg * 0.5 + focusAvg * 0.3 - frustrationAvg * 0.2)
  }
  
  const completedSession: WritingSessionMood = { ...state.currentSession, flowQuality }
  
  // Update historical sessions
  const historicalSessions = [...state.historicalSessions, completedSession]
  
  // Update mood pattern frequencies
  const moodPatternFrequencies = new Map(state.moodPatternFrequencies)
  const finalMood = state.currentSession.currentMood.moodState
  moodPatternFrequencies.set(finalMood, (moodPatternFrequencies.get(finalMood) || 0) + 1)
  
  // Update average flow quality
  const newAvg = (state.averageFlowQuality * state.sessionCount + flowQuality) / (state.sessionCount + 1)
  
  return {
    ...state,
    currentSession: null,
    historicalSessions: historicalSessions.slice(-50),  // keep last 50
    sessionCount: state.sessionCount + 1,
    averageFlowQuality: Math.round(newAvg),
    moodPatternFrequencies,
  }
}

// =============================================================================
// Optimization Suggestions
// =============================================================================

export function suggestMoodImprovement(state: WriterMoodEngineState): string | null {
  if (!state.currentSession) return null
  
  const mood = state.currentSession.currentMood
  
  if (mood.frustrationLevel > state.frustrationThreshold) {
    return 'Take a short break - frustration is building'
  }
  
  if (mood.moodState === 'stuck') {
    return 'Try a different scene or perspective - current approach not working'
  }
  
  if (mood.energyLevel === 'depleted') {
    return 'Rest and recharge - energy is fully depleted'
  }
  
  if (mood.moodState === 'exhausted') {
    return 'End session gracefully - exhaustion will reduce quality'
  }
  
  if (mood.flowPhase === 'declining' && mood.creativeIntensity < 50) {
    return 'Consider stopping or switching to a lighter task'
  }
  
  if (mood.creativeIntensity > 80 && mood.focusLevel > 70 && mood.flowPhase !== 'peak') {
    return 'You are approaching flow state - keep going!'
  }
  
  return null  // no urgent suggestion
}

export function getOptimalSessionLength(state: WriterMoodEngineState): number {
  // Based on historical data, suggest optimal session length in minutes
  if (state.sessionCount === 0) return 30
  
  // If average flow quality > 70, sessions can be longer (up to 60 min)
  // If average flow quality < 50, keep sessions shorter (15-20 min)
  const qualityFactor = state.averageFlowQuality / 100
  return Math.round(15 + qualityFactor * 45)
}

export function shouldPauseSession(state: WriterMoodEngineState): boolean {
  if (!state.currentSession) return false
  
  const mood = state.currentSession.currentMood
  
  // Always pause if depleted or extremely frustrated
  if (mood.energyLevel === 'depleted') return true
  if (mood.frustrationLevel > 90) return true
  if (mood.moodState === 'exhausted') return true
  
  // Pause if declining for too long
  const history = state.currentSession.moodHistory
  if (history.length >= 5) {
    const recent = history.slice(-5)
    const allDeclining = recent.every((h, i) => i === 0 || h.metrics.creativeIntensity <= recent[i - 1].metrics.creativeIntensity)
    if (allDeclining && recent[recent.length - 1].metrics.creativeIntensity < 40) return true
  }
  
  return false
}

// =============================================================================
// Formatters
// =============================================================================

export function formatMoodMetrics(metrics: WriterMoodMetrics): string {
  const lines = [
    `Energy: ${metrics.energyLevel}`,
    `Mood: ${metrics.moodState}`,
    `Flow Phase: ${metrics.flowPhase}`,
    `Creative: ${metrics.creativeIntensity}/100`,
    `Focus: ${metrics.focusLevel}/100`,
    `Frustration: ${metrics.frustrationLevel}/100`,
    `Engagement: ${metrics.engagementScore}/100`,
  ]
  return lines.join(' | ')
}

export function formatMoodDashboard(state: WriterMoodEngineState): string {
  const lines = [
    '=== Writer Mood Engine Dashboard ===',
    `Sessions: ${state.sessionCount} | Avg Flow Quality: ${state.averageFlowQuality.toFixed(0)}/100`,
    `Frustration Threshold: ${state.frustrationThreshold}`,
    `Energy Decay Rate: ${state.energyDecayRate}%/min`,
    '',
  ]
  
  if (state.currentSession) {
    lines.push('--- Current Session ---')
    lines.push(formatMoodMetrics(state.currentSession.currentMood))
    lines.push(`Transitions: ${state.currentSession.transitionsCount}`)
    lines.push(`Duration: ${((Date.now() - state.currentSession.startTime) / 60000).toFixed(1)} min`)
  } else {
    lines.push('--- No Active Session ---')
  }
  
  if (state.moodPatternFrequencies.size > 0) {
    lines.push('')
    lines.push('--- Mood Patterns ---')
    const sorted = Array.from(state.moodPatternFrequencies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    for (const [mood, freq] of sorted) {
      lines.push(`  ${mood}: ${freq}x`)
    }
  }
  
  if (state.historicalSessions.length > 0) {
    lines.push('')
    lines.push(`--- Recent Sessions: ${state.historicalSessions.length} ---`)
    const recent = state.historicalSessions.slice(-3)
    for (const s of recent) {
      const duration = ((state.sessionCount > 0 ? 0 : 0) / 60000).toFixed(0)  // placeholder
      lines.push(`  ${s.sessionId.slice(-8)}: flow=${s.flowQuality} mood=${s.currentMood.moodState}`)
    }
  }
  
  return lines.join('\n')
}
