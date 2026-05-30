/**
 * AdaptiveStoryBranchingEngine Tests — V498
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createNode,
  addChoice,
  createPath,
  setActivePath,
  navigateToNode,
  makeChoice,
  addCheckpoint,
  addConvergencePoint,
  getActivePath,
  getNodeById,
  getPathHistory,
  getAvailableChoices,
  findConvergentNode,
  getBacktrackOptions,
  backtrackToNode,
  getStoryProgress
} from './AdaptiveStoryBranchingEngine'

describe('AdaptiveStoryBranchingEngine', () => {
  describe('createEmptyState', () => {
    it('should create empty state', () => {
      const state = createEmptyState()
      expect(state.nodes).toEqual({})
      expect(state.paths).toEqual([])
      expect(state.activePathId).toBeNull()
      expect(state.checkpoints).toEqual([])
      expect(state.convergencePoints).toEqual({})
    })
  })

  describe('createNode', () => {
    it('should create a scene node', () => {
      let state = createEmptyState()
      state = createNode(state, 'The Beginning', 'Once upon a time...', 'scene', 1)
      expect(Object.keys(state.nodes)).toHaveLength(1)
      const node = state.nodes[Object.keys(state.nodes)[0]]
      expect(node.title).toBe('The Beginning')
      expect(node.type).toBe('scene')
      expect(node.chapterNumber).toBe(1)
    })

    it('should set parent-child relationship', () => {
      let state = createEmptyState()
      state = createNode(state, 'Start', 'Begin here', 'scene', 1)
      const parentId = Object.keys(state.nodes)[0]
      state = createNode(state, 'Next', 'Continue', 'scene', 1, parentId)
      expect(state.nodes[parentId].childNodeIds).toContain(Object.keys(state.nodes)[1])
    })
  })

  describe('addChoice', () => {
    it('should add choice to node', () => {
      let state = createEmptyState()
      state = createNode(state, 'Scene', 'Content', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = createNode(state, 'Branch A', 'Path A', 'scene', 1)
      const targetId = Object.keys(state.nodes)[1]
      state = addChoice(state, nodeId, 'Go left', targetId)
      expect(state.nodes[nodeId].choices).toHaveLength(1)
      expect(state.nodes[nodeId].choices[0].text).toBe('Go left')
    })
  })

  describe('createPath and setActivePath', () => {
    it('should create path for reader', () => {
      let state = createEmptyState()
      state = createPath(state, 'profile_1')
      expect(state.paths).toHaveLength(1)
      expect(state.activePathId).toBe(state.paths[0].id)
    })

    it('should switch active path', () => {
      let state = createEmptyState()
      state = createPath(state, 'profile_1')
      state = createPath(state, 'profile_2')
      const path2Id = state.paths[1].id
      state = setActivePath(state, path2Id)
      expect(state.activePathId).toBe(path2Id)
    })
  })

  describe('navigateToNode', () => {
    it('should add node to path', () => {
      let state = createEmptyState()
      state = createNode(state, 'Start', 'Begin', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = createPath(state, 'profile_1')
      const pathId = state.paths[0].id
      state = navigateToNode(state, pathId, nodeId)
      expect(state.paths[0].nodeIds).toContain(nodeId)
    })
  })

  describe('makeChoice', () => {
    it('should navigate via choice', () => {
      let state = createEmptyState()
      state = createNode(state, 'Start', 'Begin', 'scene', 1)
      const startId = Object.keys(state.nodes)[0]
      state = createNode(state, 'Left', 'Go left', 'scene', 1)
      const leftId = Object.keys(state.nodes)[1]
      state = addChoice(state, startId, 'Left', leftId)
      state = createPath(state, 'profile_1')
      const pathId = state.paths[0].id
      state = navigateToNode(state, pathId, startId)
      const choiceId = state.nodes[startId].choices[0].id
      state = makeChoice(state, pathId, startId, choiceId)
      expect(state.paths[0].nodeIds).toContain(leftId)
    })
  })

  describe('addCheckpoint', () => {
    it('should add checkpoint', () => {
      let state = createEmptyState()
      state = createNode(state, 'Checkpoint', 'Save here', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = addCheckpoint(state, nodeId)
      expect(state.checkpoints).toContain(nodeId)
    })

    it('should not duplicate checkpoint', () => {
      let state = createEmptyState()
      state = createNode(state, 'CP', 'Save', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = addCheckpoint(state, nodeId)
      state = addCheckpoint(state, nodeId)
      expect(state.checkpoints.filter(id => id === nodeId).length).toBe(1)
    })
  })

  describe('getNodeById', () => {
    it('should return node by id', () => {
      let state = createEmptyState()
      state = createNode(state, 'Test', 'Content', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      const node = getNodeById(state, nodeId)
      expect(node?.title).toBe('Test')
    })

    it('should return null for unknown id', () => {
      const state = createEmptyState()
      expect(getNodeById(state, 'unknown')).toBeNull()
    })
  })

  describe('getPathHistory', () => {
    it('should return visited nodes in order', () => {
      let state = createEmptyState()
      state = createNode(state, 'A', 'Content A', 'scene', 1)
      state = createNode(state, 'B', 'Content B', 'scene', 1)
      state = createNode(state, 'C', 'Content C', 'scene', 1)
      const ids = Object.keys(state.nodes)
      state = createPath(state, 'profile_1')
      const pathId = state.paths[0].id
      state = navigateToNode(state, pathId, ids[0])
      state = navigateToNode(state, pathId, ids[1])
      state = navigateToNode(state, pathId, ids[2])
      const history = getPathHistory(state, pathId)
      expect(history.map(n => n.title)).toEqual(['A', 'B', 'C'])
    })
  })

  describe('getAvailableChoices', () => {
    it('should return all choices without conditions', () => {
      let state = createEmptyState()
      state = createNode(state, 'Start', 'Begin', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = createNode(state, 'Next', 'Continue', 'scene', 1)
      const nextId = Object.keys(state.nodes)[1]
      state = addChoice(state, nodeId, 'Continue', nextId)
      const choices = getAvailableChoices(state, nodeId)
      expect(choices).toHaveLength(1)
    })

    it('should filter choices by condition', () => {
      let state = createEmptyState()
      state = createNode(state, 'Start', 'Begin', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = createNode(state, 'Fast', 'Fast path', 'scene', 1)
      const fastId = Object.keys(state.nodes)[1]
      state = addChoice(state, nodeId, 'Fast', fastId, 'engagementScore > 60')
      const available = getAvailableChoices(state, nodeId, { engagementScore: 70 })
      expect(available).toHaveLength(1)
      const unavailable = getAvailableChoices(state, nodeId, { engagementScore: 50 })
      expect(unavailable).toHaveLength(0)
    })
  })

  describe('addConvergencePoint', () => {
    it('should register convergence', () => {
      let state = createEmptyState()
      state = createNode(state, 'Meet', 'Converge here', 'scene', 1)
      const nodeId = Object.keys(state.nodes)[0]
      state = createPath(state, 'p1')
      state = createPath(state, 'p2')
      state = addConvergencePoint(state, nodeId, 'p1')
      state = addConvergencePoint(state, nodeId, 'p2')
      expect(state.convergencePoints[nodeId]).toEqual(['p1', 'p2'])
    })
  })

  describe('getBacktrackOptions', () => {
    it('should return recent nodes for backtracking', () => {
      let state = createEmptyState()
      state = createNode(state, 'A', 'A', 'scene', 1)
      state = createNode(state, 'B', 'B', 'scene', 1)
      state = createNode(state, 'C', 'C', 'scene', 1)
      state = createNode(state, 'D', 'D', 'scene', 1)
      const ids = Object.keys(state.nodes)
      state = createPath(state, 'p1')
      const pathId = state.paths[0].id
      state = navigateToNode(state, pathId, ids[0])
      state = navigateToNode(state, pathId, ids[1])
      state = navigateToNode(state, pathId, ids[2])
      state = navigateToNode(state, pathId, ids[3])
      const options = getBacktrackOptions(state, pathId, 3)
      // Returns [C, B] (excluding current D, maxDepth=3)
      expect(options.map(n => n.title)).toEqual(['C', 'B'])
    })
  })

  describe('backtrackToNode', () => {
    it('should truncate path to node', () => {
      let state = createEmptyState()
      state = createNode(state, 'A', 'A', 'scene', 1)
      state = createNode(state, 'B', 'B', 'scene', 1)
      state = createNode(state, 'C', 'C', 'scene', 1)
      const ids = Object.keys(state.nodes)
      state = createPath(state, 'p1')
      const pathId = state.paths[0].id
      state = navigateToNode(state, pathId, ids[0])
      state = navigateToNode(state, pathId, ids[1])
      state = navigateToNode(state, pathId, ids[2])
      state = backtrackToNode(state, pathId, ids[1])
      const path = state.paths.find(p => p.id === pathId)
      expect(path?.nodeIds).toEqual([ids[0], ids[1]])
    })
  })

  describe('getStoryProgress', () => {
    it('should calculate progress', () => {
      let state = createEmptyState()
      state = createNode(state, 'A', 'A', 'scene', 1)
      state = createNode(state, 'B', 'B', 'scene', 1)
      state = createNode(state, 'C', 'C', 'scene', 1)
      state = createNode(state, 'End', 'The End', 'ending', 3)
      const ids = Object.keys(state.nodes)
      state = createPath(state, 'p1')
      const pathId = state.paths[0].id
      state = navigateToNode(state, pathId, ids[0])
      state = navigateToNode(state, pathId, ids[1])
      const progress = getStoryProgress(state, pathId)
      expect(progress.totalNodes).toBe(2)
      expect(progress.chapterProgress).toBeGreaterThan(0)
    })
  })

  describe('getActivePath', () => {
    it('should return active path', () => {
      let state = createEmptyState()
      state = createPath(state, 'p1')
      const path = getActivePath(state)
      expect(path?.readerProfileId).toBe('p1')
    })

    it('should return null when no active path', () => {
      const state = createEmptyState()
      expect(getActivePath(state)).toBeNull()
    })
  })
})