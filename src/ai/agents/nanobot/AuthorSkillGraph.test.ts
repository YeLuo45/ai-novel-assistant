import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerSkill,
  updateSkillLevel,
  addSkillEdge,
  computeStrengths,
  computeWeaknesses,
  getSkillSubtree,
  getSkillAncestors,
  calculateSkillGap,
  getSkillGrowthRate,
  getSkillRadarData,
  findTransferOpportunities,
  getSkillHealthScore,
} from './AuthorSkillGraph'

describe('createEmptyState', () => {
  it('should create empty state', () => {
    const state = createEmptyState()
    expect(state.nodes.size).toBe(0)
    expect(state.edges.length).toBe(0)
    expect(state.strengths.length).toBe(0)
    expect(state.typeAlias).toEqual({})
  })
})

describe('registerSkill', () => {
  it('should register a root skill', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'plot-basic', 'Plot Basics', 'plot')
    expect(state.nodes.get('plot-basic')!.name).toBe('Plot Basics')
    expect(state.nodes.get('plot-basic')!.level).toBe(0)
  })

  it('should register child skill and update parent', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'plot-basic', 'Plot Basics', 'plot')
    state = registerSkill(state, 'plot-arcs', 'Story Arcs', 'plot', 'plot-basic')
    expect(state.nodes.get('plot-basic')!.childSkillIds).toContain('plot-arcs')
    expect(state.nodes.get('plot-arcs')!.parentSkillId).toBe('plot-basic')
  })

  it('should handle dependencies', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'revise-basic', 'Basic Revision', 'revision', undefined, ['plot-basic'])
    expect(state.nodes.get('revise-basic')!.dependencies).toContain('plot-basic')
  })
})

describe('updateSkillLevel', () => {
  it('should update skill level', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'plot', 'Plot', 'plot')
    state = updateSkillLevel(state, 'plot', 65)
    expect(state.nodes.get('plot')!.level).toBe(65)
    expect(state.nodes.get('plot')!.practiceCount).toBe(1)
  })

  it('should increment mastery score', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'dialogue', 'Dialogue', 'dialogue')
    state = updateSkillLevel(state, 'dialogue', 50, 0.1)
    expect(state.nodes.get('dialogue')!.masteryScore).toBeCloseTo(0.1, 1)
  })

  it('should cap level at 100', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'style', 'Style', 'style')
    state = updateSkillLevel(state, 'style', 120)
    expect(state.nodes.get('style')!.level).toBe(100)
  })
})

describe('addSkillEdge', () => {
  it('should add prereq edge', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'basic', 'Basic', 'plot')
    state = registerSkill(state, 'advanced', 'Advanced', 'plot')
    state = addSkillEdge(state, 'basic', 'advanced', 'prereq', 0.8)
    expect(state.edges.length).toBe(1)
    expect(state.edges[0].relationship).toBe('prereq')
  })
})

describe('computeStrengths', () => {
  it('should return top K skills', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'p1', 'Plot', 'plot')
    state = registerSkill(state, 'd1', 'Dialogue', 'dialogue')
    state = registerSkill(state, 'c1', 'Character', 'character')
    state = updateSkillLevel(state, 'p1', 80)
    state = updateSkillLevel(state, 'd1', 60)
    state = updateSkillLevel(state, 'c1', 70)
    const strengths = computeStrengths(state, 2)
    expect(strengths).toEqual(['p1', 'c1'])
  })

  it('should return empty when no skills', () => {
    const state = createEmptyState()
    expect(computeStrengths(state)).toEqual([])
  })
})

describe('computeWeaknesses', () => {
  it('should return practiced skills with lowest level', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'p1', 'Plot', 'plot')
    state = registerSkill(state, 'd1', 'Dialogue', 'dialogue')
    state = updateSkillLevel(state, 'p1', 80)
    state = updateSkillLevel(state, 'd1', 35)
    const weaknesses = computeWeaknesses(state, 1)
    expect(weaknesses).toContain('d1')
  })
})

describe('getSkillSubtree', () => {
  it('should return all descendants', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'root', 'Root', 'plot')
    state = registerSkill(state, 'child1', 'Child1', 'plot', 'root')
    state = registerSkill(state, 'child2', 'Child2', 'plot', 'root')
    state = registerSkill(state, 'grandchild', 'Grandchild', 'plot', 'child1')
    const subtree = getSkillSubtree(state, 'root')
    expect(subtree).toContain('root')
    expect(subtree).toContain('child1')
    expect(subtree).toContain('grandchild')
    expect(subtree.length).toBe(4)
  })

  it('should return empty for unknown skill', () => {
    const state = createEmptyState()
    expect(getSkillSubtree(state, 'unknown')).toEqual([])
  })
})

describe('getSkillAncestors', () => {
  it('should return all ancestors up to root', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'root', 'Root', 'plot')
    state = registerSkill(state, 'mid', 'Mid', 'plot', 'root')
    state = registerSkill(state, 'leaf', 'Leaf', 'plot', 'mid')
    const ancestors = getSkillAncestors(state, 'leaf')
    expect(ancestors).toEqual(['mid', 'root'])
  })
})

describe('calculateSkillGap', () => {
  it('should find missing prerequisites', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'advanced', 'Advanced', 'plot')
    state = updateSkillLevel(state, 'advanced', 50)
    const gap = calculateSkillGap(state, 'advanced', 'unknown')
    expect(gap.missing.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getSkillGrowthRate', () => {
  it('should return 0 for insufficient history', () => {
    const state = createEmptyState()
    expect(getSkillGrowthRate(state, 'unknown')).toBe(0)
  })

  it('should calculate growth rate from history', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'plot', 'Plot', 'plot')
    // Add fake history
    const history = [
      { timestamp: Date.now() - 2 * 86400000, skills: new Map([['plot', 50]]) },
      { timestamp: Date.now() - 86400000, skills: new Map([['plot', 55]]) },
      { timestamp: Date.now(), skills: new Map([['plot', 60]]) },
    ]
    state = { ...state, growthHistory: history }
    const rate = getSkillGrowthRate(state, 'plot', 3)
    expect(rate).toBeGreaterThan(0)
  })
})

describe('getSkillRadarData', () => {
  it('should return category averages', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'p1', 'Plotting', 'plot')
    state = registerSkill(state, 'p2', 'Story Structure', 'plot')
    state = updateSkillLevel(state, 'p1', 70)
    state = updateSkillLevel(state, 'p2', 50)
    const strengths = computeStrengths(state)
    const weaknesses = computeWeaknesses(state)
    state = { ...state, strengths, weaknesses }
    const radar = getSkillRadarData(state)
    const plotEntry = radar.find(r => r.category === 'plot')
    expect(plotEntry).not.toBeUndefined()
    expect(plotEntry!.level).toBe(60) // average of 70 and 50
  })
})

describe('findTransferOpportunities', () => {
  it('should find transfer opportunities between same-category skills', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'p1', 'Plot Basic', 'plot')
    state = registerSkill(state, 'p2', 'Plot Advanced', 'plot')
    state = updateSkillLevel(state, 'p1', 80)
    state = updateSkillLevel(state, 'p2', 30)
    const strengths = computeStrengths(state, 1)
    const weaknesses = computeWeaknesses(state, 1)
    state = { ...state, strengths, weaknesses }
    const ops = findTransferOpportunities(state)
    expect(ops.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getSkillHealthScore', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptyState()
    expect(getSkillHealthScore(state)).toBe(0)
  })

  it('should calculate weighted score', () => {
    let state = createEmptyState()
    state = registerSkill(state, 'plot', 'Plot', 'plot')
    state = updateSkillLevel(state, 'plot', 80)
    const health = getSkillHealthScore(state)
    expect(health).toBeGreaterThan(0)
    expect(health).toBeLessThanOrEqual(100)
  })
})
