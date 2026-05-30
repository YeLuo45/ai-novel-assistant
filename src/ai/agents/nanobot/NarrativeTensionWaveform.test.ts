import { describe, it, expect } from 'vitest'
import {
  createEmptyTensionWaveformState,
  addTensionPoint,
  getTensionAtChapter,
  getTensionAtPosition,
  getPeakTensions,
  getValleyTensions,
  getWaveformTrend,
  formatTensionSummary,
  formatTensionDashboard,
  formatWaveformVisual,
} from './NarrativeTensionWaveform'

describe('createEmptyTensionWaveformState', () => {
  it('should create empty state', () => {
    const state = createEmptyTensionWaveformState()
    expect(state.dataPoints.length).toBe(0)
    expect(state.averageTension).toBe(50)
    expect(state.peakCount).toBe(0)
    expect(state.valleyCount).toBe(0)
    expect(state.overallTensionScore).toBe(50)
  })
})

describe('addTensionPoint', () => {
  it('should add first tension point', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "rising", false, "Tension rising")
    expect(state.dataPoints.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should clamp tension level to 0-100', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 150, "peak", false, "Over max")
    expect(state.dataPoints[0].tensionLevel).toBe(100)
    state = addTensionPoint(state, 2, 50, -50, "valley", false, "Under min")
    expect(state.dataPoints[1].tensionLevel).toBe(0)
  })

  it('should increment peak count for climax points', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 80, "peak", true, "Peak moment")
    expect(state.peakCount).toBe(1)
  })

  it('should update average tension', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "rising", false, "a")
    state = addTensionPoint(state, 2, 50, 80, "rising", false, "b")
    expect(state.averageTension).toBe(70)
  })
})

describe('getTensionAtChapter', () => {
  it('should filter by chapter', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "rising", false, "a")
    state = addTensionPoint(state, 3, 50, 70, "peak", false, "b")
    state = addTensionPoint(state, 5, 50, 80, "peak", false, "c")
    const ch3 = getTensionAtChapter(state, 3)
    expect(ch3.length).toBe(1)
    expect(ch3[0].chapter).toBe(3)
  })
})

describe('getTensionAtPosition', () => {
  it('should find point at exact chapter and position', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 2, 75, 85, "climax", true, "Climax point")
    const point = getTensionAtPosition(state, 2, 75)
    expect(point).not.toBeNull()
    expect(point?.tensionLevel).toBe(85)
    expect(point?.isClimax).toBe(true)
  })

  it('should return null for missing position', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "rising", false, "a")
    const point = getTensionAtPosition(state, 1, 25)
    expect(point).toBeNull()
  })
})

describe('getPeakTensions', () => {
  it('should return all climax and peak points', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 80, "rising", false, "a")
    state = addTensionPoint(state, 2, 50, 90, "peak", false, "b")
    state = addTensionPoint(state, 3, 50, 95, "climax", true, "c")
    state = addTensionPoint(state, 4, 50, 60, "plateau", false, "d")
    const peaks = getPeakTensions(state)
    expect(peaks.length).toBe(2)
  })
})

describe('getValleyTensions', () => {
  it('should return valley and resolution points', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 80, "rising", false, "a")
    state = addTensionPoint(state, 2, 50, 30, "valley", false, "b")
    state = addTensionPoint(state, 3, 50, 25, "resolution", false, "c")
    const valleys = getValleyTensions(state)
    expect(valleys.length).toBe(2)
  })
})

describe('getWaveformTrend', () => {
  it('should return stable for empty state', () => {
    const state = createEmptyTensionWaveformState()
    expect(getWaveformTrend(state)).toBe("stable")
  })

  it('should return rising for increasing tension', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 40, "rising", false, "a")
    state = addTensionPoint(state, 2, 50, 55, "rising", false, "b")
    state = addTensionPoint(state, 3, 50, 70, "rising", false, "c")
    expect(getWaveformTrend(state)).toBe("rising")
  })

  it('should return falling for decreasing tension', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 80, "falling", false, "a")
    state = addTensionPoint(state, 2, 50, 65, "falling", false, "b")
    state = addTensionPoint(state, 3, 50, 50, "falling", false, "c")
    expect(getWaveformTrend(state)).toBe("falling")
  })

  it('should return stable for minor changes', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "plateau", false, "a")
    state = addTensionPoint(state, 2, 50, 62, "plateau", false, "b")
    state = addTensionPoint(state, 3, 50, 58, "plateau", false, "c")
    expect(getWaveformTrend(state)).toBe("stable")
  })
})

describe('formatTensionSummary', () => {
  it('should contain summary header', () => {
    const state = createEmptyTensionWaveformState()
    const summary = formatTensionSummary(state)
    expect(summary).toContain("Tension Waveform Summary")
  })

  it('should show data points count', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "rising", false, "a")
    state = addTensionPoint(state, 2, 50, 70, "peak", false, "b")
    const summary = formatTensionSummary(state)
    expect(summary).toContain("Data Points: 2")
  })
})

describe('formatTensionDashboard', () => {
  it('should contain dashboard header', () => {
    const state = createEmptyTensionWaveformState()
    const dash = formatTensionDashboard(state)
    expect(dash).toContain("Tension Waveform Dashboard")
  })

  it('should show chapter information', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 5, 50, 80, "peak", true, "Major climax")
    const dash = formatTensionDashboard(state)
    expect(dash).toContain("Chapter: 5")
    expect(dash).toContain("Peaks: 1")
  })
})

describe('formatWaveformVisual', () => {
  it('should return no data message for empty state', () => {
    const state = createEmptyTensionWaveformState()
    const visual = formatWaveformVisual(state)
    expect(visual).toContain("No waveform data")
  })

  it('should contain visual header', () => {
    let state = createEmptyTensionWaveformState()
    state = addTensionPoint(state, 1, 50, 60, "rising", false, "a")
    state = addTensionPoint(state, 2, 50, 80, "peak", false, "b")
    const visual = formatWaveformVisual(state, 10)
    expect(visual).toContain("Tension Waveform Visual")
  })
})