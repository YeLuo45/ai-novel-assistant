import { describe, it, expect } from 'vitest'
import {
  createEmptyBlueprintState,
  generateBlueprint,
  getChapterByAct,
  getPivotChapters,
  getActWordCounts,
  formatBlueprintSummary,
  formatBlueprintDashboard,
} from './StoryBlueprintGenerator'

describe('createEmptyBlueprintState', () => {
  it('should create empty state', () => {
    const state = createEmptyBlueprintState()
    expect(state.blueprint.length).toBe(0)
    expect(state.totalChapters).toBe(0)
  })
})

describe('generateBlueprint', () => {
  it('should generate blueprint with correct chapter count', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    expect(result.totalChapters).toBe(20)
    expect(result.blueprint.length).toBe(20)
  })

  it('should assign correct act distribution', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    expect(result.actBreakdown.act1).toBeGreaterThan(0)
    expect(result.actBreakdown.act2).toBeGreaterThan(0)
    expect(result.actBreakdown.act3).toBeGreaterThan(0)
  })

  it('should mark pivot chapters', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const pivots = getPivotChapters(result)
    expect(pivots.length).toBeGreaterThanOrEqual(2)
  })
})

describe('getChapterByAct', () => {
  it('should filter chapters by act', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const act1 = getChapterByAct(result, 1)
    expect(act1.length).toBeGreaterThan(0)
  })
})

describe('getActWordCounts', () => {
  it('should return word counts per act', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const counts = getActWordCounts(result)
    expect(counts.act1).toBeGreaterThanOrEqual(0)
    expect(counts.act2).toBeGreaterThanOrEqual(0)
  })
})

describe('formatBlueprintSummary', () => {
  it('should show chapter count', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const summary = formatBlueprintSummary(result)
    expect(summary).toContain('Chapters: 20')
  })

  it('should show act breakdown', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const summary = formatBlueprintSummary(result)
    expect(summary).toContain('Act breakdown:')
  })
})

describe('formatBlueprintDashboard', () => {
  it('should show total chapters', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const dash = formatBlueprintDashboard(result)
    expect(dash).toContain('Total: 20')
  })

  it('should show target words', () => {
    const state = createEmptyBlueprintState()
    const result = generateBlueprint(state, 20, 2000)
    const dash = formatBlueprintDashboard(result)
    expect(dash).toContain('words')
  })
})
