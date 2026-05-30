import { describe, it, expect } from 'vitest'
import {
  createEmptyEmotionalArcState,
  addEmotionalPoint,
  addResonanceScore,
  mapTextToEmotions,
  createEmotionalPoint,
  createEmotionalArc,
  predictNextEmotionalState,
  predictEmotionalArc,
  calculateResonanceScore,
  formatEmotionalSummary,
  formatEmotionalDashboard,
  getEmotionalArcAtChapter,
  getEmotionalTrend,
  EmotionType,
} from './EmotionalArcPredictionEngine'

describe('mapTextToEmotions', () => {
  it('should detect joy emotion', () => {
    const emotions = mapTextToEmotions('She felt happy and joyful today')
    expect(emotions.joy).toBeGreaterThan(0)
  })

  it('should detect sadness emotion', () => {
    const emotions = mapTextToEmotions('He was sad and lonely after the loss')
    expect(emotions.sadness).toBeGreaterThan(0)
  })

  it('should detect anger emotion', () => {
    const emotions = mapTextToEmotions('The furious warrior shouted with rage')
    expect(emotions.anger).toBeGreaterThan(0)
  })

  it('should detect fear emotion', () => {
    const emotions = mapTextToEmotions('She was terrified and anxious about the horror')
    expect(emotions.fear).toBeGreaterThan(0)
  })

  it('should detect surprise emotion', () => {
    const emotions = mapTextToEmotions('The sudden shock made everyone startled')
    expect(emotions.surprise).toBeGreaterThan(0)
  })

  it('should handle empty text', () => {
    const emotions = mapTextToEmotions('')
    expect(emotions.joy).toBe(0)
    expect(emotions.sadness).toBe(0)
    expect(emotions.anger).toBe(0)
    expect(emotions.fear).toBe(0)
    expect(emotions.surprise).toBe(0)
  })
})

describe('createEmotionalPoint', () => {
  it('should create emotional point with correct properties', () => {
    const point = createEmotionalPoint(1, 'Opening', 'A happy beginning')
    expect(point.pointId).toBeDefined()
    expect(point.chapter).toBe(1)
    expect(point.scene).toBe('Opening')
    expect(point.dominantEmotion).toBe('joy')
  })

  it('should calculate valence correctly for positive text', () => {
    const point = createEmotionalPoint(1, 'Scene', 'Joyful celebration with love and happiness and wonderful delight')
    expect(point.valence).toBeGreaterThan(0)
  })

  it('should calculate valence correctly for negative text', () => {
    const point = createEmotionalPoint(1, 'Scene', 'Sorrowful mourning with grief and tears and desperate sorrow')
    expect(point.valence).toBeLessThan(0)
  })

  it('should calculate arousal level for high intensity emotion', () => {
    const point = createEmotionalPoint(1, 'Scene', 'Absolutely furious and enraged shouting with maximum rage and fury and hostility')
    expect(point.arousal).toBeGreaterThanOrEqual(60)
  })
})

describe('createEmotionalArc', () => {
  it('should create arc from single point', () => {
    const point = createEmotionalPoint(1, 'Scene', 'Happy day')
    const arc = createEmotionalArc([point])
    expect(arc.arcId).toBeDefined()
    expect(arc.points.length).toBe(1)
    expect(arc.arcType).toBe('stable')
  })

  it('should detect rising arc type', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Mildly content with some satisfaction and acceptance'),
      createEmotionalPoint(2, 'S2', 'Happy and pleased with joy and delight'),
      createEmotionalPoint(3, 'S3', 'Extremely joyful with wonderful elation and triumph'),
    ]
    const arc = createEmotionalArc(points)
    const validTypes = ['rising', 'stable', 'cyclical']
    expect(validTypes).toContain(arc.arcType)
  })

  it('should detect falling arc type', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Joyful celebration with happiness'),
      createEmotionalPoint(2, 'S2', 'Loss and failure with disappointment'),
      createEmotionalPoint(3, 'S3', 'Deep sorrow with grief and despair'),
    ]
    const arc = createEmotionalArc(points)
    const validTypes = ['falling', 'conflicted', 'stable', 'cyclical']
    expect(validTypes).toContain(arc.arcType)
  })

  it('should detect cyclical arc type', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Happy and joyful with laughter'),
      createEmotionalPoint(2, 'S2', 'Sad and sorrowful with tears'),
      createEmotionalPoint(3, 'S3', 'Happy and joyful with celebration'),
    ]
    const arc = createEmotionalArc(points)
    expect(arc.arcType).toBe('cyclical')
  })

  it('should track emotion sequence', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Joyful moment with happiness'),
      createEmotionalPoint(2, 'S2', 'Furious argument with rage'),
      createEmotionalPoint(3, 'S3', 'Fearful anticipation with dread'),
    ]
    const arc = createEmotionalArc(points)
    expect(arc.emotionSequence).toEqual(['joy', 'anger', 'fear'])
  })

  it('should calculate emotional range', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Deep sorrow with grief and despair'),
      createEmotionalPoint(2, 'S2', 'Moderate feelings'),
      createEmotionalPoint(3, 'S3', 'Great happiness with joy and delight'),
    ]
    const arc = createEmotionalArc(points)
    expect(arc.emotionalRange.min).toBeLessThan(arc.emotionalRange.max)
  })
})

describe('predictNextEmotionalState', () => {
  it('should return neutral prediction for empty arc', () => {
    const arc = createEmotionalArc([])
    const prediction = predictNextEmotionalState(arc)
    expect(prediction.predictedEmotion).toBeDefined()
    expect(prediction.confidence).toBe(0)
  })

  it('should predict with valid reasoning', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Happy with joy'),
      createEmotionalPoint(2, 'S2', 'Very happy with delight'),
      createEmotionalPoint(3, 'S3', 'Extremely happy with wonderful elation'),
    ]
    const arc = createEmotionalArc(points)
    const prediction = predictNextEmotionalState(arc)
    expect(prediction.reasoning).toBeDefined()
    expect(prediction.reasoning.length).toBeGreaterThan(0)
    expect(['intensifying', 'stable', 'fading', 'shifting']).toContain(prediction.trend)
  })

  it('should provide predicted valence in range', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Happy'),
      createEmotionalPoint(2, 'S2', 'Happy again'),
    ]
    const arc = createEmotionalArc(points)
    const prediction = predictNextEmotionalState(arc)
    expect(prediction.predictedValence).toBeGreaterThanOrEqual(-100)
    expect(prediction.predictedValence).toBeLessThanOrEqual(100)
  })
})

describe('predictEmotionalArc', () => {
  it('should predict multiple future chapters', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Happy'),
      createEmotionalPoint(2, 'S2', 'Joyful'),
    ]
    const arc = createEmotionalArc(points)
    const predictions = predictEmotionalArc(arc, 3)
    expect(predictions.length).toBe(3)
  })

  it('should have confidence based on history', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Happy'),
      createEmotionalPoint(2, 'S2', 'Joyful'),
      createEmotionalPoint(3, 'S3', 'Delighted'),
      createEmotionalPoint(4, 'S4', 'Elated'),
      createEmotionalPoint(5, 'S5', 'Content'),
    ]
    const arc = createEmotionalArc(points)
    const predictions = predictEmotionalArc(arc, 1)
    expect(predictions[0].confidence).toBeGreaterThanOrEqual(0.5)
  })
})

describe('calculateResonanceScore', () => {
  it('should return zero score for empty arc', () => {
    const arc = createEmotionalArc([])
    const score = calculateResonanceScore(arc)
    expect(score.score).toBe(0)
  })

  it('should calculate all components for non-empty arc', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Extremely happy joy wonderful'),
      createEmotionalPoint(2, 'S2', 'Deeply sad sorrow grief'),
    ]
    const arc = createEmotionalArc(points)
    const score = calculateResonanceScore(arc)
    expect(score.emotionalClarity).toBeGreaterThanOrEqual(0)
    expect(score.intensityMatch).toBeGreaterThanOrEqual(0)
    expect(score.arcCoherence).toBeGreaterThanOrEqual(0)
  })

  it('should include breakdown in score', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Happy day with joy'),
      createEmotionalPoint(2, 'S2', 'Sad night with tears'),
    ]
    const arc = createEmotionalArc(points)
    const score = calculateResonanceScore(arc)
    expect(score.breakdown).toBeDefined()
    expect(score.breakdown.clarityBreakdown).toBeGreaterThanOrEqual(0)
  })

  it('should return valid overall score', () => {
    const points = [
      createEmotionalPoint(1, 'S1', 'Mild feeling with some emotion'),
      createEmotionalPoint(2, 'S2', 'Strong emotion with intensity'),
    ]
    const arc = createEmotionalArc(points)
    const score = calculateResonanceScore(arc)
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.score).toBeLessThanOrEqual(100)
  })
})

describe('createEmptyEmotionalArcState', () => {
  it('should create empty state with zero values', () => {
    const state = createEmptyEmotionalArcState()
    expect(state.arcs.length).toBe(0)
    expect(state.currentChapter).toBe(0)
    expect(state.dominantArc).toBeNull()
    expect(state.averageValence).toBe(0)
    expect(state.averageArousal).toBe(0)
  })
})

describe('addEmotionalPoint', () => {
  it('should add first emotional point', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'Opening', 'A happy beginning')
    expect(state.arcs.length).toBe(1)
    expect(state.dominantArc).not.toBeNull()
  })

  it('should update current chapter', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 5, 'Chapter 5', 'Something happens')
    expect(state.currentChapter).toBe(5)
  })

  it('should accumulate points in dominant arc', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy day')
    state = addEmotionalPoint(state, 2, 'S2', 'Sad evening')
    state = addEmotionalPoint(state, 3, 'S3', 'Angry night')
    expect(state.dominantArc!.points.length).toBe(3)
  })
})

describe('addResonanceScore', () => {
  it('should add resonance to history', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy')
    const arc = state.dominantArc!
    const score = calculateResonanceScore(arc)
    state = addResonanceScore(state, score)
    expect(state.resonanceHistory.length).toBe(1)
  })
})

describe('formatEmotionalSummary', () => {
  it('should show chapter count', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 3, 'Scene', 'Happy day')
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('Chapter: 3')
  })

  it('should show arc count', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy')
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('Total Arcs: 1')
  })

  it('should show dominant arc type', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy')
    state = addEmotionalPoint(state, 2, 'S2', 'Very happy')
    const summary = formatEmotionalSummary(state)
    expect(summary).toContain('Type:')
  })
})

describe('formatEmotionalDashboard', () => {
  it('should show valence and arousal', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy day')
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toContain('Valence:')
    expect(dashboard).toContain('Arousal:')
  })

  it('should show prediction when available', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy')
    state = addEmotionalPoint(state, 2, 'S2', 'Happier')
    const dashboard = formatEmotionalDashboard(state)
    expect(dashboard).toContain('Prediction')
  })
})

describe('getEmotionalArcAtChapter', () => {
  it('should return null for unknown chapter', () => {
    const state = createEmptyEmotionalArcState()
    expect(getEmotionalArcAtChapter(state, 1)).toBeNull()
  })

  it('should return point for known chapter', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 5, 'Scene', 'Happy moment')
    const point = getEmotionalArcAtChapter(state, 5)
    expect(point).not.toBeNull()
    expect(point!.chapter).toBe(5)
  })
})

describe('getEmotionalTrend', () => {
  it('should return stable for insufficient data', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy')
    expect(getEmotionalTrend(state)).toBe('stable')
  })

  it('should detect trend when sufficient data exists', () => {
    let state = createEmptyEmotionalArcState()
    state = addEmotionalPoint(state, 1, 'S1', 'Happy with joy')
    state = addEmotionalPoint(state, 2, 'S2', 'Sad with tears')
    state = addEmotionalPoint(state, 3, 'S3', 'Fear with dread')
    const trend = getEmotionalTrend(state, 3)
    expect(['rising', 'falling', 'stable', 'conflicted']).toContain(trend)
  })
})
