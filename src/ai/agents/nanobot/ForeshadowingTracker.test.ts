import { describe, it, expect } from 'vitest'
import {
  createEmptyForeshadowingState,
  addForeshadowingSetup,
  addReinforcingHint,
  resolveForeshadowing,
  markOrphanedForeshadowing,
  getPendingForeshadowing,
  getPayoffStats,
  formatForeshadowingSummary,
  formatForeshadowingDashboard,
} from './ForeshadowingTracker'

describe('createEmptyForeshadowingState', () => {
  it('should create empty state', () => {
    const state = createEmptyForeshadowingState()
    expect(state.entries.length).toBe(0)
    expect(state.totalSetups).toBe(0)
    expect(state.setupPayoffRatio).toBe(0)
  })
})

describe('addForeshadowingSetup', () => {
  it('should add a foreshadowing setup', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'A mysterious key appears')
    expect(state.entries.length).toBe(1)
    expect(state.entries[0].setupChapter).toBe(1)
    expect(state.entries[0].payoffStatus).toBe('pending')
  })

  it('should update total setups count', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup one')
    state = addForeshadowingSetup(state, 2, 'Setup two')
    expect(state.totalSetups).toBe(2)
  })

  it('should initialize with zero ratio when only setups exist', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    expect(state.setupPayoffRatio).toBe(0)
  })
})

describe('addReinforcingHint', () => {
  it('should increment hint count', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = addReinforcingHint(state, entryId, 3)
    expect(state.entries[0].hintsCount).toBe(1)
  })

  it('should ignore hint for already paid entries', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff text', 80)
    state = addReinforcingHint(state, entryId, 6)
    expect(state.entries[0].hintsCount).toBe(0)
  })
})

describe('resolveForeshadowing', () => {
  it('should mark entry as fully paid', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff text', 80)
    expect(state.entries[0].payoffStatus).toBe('fully_paid')
    expect(state.entries[0].payoffChapter).toBe(5)
  })

  it('should update fully paid count', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff', 80)
    expect(state.fullyPaidCount).toBe(1)
  })

  it('should update setup-payoff ratio', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff', 80)
    expect(state.setupPayoffRatio).toBe(100)
  })
})

describe('markOrphanedForeshadowing', () => {
  it('should mark pending entry as orphaned', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = markOrphanedForeshadowing(state, entryId)
    expect(state.entries[0].payoffStatus).toBe('orphaned')
  })

  it('should update orphaned count', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = markOrphanedForeshadowing(state, entryId)
    expect(state.orphanedCount).toBe(1)
  })
})

describe('getPendingForeshadowing', () => {
  it('should return only pending entries', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup one')
    state = addForeshadowingSetup(state, 2, 'Setup two')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff', 80)
    const pending = getPendingForeshadowing(state)
    expect(pending.length).toBe(1)
  })
})

describe('getPayoffStats', () => {
  it('should return correct stats', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff', 80)
    const stats = getPayoffStats(state)
    expect(stats.total).toBe(1)
    expect(stats.fullyPaid).toBe(1)
    expect(stats.ratio).toBe(100)
  })

  it('should return zero ratio for no entries', () => {
    const state = createEmptyForeshadowingState()
    const stats = getPayoffStats(state)
    expect(stats.ratio).toBe(0)
  })
})

describe('formatForeshadowingSummary', () => {
  it('should show total setups', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const summary = formatForeshadowingSummary(state)
    expect(summary).toContain('Total Setups: 1')
  })

  it('should show payoff counts', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'Setup')
    const entryId = state.entries[0].entryId
    state = resolveForeshadowing(state, entryId, 5, 'Payoff', 80)
    const summary = formatForeshadowingSummary(state)
    expect(summary).toContain('Fully Paid: 1')
    expect(summary).toContain('Setup-Payoff Ratio: 100%')
  })
})

describe('formatForeshadowingDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 3, 'Setup')
    const dashboard = formatForeshadowingDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show pending foreshadowing', () => {
    let state = createEmptyForeshadowingState()
    state = addForeshadowingSetup(state, 1, 'A mysterious key appears under the floor')
    const dashboard = formatForeshadowingDashboard(state)
    expect(dashboard).toContain('Pending Foreshadowing')
    expect(dashboard).toContain('mysterious key')
  })
})
