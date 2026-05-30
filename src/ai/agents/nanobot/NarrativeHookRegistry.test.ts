import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  registerHook,
  updateHookEffectiveness,
  generateEffectivenessReport,
  getHookStats,
  compareChapterHooks,
} from './NarrativeHookRegistry'

describe('createEmptyState', () => {
  it('should create empty hook state', () => {
    const s = createEmptyState()
    expect(s.hooks).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('registerHook', () => {
  it('should register a hook', () => {
    let s = createEmptyState()
    s = registerHook(s, 'question', 'ch1', 10, 'Who was at the door?')
    expect(s.hooks.length).toBe(1)
    expect(s.hooks[0].type).toBe('question')
  })

  it('should register multiple hooks', () => {
    let s = createEmptyState()
    s = registerHook(s, 'mystery', 'ch1', 5, 'A dark figure appeared')
    s = registerHook(s, 'danger', 'ch2', 15, 'The building collapsed')
    expect(s.hooks.length).toBe(2)
  })
})

describe('updateHookEffectiveness', () => {
  it('should update hook effectiveness', () => {
    let s = createEmptyState()
    s = registerHook(s, 'question', 'ch1', 10, 'Who was there?')
    const hookId = s.hooks[0].id
    s = updateHookEffectiveness(s, hookId, 85, 100, null)
    expect(s.hooks[0].clicksGenerated).toBe(85)
    expect(s.hooks[0].effectiveness).toBeGreaterThan(50)
  })
})

describe('generateEffectivenessReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateEffectivenessReport(s)
    expect(report.totalHooks).toBe(0)
    expect(report.bestHookType).toBeNull()
  })

  it('should identify best hook type', () => {
    let s = createEmptyState()
    s = registerHook(s, 'question', 'ch1', 10, 'Q1')
    s = registerHook(s, 'mystery', 'ch2', 10, 'M1')
    const hookId1 = s.hooks[0].id
    const hookId2 = s.hooks[1].id
    s = updateHookEffectiveness(s, hookId1, 90, 100, null)
    s = updateHookEffectiveness(s, hookId2, 40, 100, null)
    const report = generateEffectivenessReport(s)
    expect(report.bestHookType).toBe('question')
    expect(report.worstHookType).toBe('mystery')
  })
})

describe('getHookStats', () => {
  it('should return zeros for unknown chapter', () => {
    const s = createEmptyState()
    const stats = getHookStats(s, 'unknown')
    expect(stats.hookCount).toBe(0)
  })

  it('should return chapter hook stats', () => {
    let s = createEmptyState()
    s = registerHook(s, 'action', 'ch1', 20, 'Fight scene')
    s = registerHook(s, 'conflict', 'ch1', 50, 'Argument')
    const stats = getHookStats(s, 'ch1')
    expect(stats.hookCount).toBe(2)
    expect(stats.avgEffectiveness).toBeGreaterThan(0)
  })
})

describe('compareChapterHooks', () => {
  it('should compare chapters', () => {
    let s = createEmptyState()
    s = registerHook(s, 'action', 'ch1', 20, 'Hook 1')
    s = registerHook(s, 'description', 'ch2', 20, 'Hook 2')
    const result = compareChapterHooks(s, 'ch1', 'ch2')
    expect(result.moreEngaging).toBeTruthy()
  })
})
