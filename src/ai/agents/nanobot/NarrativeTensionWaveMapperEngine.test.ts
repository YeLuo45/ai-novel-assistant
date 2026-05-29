import { describe, it, expect } from 'vitest'
import {
  createEmptyTensionWaveState,
  addTensionPoint,
  getTensionAtChapter,
  getTensionByLayer,
  getLayerTensionAverage,
  getTensionSpikes,
  getTensionValleys,
  formatTensionWaveSummary,
  formatTensionWaveDashboard,
} from './NarrativeTensionWaveMapperEngine'

describe('createEmptyTensionWaveState', () => {
  it('should create empty state', () => {
    const state = createEmptyTensionWaveState()
    expect(state.dataPoints.length).toBe(0)
    expect(state.currentWaveform).toBe('plateau')
  })
})

describe('addTensionPoint', () => {
  it('should add tension point', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'Battle begins')
    expect(state.dataPoints.length).toBe(1)
    expect(state.dataPoints[0].chapter).toBe(1)
  })

  it('should track external layer', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 70, 'Combat')
    expect(state.layers.external).toBeGreaterThan(0)
  })

  it('should track internal layer', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'internal', 50, 'Fear')
    expect(state.layers.internal).toBeGreaterThan(0)
  })

  it('should track peak tension', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'Event1')
    state = addTensionPoint(state, 2, 'external', 85, 'Major event')
    expect(state.peakTension).toBe(85)
    expect(state.peakChapter).toBe(2)
  })
})

describe('addTensionPoint pattern detection', () => {
  it('should detect rising pattern', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 10, 'Start')
    state = addTensionPoint(state, 2, 'external', 30, 'Middle')
    state = addTensionPoint(state, 3, 'external', 80, 'End')
    expect(state.currentWaveform).toBe('rising')
  })

  it('should detect falling pattern', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 80, 'Start')
    state = addTensionPoint(state, 2, 'external', 50, 'Middle')
    state = addTensionPoint(state, 3, 'external', 10, 'End')
    expect(state.currentWaveform).toBe('falling')
  })

  it('should detect spike pattern', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 70, 'Start')
    state = addTensionPoint(state, 2, 'external', 85, 'Peak')
    state = addTensionPoint(state, 3, 'external', 72, 'End')
    expect(state.currentWaveform).toBe('spike')
  })
})

describe('getTensionAtChapter', () => {
  it('should return points at chapter', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 5, 'external', 60, 'Event1')
    state = addTensionPoint(state, 5, 'internal', 50, 'Event2')
    const points = getTensionAtChapter(state, 5)
    expect(points.length).toBe(2)
  })

  it('should return empty array for missing chapter', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'Event')
    const points = getTensionAtChapter(state, 99)
    expect(points.length).toBe(0)
  })
})

describe('getTensionByLayer', () => {
  it('should return points by layer', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'Ext1')
    state = addTensionPoint(state, 2, 'internal', 50, 'Int1')
    const extPoints = getTensionByLayer(state, 'external')
    expect(extPoints.length).toBe(1)
  })
})

describe('getLayerTensionAverage', () => {
  it('should return 0 for layer with no points', () => {
    const state = createEmptyTensionWaveState()
    expect(getLayerTensionAverage(state, 'external')).toBe(0)
  })

  it('should calculate layer average', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'E1')
    state = addTensionPoint(state, 2, 'external', 80, 'E2')
    const avg = getLayerTensionAverage(state, 'external')
    expect(avg).toBeGreaterThan(0)
  })
})

describe('getTensionSpikes', () => {
  it('should return points above threshold', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 80, 'High')
    state = addTensionPoint(state, 2, 'external', 50, 'Low')
    const spikes = getTensionSpikes(state, 75)
    expect(spikes.length).toBe(1)
  })
})

describe('getTensionValleys', () => {
  it('should return points below threshold', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 20, 'Low')
    state = addTensionPoint(state, 2, 'external', 50, 'Mid')
    const valleys = getTensionValleys(state, 25)
    expect(valleys.length).toBe(1)
  })
})

describe('formatTensionWaveSummary', () => {
  it('should show tension summary', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'Event')
    const summary = formatTensionWaveSummary(state)
    expect(summary).toContain('Data Points: 1')
  })
})

describe('formatTensionWaveDashboard', () => {
  it('should show tension dashboard', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 60, 'Event')
    const dash = formatTensionWaveDashboard(state)
    expect(dash).toContain('Points: 1')
  })

  it('should show layer averages', () => {
    let state = createEmptyTensionWaveState()
    state = addTensionPoint(state, 1, 'external', 70, 'Event')
    const dash = formatTensionWaveDashboard(state)
    expect(dash).toContain('Layer Averages')
  })
})
