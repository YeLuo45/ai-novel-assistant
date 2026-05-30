/**
 * StateSync.test.ts - 状态同步测试
 * V41 多Agent协作系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StateSync, SharedState, Review } from '../StateSync'
import { PlotPoint } from '../PlotAgent'
import { Character } from '../CharacterAgent'

describe('StateSync', () => {
  let stateSync: StateSync

  describe('constructor', () => {
    it('should initialize with default state', () => {
      stateSync = new StateSync()
      const state = stateSync.getSharedState()

      expect(state.plotOutline).toEqual([])
      expect(state.characters).toEqual([])
      expect(state.currentChapter).toBe(1)
      expect(state.pendingReviews).toEqual([])
    })

    it('should accept initial state', () => {
      const initialState: Partial<SharedState> = {
        currentChapter: 5,
        plotOutline: [{ id: 'p1', title: 'Test', description: 'Test plot' }]
      }

      stateSync = new StateSync(initialState)
      const state = stateSync.getSharedState()

      expect(state.currentChapter).toBe(5)
      expect(state.plotOutline.length).toBe(1)
    })
  })

  describe('updateState', () => {
    it('should update plotOutline', () => {
      stateSync = new StateSync()
      const plotPoints: PlotPoint[] = [
        { id: 'p1', title: 'Point 1', description: 'First point' }
      ]

      stateSync.updateState({ plotOutline: plotPoints })

      const state = stateSync.getSharedState()
      expect(state.plotOutline.length).toBe(1)
    })

    it('should update characters', () => {
      stateSync = new StateSync()
      const characters: Character[] = [
        { id: 'c1', name: 'Test', role: 'protagonist', description: 'Test char', personality: [], relationships: {} }
      ]

      stateSync.updateState({ characters })

      const state = stateSync.getSharedState()
      expect(state.characters.length).toBe(1)
    })

    it('should update currentChapter', () => {
      stateSync = new StateSync()

      stateSync.updateState({ currentChapter: 10 })

      const state = stateSync.getSharedState()
      expect(state.currentChapter).toBe(10)
    })

    it('should update pendingReviews', () => {
      stateSync = new StateSync()
      const reviews: Review[] = [
        { id: 'r1', timestamp: Date.now(), score: 85, approved: true }
      ]

      stateSync.updateState({ pendingReviews: reviews })

      const state = stateSync.getSharedState()
      expect(state.pendingReviews.length).toBe(1)
    })
  })

  describe('addPlotPoint', () => {
    it('should add plot point to outline', () => {
      stateSync = new StateSync()
      const plotPoint: PlotPoint = { id: 'p1', title: 'New Point', description: 'A new point' }

      stateSync.addPlotPoint(plotPoint)

      const state = stateSync.getSharedState()
      expect(state.plotOutline.length).toBe(1)
      expect(state.plotOutline[0].id).toBe('p1')
    })
  })

  describe('addCharacter', () => {
    it('should add character', () => {
      stateSync = new StateSync()
      const character: Character = {
        id: 'c1',
        name: 'Hero',
        role: 'protagonist',
        description: 'Main character',
        personality: ['brave'],
        relationships: {}
      }

      stateSync.addCharacter(character)

      const state = stateSync.getSharedState()
      expect(state.characters.length).toBe(1)
    })
  })

  describe('addPendingReview', () => {
    it('should add pending review', () => {
      stateSync = new StateSync()
      const review: Review = { id: 'r1', timestamp: Date.now(), score: 90, approved: true }

      stateSync.addPendingReview(review)

      const state = stateSync.getSharedState()
      expect(state.pendingReviews.length).toBe(1)
    })
  })

  describe('advanceChapter', () => {
    it('should increment current chapter', () => {
      stateSync = new StateSync({ currentChapter: 1 })

      stateSync.advanceChapter()

      const state = stateSync.getSharedState()
      expect(state.currentChapter).toBe(2)
    })
  })

  describe('setCurrentChapter', () => {
    it('should set specific chapter', () => {
      stateSync = new StateSync()

      stateSync.setCurrentChapter(5)

      const state = stateSync.getSharedState()
      expect(state.currentChapter).toBe(5)
    })
  })

  describe('clearPendingReviews', () => {
    it('should clear all pending reviews', () => {
      stateSync = new StateSync({
        pendingReviews: [{ id: 'r1', timestamp: Date.now(), score: 80, approved: true }]
      })

      stateSync.clearPendingReviews()

      const state = stateSync.getSharedState()
      expect(state.pendingReviews.length).toBe(0)
    })
  })

  describe('watchChanges', () => {
    it('should notify watcher on state change', () => {
      stateSync = new StateSync()
      let notificationCount = 0

      stateSync.watchChanges(() => {
        notificationCount++
      })

      stateSync.addPlotPoint({ id: 'p1', title: 'Test', description: 'Test' })

      expect(notificationCount).toBe(1)
    })

    it('should return unsubscribe function', () => {
      stateSync = new StateSync()
      let notificationCount = 0

      const unsubscribe = stateSync.watchChanges(() => {
        notificationCount++
      })

      unsubscribe()
      stateSync.addPlotPoint({ id: 'p1', title: 'Test', description: 'Test' })

      expect(notificationCount).toBe(0)
    })

    it('should handle multiple watchers', () => {
      stateSync = new StateSync()
      let count1 = 0
      let count2 = 0

      stateSync.watchChanges(() => count1++)
      stateSync.watchChanges(() => count2++)

      stateSync.addPlotPoint({ id: 'p1', title: 'Test', description: 'Test' })

      expect(count1).toBe(1)
      expect(count2).toBe(1)
    })
  })

  describe('clearWatchers', () => {
    it('should clear all watchers', () => {
      stateSync = new StateSync()
      let count = 0

      stateSync.watchChanges(() => count++)
      stateSync.watchChanges(() => count++)

      stateSync.clearWatchers()
      stateSync.addPlotPoint({ id: 'p1', title: 'Test', description: 'Test' })

      expect(count).toBe(0)
    })
  })

  describe('reset', () => {
    it('should reset to default state', () => {
      stateSync = new StateSync({
        currentChapter: 10,
        plotOutline: [{ id: 'p1', title: 'Point', description: 'A point' }],
        characters: [{ id: 'c1', name: 'Test', role: 'protagonist', description: 'desc', personality: [], relationships: {} }],
        pendingReviews: [{ id: 'r1', timestamp: Date.now(), score: 90, approved: true }]
      })

      stateSync.reset()

      const state = stateSync.getSharedState()
      expect(state.currentChapter).toBe(1)
      expect(state.plotOutline.length).toBe(0)
      expect(state.characters.length).toBe(0)
      expect(state.pendingReviews.length).toBe(0)
    })
  })

  describe('snapshot', () => {
    it('should return state with timestamp', () => {
      stateSync = new StateSync({ currentChapter: 3 })

      const snapshot = stateSync.snapshot()

      expect(snapshot.state.currentChapter).toBe(3)
      expect(snapshot.timestamp).toBeDefined()
      expect(typeof snapshot.timestamp).toBe('number')
    })
  })
})
