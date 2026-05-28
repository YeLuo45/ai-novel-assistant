/**
 * SensoryDetailEngine Tests - V179
 * Tests for Sensory Detail Injection & Immersion Tracking Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptySensoryState,
  analyzeSensoryContent,
  getImmersionScore,
  getChapterSensoryDetails,
  getModeUsageStats,
  formatSensorySummary,
  formatSensoryDashboard,
} from './SensoryDetailEngine'

describe('createEmptySensoryState', () => {
  it('should create empty state', () => {
    const state = createEmptySensoryState()
    expect(state.details.length).toBe(0)
    expect(state.immersionScores.length).toBe(0)
    expect(state.modeUsage.visual).toBe(0)
  })
})

describe('analyzeSensoryContent', () => {
  it('should detect visual sensory detail', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sunlight shone through the window. She looked at the sky.', 1)
    expect(state.details.length).toBe(1)
    expect(state.details[0].mode).toBe('visual')
  })

  it('should detect auditory sensory detail', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'She heard a sudden loud noise. The sound echoed in the hallway.', 2)
    expect(state.details[0].mode).toBe('auditory')
  })

  it('should detect olfactory sensory detail', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'A fresh scent of roses filled the air. The fragrant perfume was lovely.', 3)
    expect(state.details[0].mode).toBe('olfactory')
  })

  it('should detect gustatory sensory detail', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The food tasted delicious. She enjoyed the sweet flavor of the dessert.', 4)
    expect(state.details[0].mode).toBe('gustatory')
  })

  it('should detect tactile sensory detail', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The surface felt warm and smooth under her fingers. She could sense the temperature of the material through the touch.', 5)
    expect(state.details[0].mode).toBe('tactile')
  })

  it('should detect kinesthetic sensory detail', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'He moved quickly across the room. She walked slowly toward the door.', 6)
    expect(state.details[0].mode).toBe('kinesthetic')
  })

  it('should update mode usage', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright light illuminated the dark scene.', 1)
    expect(state.modeUsage.visual).toBe(1)
  })

  it('should calculate immersion score', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'She saw the bright sky above.', 1)
    expect(state.immersionScores.length).toBe(1)
    expect(state.immersionScores[0].overallScore).toBeGreaterThan(0)
  })

  it('should track multiple sensory modes', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 1)
    state = analyzeSensoryContent(state, 'She heard a whisper.', 1)
    expect(state.details.length).toBe(2)
    expect(state.modeUsage.visual).toBe(1)
    expect(state.modeUsage.auditory).toBe(1)
  })
})

describe('getImmersionScore', () => {
  it('should return null for unknown chapter', () => {
    const state = createEmptySensoryState()
    const score = getImmersionScore(state, 1)
    expect(score).toBeNull()
  })

  it('should return score for chapter', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 3)
    const score = getImmersionScore(state, 3)
    expect(score).not.toBeNull()
    expect(score?.chapter).toBe(3)
  })
})

describe('getChapterSensoryDetails', () => {
  it('should return empty for unknown chapter', () => {
    const state = createEmptySensoryState()
    const details = getChapterSensoryDetails(state, 1)
    expect(details.length).toBe(0)
  })

  it('should return chapter details', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 2)
    state = analyzeSensoryContent(state, 'She heard a sound.', 2)
    const details = getChapterSensoryDetails(state, 2)
    expect(details.length).toBe(2)
  })
})

describe('getModeUsageStats', () => {
  it('should return mode usage counts', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 1)
    state = analyzeSensoryContent(state, 'She heard a sound.', 1)
    const stats = getModeUsageStats(state)
    expect(stats.visual).toBe(1)
    expect(stats.auditory).toBe(1)
  })
})

describe('formatSensorySummary', () => {
  it('should show detail count', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 1)
    const summary = formatSensorySummary(state)
    expect(summary).toContain('Total Details: 1')
  })

  it('should show mode usage', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 1)
    const summary = formatSensorySummary(state)
    expect(summary).toContain('Mode Usage')
  })
})

describe('formatSensoryDashboard', () => {
  it('should show chapter', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 5)
    const dashboard = formatSensoryDashboard(state)
    expect(dashboard).toContain('Chapter: 5')
  })

  it('should show immersion scores', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 3)
    const dashboard = formatSensoryDashboard(state)
    expect(dashboard).toContain('Immersion Scores')
  })

  it('should show sensory details', () => {
    let state = createEmptySensoryState()
    state = analyzeSensoryContent(state, 'The bright sky above.', 1)
    const dashboard = formatSensoryDashboard(state)
    expect(dashboard).toContain('Sensory Details')
  })
})
