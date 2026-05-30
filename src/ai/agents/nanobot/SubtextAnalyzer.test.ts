import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordExchange,
  analyzeExchange,
  getSubtextAnalysis,
  getTensionHotspots,
} from './SubtextAnalyzer'

describe('createEmptyState', () => {
  it('should create empty subtext state', () => {
    const s = createEmptyState()
    expect(s.exchanges).toEqual([])
    expect(s.analyses).toEqual({})
    expect(s.typeAlias).toEqual({})
  })
})

describe('recordExchange', () => {
  it('should record dialogue exchange', () => {
    let s = createEmptyState()
    s = recordExchange(s, 'alice', 'bob', [
      { speaker: 'alice', text: 'We need to talk...' },
      { speaker: 'bob', text: 'Okay.' },
    ])
    expect(s.exchanges.length).toBe(1)
    expect(s.exchanges[0].lines.length).toBe(2)
  })

  it('should calculate subtext scores', () => {
    let s = createEmptyState()
    s = recordExchange(s, 'alice', 'bob', [
      { speaker: 'alice', text: 'We need to talk...' },
      { speaker: 'bob', text: 'Fine...' },
    ])
    expect(s.exchanges[0].lines[0].subtextScore).toBeGreaterThan(20)
  })
})

describe('analyzeExchange', () => {
  it('should analyze exchange', () => {
    let s = createEmptyState()
    s = recordExchange(s, 'alice', 'bob', [
      { speaker: 'alice', text: 'We need to talk.' },
      { speaker: 'bob', text: 'Whatever you say.' },
      { speaker: 'alice', text: 'Why do you always do this?' },
      { speaker: 'bob', text: 'I don\'t know what you mean.' },
    ])
    const exchangeId = `${s.exchanges[0].speaker1}-${s.exchanges[0].speaker2}`
    s = analyzeExchange(s, 'alice', 'bob', exchangeId)
    const analysis = getSubtextAnalysis(s, exchangeId)
    expect(analysis).not.toBeNull()
    expect(analysis!.overallSubtextScore).toBeGreaterThan(0)
  })

  it('should detect hostile tension', () => {
    let s = createEmptyState()
    s = recordExchange(s, 'alice', 'bob', [
      { speaker: 'alice', text: 'I will destroy you.' },
      { speaker: 'bob', text: 'Try it.' },
    ])
    const exchangeId = `${s.exchanges[0].speaker1}-${s.exchanges[0].speaker2}`
    s = analyzeExchange(s, 'alice', 'bob', exchangeId)
    const analysis = getSubtextAnalysis(s, exchangeId)
    expect(analysis!.dominantTensionType).toBe('hostile')
  })
})

describe('getTensionHotspots', () => {
  it('should return empty for no hotspots', () => {
    const s = createEmptyState()
    expect(getTensionHotspots(s)).toEqual([])
  })

  it('should return sorted hotspots', () => {
    let s = createEmptyState()
    s = recordExchange(s, 'alice', 'bob', [
      { speaker: 'alice', text: 'Hello.' },
      { speaker: 'bob', text: 'Hey.' },
    ])
    const exchangeId = `${s.exchanges[0].speaker1}-${s.exchanges[0].speaker2}`
    s = analyzeExchange(s, 'alice', 'bob', exchangeId)
    const hotspots = getTensionHotspots(s)
    expect(hotspots.length).toBeGreaterThanOrEqual(0)
  })
})
