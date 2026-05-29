import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  recordTension,
  getChapterTension,
  compareTensionWaves,
} from './NarrativeTensionWaves'

describe('createEmptyState', () => {
  it('should create empty tension state', () => {
    const s = createEmptyState()
    expect(s.tensionPoints).toEqual([])
    expect(s.waves).toEqual([])
    expect(s.typeAlias).toEqual({})
  })
})

describe('recordTension', () => {
  it('should record tension points', () => {
    let s = createEmptyState()
    s = recordTension(s, 'ch1', 10, 70, 'action')
    s = recordTension(s, 'ch1', 50, 60, 'dialogue')
    expect(s.tensionPoints.length).toBe(2)
    expect(s.currentTrend).not.toBeNull()
  })

  it('should detect rising trend', () => {
    let s = createEmptyState()
    s = recordTension(s, 'ch1', 10, 30, 'description')
    s = recordTension(s, 'ch2', 10, 40, 'description')
    s = recordTension(s, 'ch3', 10, 50, 'description')
    s = recordTension(s, 'ch4', 10, 60, 'description')
    expect(s.currentTrend!.overallTrend).toBe('rising')
  })

  it('should detect falling trend', () => {
    let s = createEmptyState()
    s = recordTension(s, 'ch1', 10, 70, 'action')
    s = recordTension(s, 'ch2', 10, 60, 'action')
    s = recordTension(s, 'ch3', 10, 50, 'action')
    expect(s.currentTrend!.overallTrend).toBe('falling')
  })
})

describe('getChapterTension', () => {
  it('should return zeros for unknown chapter', () => {
    const s = createEmptyState()
    const result = getChapterTension(s, 'unknown')
    expect(result.avgTension).toBe(0)
    expect(result.peakTension).toBe(0)
  })

  it('should calculate chapter average', () => {
    let s = createEmptyState()
    s = recordTension(s, 'ch1', 10, 70, 'action')
    s = recordTension(s, 'ch1', 50, 80, 'climax')
    s = recordTension(s, 'ch1', 90, 60, 'resolution')
    const result = getChapterTension(s, 'ch1')
    expect(result.avgTension).toBe(Math.round((70 + 80 + 60) / 3))
    expect(result.peakTension).toBe(80)
  })

  it('should count scene types', () => {
    let s = createEmptyState()
    s = recordTension(s, 'ch1', 20, 70, 'action')
    s = recordTension(s, 'ch1', 50, 60, 'dialogue')
    s = recordTension(s, 'ch1', 80, 50, 'dialogue')
    const result = getChapterTension(s, 'ch1')
    expect(result.sceneBreakdown.action).toBe(1)
    expect(result.sceneBreakdown.dialogue).toBe(2)
  })
})

describe('compareTensionWaves', () => {
  it('should compare two chapters', () => {
    let s = createEmptyState()
    s = recordTension(s, 'ch1', 50, 80, 'climax')
    s = recordTension(s, 'ch2', 50, 40, 'description')
    const result = compareTensionWaves(s, 'ch1', 'ch2')
    expect(result.moreIntense).toBe('ch1')
    expect(result.tensionDiff).toBe(40)
  })
})
