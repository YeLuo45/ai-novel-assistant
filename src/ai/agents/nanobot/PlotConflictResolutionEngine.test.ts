/**
 * PlotConflictResolutionEngine Tests — V528
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  introduceConflict,
  escalateConflict,
  deEscalateConflict,
  resolveConflict,
  updateGlobalTension,
  calculateResolutionPacing,
  findClimaxPoint,
  getConflictById,
  getConflictsByType,
  getActiveConflicts,
  getPlotSummary
} from './PlotConflictResolutionEngine'

describe('PlotConflictResolutionEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.conflicts).toEqual({})
      expect(state.activeConflicts).toEqual([])
      expect(state.resolvedConflicts).toEqual([])
      expect(state.globalTension).toEqual([])
    })
  })

  describe('introduceConflict', () => {
    it('should add conflict', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['protagonist'], 'fear of failure', 50, 'accept weakness')
      expect(getConflictById(state, 'c1')).not.toBeNull()
      expect(state.activeConflicts).toContain('c1')
    })

    it('should not duplicate', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['A'], 's1', 40, 'r1')
      state = introduceConflict(state, 'c1', 'external', ['B'], 's2', 80, 'r2')
      const c = getConflictById(state, 'c1')
      expect(c?.initialIntensity).toBe(40)
    })
  })

  describe('escalateConflict', () => {
    it('should escalate intensity', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'relational', ['A', 'B'], 'misunderstanding', 30, 'honest conversation')
      state = escalateConflict(state, 'c1', 5, 'A discovers B secret', 25)
      const c = getConflictById(state, 'c1')
      expect(c?.currentIntensity).toBe(55)
      expect(c?.turningPoints).toHaveLength(1)
    })
  })

  describe('deEscalateConflict', () => {
    it('should decrease intensity', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'relational', ['A', 'B'], 'misunderstanding', 60, 'talk')
      state = deEscalateConflict(state, 'c1', 7, 'B apologizes', 20)
      const c = getConflictById(state, 'c1')
      expect(c?.currentIntensity).toBe(40)
    })
  })

  describe('resolveConflict', () => {
    it('should mark resolved', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['protagonist'], 'identity crisis', 70, 'self-acceptance')
      state = resolveConflict(state, 'c1', 15)
      expect(state.resolvedConflicts).toContain('c1')
      expect(state.activeConflicts).not.toContain('c1')
      expect(getConflictById(state, 'c1')?.currentIntensity).toBe(0)
    })
  })

  describe('updateGlobalTension', () => {
    it('should calculate avg tension from active conflicts', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'external', ['A', 'B'], 'war', 80, 'treaty')
      state = introduceConflict(state, 'c2', 'internal', ['A'], 'guilt', 40, 'forgiveness')
      state = updateGlobalTension(state, 10)
      expect(state.globalTension[10]).toBe(60)  // (80+40)/2
    })

    it('should detect climax', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'external', ['A', 'B'], 'war', 50, 'peace')
      state = updateGlobalTension(state, 5)
      state = escalateConflict(state, 'c1', 10, 'final battle', 40)
      state = updateGlobalTension(state, 10)
      expect(state.climaxChapter).toBe(10)
    })
  })

  describe('calculateResolutionPacing', () => {
    it('should detect rushed resolution', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'relational', ['A', 'B'], 'misunderstanding', 80, 'talk')
      state = introduceConflict(state, 'c2', 'internal', ['A'], 'guilt', 80, 'forgive')
      state = updateGlobalTension(state, 1)
      state = updateGlobalTension(state, 2)
      state = resolveConflict(state, 'c1', 3)
      state = resolveConflict(state, 'c2', 3)
      state = calculateResolutionPacing(state)
      expect(state.resolutionPacing).toBe('rushed')
    })
  })

  describe('findClimaxPoint', () => {
    it('should find highest tension chapter', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'external', ['A', 'B'], 'war', 50, 'peace')
      state = updateGlobalTension(state, 1)
      state = escalateConflict(state, 'c1', 5, 'battle', 45)
      state = updateGlobalTension(state, 5)
      const climax = findClimaxPoint(state)
      expect(climax).toBe(5)
    })

    it('should return null for empty tension', () => {
      const state = createEmptyState()
      expect(findClimaxPoint(state)).toBeNull()
    })
  })

  describe('getConflictsByType', () => {
    it('should filter by type', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['A'], 'identity', 50, 'accept')
      state = introduceConflict(state, 'c2', 'external', ['A', 'B'], 'war', 70, 'peace')
      const internal = getConflictsByType(state, 'internal')
      expect(internal).toHaveLength(1)
      expect(internal[0].id).toBe('c1')
    })
  })

  describe('getActiveConflicts', () => {
    it('should return active conflict nodes', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['A'], 'identity', 50, 'accept')
      state = introduceConflict(state, 'c2', 'external', ['A', 'B'], 'war', 70, 'peace')
      state = resolveConflict(state, 'c1', 5)
      const active = getActiveConflicts(state)
      expect(active).toHaveLength(1)
      expect(active[0].id).toBe('c2')
    })
  })

  describe('getPlotSummary', () => {
    it('should compute summary', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['A'], 'identity', 50, 'accept')
      state = introduceConflict(state, 'c2', 'external', ['A', 'B'], 'war', 70, 'peace')
      state = resolveConflict(state, 'c1', 10)
      state = updateGlobalTension(state, 10)
      const summary = getPlotSummary(state)
      expect(summary.totalConflicts).toBe(2)
      expect(summary.activeConflicts).toBe(1)
      expect(summary.resolvedConflicts).toBe(1)
      expect(summary.avgTension).toBe(70)
    })

    it('should return zeros when no conflicts', () => {
      const state = createEmptyState()
      const summary = getPlotSummary(state)
      expect(summary.totalConflicts).toBe(0)
      expect(summary.avgTension).toBe(0)
    })
  })

  describe('introduceConflict with different types', () => {
    it('should handle relational conflict', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'relational', ['A', 'B'], 'love triangle', 65, 'choose one')
      const c = getConflictById(state, 'c1')
      expect(c?.type).toBe('relational')
      expect(c?.parties).toHaveLength(2)
    })

    it('should handle societal conflict', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'societal', ['protagonist', 'system'], 'oppression', 80, 'overthrow')
      expect(state.conflicts.c1).toBeDefined()
    })
  })

  describe('multiple conflicts tension calculation', () => {
    it('should handle 3 active conflicts', () => {
      let state = createEmptyState()
      state = introduceConflict(state, 'c1', 'internal', ['A'], 'identity', 40, 'accept')
      state = introduceConflict(state, 'c2', 'external', ['A', 'B'], 'war', 60, 'peace')
      state = introduceConflict(state, 'c3', 'relational', ['A', 'C'], 'betrayal', 80, 'forgive')
      state = updateGlobalTension(state, 5)
      expect(state.globalTension[5]).toBe(60)  // (40+60+80)/3
    })
  })
})