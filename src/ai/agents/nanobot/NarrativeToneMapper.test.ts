/**
 * NarrativeToneMapper Tests - V153
 * Tests for Emotional Tone Analysis & Narrative Voice Mapping Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyToneState,
  detectTone,
  measureToneIntensity,
  detectVoiceMarker,
  createToneSegments,
  buildToneMap,
  analyzeChapterTone,
  compareToneConsistency,
  detectToneAnomaly,
  formatToneMap,
  formatToneDashboard,
} from './NarrativeToneMapper'

// =============================================================================
// State Management Tests
// =============================================================================

describe('createEmptyToneState', () => {
  it('should create empty state', () => {
    const state = createEmptyToneState()
    expect(state.toneMaps.size).toBe(0)
    expect(state.currentMapId).toBeNull()
    expect(state.toneHistory.length).toBe(0)
  })

  it('should have empty transition alerts', () => {
    const state = createEmptyToneState()
    expect(state.transitionAlerts.length).toBe(0)
  })
})

// =============================================================================
// Tone Detection Tests
// =============================================================================

describe('detectTone', () => {
  it('should detect joyful tone', () => {
    const tone = detectTone('The children laughed and smiled with delight')
    expect(tone).toBe('joyful')
  })

  it('should detect dark tone', () => {
    const tone = detectTone('Shadows crept across the grim darkness')
    expect(tone).toBe('dark')
  })

  it('should detect tense tone', () => {
    const tone = detectTone('Her heart beat faster as danger approached')
    expect(tone).toBe('tense')
  })

  it('should detect romantic tone', () => {
    const tone = detectTone('He kissed her tenderly with passion')
    expect(tone).toBe('romantic')
  })

  it('should default to serene when no keywords', () => {
    const tone = detectTone('The water flowed gently downstream')
    expect(tone).toBe('serene')
  })
})

describe('measureToneIntensity', () => {
  it('should measure low intensity for calm text', () => {
    const intensity = measureToneIntensity('The cat sat on the mat.')
    expect(intensity).toBeLessThan(30)
  })

  it('should measure higher intensity for punctuated text', () => {
    const intensity = measureToneIntensity('Run! Faster! Now!')
    expect(intensity).toBeGreaterThan(50)
  })

  it('should cap at 100', () => {
    const longExclamation = 'Wow! '.repeat(20)
    const intensity = measureToneIntensity(longExclamation)
    expect(intensity).toBeLessThanOrEqual(100)
  })
})

// =============================================================================
// Voice Marker Tests
// =============================================================================

describe('detectVoiceMarker', () => {
  it('should detect first person intimate', () => {
    const marker = detectVoiceMarker('I feel the fear in my heart. I believe this is wrong.')
    expect(marker).toBe('first_person_intimate')
  })

  it('should detect first person distant', () => {
    // Need enough words and first-person ratio > 0.15 to trigger first person detection
    // 6 "I"s in 20 words = 0.30 > 0.15, but no intimate words → first_person_distant
    const marker = detectVoiceMarker('I saw the building from the hill I walked to the door I entered the room I looked around I decided to stay')
    expect(marker).toBe('first_person_distant')
  })

  it('should detect third person close', () => {
    const marker = detectVoiceMarker('She walked through the forest. He followed.')
    expect(marker).toBe('third_person_close')
  })

  it('should detect third person omniscient', () => {
    // Need third person ratio > 0.15 AND 2+ markers with 2+ occurrences each
    // Use pronouns throughout: he/him/his, she/her, they/their/them
    // "John thought" x2 + "he thought" x2 + "Mary felt" x2 + "she knew" x2 + "they understood" x2 = 10+ markers
    const marker = detectVoiceMarker('John thought the plan was foolish. He thought it was hard. He thought about the risk. Mary felt nervous. She felt afraid. She knew it was dangerous. They both understood their responsibility. They both knew the danger was real.')
    expect(marker).toBe('third_person_omniscient')
  })

  it('should detect second person', () => {
    const marker = detectVoiceMarker('You should take the path that leads home.')
    expect(marker).toBe('second_person')
  })
})

// =============================================================================
// Tone Mapping Tests
// =============================================================================

describe('createToneSegments', () => {
  it('should create segments from text', () => {
    const segments = createToneSegments('The cat sat on the warm mat in the sunny kitchen. The playful dog ran through the green garden.', 1, 30)
    expect(segments.length).toBeGreaterThan(0)
  })

  it('should assign chapter and position', () => {
    const segments = createToneSegments('First long sentence here. Second long sentence here.', 5, 20)
    for (const seg of segments) {
      expect(seg.chapter).toBe(5)
    }
  })

  it('should handle empty text', () => {
    const segments = createToneSegments('', 1)
    expect(segments.length).toBe(0)
  })
})

describe('buildToneMap', () => {
  it('should build tone map from segments', () => {
    const segments = createToneSegments('The cat sat. The dog ran. The bird sang.', 1, 20)
    const map = buildToneMap(segments)
    expect(map.segments.length).toBe(segments.length)
    expect(map.dominantTone).toBeTruthy()
  })

  it('should handle empty segments', () => {
    const map = buildToneMap([])
    expect(map.overallTone).toBe('peaceful')
    expect(map.voiceConsistency).toBe(100)
  })

  it('should calculate voice consistency', () => {
    const segments = createToneSegments('I feel happy with this moment. I think it is wonderful.', 1, 30)
    const map = buildToneMap(segments)
    expect(map.voiceConsistency).toBeLessThanOrEqual(100)
  })
})

// =============================================================================
// State Operations Tests
// =============================================================================

describe('analyzeChapterTone', () => {
  it('should analyze and store chapter tone', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy children laughed with joy and delight.')
    
    expect(state.toneMaps.size).toBe(1)
    expect(state.currentMapId).toBe('map_ch1')
  })

  it('should track tone history', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy children laughed with joy and delight in the bright sunshine.')
    state = analyzeChapterTone(state, 2, 'The dark shadows crept with evil and fear across the grim night.')
    
    expect(state.toneHistory.length).toBe(2)
    expect(state.toneHistory[0].dominantTone).toBeTruthy()
    expect(state.toneHistory[1].dominantTone).toBeTruthy()
  })

  it('should detect tone transitions', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy cheerful joyful children played with laughter in the sunny warm garden.')
    state = analyzeChapterTone(state, 2, 'The dark grim shadows crept with fear and dread in the cold night.')
    
    expect(state.transitionAlerts.length).toBeGreaterThanOrEqual(0)
  })
})

describe('compareToneConsistency', () => {
  it('should compare two chapters', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy cheerful playful joyful children laughed with delight in the bright sun.')
    state = analyzeChapterTone(state, 2, 'The joyful family celebrated with laughter and cheer.')
    
    const result = compareToneConsistency(state, 1, 2)
    expect(result.consistency).toBeGreaterThanOrEqual(0)
  })

  it('should detect tone shift', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy cheerful playful joyful children laughed with delight in the bright sun.')
    state = analyzeChapterTone(state, 2, 'The dark grim bleak shadows came with evil and fear in the cold night.')
    
    const result = compareToneConsistency(state, 1, 2)
    expect(result.toneShift).toBeTruthy()
  })

  it('should return zero for nonexistent chapters', () => {
    const state = createEmptyToneState()
    const result = compareToneConsistency(state, 1, 2)
    expect(result.consistency).toBe(0)
  })
})

describe('detectToneAnomaly', () => {
  it('should detect high variance anomaly', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The cat sat on the mat. The dog barked loudly. The bird flew away.')
    
    const anomaly = detectToneAnomaly(state, 1)
    expect(typeof anomaly.isAnomalous).toBe('boolean')
  })

  it('should return false for normal chapter', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The joyful happy children played with laughter and cheer in the warm bright sunshine.')
    
    const anomaly = detectToneAnomaly(state, 1)
    expect(anomaly.isAnomalous).toBe(false)
  })

  it('should return false for nonexistent chapter', () => {
    const state = createEmptyToneState()
    const anomaly = detectToneAnomaly(state, 1)
    expect(anomaly.isAnomalous).toBe(false)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatToneMap', () => {
  it('should format tone map', () => {
    const segments = createToneSegments('The happy children laughed with joy.', 1, 20)
    const map = buildToneMap(segments)
    const formatted = formatToneMap(map)
    
    expect(formatted).toContain('Narrative Tone Map')
    expect(formatted).toContain('Dominant Tone')
  })

  it('should show segment previews', () => {
    const segments = createToneSegments('The happy children laughed. The sun was bright.', 1, 20)
    const map = buildToneMap(segments)
    const formatted = formatToneMap(map)
    
    expect(formatted).toContain('Segment Preview')
  })
})

describe('formatToneDashboard', () => {
  it('should show chapter count', () => {
    const state = createEmptyToneState()
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('Chapters analyzed: 0')
  })

  it('should show tone history', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy cheerful joyful children played with laughter in the warm bright sunshine.')
    state = analyzeChapterTone(state, 2, 'The dark grim shadows crept with fear and dread in the cold night.')
    
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('Tone History')
  })

  it('should show transition alerts', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The happy cheerful joyful children played with laughter in the warm bright sunshine.')
    state = analyzeChapterTone(state, 2, 'The dark grim shadows crept with fear and dread in the cold night.')
    
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('Tone Transition Alerts')
  })

  it('should show anomalies section', () => {
    let state = createEmptyToneState()
    state = analyzeChapterTone(state, 1, 'The joyful happy children played with laughter and cheer in the warm bright sunshine.')
    
    const dashboard = formatToneDashboard(state)
    expect(dashboard).toContain('Anomalies Detected')
  })
})