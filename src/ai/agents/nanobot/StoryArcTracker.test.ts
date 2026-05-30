/**
 * StoryArcTracker Tests - V143
 * Tests for Narrative Arc Progress Tracking System
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyArcTrackerState,
  createArc,
  updateArcProgress,
  addBeat,
  markBeatComplete,
  updateBeatWordCount,
  updateChapterProgress,
  analyzeMissingBeats,
  transitionArcPhase,
  closeArc,
  formatArcSummary,
  formatTrackerDashboard,
} from './StoryArcTracker'

// =============================================================================
// createEmptyArcTrackerState Tests
// =============================================================================

describe('createEmptyArcTrackerState', () => {
  it('should create empty state', () => {
    const state = createEmptyArcTrackerState()
    expect(state.arcs.size).toBe(0)
    expect(state.chapters.size).toBe(0)
    expect(state.totalWordCount).toBe(0)
  })

  it('should have default target word count', () => {
    const state = createEmptyArcTrackerState()
    expect(state.targetWordCount).toBe(50000)
  })

  it('should have no current arc', () => {
    const state = createEmptyArcTrackerState()
    expect(state.currentArcId).toBeNull()
  })
})

// =============================================================================
// Arc Management Tests
// =============================================================================

describe('createArc', () => {
  it('should create new arc', () => {
    let state = createEmptyArcTrackerState()
    const result = createArc(state, 'Main Plot Arc', 1)
    expect(result.arcId).toContain('arc_')
    expect(result.state.arcs.size).toBe(1)
  })

  it('should set arc phase to setup', () => {
    let state = createEmptyArcTrackerState()
    const result = createArc(state, 'Subplot', 5)
    const arc = result.state.arcs.get(result.arcId)
    expect(arc?.phase).toBe('setup')
  })

  it('should set current arc to new arc', () => {
    let state = createEmptyArcTrackerState()
    const result = createArc(state, 'Main Arc', 1)
    expect(result.state.currentArcId).toBe(result.arcId)
  })
})

describe('updateArcProgress', () => {
  it('should calculate progress from beats', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    const arcId = result.arcId
    state = addBeat(result.state, arcId, 'inciting_incident', 1, 0.1, 'Hook', 2000)
    state = addBeat(state, arcId, 'rising_action', 2, 0.1, 'Build', 2500)
    state = markBeatComplete(state, arcId, state.arcs.get(arcId)!.beats[0].beatId, 1800)
    state = updateArcProgress(state, arcId)
    
    const arc = state.arcs.get(arcId)
    expect(arc?.progress).toBeGreaterThan(0)
  })

  it('should calculate pacing score', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    const arcId = result.arcId
    state = addBeat(result.state, arcId, 'climax', 5, 0.5, 'Peak', 3000)
    state = addBeat(state, arcId, 'rising_action', 3, 0.3, 'Build', 1000)
    state = markBeatComplete(state, arcId, state.arcs.get(arcId)!.beats[0].beatId, 3000)
    state = markBeatComplete(state, arcId, state.arcs.get(arcId)!.beats[1].beatId, 1000)
    state = updateArcProgress(state, arcId)
    
    const arc = state.arcs.get(arcId)
    expect(arc?.pacingScore).toBeDefined()
    expect(arc?.pacingScore).toBeGreaterThanOrEqual(0)
  })
})

// =============================================================================
// Beat Management Tests
// =============================================================================

describe('addBeat', () => {
  it('should add beat to arc', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    state = addBeat(result.state, result.arcId, 'inciting_incident', 1, 0.1, 'Hook', 2000)
    
    const arc = state.arcs.get(result.arcId)
    expect(arc?.beats.length).toBe(1)
    expect(arc?.beats[0].beatType).toBe('inciting_incident')
  })

  it('should return unchanged state for invalid arc', () => {
    const state = createEmptyArcTrackerState()
    const result = addBeat(state, 'nonexistent', 'climax', 1, 0.5, 'Test', 2000)
    expect(result).toBe(state)
  })
})

describe('markBeatComplete', () => {
  it('should mark beat as completed with word count', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    state = addBeat(result.state, result.arcId, 'climax', 5, 0.5, 'Peak', 3000)
    
    const beatId = state.arcs.get(result.arcId)!.beats[0].beatId
    state = markBeatComplete(state, result.arcId, beatId, 3200)
    
    const beat = state.arcs.get(result.arcId)!.beats[0]
    expect(beat.completed).toBe(true)
    expect(beat.wordCountActual).toBe(3200)
  })
})

describe('updateBeatWordCount', () => {
  it('should update word count without marking complete', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    state = addBeat(result.state, result.arcId, 'rising_action', 2, 0.2, 'Build', 2000)
    
    const beatId = state.arcs.get(result.arcId)!.beats[0].beatId
    state = updateBeatWordCount(state, result.arcId, beatId, 1500)
    
    const beat = state.arcs.get(result.arcId)!.beats[0]
    expect(beat.wordCountActual).toBe(1500)
    expect(beat.completed).toBe(false)
  })
})

// =============================================================================
// Chapter Progress Tests
// =============================================================================

describe('updateChapterProgress', () => {
  it('should update chapter progress', () => {
    let state = createEmptyArcTrackerState()
    state = updateChapterProgress(state, 1, 2500, 3000)
    
    const chapter = state.chapters.get(1)
    expect(chapter?.wordCount).toBe(2500)
    expect(chapter?.completionPercent).toBe(83)
  })

  it('should update total word count', () => {
    let state = createEmptyArcTrackerState()
    state = updateChapterProgress(state, 1, 2500, 3000)
    state = updateChapterProgress(state, 2, 1800, 3000)
    
    expect(state.totalWordCount).toBe(4300)
  })

  it('should calculate completion percentage', () => {
    let state = createEmptyArcTrackerState()
    state = updateChapterProgress(state, 1, 1500, 3000)
    
    const chapter = state.chapters.get(1)
    expect(chapter?.completionPercent).toBe(50)
  })
})

// =============================================================================
// Missing Beat Analysis Tests
// =============================================================================

describe('analyzeMissingBeats', () => {
  it('should identify missing inciting incident', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    state = addBeat(result.state, result.arcId, 'rising_action', 2, 0.2, 'Build', 2000)
    state = analyzeMissingBeats(state)
    
    expect(state.nextSuggestedBeat).toBe('inciting_incident')
  })

  it('should not suggest when arc is complete', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Complete Arc', 1)
    const arcId = result.arcId
    state = addBeat(result.state, arcId, 'inciting_incident', 1, 0.1, 'Hook', 2000)
    state = addBeat(state, arcId, 'rising_action', 3, 0.3, 'Build', 2500)
    state = addBeat(state, arcId, 'midpoint', 5, 0.5, 'Midpoint', 3000)
    state = addBeat(state, arcId, 'climax', 8, 0.8, 'Climax', 3000)
    state = addBeat(state, arcId, 'resolution', 10, 0.9, 'End', 2000)
    state = analyzeMissingBeats(state)
    
    expect(state.nextSuggestedBeat).not.toBe('inciting_incident')
  })
})

// =============================================================================
// Arc Phase Transition Tests
// =============================================================================

describe('transitionArcPhase', () => {
  it('should transition arc phase', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    state = transitionArcPhase(result.state, result.arcId, 'rising_action')
    
    const arc = state.arcs.get(result.arcId)
    expect(arc?.phase).toBe('rising_action')
  })
})

describe('closeArc', () => {
  it('should close arc with end chapter', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Test Arc', 1)
    state = closeArc(result.state, result.arcId, 10)
    
    const arc = state.arcs.get(result.arcId)
    expect(arc?.endChapter).toBe(10)
    expect(arc?.phase).toBe('resolution')
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatArcSummary', () => {
  it('should format arc summary', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Main Arc', 1)
    state = addBeat(result.state, result.arcId, 'inciting_incident', 1, 0.1, 'Hook', 2000)
    state = markBeatComplete(state, result.arcId, state.arcs.get(result.arcId)!.beats[0].beatId, 1800)
    
    const summary = formatArcSummary(state, result.arcId)
    expect(summary).toContain('Main Arc')
    expect(summary).toContain('inciting_incident')
    expect(summary).toContain('Hook')
  })

  it('should handle missing arc', () => {
    const state = createEmptyArcTrackerState()
    const summary = formatArcSummary(state, 'nonexistent')
    expect(summary).toContain('not found')
  })
})

describe('formatTrackerDashboard', () => {
  it('should show total words and target', () => {
    const state = createEmptyArcTrackerState()
    const dashboard = formatTrackerDashboard(state)
    expect(dashboard).toContain('Total Words')
    expect(dashboard).toContain('50,000')
  })

  it('should show zero progress when empty', () => {
    const state = createEmptyArcTrackerState()
    const dashboard = formatTrackerDashboard(state)
    expect(dashboard).toContain('0%')
  })

  it('should show arc count', () => {
    let state = createEmptyArcTrackerState()
    let result = createArc(state, 'Arc 1', 1)
    const dashboard = formatTrackerDashboard(result.state)
    expect(dashboard).toContain('Arcs: 1')
  })

  it('should show chapter progress', () => {
    let state = createEmptyArcTrackerState()
    state = updateChapterProgress(state, 1, 2500, 3000)
    const dashboard = formatTrackerDashboard(state)
    expect(dashboard).toContain('Chapter Progress')
  })
})
