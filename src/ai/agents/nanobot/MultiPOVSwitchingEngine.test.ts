import { describe, it, expect } from 'vitest'
import {
  detectPOVType,
  extractCharacterName,
  segmentTextByPOV,
  checkPOVConsistency,
  checkAllPOVConsistency,
  detectPOVSwitches,
  analyzePOVSwitchEffect,
  analyzePOVSwitches,
  createEmptyPOVState,
  buildPOVState,
  getPOVSummary,
  formatPOVReport,
  getPOVAtPosition,
  getPOVTrend,
  getNarrativeDistance,
  getEmotionalProximity,
  POVType,
  POVSegment,
} from './MultiPOVSwitchingEngine'

describe('detectPOVType', () => {
  it('should detect first person POV', () => {
    const result = detectPOVType('I walked through the forest. I felt someone watching me.')
    expect(result.povType).toBe('first_person')
    expect(result.confidence).toBeGreaterThanOrEqual(0.3)
  })

  it('should detect second person POV', () => {
    const result = detectPOVType('You walk through the forest. You feel a chill.')
    expect(result.povType).toBe('second_person')
    expect(result.confidence).toBeGreaterThanOrEqual(0.2)
  })

  it('should detect third person POV', () => {
    const result = detectPOVType('She walked through the forest. She saw a shadow.')
    expect(result.povType).toBe('third_person')
    expect(result.confidence).toBeGreaterThanOrEqual(0.2)
  })

  it('should detect omniscient indicators in text', () => {
    const result = detectPOVType('The world knew of his treachery. Beyond the horizon, fate would unfold.')
    // Omniscient indicators should be detected
    expect(result.indicators.some(i => i.includes('knew') || i.includes('fate') || i.includes('horizon'))).toBe(true)
  })

  it('should handle empty text', () => {
    const result = detectPOVType('')
    expect(result.povType).toBe('unknown')
    expect(result.confidence).toBe(0)
  })

  it('should return unknown for text with no clear POV markers', () => {
    const result = detectPOVType('The forest was dark. Trees stood tall.')
    expect(result.povType).toBe('unknown')
  })
})

describe('extractCharacterName', () => {
  it('should extract character name from third person text', () => {
    const name = extractCharacterName('Sarah was walking in the forest.', 'third_person')
    expect(name).toBe('Sarah')
  })

  it('should return null for first person without explicit name', () => {
    const name = extractCharacterName('I was walking in the forest.', 'first_person')
    expect(name).toBeNull()
  })
})

describe('segmentTextByPOV', () => {
  it('should segment text into POV chunks', () => {
    const text = 'I walked forward. The path was dark. She followed behind. I could hear her footsteps.'
    const segments = segmentTextByPOV(text, 20)
    expect(segments.length).toBeGreaterThan(0)
  })

  it('should identify first person segment', () => {
    const text = 'I walked through the forest. It was dark and cold.'
    const segments = segmentTextByPOV(text, 30)
    const firstPersonSegments = segments.filter(s => s.povType === 'first_person')
    expect(firstPersonSegments.length).toBeGreaterThan(0)
  })

  it('should assign confidence scores', () => {
    const text = 'I walked. I ran. I jumped.'
    const segments = segmentTextByPOV(text, 20)
    for (const seg of segments) {
      expect(seg.confidence).toBeGreaterThan(0)
      expect(seg.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('should include raw indicators', () => {
    const text = 'I walked through the forest. My feet crunched on leaves.'
    const segments = segmentTextByPOV(text, 30)
    for (const seg of segments) {
      expect(Array.isArray(seg.rawIndicators)).toBe(true)
    }
  })
})

describe('detectPOVSwitches', () => {
  it('should detect switch from first to third person', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 20, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] },
      { id: '2', startIndex: 20, endIndex: 50, povType: 'third_person', characterName: 'Sarah', confidence: 0.8, rawIndicators: [] }
    ]
    const switches = detectPOVSwitches(segments)
    expect(switches.length).toBe(1)
    expect(switches[0].from).toBe('first_person')
    expect(switches[0].to).toBe('third_person')
  })

  it('should detect smooth transition (close POVs)', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 30, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] },
      { id: '2', startIndex: 30, endIndex: 60, povType: 'second_person', characterName: null, confidence: 0.8, rawIndicators: [] }
    ]
    const switches = detectPOVSwitches(segments)
    // first_person (0.2) to second_person (0.3) = delta 0.1 which is < 0.2, so seamless
    expect(switches[0].smoothness).toBe('seamless')
  })

  it('should return empty for no switches', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 30, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] },
      { id: '2', startIndex: 30, endIndex: 60, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] }
    ]
    const switches = detectPOVSwitches(segments)
    expect(switches.length).toBe(0)
  })
})

describe('analyzePOVSwitchEffect', () => {
  it('should calculate narrative distance change', () => {
    const sw = {
      from: 'first_person' as POVType,
      to: 'omniscient' as POVType,
      character: null,
      position: 50,
      smoothness: 'abrupt' as const,
      narrativeDistanceChange: 'farther' as const
    }
    const effect = analyzePOVSwitchEffect(sw)
    expect(effect.narrativeDistanceAfter).toBeGreaterThan(effect.narrativeDistanceBefore)
  })

  it('should recommend keep for smooth transitions', () => {
    const sw = {
      from: 'first_person' as POVType,
      to: 'third_person' as POVType,
      character: null,
      position: 50,
      smoothness: 'seamless' as const,
      narrativeDistanceChange: 'same' as const
    }
    const effect = analyzePOVSwitchEffect(sw)
    expect(effect.recommendedTransition).toBe('keep')
  })

  it('should recommend soften for abrupt large jumps', () => {
    const sw = {
      from: 'first_person' as POVType,
      to: 'omniscient' as POVType,
      character: null,
      position: 50,
      smoothness: 'abrupt' as const,
      narrativeDistanceChange: 'farther' as const
    }
    const effect = analyzePOVSwitchEffect(sw)
    expect(['soften', 'remove']).toContain(effect.recommendedTransition)
  })
})

describe('analyzePOVSwitches', () => {
  it('should analyze multiple switches', () => {
    const switches = [
      { from: 'first_person' as POVType, to: 'third_person' as POVType, character: null, position: 20, smoothness: 'gradual' as const, narrativeDistanceChange: 'farther' as const },
      { from: 'third_person' as POVType, to: 'first_person' as POVType, character: null, position: 50, smoothness: 'gradual' as const, narrativeDistanceChange: 'closer' as const }
    ]
    const effects = analyzePOVSwitches(switches)
    expect(effects.length).toBe(2)
    expect(effects[0].switchIndex).toBe(0)
    expect(effects[1].switchIndex).toBe(1)
  })
})

describe('checkPOVConsistency', () => {
  it('should pass for consistent first person segment', () => {
    const segment: POVSegment = {
      id: '1', startIndex: 0, endIndex: 50, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: ['i:5']
    }
    const result = checkPOVConsistency(segment, 'I walked through the forest. I felt calm.', null)
    expect(result.isConsistent).toBe(true)
    expect(result.overallScore).toBeGreaterThan(0.9)
  })

  it('should detect inner thought leak in third person', () => {
    const segment: POVSegment = {
      id: '1', startIndex: 0, endIndex: 80, povType: 'third_person', characterName: 'Sarah', confidence: 0.8, rawIndicators: ['she:5']
    }
    // Text with unattributed inner knowledge (no character before "thought")
    const text = 'The room was dark. Thoughts drifted through the air. Wondering filled the space.'
    const result = checkPOVConsistency(segment, text, null)
    expect(result.violations.length).toBeGreaterThan(0)
  })
})

describe('checkAllPOVConsistency', () => {
  it('should check all segments for consistency', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 40, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] },
      { id: '2', startIndex: 40, endIndex: 80, povType: 'third_person', characterName: 'Sarah', confidence: 0.8, rawIndicators: [] }
    ]
    const text = 'I walked forward. Sarah was behind me.'
    const results = checkAllPOVConsistency(segments, text)
    expect(results.length).toBe(2)
  })
})

describe('createEmptyPOVState', () => {
  it('should create empty state with correct structure', () => {
    const state = createEmptyPOVState()
    expect(state.segments).toEqual([])
    expect(state.switches).toEqual([])
    expect(state.currentPOV).toBe('unknown')
    expect(state.dominantPOV).toBeNull()
    expect(state.povDistribution).toBeDefined()
  })
})

describe('buildPOVState', () => {
  it('should build complete state from text', () => {
    const text = 'I walked through the forest. She followed behind. The path was dark.'
    const state = buildPOVState(text)
    expect(state.segments.length).toBeGreaterThan(0)
    expect(state.switches.length).toBeGreaterThanOrEqual(0)
  })

  it('should calculate POV distribution', () => {
    const text = 'I walked through the dark forest. I felt the cold wind. I kept moving forward.'
    const state = buildPOVState(text, 30)
    expect(state.povDistribution.first_person).toBeGreaterThan(0)
  })

  it('should identify dominant POV', () => {
    const text = 'I walked through the forest. I ran through the trees. I jumped over the log. I danced in the clearing.'
    const state = buildPOVState(text, 30)
    expect(state.dominantPOV).toBe('first_person')
  })
})

describe('getPOVSummary', () => {
  it('should return summary with correct fields', () => {
    const text = 'I walked through the forest. She followed behind.'
    const state = buildPOVState(text)
    const summary = getPOVSummary(state)
    expect(summary.segmentCount).toBeGreaterThanOrEqual(0)
    expect(summary.switchCount).toBeGreaterThanOrEqual(0)
    expect(summary.consistencyScore).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(summary.recommendedActions)).toBe(true)
  })
})

describe('formatPOVReport', () => {
  it('should format report as string', () => {
    const text = 'I walked. She ran.'
    const state = buildPOVState(text)
    const report = formatPOVReport(state)
    expect(typeof report).toBe('string')
    expect(report.length).toBeGreaterThan(0)
    expect(report).toContain('POV')
  })
})

describe('getPOVAtPosition', () => {
  it('should find segment at given position', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 20, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] },
      { id: '2', startIndex: 20, endIndex: 50, povType: 'third_person', characterName: 'Sarah', confidence: 0.8, rawIndicators: [] }
    ]
    const state = createEmptyPOVState()
    // Manually set segments for testing
    const testState = { ...state, segments }
    const found = getPOVAtPosition(testState, 10)
    expect(found).not.toBeNull()
    expect(found?.povType).toBe('first_person')
  })

  it('should return null for position outside segments', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 20, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] }
    ]
    const state = { ...createEmptyPOVState(), segments }
    const found = getPOVAtPosition(state, 100)
    expect(found).toBeNull()
  })
})

describe('getPOVTrend', () => {
  it('should return trend data for segments', () => {
    const segments: POVSegment[] = [
      { id: '1', startIndex: 0, endIndex: 20, povType: 'first_person', characterName: null, confidence: 0.8, rawIndicators: [] },
      { id: '2', startIndex: 20, endIndex: 50, povType: 'omniscient', characterName: null, confidence: 0.8, rawIndicators: [] }
    ]
    const state = { ...createEmptyPOVState(), segments }
    const trend = getPOVTrend(state)
    expect(trend.length).toBe(2)
    expect(trend[0].distance).toBeLessThan(trend[1].distance)
  })
})

describe('getNarrativeDistance', () => {
  it('should return correct distances for POV types', () => {
    expect(getNarrativeDistance('first_person')).toBe(0.2)
    expect(getNarrativeDistance('second_person')).toBe(0.3)
    expect(getNarrativeDistance('third_person')).toBe(0.6)
    expect(getNarrativeDistance('omniscient')).toBe(0.9)
  })
})

describe('getEmotionalProximity', () => {
  it('should return correct proximities for POV types', () => {
    expect(getEmotionalProximity('first_person')).toBe(0.9)
    expect(getEmotionalProximity('second_person')).toBe(0.8)
    expect(getEmotionalProximity('third_person')).toBe(0.5)
    expect(getEmotionalProximity('omniscient')).toBe(0.3)
  })
})

describe('POV Detection Edge Cases', () => {
  it('should handle mixed pronouns', () => {
    const result = detectPOVType('I saw her and you together.')
    expect(result.povType).toBeDefined()
  })

  it('should handle very short text', () => {
    const result = detectPOVType('I')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should handle text with only omniscient indicators', () => {
    const result = detectPOVType('The stars watched. Beyond the horizon, fate would unfold.')
    expect(result.povType).toBe('omniscient')
  })
})

describe('Multi-switch narrative flow', () => {
  it('should analyze complex multi-switch narrative', () => {
    const text = 'I walked forward. Sarah was behind me. She knew something was wrong. I felt a chill. We moved together.'
    const state = buildPOVState(text)
    expect(state.switches.length).toBeGreaterThanOrEqual(0)
  })
})