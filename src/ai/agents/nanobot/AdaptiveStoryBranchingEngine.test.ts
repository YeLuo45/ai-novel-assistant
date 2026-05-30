/**
 * AdaptiveStoryBranchingEngine Tests — V534
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  initializeStory,
  addSceneNode,
  addChoiceNode,
  executeChoice,
  backtrack,
  getCurrentScene,
  getSceneById,
  getStoryStateSummary,
  evaluateCondition,
  calculatePathSimilarity,
  getNodeAtDepth,
  findNearestCommonAncestor
} from './AdaptiveStoryBranchingEngine'

describe('AdaptiveStoryBranchingEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.nodes).toEqual({})
      expect(state.currentNodeId).toBeNull()
      expect(state.storyMetadata.storyId).toBe('')
    })
  })

  describe('initializeStory', () => {
    it('should create start node', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'My Story', 'start', 'linear')
      expect(getCurrentScene(state)?.id).toBe('start')
      expect(getCurrentScene(state)?.title).toBe('My Story')
    })
    it('should track visited nodes', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 's1', 'branching')
      expect(state.storyMetadata.visitedNodes).toContain('s1')
      expect(state.storyMetadata.currentPathLength).toBe(1)
    })
  })

  describe('addSceneNode', () => {
    it('should add node', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = addSceneNode(state, 'scene2', 'Chapter 2', 'Content here', 2, 'start')
      expect(Object.keys(state.nodes)).toHaveLength(2)
    })
    it('should update parent childIds', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = addSceneNode(state, 'scene2', 'Chapter 2', 'Content', 2, 'start')
      expect(state.nodes['start'].childNodeIds).toContain('scene2')
    })
    it('should not duplicate', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = addSceneNode(state, 'start', 'Duplicate', 'Content', 1, null)
      expect(getCurrentScene(state)?.title).toBe('Test')
    })
  })

  describe('addChoiceNode', () => {
    it('should add choice', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'branching')
      state = addSceneNode(state, 'scene2', 'Scene 2', 'Content', 2, 'start')
      state = addChoiceNode(state, 'c1', 'Go to scene 2', 'start', 'scene2')
      expect(getSceneById(state, 'start')?.choices).toHaveLength(1)
    })
    it('should track total choices', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'branching')
      state = addSceneNode(state, 's2', 'S2', 'C', 2, 'start')
      state = addChoiceNode(state, 'c1', 'Choice 1', 'start', 's2')
      expect(state.storyMetadata.totalChoices).toBe(1)
    })
  })

  describe('executeChoice', () => {
    it('should navigate to target', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = addSceneNode(state, 'end', 'The End', ' Finale', 3, 'start')
      state = addChoiceNode(state, 'finish', 'Finish story', 'start', 'end')
      state = executeChoice(state, 'start', 'finish')
      expect(getCurrentScene(state)?.id).toBe('end')
    })
    it('should not navigate for invalid choice', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = executeChoice(state, 'start', 'nonexistent')
      expect(getCurrentScene(state)?.id).toBe('start')
    })
  })

  describe('evaluateCondition', () => {
    it('should evaluate simple condition', () => {
      const result = evaluateCondition('health > 50', { health: 75 })
      expect(result).toBe(true)
    })
    it('should return true for empty condition', () => {
      expect(evaluateCondition('', {})).toBe(true)
      expect(evaluateCondition('  ', {})).toBe(true)
    })
    it('should handle boolean variables', () => {
      expect(evaluateCondition('isAlive && hasKey', { isAlive: true, hasKey: true })).toBe(true)
    })
    it('should return true on error', () => {
      expect(evaluateCondition('invalid ++ syntax', {})).toBe(true)
    })
  })

  describe('backtrack', () => {
    it('should go back steps', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 's1', 'linear')
      state = addSceneNode(state, 's2', 'S2', 'C', 2, 's1')
      state = addChoiceNode(state, 'c1', 'Next', 's1', 's2')
      state = executeChoice(state, 's1', 'c1')
      state = backtrack(state, 1)
      expect(getCurrentScene(state)?.id).toBe('s1')
    })
    it('should increment backtrack count', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 's1', 'linear')
      state = addSceneNode(state, 's2', 'S2', 'C', 2, 's1')
      state = addChoiceNode(state, 'c1', 'Next', 's1', 's2')
      state = executeChoice(state, 's1', 'c1')
      state = backtrack(state, 1)
      expect(state.storyMetadata.backtrackCount).toBe(1)
    })
  })

  describe('getStoryStateSummary', () => {
    it('should return summary', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Epic Tale', 'start', 'branching')
      const summary = getStoryStateSummary(state)
      expect(summary.storyTitle).toBe('Epic Tale')
      expect(summary.mode).toBe('branching')
      expect(summary.currentPathLength).toBe(1)
    })
  })

  describe('calculatePathSimilarity', () => {
    it('should calculate similarity', () => {
      const similarity = calculatePathSimilarity(['a', 'b', 'c'], ['a', 'b', 'd'])
      expect(similarity).toBeGreaterThan(0)
    })
    it('should return 0 for empty paths', () => {
      expect(calculatePathSimilarity([], ['a'])).toBe(0)
    })
    it('should return 100 for identical paths', () => {
      expect(calculatePathSimilarity(['a', 'b'], ['a', 'b'])).toBe(100)
    })
  })

  describe('getNodeAtDepth', () => {
    it('should return node at depth', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 's1', 'linear')
      state = addSceneNode(state, 's2', 'S2', 'C', 2, 's1')
      state = addChoiceNode(state, 'c1', 'Next', 's1', 's2')
      state = executeChoice(state, 's1', 'c1')
      const node = getNodeAtDepth(state, 0)
      expect(node?.id).toBe('s1')
    })
    it('should return null for invalid depth', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 's1', 'linear')
      expect(getNodeAtDepth(state, 99)).toBeNull()
      expect(getNodeAtDepth(state, -1)).toBeNull()
    })
  })

  describe('findNearestCommonAncestor', () => {
    it('should find ancestor', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'root', 'branching')
      state = addSceneNode(state, 'a', 'A', 'A content', 2, 'root')
      state = addSceneNode(state, 'b', 'B', 'B content', 2, 'root')
      state = addSceneNode(state, 'c', 'C', 'C content', 3, 'a')
      state = addSceneNode(state, 'd', 'D', 'D content', 3, 'b')
      const ancestor = findNearestCommonAncestor(state, 'c', 'd')
      expect(ancestor).toBe('root')
    })
    it('should return null when no common ancestor', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'T', 'n1', 'linear')
      state = addSceneNode(state, 'n2', 'N2', 'C', 2, 'n1')
      const ancestor = findNearestCommonAncestor(state, 'n1', 'n2')
      expect(ancestor).toBe('n1')
    })
  })

  describe('revisit tracking', () => {
    it('should track revisited nodes', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'branching')
      state = addSceneNode(state, 'middle', 'Middle', 'C', 2, 'start')
      state = addChoiceNode(state, 'c1', 'Go middle', 'start', 'middle')
      state = executeChoice(state, 'start', 'c1')
      state = backtrack(state, 1)
      state = addSceneNode(state, 'end', 'End', 'C', 3, 'start')
      state = addChoiceNode(state, 'c2', 'Go end', 'start', 'end')
      state = addChoiceNode(state, 'c3', 'Back to middle', 'end', 'middle')
      state = executeChoice(state, 'start', 'c2')
      state = executeChoice(state, 'end', 'c3')
      expect(state.storyMetadata.revisitedNodes).toContain('middle')
    })
  })

  describe('consequence variables', () => {
    it('should update variables from consequence', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = addSceneNode(state, 'end', 'End', 'C', 2, 'start')
      state = addChoiceNode(state, 'c1', 'Pick up key', 'start', 'end', undefined, 'hasKey = true;')
      state = executeChoice(state, 'start', 'c1')
      expect(state.variables['hasKey']).toBe(true)
    })

    it('should handle consequence with multiple assignments', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      state = addSceneNode(state, 'end', 'End', 'C', 2, 'start')
      state = addChoiceNode(state, 'c1', 'Action', 'start', 'end', undefined, 'score = 100; level = 2;')
      state = executeChoice(state, 'start', 'c1')
      expect(state.variables['score']).toBe(100)
      expect(state.variables['level']).toBe(2)
    })
  })

  describe('error paths', () => {
    it('executeChoice with no choices returns state', () => {
      let state = createEmptyState()
      state = initializeStory(state, 'Test', 'start', 'linear')
      const result = executeChoice(state, 'start', 'any')
      expect(result).toBe(state)
    })
    it('getSceneById returns null for unknown', () => {
      const state = createEmptyState()
      expect(getSceneById(state, 'unknown')).toBeNull()
    })
  })
})