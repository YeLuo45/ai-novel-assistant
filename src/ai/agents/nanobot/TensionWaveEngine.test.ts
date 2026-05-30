import { describe, it, expect } from 'vitest'
import {
  createEmptyTensionWaveState,
  recordTensionPoint,
  getTensionAtChapter,
  getNextPeak,
  getAverageTension,
  formatTensionSummary,
  formatTensionDashboard,
} from './TensionWaveEngine'

describe('createEmptyTensionWaveState', () => {
  it('should create empty state', () => {
    const state = createEmptyTensionWaveState()
    expect(state.points.length).toBe(0)
    expect(state.peaks.length).toBe(0)
  })
})

describe('recordTensionPoint', () => {
  it('should add tension point', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Battle scene', 'A sudden battle erupted')
    expect(state.points.length).toBe(1)
  })

  it('should detect battle event type', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Fight', 'The battle was intense')
    expect(state.points[0].eventType).toBe('combat')
  })

  it('should detect revelation event type', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Reveal', 'They made a discovery')
    expect(state.points[0].eventType).toBe('revelation')
  })

  it('should calculate high tension for combat', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Battle', 'A sudden battle erupted')
    expect(state.points[0].tensionLevel).toBeGreaterThan(70)
  })

  it('should calculate low tension for normal scenes', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Walk', 'They walked slowly')
    expect(state.points[0].tensionLevel).toBeLessThan(50)
  })

  it('should detect peak tension', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Calm', 'Quiet morning')
    state = recordTensionPoint(state, 2, 'Battle', 'A sudden battle')
    state = recordTensionPoint(state, 3, 'Aftermath', 'The dust settled')
    expect(state.peaks.length).toBeGreaterThan(0)
  })

  it('should detect trough tension', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'High', 'Intense fighting')
    state = recordTensionPoint(state, 2, 'Low', 'Quiet moment')
    state = recordTensionPoint(state, 3, 'High', 'More fighting')
    expect(state.troughs.length).toBeGreaterThan(0)
  })

  it('should update current chapter', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 5, 'Scene', 'Some text')
    expect(state.currentChapter).toBe(5)
  })
})

describe('getTensionAtChapter', () => {
  it('should return null for unknown chapter', () => {
    const state = createEmptyTensionWaveState()
    expect(getTensionAtChapter(state, 1)).toBeNull()
  })

  it('should return tension level', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Battle', 'A battle')
    expect(getTensionAtChapter(state, 1)).not.toBeNull()
  })
})

describe('getNextPeak', () => {
  it('should return null when no future peaks', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Battle', 'A battle')
    expect(getNextPeak(state, 1)).toBeNull()
  })

  it('should return next peak chapter', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Calm', 'Quiet')
    state = recordTensionPoint(state, 2, 'Peak', 'Intense battle')
    state = recordTensionPoint(state, 3, 'After', 'Aftermath')
    state = recordTensionPoint(state, 4, 'Peak2', 'Another peak')
    const next = getNextPeak(state, 1)
    expect(next).not.toBeNull()
    expect(next).toBe(2)
  })
})

describe('getAverageTension', () => {
  it('should return 0 for empty state', () => {
    const state = createEmptyTensionWaveState()
    expect(getAverageTension(state)).toBe(0)
  })

  it('should calculate average', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Low', 'Quiet')
    state = recordTensionPoint(state, 2, 'High', 'Intense battle')
    expect(getAverageTension(state)).toBeGreaterThan(0)
  })
})

describe('formatTensionSummary', () => {
  it('should show point count', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Battle', 'A battle')
    const summary = formatTensionSummary(state)
    expect(summary).toContain('Total Points: 1')
  })

  it('should show peak count', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Calm', 'Quiet')
    state = recordTensionPoint(state, 2, 'Peak', 'Intense')
    state = recordTensionPoint(state, 3, 'After', 'Done')
    const summary = formatTensionSummary(state)
    expect(summary).toContain('Peaks:')
  })
})

describe('formatTensionDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 3, 'Scene', 'Text')
    const dashboard = formatTensionDashboard(state)
    expect(dashboard).toContain('Chapter: 3')
  })

  it('should show average tension', () => {
    let state = createEmptyTensionWaveState()
    state = recordTensionPoint(state, 1, 'Scene', 'Text')
    const dashboard = formatTensionDashboard(state)
    expect(dashboard).toContain('Average:')
  })
})
