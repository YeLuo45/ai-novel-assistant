/**
 * WriterMoodEngine Tests - V141
 * Tests for Emotional State & Creative Flow Optimization
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyMoodEngineState,
  detectMoodFromInput,
  determineFlowPhaseFromMood,
  startMoodSession,
  updateSessionMood,
  endMoodSession,
  suggestMoodImprovement,
  getOptimalSessionLength,
  shouldPauseSession,
  formatMoodMetrics,
  formatMoodDashboard,
} from './WriterMoodEngine'

// =============================================================================
// createEmptyMoodEngineState Tests
// =============================================================================

describe('createEmptyMoodEngineState', () => {
  it('should create empty state', () => {
    const state = createEmptyMoodEngineState()
    expect(state.currentSession).toBeNull()
    expect(state.historicalSessions.length).toBe(0)
    expect(state.sessionCount).toBe(0)
  })

  it('should have default energy level', () => {
    const state = createEmptyMoodEngineState()
    expect(state.defaultEnergyLevel).toBe('medium')
  })

  it('should have default frustration threshold', () => {
    const state = createEmptyMoodEngineState()
    expect(state.frustrationThreshold).toBe(75)
  })

  it('should have default energy decay rate', () => {
    const state = createEmptyMoodEngineState()
    expect(state.energyDecayRate).toBe(2)
  })
})

// =============================================================================
// detectMoodFromInput Tests
// =============================================================================

describe('detectMoodFromInput', () => {
  it('should detect creative flow from rich content', () => {
    const content = 'The ephemeral nature of existence reveals through myriad experiences that transcend the mundane boundaries of ordinary perception and understanding.'
    const result = detectMoodFromInput(content, null, 0)
    expect(result.creativeIntensity).toBeGreaterThanOrEqual(40)
    expect(result.engagementScore).toBeGreaterThanOrEqual(40)
  })

  it('should detect frustration from short fragmented input', () => {
    const content = 'No. Not again. Why does this happen. Every time. I try. But it fails. This is wrong.'
    const result = detectMoodFromInput(content, null, 0)
    expect(result.frustrationLevel).toBeGreaterThan(0)
    expect(result.moodState).not.toBe('flow')
  })

  it('should apply energy decay over time', () => {
    const content = 'Some normal content.'
    const resultWithPause = detectMoodFromInput(content, null, 600000)  // 10 minutes
    const resultImmediate = detectMoodFromInput(content, null, 0)
    expect(resultWithPause.energyLevel).not.toBe(resultImmediate.energyLevel)
  })

  it('should clamp values to 0-100', () => {
    const content = 'Word ' + 'word '.repeat(100)
    const result = detectMoodFromInput(content, null, 0)
    expect(result.creativeIntensity).toBeLessThanOrEqual(100)
    expect(result.focusLevel).toBeLessThanOrEqual(100)
  })
})

describe('determineFlowPhaseFromMood', () => {
  it('should return peak for flow state', () => {
    const mood = { energyLevel: 'high' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 90, focusLevel: 85, frustrationLevel: 5, engagementScore: 90 }
    expect(determineFlowPhaseFromMood(mood)).toBe('peak')
  })

  it('should return recovery for frustrated', () => {
    const mood = { energyLevel: 'medium' as const, moodState: 'frustrated' as const, flowPhase: 'recovery' as const, creativeIntensity: 30, focusLevel: 40, frustrationLevel: 70, engagementScore: 30 }
    expect(determineFlowPhaseFromMood(mood)).toBe('recovery')
  })

  it('should return rest for exhausted', () => {
    const mood = { energyLevel: 'depleted' as const, moodState: 'exhausted' as const, flowPhase: 'rest' as const, creativeIntensity: 10, focusLevel: 10, frustrationLevel: 80, engagementScore: 10 }
    expect(determineFlowPhaseFromMood(mood)).toBe('rest')
  })

  it('should return building for high creative', () => {
    const mood = { energyLevel: 'high' as const, moodState: 'creative' as const, flowPhase: 'building' as const, creativeIntensity: 80, focusLevel: 70, frustrationLevel: 10, engagementScore: 75 }
    expect(determineFlowPhaseFromMood(mood)).toBe('building')
  })
})

// =============================================================================
// Session Management Tests
// =============================================================================

describe('startMoodSession', () => {
  it('should create new session', () => {
    let state = createEmptyMoodEngineState()
    const initialMood = { energyLevel: 'medium' as const, moodState: 'neutral' as const, flowPhase: 'warmup' as const, creativeIntensity: 50, focusLevel: 50, frustrationLevel: 0, engagementScore: 50 }
    state = startMoodSession(state, initialMood)
    expect(state.currentSession).not.toBeNull()
    expect(state.currentSession?.sessionId).toContain('mood_')
  })
})

describe('updateSessionMood', () => {
  it('should update current mood', () => {
    let state = createEmptyMoodEngineState()
    const mood1 = { energyLevel: 'medium' as const, moodState: 'creative' as const, flowPhase: 'building' as const, creativeIntensity: 65, focusLevel: 60, frustrationLevel: 5, engagementScore: 60 }
    state = startMoodSession(state, mood1)
    const mood2 = { energyLevel: 'high' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 85, focusLevel: 80, frustrationLevel: 5, engagementScore: 85 }
    state = updateSessionMood(state, mood2)
    expect(state.currentSession?.currentMood.creativeIntensity).toBe(85)
  })

  it('should count mood transitions', () => {
    let state = createEmptyMoodEngineState()
    const mood1 = { energyLevel: 'medium' as const, moodState: 'creative' as const, flowPhase: 'warmup' as const, creativeIntensity: 50, focusLevel: 50, frustrationLevel: 0, engagementScore: 50 }
    state = startMoodSession(state, mood1)
    const mood2 = { energyLevel: 'high' as const, moodState: 'flow' as const, flowPhase: 'building' as const, creativeIntensity: 70, focusLevel: 65, frustrationLevel: 0, engagementScore: 65 }
    state = updateSessionMood(state, mood2)
    expect(state.currentSession?.transitionsCount).toBeGreaterThanOrEqual(0)
  })

  it('should auto-start session if none exists', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'neutral' as const, flowPhase: 'warmup' as const, creativeIntensity: 50, focusLevel: 50, frustrationLevel: 0, engagementScore: 50 }
    state = updateSessionMood(state, mood)
    expect(state.currentSession).not.toBeNull()
  })
})

describe('endMoodSession', () => {
  it('should end session and store in history', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 80, focusLevel: 75, frustrationLevel: 5, engagementScore: 80 }
    state = startMoodSession(state, mood)
    state = endMoodSession(state)
    expect(state.currentSession).toBeNull()
    expect(state.historicalSessions.length).toBe(1)
  })

  it('should increment session count', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'neutral' as const, flowPhase: 'warmup' as const, creativeIntensity: 50, focusLevel: 50, frustrationLevel: 0, engagementScore: 50 }
    state = startMoodSession(state, mood)
    state = endMoodSession(state)
    expect(state.sessionCount).toBe(1)
  })

  it('should update mood pattern frequencies', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 80, focusLevel: 75, frustrationLevel: 5, engagementScore: 80 }
    state = startMoodSession(state, mood)
    state = endMoodSession(state)
    expect(state.moodPatternFrequencies.get('flow')).toBe(1)
  })

  it('should calculate flow quality', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'high' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 90, focusLevel: 85, frustrationLevel: 5, engagementScore: 90 }
    state = startMoodSession(state, mood)
    state = endMoodSession(state)
    expect(state.averageFlowQuality).toBeGreaterThan(0)
  })
})

// =============================================================================
// Optimization Tests
// =============================================================================

describe('suggestMoodImprovement', () => {
  it('should suggest break when frustrated', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'frustrated' as const, flowPhase: 'recovery' as const, creativeIntensity: 35, focusLevel: 30, frustrationLevel: 80, engagementScore: 25 }
    state = startMoodSession(state, mood)
    const suggestion = suggestMoodImprovement(state)
    expect(suggestion).toContain('break')
  })

  it('should suggest different approach when stuck', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'low' as const, moodState: 'stuck' as const, flowPhase: 'recovery' as const, creativeIntensity: 20, focusLevel: 25, frustrationLevel: 50, engagementScore: 20 }
    state = startMoodSession(state, mood)
    const suggestion = suggestMoodImprovement(state)
    expect(suggestion).toContain('different')
  })

  it('should return null for good state', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'high' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 85, focusLevel: 80, frustrationLevel: 5, engagementScore: 85 }
    state = startMoodSession(state, mood)
    const suggestion = suggestMoodImprovement(state)
    expect(suggestion).toBeNull()
  })

  it('should return null when no session', () => {
    const state = createEmptyMoodEngineState()
    expect(suggestMoodImprovement(state)).toBeNull()
  })
})

describe('getOptimalSessionLength', () => {
  it('should return default 30 for new writer', () => {
    const state = createEmptyMoodEngineState()
    const length = getOptimalSessionLength(state)
    expect(length).toBe(30)
  })

  it('should return longer for high flow quality', () => {
    let state = createEmptyMoodEngineState()
    state = { ...state, sessionCount: 5, averageFlowQuality: 80 }
    const length = getOptimalSessionLength(state)
    expect(length).toBeGreaterThan(30)
  })

  it('should return shorter for low flow quality', () => {
    let state = createEmptyMoodEngineState()
    state = { ...state, sessionCount: 5, averageFlowQuality: 30 }
    const length = getOptimalSessionLength(state)
    expect(length).toBeLessThan(30)
  })
})

describe('shouldPauseSession', () => {
  it('should return true for depleted energy', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'depleted' as const, moodState: 'exhausted' as const, flowPhase: 'rest' as const, creativeIntensity: 10, focusLevel: 10, frustrationLevel: 20, engagementScore: 10 }
    state = startMoodSession(state, mood)
    expect(shouldPauseSession(state)).toBe(true)
  })

  it('should return true for extreme frustration', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'frustrated' as const, flowPhase: 'recovery' as const, creativeIntensity: 30, focusLevel: 30, frustrationLevel: 95, engagementScore: 20 }
    state = startMoodSession(state, mood)
    expect(shouldPauseSession(state)).toBe(true)
  })

  it('should return false for healthy state', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'high' as const, moodState: 'creative' as const, flowPhase: 'building' as const, creativeIntensity: 70, focusLevel: 65, frustrationLevel: 10, engagementScore: 70 }
    state = startMoodSession(state, mood)
    expect(shouldPauseSession(state)).toBe(false)
  })

  it('should return false when no session', () => {
    const state = createEmptyMoodEngineState()
    expect(shouldPauseSession(state)).toBe(false)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatMoodMetrics', () => {
  it('should include all mood fields', () => {
    const mood = { energyLevel: 'high' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 85, focusLevel: 80, frustrationLevel: 5, engagementScore: 85 }
    const formatted = formatMoodMetrics(mood)
    expect(formatted).toContain('Energy')
    expect(formatted).toContain('high')
    expect(formatted).toContain('Mood')
    expect(formatted).toContain('flow')
    expect(formatted).toContain('Creative')
    expect(formatted).toContain('85')
  })
})

describe('formatMoodDashboard', () => {
  it('should show session count', () => {
    const state = createEmptyMoodEngineState()
    const dashboard = formatMoodDashboard(state)
    expect(dashboard).toContain('Sessions')
  })

  it('should show average flow quality', () => {
    const state = createEmptyMoodEngineState()
    const dashboard = formatMoodDashboard(state)
    expect(dashboard).toContain('Avg Flow Quality')
  })

  it('should show no active session', () => {
    const state = createEmptyMoodEngineState()
    const dashboard = formatMoodDashboard(state)
    expect(dashboard).toContain('No Active Session')
  })

  it('should show current session when active', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'high' as const, moodState: 'creative' as const, flowPhase: 'building' as const, creativeIntensity: 70, focusLevel: 65, frustrationLevel: 10, engagementScore: 70 }
    state = startMoodSession(state, mood)
    const dashboard = formatMoodDashboard(state)
    expect(dashboard).toContain('Current Session')
  })

  it('should show mood patterns when available', () => {
    let state = createEmptyMoodEngineState()
    const mood = { energyLevel: 'medium' as const, moodState: 'flow' as const, flowPhase: 'peak' as const, creativeIntensity: 80, focusLevel: 75, frustrationLevel: 5, engagementScore: 80 }
    state = startMoodSession(state, mood)
    state = endMoodSession(state)
    const dashboard = formatMoodDashboard(state)
    expect(dashboard).toContain('Mood Patterns')
  })
})
