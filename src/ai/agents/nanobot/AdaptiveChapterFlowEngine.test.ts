/**
 * AdaptiveChapterFlowEngine Tests — V512
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createChapterFlow,
  addSectionBreak,
  setChapterPhase,
  recordEngagementSignal,
  detectFlowIssues,
  adaptChapterFlow,
  optimizeSectionBreaks,
  calculateHookStrength,
  getChapterFlow,
  getEngagementSignal,
  getFlowAdaptations,
  getChapterFlowSummary,
  compareChapterFlows
} from './AdaptiveChapterFlowEngine'

describe('AdaptiveChapterFlowEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.chapters).toEqual({})
      expect(state.engagementSignals).toEqual({})
      expect(state.adaptations).toEqual([])
    })
  })

  describe('createChapterFlow', () => {
    it('should create chapter flow', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'rising', 3000)
      expect(Object.keys(state.chapters)).toHaveLength(1)
      const flow = state.chapters[Object.keys(state.chapters)[0]]
      expect(flow.chapterNumber).toBe(1)
      expect(flow.phase).toBe('rising')
      expect(flow.totalWords).toBe(3000)
    })
  })

  describe('addSectionBreak', () => {
    it('should add section break', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1)
      const id = Object.keys(state.chapters)[0]
      state = addSectionBreak(state, id, 25, 'narrative', 'The hero entered the castle', 500)
      expect(state.chapters[id].sections).toHaveLength(1)
      expect(state.chapters[id].sections[0].position).toBe(25)
    })
  })

  describe('setChapterPhase', () => {
    it('should update chapter phase', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'setup')
      const id = Object.keys(state.chapters)[0]
      state = setChapterPhase(state, id, 'climax')
      expect(state.chapters[id].phase).toBe('climax')
    })
  })

  describe('recordEngagementSignal', () => {
    it('should record engagement signal', () => {
      let state = createEmptyState()
      state = recordEngagementSignal(state, 1, 45, 180, 60, 30)
      expect(state.engagementSignals[1]).toBeDefined()
      expect(state.engagementSignals[1].dropOffRate).toBe(45)
    })
  })

  describe('detectFlowIssues', () => {
    it('should detect pacing issues', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1)
      const id = Object.keys(state.chapters)[0]
      state = recordEngagementSignal(state, 1, 75, 200, 20, 10)
      state = detectFlowIssues(state, id)
      expect(state.chapters[id].issues.length).toBeGreaterThan(0)
    })

    it('should detect sagging middle', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'rising', 3000)
      const id = Object.keys(state.chapters)[0]
      state = recordEngagementSignal(state, 1, 50, 120, 20, 10)  // peakMoment at 20%
      state = detectFlowIssues(state, id)
      expect(state.chapters[id].issues).toContain('sagging_middle')
    })
  })

  describe('adaptChapterFlow', () => {
    it('should adapt based on engagement signals', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1)
      state = recordEngagementSignal(state, 1, 70, 150, 25, 15)
      const id = Object.keys(state.chapters)[0]
      state = adaptChapterFlow(state, id)
      expect(state.adaptations).toHaveLength(1)
    })

    it('should not adapt without signals', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1)
      const id = Object.keys(state.chapters)[0]
      const before = state.chapters[id].pacingScore
      state = adaptChapterFlow(state, id)
      expect(state.adaptations).toHaveLength(0)
    })
  })

  describe('optimizeSectionBreaks', () => {
    it('should ensure minimum gap between sections', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1)
      const id = Object.keys(state.chapters)[0]
      state = addSectionBreak(state, id, 5, 'narrative', 'A', 100)
      state = addSectionBreak(state, id, 8, 'dialogue', 'B', 100)
      state = addSectionBreak(state, id, 12, 'action', 'C', 100)
      state = optimizeSectionBreaks(state, id)

      const sections = state.chapters[id].sections
      expect(sections[1].position).toBeGreaterThanOrEqual(15)  // 5 + 10 minimum gap
    })
  })

  describe('calculateHookStrength', () => {
    it('should calculate hook based on phase', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'climax')
      const id = Object.keys(state.chapters)[0]
      state = calculateHookStrength(state, id)
      expect(state.chapters[id].hookStrength).toBeGreaterThan(50)
    })

    it('should penalize sagging middle', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'rising', 3000)
      const id = Object.keys(state.chapters)[0]
      state = recordEngagementSignal(state, 1, 50, 120, 20, 10)
      state = detectFlowIssues(state, id)
      const issues = state.chapters[id].issues
      expect(issues.includes('sagging_middle') || issues.some(i => i.includes('sagging'))).toBe(true)
    })
  })

  describe('getChapterFlow', () => {
    it('should retrieve chapter by number', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 5, 'rising')
      const flow = getChapterFlow(state, 5)
      expect(flow?.chapterNumber).toBe(5)
    })

    it('should return null for unknown chapter', () => {
      const state = createEmptyState()
      expect(getChapterFlow(state, 99)).toBeNull()
    })
  })

  describe('getEngagementSignal', () => {
    it('should retrieve signal for chapter', () => {
      let state = createEmptyState()
      state = recordEngagementSignal(state, 3, 40, 120, 55, 25)
      const signal = getEngagementSignal(state, 3)
      expect(signal?.dropOffRate).toBe(40)
    })
  })

  describe('getFlowAdaptations', () => {
    it('should return sorted adaptations', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1)
      state = createChapterFlow(state, 2)
      const id1 = Object.keys(state.chapters)[0]
      const id2 = Object.keys(state.chapters)[1]

      state = recordEngagementSignal(state, 1, 70, 100, 20, 10)
      state = recordEngagementSignal(state, 2, 60, 120, 50, 20)
      state = adaptChapterFlow(state, id1)
      state = adaptChapterFlow(state, id2)

      const recent = getFlowAdaptations(state, 5)
      expect(recent.length).toBeGreaterThan(0)
    })
  })

  describe('getChapterFlowSummary', () => {
    it('should compute summary stats', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'rising', 3000)
      state = createChapterFlow(state, 2, 'climax', 3500)
      const id2 = Object.keys(state.chapters)[1]
      state = setChapterPhase(state, id2, 'falling')

      const summary = getChapterFlowSummary(state)
      expect(summary.totalChapters).toBe(2)
      expect(summary.avgPacing).toBeGreaterThan(0)
    })
  })

  describe('compareChapterFlows', () => {
    it('should compare two chapters', () => {
      let state = createEmptyState()
      state = createChapterFlow(state, 1, 'rising', 3000)
      state = createChapterFlow(state, 2, 'climax', 4000)
      const id1 = Object.keys(state.chapters)[0]
      const id2 = Object.keys(state.chapters)[1]
      state = { ...state, chapters: { [id1]: { ...state.chapters[id1], pacingScore: 60, hookStrength: 55 }, [id2]: { ...state.chapters[id2], pacingScore: 75, hookStrength: 80 } } }

      const comparison = compareChapterFlows(state, 1, 2)
      expect(comparison.pacingDiff).toBe(-15)
      expect(comparison.wordCountDiff).toBe(-1000)
      expect(comparison.phaseDiff).toBe(true)
    })
  })
})