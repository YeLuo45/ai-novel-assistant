/**
 * MultiAgentCritiqueRouterEngine Tests — V516
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  submitForCritique,
  routeToDimension,
  executeCritique,
  getPipelineStatus,
  getDimensionLeaderboard,
  getCritiqueHistory,
  getOverallStats,
  getPendingRequests
} from './MultiAgentCritiqueRouterEngine'

describe('MultiAgentCritiqueRouterEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.pipelines).toEqual({})
      expect(state.critiqueHistory).toEqual({})
      expect(state.totalProcessed).toBe(0)
      expect(state.avgOverallScore).toBe(50)
    })

    it('should have all dimension stats', () => {
      const state = createEmptyState()
      expect(state.dimensionStats.plot).toBeDefined()
      expect(state.dimensionStats.dialogue).toBeDefined()
      expect(state.dimensionStats.style).toBeDefined()
      expect(state.dimensionStats.emotion).toBeDefined()
      expect(state.dimensionStats.continuity).toBeDefined()
    })
  })

  describe('submitForCritique', () => {
    it('should submit text for critique', () => {
      let state = createEmptyState()
      const result = submitForCritique(state, 'Hero walked into the castle', 1, 50, ['plot', 'dialogue'], 3)
      state = result.state
      expect(result.requestId).toMatch(/^crit_/)
      expect(state.pendingQueue).toContain(result.requestId)
    })

    it('should create new pipeline for chapter', () => {
      let state = createEmptyState()
      const { state: newState } = submitForCritique(state, 'Test text', 5, 30)
      expect(newState.pipelines['pipeline_5']).toBeDefined()
      expect(newState.pipelines['pipeline_5'].chapterNumber).toBe(5)
    })

    it('should prioritize high-priority requests', () => {
      let state = createEmptyState()
      const r1 = submitForCritique(state, 'Normal priority', 1, 50, ['plot'], 3)
      state = r1.state
      const r2 = submitForCritique(state, 'High priority', 1, 50, ['plot'], 5)
      state = r2.state
      expect(state.pipelines['pipeline_1'].queueOrder[0]).toBe(r2.requestId)
    })

    it('should clamp priority', () => {
      let state = createEmptyState()
      const result = submitForCritique(state, 'Test', 1, 50, ['plot'], 10)
      const request = result.state.pipelines['pipeline_1'].requests[0]
      expect(request.priority).toBe(5)
    })
  })

  describe('routeToDimension', () => {
    it('should route to requested dimension', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Test', 1, 50, ['plot', 'dialogue'])
      state = s1
      state = routeToDimension(state, requestId, 'pipeline_1', 'plot')
      expect(state.pipelines['pipeline_1'].activeDimensions).toContain('plot')
    })

    it('should not route to non-requested dimension', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Test', 1, 50, ['plot'])
      state = s1
      state = routeToDimension(state, requestId, 'pipeline_1', 'dialogue')
      expect(state.pipelines['pipeline_1'].activeDimensions).not.toContain('dialogue')
    })
  })

  describe('executeCritique', () => {
    it('should execute critique and populate response', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Hero entered the dark castle. He felt afraid. "Who is there?" he asked.', 1, 50, ['plot', 'dialogue', 'style', 'emotion', 'continuity'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')

      const response = state.critiqueHistory[requestId]
      expect(response).toBeDefined()
      expect(response.overallScore).toBeGreaterThan(0)
      expect(response.criticalIssues).toBeDefined()
      expect(response.recommendations).toBeDefined()
      expect(Object.keys(response.dimensions).length).toBe(5)
    })

    it('should calculate dimension scores', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Short text.', 1, 50, ['plot', 'dialogue'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')

      const response = state.critiqueHistory[requestId]
      expect(response.dimensions.plot.score).toBeGreaterThan(0)
      expect(response.dimensions.dialogue.score).toBeGreaterThan(0)
    })

    it('should remove from pending queue after execution', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Test passage for critique', 1, 50, ['plot'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')
      expect(state.pendingQueue).not.toContain(requestId)
    })

    it('should update dimension stats', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Hero stood there. He looked around. She smiled.', 1, 50, ['plot', 'dialogue', 'style', 'emotion', 'continuity'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')
      expect(state.dimensionStats.plot.total).toBe(1)
      expect(state.totalProcessed).toBe(1)
    })
  })

  describe('getPipelineStatus', () => {
    it('should return pipeline status', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Test', 1, 50, ['plot'])
      state = s1
      const status = getPipelineStatus(state, 'pipeline_1')
      expect(status).not.toBeNull()
      expect(status!.totalRequests).toBe(1)
      expect(status!.pending).toBe(1)
    })

    it('should return null for unknown pipeline', () => {
      const state = createEmptyState()
      expect(getPipelineStatus(state, 'unknown')).toBeNull()
    })

    it('should update after execution', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Hero walked. He spoke.', 1, 50, ['plot'])
      state = executeCritique(s1, requestId, 'pipeline_1')
      const status = getPipelineStatus(state, 'pipeline_1')
      expect(status!.completed).toBe(1)
      expect(status!.pending).toBe(0)
    })
  })

  describe('getDimensionLeaderboard', () => {
    it('should rank dimensions by avg score', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'A long passage with lots of text that goes on and on to test the plot dimension scoring.', 1, 50, ['plot', 'dialogue'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')
      const leaderboard = getDimensionLeaderboard(state)
      expect(leaderboard.length).toBe(5)
      expect(leaderboard[0].avgScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getCritiqueHistory', () => {
    it('should return recent critiques', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'First critique text', 1, 50, ['plot'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')
      const history = getCritiqueHistory(state, 5)
      expect(history.length).toBe(1)
    })
  })

  describe('getOverallStats', () => {
    it('should compute comprehensive stats', () => {
      let state = createEmptyState()
      const { state: s1, requestId } = submitForCritique(state, 'Hero entered. He looked around carefully. The wind howled.', 1, 50, ['plot', 'dialogue', 'style', 'emotion', 'continuity'])
      state = s1
      state = executeCritique(state, requestId, 'pipeline_1')
      const stats = getOverallStats(state)
      expect(stats.totalProcessed).toBe(1)
      expect(stats.avgOverallScore).toBeGreaterThan(0)
      expect(stats.dimensionLeaderboard.length).toBe(5)
    })
  })

  describe('getPendingRequests', () => {
    it('should return pending requests', () => {
      let state = createEmptyState()
      const { state: s1 } = submitForCritique(state, 'Pending text', 1, 50, ['plot'])
      state = s1
      const pending = getPendingRequests(state)
      expect(pending.length).toBe(1)
    })

    it('should return empty when none pending', () => {
      const state = createEmptyState()
      expect(getPendingRequests(state)).toEqual([])
    })
  })
})