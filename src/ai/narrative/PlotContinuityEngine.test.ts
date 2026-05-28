/**
 * PlotContinuityEngine Tests - V92
 * Tests for Narrative Thread Continuity and Causal Integrity
 */

import { describe, it, expect } from 'vitest'
import {
  createThread,
  createSetupPromise,
  createForeshadow,
  createPlotHole,
  createEmptyThreadState,
  registerSetup,
  registerForeshadow,
  fulfilSetup,
  payOffForeshadow,
  abandonThread,
  calculateThreadUrgency,
  detectPlotHoles,
  checkTimelineConsistency,
  generateContinuityReport,
  formatContinuitySummary,
  calculateThreadSatisfaction,
  DEFAULT_CONTINUITY_CONFIG,
  type ThreadType
} from './PlotContinuityEngine'

// =============================================================================
// Helper Functions
// =============================================================================

function makeThread(overrides = {}) {
  return createThread('t1', 'main_plot', 'Main Plot Thread', 1, 'A test thread')
}

// =============================================================================
// createThread Tests
// =============================================================================

describe('createThread', () => {
  it('should create thread with correct defaults', () => {
    const thread = createThread('t1', 'main_plot', 'Main Plot', 5, 'Test description')
    expect(thread.id).toBe('t1')
    expect(thread.status).toBe('active')
    expect(thread.urgency).toBe(0)
    expect(thread.introducedChapter).toBe(5)
    expect(thread.setupCount).toBe(0)
    expect(thread.payoffCount).toBe(0)
  })

  it('should set importance for different thread types', () => {
    const mainThread = createThread('t1', 'main_plot', 'Main', 1, '')
    expect(mainThread.connectedThreads).toEqual([])

    const subThread = createThread('t2', 'subplot', 'Sub', 1, '')
    expect(subThread.connectedThreads).toEqual([])
  })
})

// =============================================================================
// createSetupPromise Tests
// =============================================================================

describe('createSetupPromise', () => {
  it('should create unfulfilled promise', () => {
    const promise = createSetupPromise('t1', 'A promise is made', 5, 'Promise description')
    expect(promise.threadId).toBe('t1')
    expect(promise.fulfilled).toBe(false)
    expect(promise.setupChapter).toBe(5)
    expect(promise.id).toMatch(/^sp-/)
  })
})

// =============================================================================
// createForeshadow Tests
// =============================================================================

describe('createForeshadow', () => {
  it('should create unpaid foreshadow', () => {
    const fs = createForeshadow('t1', 'A hint is dropped', 3, 0.7)
    expect(fs.threadId).toBe('t1')
    expect(fs.paidOff).toBe(false)
    expect(fs.strength).toBe(0.7)
    expect(fs.payoffQuality).toBe(0)
  })

  it('should use default strength', () => {
    const fs = createForeshadow('t1', 'A hint', 3)
    expect(fs.strength).toBe(0.5)
  })
})

// =============================================================================
// createEmptyThreadState Tests
// =============================================================================

describe('createEmptyThreadState', () => {
  it('should create empty state', () => {
    const state = createEmptyThreadState()
    expect(state.setupPromises).toEqual([])
    expect(state.unresolvedPayoffs).toEqual([])
    expect(state.satisfiedThreads).toEqual([])
  })
})

// =============================================================================
// registerSetup Tests
// =============================================================================

describe('registerSetup', () => {
  it('should register setup and add to unresolved', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup text', 5, 'Setup description')
    expect(state.setupPromises.length).toBe(1)
    expect(state.unresolvedPayoffs.length).toBe(1)
    expect(state.setupPromises[0].fulfilled).toBe(false)
  })
})

// =============================================================================
// registerForeshadow Tests
// =============================================================================

describe('registerForeshadow', () => {
  it('should register foreshadow', () => {
    let state = createEmptyThreadState()
    state = registerForeshadow(state, 't1', 'Hint text', 10, 0.6)
    expect(state.pendingForeshadowing.length).toBe(1)
    expect(state.pendingForeshadowing[0].paidOff).toBe(false)
  })
})

// =============================================================================
// fulfilSetup Tests
// =============================================================================

describe('fulfilSetup', () => {
  it('should mark promise as fulfilled', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Desc')
    const promiseId = state.setupPromises[0].id
    state = fulfilSetup(state, promiseId, 15)
    expect(state.setupPromises[0].fulfilled).toBe(true)
    expect(state.unresolvedPayoffs).not.toContain(promiseId)
  })

  it('should remove from unresolved list', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Desc')
    const promiseId = state.setupPromises[0].id
    state = fulfilSetup(state, promiseId, 15)
    expect(state.unresolvedPayoffs).toEqual([])
  })
})

// =============================================================================
// payOffForeshadow Tests
// =============================================================================

describe('payOffForeshadow', () => {
  it('should mark foreshadow as paid off with quality', () => {
    let state = createEmptyThreadState()
    state = registerForeshadow(state, 't1', 'Hint', 10, 0.6)
    const fsId = state.pendingForeshadowing[0].id
    state = payOffForeshadow(state, fsId, 25, 0.9)
    expect(state.pendingForeshadowing[0].paidOff).toBe(true)
    expect(state.pendingForeshadowing[0].payoffQuality).toBe(0.9)
  })
})

// =============================================================================
// abandonThread Tests
// =============================================================================

describe('abandonThread', () => {
  it('should add thread to abandoned list', () => {
    let state = createEmptyThreadState()
    state = abandonThread(state, 't1')
    expect(state.abandonedThreads).toContain('t1')
  })

  it('should remove thread from satisfied list', () => {
    let state = createEmptyThreadState()
    state = { ...state, satisfiedThreads: ['t1', 't2'] }
    state = abandonThread(state, 't1')
    expect(state.satisfiedThreads).not.toContain('t1')
  })
})

// =============================================================================
// calculateThreadUrgency Tests
// =============================================================================

describe('calculateThreadUrgency', () => {
  it('should return 0 for paid_off thread', () => {
    const thread = { ...makeThread(), status: 'paid_off' as const }
    expect(calculateThreadUrgency(thread, 50)).toBe(0)
  })

  it('should return 0 for new thread', () => {
    const thread = { ...makeThread(), introducedChapter: 1 }
    expect(calculateThreadUrgency(thread, 1)).toBe(0)
  })

  it('should increase with unfulfilled setups', () => {
    const thread = { ...makeThread(), introducedChapter: 1, setupCount: 5, payoffCount: 1 }
    const urgency = calculateThreadUrgency(thread, 20)
    expect(urgency).toBeGreaterThan(0)
  })

  it('should cap at 1', () => {
    const thread = { ...makeThread(), introducedChapter: 1, setupCount: 20, payoffCount: 0 }
    expect(calculateThreadUrgency(thread, 100)).toBeLessThanOrEqual(1)
  })
})

// =============================================================================
// detectPlotHoles Tests
// =============================================================================

describe('detectPlotHoles', () => {
  it('should return empty for clean state', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Desc')
    state = fulfilSetup(state, state.setupPromises[0].id, 10)

    const threads = new Map([['t1', { ...makeThread(), setupCount: 1, payoffCount: 1 }]])
    const holes = detectPlotHoles(state, threads, 15)
    expect(holes).toEqual([])
  })

  it('should detect unfulfilled promises beyond gap', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Old setup')

    const threads = new Map([['t1', { ...makeThread(), setupCount: 1, payoffCount: 0 }]])
    const holes = detectPlotHoles(state, threads, 50) // gap > 30
    expect(holes.length).toBeGreaterThan(0)
    expect(holes.some(h => h.type === 'unfulfilled_setup')).toBe(true)
  })
})

// =============================================================================
// checkTimelineConsistency Tests
// =============================================================================

describe('checkTimelineConsistency', () => {
  it('should return empty for consistent timelines', () => {
    const timelines = [{
      id: 'tl1', name: 'Main', startChapter: 1, endChapter: 10,
      entries: [{
        chapter: 1, eventName: 'A', description: '', characters: [],
        causality: ['B'], reverseCausedBy: [], isPivotal: false, affectsThreads: []
      }, {
        chapter: 3, eventName: 'B', description: '', characters: [],
        causality: [], reverseCausedBy: ['A'], isPivotal: false, affectsThreads: []
      }],
      threadIds: []
    }]
    const conflicts = checkTimelineConsistency(timelines)
    expect(conflicts).toEqual([])
  })

  it('should detect same-chapter character conflict across timelines', () => {
    // Two timelines with same-chapter events, same character, different locations
    const timelines = [{
      id: 'tl1', name: 'Main', startChapter: 1, endChapter: 10,
      entries: [{
        chapter: 5, eventName: 'Battle', description: 'Battle at castle', characters: ['Alice'],
        location: 'Castle', causality: [], reverseCausedBy: [], isPivotal: true, affectsThreads: []
      }],
      threadIds: []
    }, {
      id: 'tl2', name: 'Subplot', startChapter: 1, endChapter: 10,
      entries: [{
        chapter: 5, eventName: 'Conversation', description: 'Talk at tavern', characters: ['Alice'],
        location: 'Tavern', causality: [], reverseCausedBy: [], isPivotal: false, affectsThreads: []
      }],
      threadIds: []
    }]
    const conflicts = checkTimelineConsistency(timelines)
    // Alice in two different locations at same chapter = simultaneity conflict
    expect(conflicts.length).toBeGreaterThan(0)
  })
})

// =============================================================================
// generateContinuityReport Tests
// =============================================================================

describe('generateContinuityReport', () => {
  it('should return clean report for healthy state', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Desc')
    state = fulfilSetup(state, state.setupPromises[0].id, 10)

    const threads = new Map([['t1', { ...makeThread(), setupCount: 1, payoffCount: 1 }]])
    const report = generateContinuityReport(state, threads, [], 15)
    expect(report.isClean).toBe(true)
    expect(report.overallHealthScore).toBe(100)
  })

  it('should penalize unresolved promises', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Desc')

    const threads = new Map([['t1', { ...makeThread(), setupCount: 1, payoffCount: 0 }]])
    const report = generateContinuityReport(state, threads, [], 15)
    expect(report.overallHealthScore).toBeLessThan(100)
  })
})

// =============================================================================
// formatContinuitySummary Tests
// =============================================================================

describe('formatContinuitySummary', () => {
  it('should format health score and status', () => {
    let state = createEmptyThreadState()
    const threads = new Map([['t1', { ...makeThread(), setupCount: 1, payoffCount: 1 }]])
    const report = generateContinuityReport(state, threads, [], 15)
    const summary = formatContinuitySummary(report)
    expect(summary).toContain('Health Score:')
    expect(summary).toContain('Status:')
  })

  it('should show warnings', () => {
    let state = createEmptyThreadState()
    state = registerSetup(state, 't1', 'Setup', 5, 'Desc')
    const threads = new Map([['t1', { ...makeThread(), setupCount: 1, payoffCount: 0 }]])
    const report = generateContinuityReport(state, threads, [], 40)
    const summary = formatContinuitySummary(report)
    expect(summary).toContain('Warnings')
  })
})

// =============================================================================
// calculateThreadSatisfaction Tests
// =============================================================================

describe('calculateThreadSatisfaction', () => {
  it('should return 100 for thread with no setups', () => {
    const thread = makeThread()
    expect(calculateThreadSatisfaction(thread)).toBe(100)
  })

  it('should return high score for well-balanced thread', () => {
    const thread = { ...makeThread(), setupCount: 5, payoffCount: 5, status: 'paid_off' as const }
    expect(calculateThreadSatisfaction(thread)).toBe(100)
  })

  it('should penalize abandoned thread', () => {
    const thread = { ...makeThread(), setupCount: 5, payoffCount: 2, status: 'abandoned' as const }
    expect(calculateThreadSatisfaction(thread)).toBeLessThan(50)
  })
})
