import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSceneConnection,
  calculateSmoothness,
  analyzeTransition,
  findOptimalSceneOrder,
  validateTransition,
  addConstraint,
  getTransitionSummary,
  suggestTransitionType,
} from './SceneTransitionOptimizer'
import type { TransitionEdge } from './SceneTransitionOptimizer'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.sceneConnections.size).toBe(0)
    expect(state.constraints.length).toBe(0)
    expect(state.recommendedOrder.length).toBe(0)
    expect(state.typeAlias).toEqual({})
  })
})

describe('registerSceneConnection', () => {
  it('should register scene connection', () => {
    let state = createEmptyState()
    state = registerSceneConnection(state, 's1', 's2', ['char1'], ['loc1'], 2)
    const key = 's1->s2'
    expect(state.sceneConnections.has(key)).toBe(true)
    expect(state.sceneConnections.get(key)!.sharedCharacters).toContain('char1')
  })
})

describe('calculateSmoothness', () => {
  it('should score high for shared characters and locations', () => {
    const edge: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'dissolve', smoothness: 0, continuityScore: 0, recommended: false }
    const score = calculateSmoothness(edge, ['c1', 'c2'], ['l1'], 1)
    expect(score).toBeGreaterThan(60)
  })

  it('should penalize temporal jumps', () => {
    const edge: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'cut', smoothness: 0, continuityScore: 0, recommended: false }
    const score = calculateSmoothness(edge, [], [], 60)
    expect(score).toBeLessThan(40)
  })

  it('should prefer match_cut over emporal_jump', () => {
    const edge1: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'match_cut', smoothness: 0, continuityScore: 0, recommended: false }
    const edge2: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'emporal_jump', smoothness: 0, continuityScore: 0, recommended: false }
    const score1 = calculateSmoothness(edge1, ['c1'], ['l1'], 0)
    const score2 = calculateSmoothness(edge2, ['c1'], ['l1'], 0)
    expect(score1).toBeGreaterThan(score2)
  })
})

describe('analyzeTransition', () => {
  it('should return all transition types', () => {
    const state = createEmptyState()
    const edges = analyzeTransition(state, 's1', 's2', ['c1'], ['l1'], 2)
    expect(edges.length).toBe(5)
    const types = edges.map(e => e.transitionType)
    expect(types).toContain('cut')
    expect(types).toContain('match_cut')
  })

  it('should recommend the smoothest transition', () => {
    const state = createEmptyState()
    const edges = analyzeTransition(state, 's1', 's2', ['c1', 'c2'], ['l1'], 1)
    const recommended = edges.find(e => e.recommended)
    expect(recommended).not.toBeUndefined()
    expect(recommended!.transitionType).toBeTruthy()
  })
})

describe('findOptimalSceneOrder', () => {
  it('should return empty for empty input', () => {
    const state = createEmptyState()
    const result = findOptimalSceneOrder(state, [])
    expect(result.orderedScenes).toEqual([])
  })

  it('should order scenes by connection strength', () => {
    const state = createEmptyState()
    const charMap = new Map([
      ['s1->s2', ['c1']],
      ['s2->s3', ['c1']],
      ['s1->s3', []],
    ])
    const result = findOptimalSceneOrder(state, ['s1', 's2', 's3'], charMap, new Map())
    expect(result.orderedScenes.length).toBe(3)
    // s1->s2->s3 should be preferred (s1->s2 shares char, s2->s3 shares char)
    const idx1 = result.orderedScenes.indexOf('s1')
    const idx2 = result.orderedScenes.indexOf('s2')
    const idx3 = result.orderedScenes.indexOf('s3')
    expect(idx1).toBeLessThan(idx2)
    expect(idx2).toBeLessThan(idx3)
  })

  it('should calculate average smoothness', () => {
    const state = createEmptyState()
    const charMap = new Map([['s1->s2', ['c1']]])
    const result = findOptimalSceneOrder(state, ['s1', 's2'], charMap, new Map())
    expect(result.totalSmoothness).toBeGreaterThan(0)
    expect(result.transitions.length).toBe(1)
  })
})

describe('validateTransition', () => {
  it('should pass valid transition', () => {
    let state = createEmptyState()
    state = addConstraint(state, { type: 'no_direct_cut', scenes: ['s1', 's2'] })
    const edge: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'dissolve', smoothness: 70, continuityScore: 80, recommended: true }
    const result = validateTransition(state, edge)
    expect(result.valid).toBe(true)
  })

  it('should fail when no_direct_cut violated', () => {
    let state = createEmptyState()
    state = addConstraint(state, { type: 'no_direct_cut', scenes: ['s1', 's2'] })
    const edge: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'cut', smoothness: 50, continuityScore: 50, recommended: false }
    const result = validateTransition(state, edge)
    expect(result.valid).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
  })

  it('should fail when require_fade violated', () => {
    let state = createEmptyState()
    state = addConstraint(state, { type: 'require_fade', scenes: ['s1', 's2'] })
    const edge: TransitionEdge = { fromScene: 's1', toScene: 's2', transitionType: 'cut', smoothness: 50, continuityScore: 50, recommended: false }
    const result = validateTransition(state, edge)
    expect(result.valid).toBe(false)
  })
})

describe('addConstraint', () => {
  it('should add constraint to state', () => {
    let state = createEmptyState()
    state = addConstraint(state, { type: 'no_direct_cut', scenes: ['s1', 's2'] })
    expect(state.constraints.length).toBe(1)
    expect(state.constraints[0].type).toBe('no_direct_cut')
  })
})

describe('getTransitionSummary', () => {
  it('should return excellent for empty transitions', () => {
    const summary = getTransitionSummary([])
    expect(summary.overallQuality).toBe('excellent')
  })

  it('should calculate average smoothness', () => {
    const transitions: TransitionEdge[] = [
      { fromScene: 's1', toScene: 's2', transitionType: 'dissolve', smoothness: 80, continuityScore: 80, recommended: true },
      { fromScene: 's2', toScene: 's3', transitionType: 'cut', smoothness: 40, continuityScore: 50, recommended: false },
    ]
    const summary = getTransitionSummary(transitions)
    expect(summary.avgSmoothness).toBe(60)
    expect(summary.recommendedCount).toBe(1)
    expect(summary.problematicTransitions.length).toBe(0)  // 40 is not < 40
  })

  it('should rate overall quality', () => {
    const transitions: TransitionEdge[] = [
      { fromScene: 's1', toScene: 's2', transitionType: 'match_cut', smoothness: 90, continuityScore: 90, recommended: true },
      { fromScene: 's2', toScene: 's3', transitionType: 'dissolve', smoothness: 85, continuityScore: 80, recommended: true },
    ]
    const summary = getTransitionSummary(transitions)
    expect(summary.overallQuality).toBe('excellent')
  })
})

describe('suggestTransitionType', () => {
  it('should suggest match_cut for strong continuity', () => {
    const result = suggestTransitionType(['c1', 'c2', 'c3'], ['l1'], 1)
    expect(result.type).toBe('match_cut')
  })

  it('should suggest dissolve for some continuity', () => {
    const result = suggestTransitionType(['c1'], [], 5)
    expect(result.type).toBe('dissolve')
  })

  it('should suggest fade for same location after time gap', () => {
    const result = suggestTransitionType([], ['l1'], 14)
    expect(result.type).toBe('fade')
  })

  it('should suggest emporal_jump for large gap', () => {
    const result = suggestTransitionType([], [], 60)
    expect(result.type).toBe('emporal_jump')
  })

  it('should default to cut for standard case', () => {
    const result = suggestTransitionType(['c1'], [], 3)
    expect(result.type).toBe('dissolve')  // shared chars with small gap
  })
})
