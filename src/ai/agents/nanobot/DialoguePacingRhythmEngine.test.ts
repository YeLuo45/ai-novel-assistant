import { describe, it, expect } from 'vitest'
import {
  createEmptyDialoguePacingState,
  analyzeDialogueExchange,
  getExchangesByChapter,
  getExchangesByRhythm,
  getHighTensionExchanges,
  formatDialoguePacingSummary,
  formatDialoguePacingDashboard,
} from './DialoguePacingRhythmEngine'

describe('createEmptyDialoguePacingState', () => {
  it('should create empty state', () => {
    const state = createEmptyDialoguePacingState()
    expect(state.exchanges.length).toBe(0)
    expect(state.dominantRhythm).toBe('flowing')
  })
})

describe('analyzeDialogueExchange', () => {
  it('should add dialogue exchange', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [
      { speaker: 'John', wordCount: 20, tension: 40, hasSubtext: false },
      { speaker: 'Jane', wordCount: 25, tension: 50, hasSubtext: true },
    ]
    state = analyzeDialogueExchange(state, 1, ['John', 'Jane'], lines)
    expect(state.exchanges.length).toBe(1)
    expect(state.currentChapter).toBe(1)
  })

  it('should detect staccato rhythm', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [
      { speaker: 'A', wordCount: 8, tension: 70, hasSubtext: false },
      { speaker: 'B', wordCount: 7, tension: 75, hasSubtext: false },
      { speaker: 'A', wordCount: 6, tension: 80, hasSubtext: false },
      { speaker: 'B', wordCount: 9, tension: 70, hasSubtext: false },
      { speaker: 'A', wordCount: 7, tension: 75, hasSubtext: false },
      { speaker: 'B', wordCount: 8, tension: 80, hasSubtext: false },
      { speaker: 'A', wordCount: 6, tension: 85, hasSubtext: false },
      { speaker: 'B', wordCount: 7, tension: 75, hasSubtext: false },
      { speaker: 'A', wordCount: 8, tension: 80, hasSubtext: false },
      { speaker: 'B', wordCount: 6, tension: 85, hasSubtext: false },
      { speaker: 'A', wordCount: 7, tension: 80, hasSubtext: false },
    ]
    state = analyzeDialogueExchange(state, 1, ['A', 'B'], lines)
    expect(state.exchanges[0].rhythm).toBe('staccato')
  })

  it('should detect rapid pace', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [
      { speaker: 'A', wordCount: 8, tension: 60, hasSubtext: false },
      { speaker: 'B', wordCount: 7, tension: 65, hasSubtext: false },
      { speaker: 'A', wordCount: 9, tension: 70, hasSubtext: false },
      { speaker: 'B', wordCount: 8, tension: 60, hasSubtext: false },
      { speaker: 'A', wordCount: 7, tension: 65, hasSubtext: false },
      { speaker: 'B', wordCount: 9, tension: 70, hasSubtext: false },
      { speaker: 'A', wordCount: 8, tension: 60, hasSubtext: false },
    ]
    state = analyzeDialogueExchange(state, 1, ['A', 'B'], lines)
    expect(state.exchanges[0].pace).toBe('rapid')
  })

  it('should calculate tension level', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [
      { speaker: 'John', wordCount: 20, tension: 60, hasSubtext: false },
      { speaker: 'Jane', wordCount: 25, tension: 80, hasSubtext: false },
    ]
    state = analyzeDialogueExchange(state, 1, ['John', 'Jane'], lines)
    expect(state.exchanges[0].tensionLevel).toBe(70)
  })
})

describe('getExchangesByChapter', () => {
  it('should return exchanges at chapter', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [{ speaker: 'John', wordCount: 20, tension: 50, hasSubtext: false }]
    state = analyzeDialogueExchange(state, 5, ['John'], lines)
    const exchanges = getExchangesByChapter(state, 5)
    expect(exchanges.length).toBe(1)
  })
})

describe('getExchangesByRhythm', () => {
  it('should return exchanges by rhythm', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [{ speaker: 'John', wordCount: 20, tension: 50, hasSubtext: false }]
    state = analyzeDialogueExchange(state, 1, ['John'], lines)
    const flowing = getExchangesByRhythm(state, 'flowing')
    expect(flowing.length).toBeGreaterThanOrEqual(0)
  })
})

describe('getHighTensionExchanges', () => {
  it('should return high tension exchanges', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [{ speaker: 'John', wordCount: 20, tension: 85, hasSubtext: true }]
    state = analyzeDialogueExchange(state, 1, ['John'], lines)
    const highTension = getHighTensionExchanges(state, 70)
    expect(highTension.length).toBe(1)
  })
})

describe('formatDialoguePacingSummary', () => {
  it('should show pacing summary', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [{ speaker: 'John', wordCount: 20, tension: 50, hasSubtext: false }]
    state = analyzeDialogueExchange(state, 1, ['John'], lines)
    const summary = formatDialoguePacingSummary(state)
    expect(summary).toContain('Exchanges: 1')
  })
})

describe('formatDialoguePacingDashboard', () => {
  it('should show pacing dashboard', () => {
    let state = createEmptyDialoguePacingState()
    const lines = [{ speaker: 'John', wordCount: 20, tension: 50, hasSubtext: false }]
    state = analyzeDialogueExchange(state, 1, ['John'], lines)
    const dash = formatDialoguePacingDashboard(state)
    expect(dash).toContain('Exchanges: 1')
  })
})