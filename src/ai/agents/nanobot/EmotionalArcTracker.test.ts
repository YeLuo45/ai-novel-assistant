import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordEmotion,
  generateEmotionalReport,
  getCharacterEmotionalJourney,
  compareEmotionalArcs,
} from './EmotionalArcTracker'

describe('createEmptyState', () => {
  it('should create empty emotional state', () => {
    const s = createEmptyState()
    expect(s.entries).toEqual([])
    expect(s.arcs.size).toBe(0)
    expect(s.typeAlias).toEqual({})
  })
})

describe('recordEmotion', () => {
  it('should record emotion entry', () => {
    let s = createEmptyState()
    s = recordEmotion(s, 'ch1', 'hero', 'joy', 80, 'Victory', 'Smiles')
    expect(s.entries.length).toBe(1)
    expect(s.entries[0].emotion).toBe('joy')
    expect(s.entries[0].intensity).toBe(80)
  })

  it('should update character arc', () => {
    let s = createEmptyState()
    s = recordEmotion(s, 'ch1', 'hero', 'joy', 80, 'Victory', 'Smiles')
    s = recordEmotion(s, 'ch2', 'hero', 'sadness', 40, 'Loss', 'Cries')
    expect(s.arcs.size).toBe(1)
    expect(s.arcs.get('hero')!.journey.length).toBe(2)
  })
})

describe('generateEmotionalReport', () => {
  it('should return empty report', () => {
    const s = createEmptyState()
    const report = generateEmotionalReport(s)
    expect(report.totalEntries).toBe(0)
    expect(report.charactersTracked).toBe(0)
  })

  it('should identify common triggers', () => {
    let s = createEmptyState()
    s = recordEmotion(s, 'ch1', 'hero', 'anger', 70, 'Insult', 'Yells')
    s = recordEmotion(s, 'ch2', 'hero', 'anger', 60, 'Insult', 'Grunts')
    const report = generateEmotionalReport(s)
    expect(report.commonTriggers).toContain('Insult')
  })

  it('should detect unstable characters', () => {
    let s = createEmptyState()
    s = recordEmotion(s, 'ch1', 'hero', 'joy', 90, 'High', 'Euphoria')
    s = recordEmotion(s, 'ch2', 'hero', 'sadness', 10, 'Low', 'Despair')
    s = recordEmotion(s, 'ch3', 'hero', 'joy', 85, 'High', 'Euphoria')
    const report = generateEmotionalReport(s)
    expect(report.unstableCharacters).toContain('hero')
  })
})

describe('getCharacterEmotionalJourney', () => {
  it('should return character emotions', () => {
    let s = createEmptyState()
    s = recordEmotion(s, 'ch1', 'hero', 'joy', 80, 'Victory', 'Smiles')
    s = recordEmotion(s, 'ch2', 'villain', 'anger', 70, 'Defeat', 'Rages')
    const journey = getCharacterEmotionalJourney(s, 'hero')
    expect(journey.length).toBe(1)
    expect(journey[0].characterId).toBe('hero')
  })
})

describe('compareEmotionalArcs', () => {
  it('should compare arcs', () => {
    let s = createEmptyState()
    s = recordEmotion(s, 'ch1', 'hero', 'joy', 90, 'High', 'Great')
    s = recordEmotion(s, 'ch2', 'hero', 'sadness', 20, 'Low', 'Sad')
    s = recordEmotion(s, 'ch3', 'villain', 'joy', 60, 'Mild', 'Smile')
    s = recordEmotion(s, 'ch4', 'villain', 'sadness', 40, 'Low', 'Frown')
    const result = compareEmotionalArcs(s, 'hero', 'villain')
    expect(result.moreVolatile).toBe('hero')
    expect(result.range1).toBeGreaterThan(result.range2)
  })
})
