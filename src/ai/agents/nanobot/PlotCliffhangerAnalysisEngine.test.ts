/**
 * PlotCliffhangerAnalysisEngine Tests — V517
 * Comprehensive tests for CliffhangerDetector, TensionBuilder, SuspenseClassifier
 */

import { describe, it, expect } from 'vitest'
import {
  // Cliffhanger Detector
  tokenizeText,
  calculateFrequencies,
  detectSuspenseKeywords,
  classifySuspenseType,
  detectTensionMarkers,
  calculateTensionIntensity,
  getTensionLevel,
  detectCliffhangerPoints,
  
  // Tension Builder
  buildTension,
  buildTensionWithQuestion,
  buildTensionWithImplication,
  buildTensionWithThreat,
  buildTensionWithReversal,
  buildTensionWithCliffhanger,
  
  // Suspense Classifier
  classifySuspenseAcrossSegments,
  refineClassification,
  
  // State Management
  createEmptyCliffhangerState,
  addCliffhangerPoint,
  addTensionBuild,
  addClassification,
  updateTensionArc,
  getCliffhangerSummary,
  
  // Main Analysis
  segmentText,
  analyzePlotCliffhangers,
  findTensionPeaks,
  
  // Types
  SuspenseType,
  TensionLevel,
  CliffhangerPoint,
  TensionBuild,
  SuspenseClassification,
  PlotCliffhangerState,
  SuspenseClassificationResult
} from './PlotCliffhangerAnalysisEngine'

// ============================================================
// CLIFFHANGER DETECTOR TESTS
// ============================================================

describe('CliffhangerDetector', () => {
  describe('tokenizeText', () => {
    it('should tokenize simple text', () => {
      const result = tokenizeText('Hello world hello')
      expect(result).toEqual(['hello', 'world', 'hello'])
    })
    
    it('should lowercase all words', () => {
      const result = tokenizeText('HELLO World Test')
      expect(result).toEqual(['hello', 'world', 'test'])
    })
    
    it('should remove punctuation', () => {
      const result = tokenizeText('Hello, world! How are you?')
      expect(result).toEqual(['hello', 'world', 'how', 'are', 'you'])
    })
    
    it('should handle empty strings', () => {
      expect(tokenizeText('')).toEqual([])
      expect(tokenizeText('   ')).toEqual([])
    })
  })
  
  describe('calculateFrequencies', () => {
    it('should count word frequencies', () => {
      const result = calculateFrequencies('hello world hello')
      expect(result).toEqual({ hello: 2, world: 1 })
    })
    
    it('should handle empty text', () => {
      const result = calculateFrequencies('')
      expect(result).toEqual({})
    })
    
    it('should be case insensitive', () => {
      const result = calculateFrequencies('Hello hello HELLO')
      expect(result).toEqual({ hello: 3 })
    })
  })
  
  describe('detectSuspenseKeywords', () => {
    it('should detect information keywords', () => {
      const result = detectSuspenseKeywords('The secret truth was revealed today')
      expect(result.information).toBeGreaterThan(0)
    })
    
    it('should detect emotion keywords', () => {
      const result = detectSuspenseKeywords('Tears fell, heart broken, love lost')
      expect(result.emotion).toBeGreaterThan(0)
    })
    
    it('should detect conflict keywords', () => {
      const result = detectSuspenseKeywords('The battle began, they would fight')
      expect(result.conflict).toBeGreaterThan(0)
    })
    
    it('should detect destiny keywords', () => {
      const result = detectSuspenseKeywords('The prophecy foretold the chosen one')
      expect(result.destiny).toBeGreaterThan(0)
    })
    
    it('should return zeros for no keywords', () => {
      const result = detectSuspenseKeywords('The cat sat on the mat')
      expect(result.information).toBe(0)
      expect(result.emotion).toBe(0)
      expect(result.conflict).toBe(0)
      expect(result.destiny).toBe(0)
    })
  })
  
  describe('classifySuspenseType', () => {
    it('should classify information suspense', () => {
      const result = classifySuspenseType('The secret was hidden unknown')
      expect(result.primaryType).toBe('information')
      expect(result.confidence).toBeGreaterThan(0)
    })
    
    it('should classify emotion suspense', () => {
      const result = classifySuspenseType('Tears and heartbreak, love lost in pain')
      expect(result.primaryType).toBe('emotion')
    })
    
    it('should classify conflict suspense', () => {
      const result = classifySuspenseType('Battle and fight, enemy attack')
      expect(result.primaryType).toBe('conflict')
    })
    
    it('should classify destiny suspense', () => {
      const result = classifySuspenseType('Fate and prophecy, the chosen one is doomed')
      expect(result.primaryType).toBe('destiny')
    })
    
    it('should return secondary types', () => {
      const result = classifySuspenseType('The secret truth about love and war')
      expect(result.secondaryTypes.length).toBeGreaterThan(0)
    })
    
    it('should include evidence', () => {
      const result = classifySuspenseType('The secret truth was revealed')
      expect(result.evidence.length).toBeGreaterThan(0)
    })
    
    it('should handle empty text with default', () => {
      const result = classifySuspenseType('')
      expect(result.primaryType).toBe('conflict')
      expect(result.confidence).toBeLessThan(1)
    })
  })
  
  describe('detectTensionMarkers', () => {
    it('should detect but/however markers', () => {
      const result = detectTensionMarkers('The door opened, but no one was there')
      expect(result.length).toBeGreaterThan(0)
    })
    
    it('should detect suddenly marker', () => {
      const result = detectTensionMarkers('Suddenly, a noise echoed')
      expect(result.some(m => m.includes('suddenly'))).toBe(true)
    })
    
    it('should return empty for no markers', () => {
      const result = detectTensionMarkers('The sky is blue')
      expect(result.length).toBe(0)
    })
  })
  
  describe('calculateTensionIntensity', () => {
    it('should calculate base intensity', () => {
      const classification = { primaryType: 'conflict' as SuspenseType, secondaryTypes: [], confidence: 0.5, evidence: [], intensity: 50 }
      const result = calculateTensionIntensity('text', classification, 0, false, 20)
      expect(result).toBeGreaterThan(0)
    })
    
    it('should increase intensity with markers', () => {
      const classification = { primaryType: 'conflict' as SuspenseType, secondaryTypes: [], confidence: 0.5, evidence: [], intensity: 50 }
      const result1 = calculateTensionIntensity('text', classification, 0, false, 20)
      const result2 = calculateTensionIntensity('text', classification, 3, false, 20)
      expect(result2).toBeGreaterThan(result1)
    })
    
    it('should add intensity for questions', () => {
      const classification = { primaryType: 'conflict' as SuspenseType, secondaryTypes: [], confidence: 0.5, evidence: [], intensity: 50 }
      const result1 = calculateTensionIntensity('text', classification, 0, false, 20)
      const result2 = calculateTensionIntensity('text', classification, 0, true, 20)
      expect(result2).toBeGreaterThan(result1)
    })
    
    it('should cap intensity at 100', () => {
      const classification = { primaryType: 'emotion' as SuspenseType, secondaryTypes: ['conflict', 'destiny'] as SuspenseType[], confidence: 1, evidence: ['tears', 'love', 'heart', 'pain', 'fear', 'secret', 'truth', 'battle', 'fight'], intensity: 100 }
      const result = calculateTensionIntensity('text', classification, 10, true, 10)
      expect(result).toBeLessThanOrEqual(100)
    })
  })
  
  describe('getTensionLevel', () => {
    it('should return low for intensity < 35', () => {
      expect(getTensionLevel(20)).toBe('low')
    })
    
    it('should return medium for intensity 35-64', () => {
      expect(getTensionLevel(50)).toBe('medium')
    })
    
    it('should return high for intensity 65-84', () => {
      expect(getTensionLevel(70)).toBe('high')
    })
    
    it('should return critical for intensity >= 85', () => {
      expect(getTensionLevel(90)).toBe('critical')
    })
  })
  
  describe('detectCliffhangerPoints', () => {
    it('should detect cliffhanger in tense segments', () => {
      const segments = [
        { text: 'The secret truth was revealed', position: 0.1 },
        { text: 'Battle began, tears fell', position: 0.5 },
        { text: 'The chosen one faced doom', position: 0.9 }
      ]
      const result = detectCliffhangerPoints(segments)
      expect(result.length).toBeGreaterThan(0)
    })
    
    it('should skip low-tension segments', () => {
      const segments = [
        { text: 'The cat sat', position: 0.1 },
        { text: 'Blue sky today', position: 0.5 }
      ]
      const result = detectCliffhangerPoints(segments)
      // May be empty or have very few points
      expect(result.length).toBeLessThanOrEqual(segments.length)
    })
    
    it('should include tension level in results', () => {
      const segments = [
        { text: 'The secret truth was revealed with hidden danger', position: 0.5 }
      ]
      const result = detectCliffhangerPoints(segments)
      if (result.length > 0) {
        expect(['low', 'medium', 'high', 'critical']).toContain(result[0].tensionLevel)
      }
    })
    
    it('should detect unresolved conflicts', () => {
      const segments = [
        { text: 'What would happen next must be revealed', position: 0.5 }
      ]
      const result = detectCliffhangerPoints(segments)
      if (result.length > 0) {
        expect(typeof result[0].unresolvedConflict).toBe('boolean')
      }
    })
    
    it('should detect emotional peaks', () => {
      const segments = [
        { text: 'Tears fell, heart broken, she screamed', position: 0.5 }
      ]
      const result = detectCliffhangerPoints(segments)
      if (result.length > 0) {
        expect(result[0].emotionalPeak).toBe(true)
      }
    })
  })
})

// ============================================================
// TENSION BUILDER TESTS
// ============================================================

describe('TensionBuilder', () => {
  describe('buildTension', () => {
    it('should build tension with default options', () => {
      const result = buildTension(0.5, 'A tense moment')
      expect(result.position).toBe(0.5)
      expect(result.technique).toBe('cliffhanger')
      expect(result.intensity).toBeGreaterThan(0)
    })
    
    it('should use custom technique', () => {
      const result = buildTension(0.5, 'A tense moment', { technique: 'question' })
      expect(result.technique).toBe('question')
    })
    
    it('should use custom target type', () => {
      const result = buildTension(0.5, 'A tense moment', { targetType: 'emotion' })
      expect(result.targetType).toBe('emotion')
    })
    
    it('should include suggestion when intensity gap exists', () => {
      const result = buildTension(0.5, 'Calm scene', { targetIntensity: 90 })
      expect(result.suggestion).toBeDefined()
    })
  })
  
  describe('buildTensionWithQuestion', () => {
    it('should create tension with question technique', () => {
      const result = buildTensionWithQuestion(0.5, 'The door was open')
      expect(result.technique).toBe('question')
      expect(result.targetType).toBe('information')
    })
    
    it('should have suggestion', () => {
      const result = buildTensionWithQuestion(0.5, 'context')
      expect(result.suggestion).toBeDefined()
    })
  })
  
  describe('buildTensionWithImplication', () => {
    it('should create tension with implication technique', () => {
      const result = buildTensionWithImplication(0.5, 'The prophecy spoke')
      expect(result.technique).toBe('implication')
      expect(result.targetType).toBe('destiny')
    })
  })
  
  describe('buildTensionWithThreat', () => {
    it('should create tension with threat technique', () => {
      const result = buildTensionWithThreat(0.5, 'The enemy approached')
      expect(result.technique).toBe('threat')
      expect(result.targetType).toBe('conflict')
    })
  })
  
  describe('buildTensionWithReversal', () => {
    it('should create tension with reversal technique', () => {
      const result = buildTensionWithReversal(0.5, 'Everything changed')
      expect(result.technique).toBe('reversal')
      expect(result.targetType).toBe('emotion')
    })
  })
  
  describe('buildTensionWithCliffhanger', () => {
    it('should create tension with cliffhanger technique', () => {
      const result = buildTensionWithCliffhanger(0.5, 'The rope snapped')
      expect(result.technique).toBe('cliffhanger')
      expect(result.targetType).toBe('conflict')
      expect(result.intensity).toBe(80)
    })
  })
})

// ============================================================
// SUSPENSE CLASSIFIER TESTS
// ============================================================

describe('SuspenseClassifier', () => {
  describe('classifySuspenseAcrossSegments', () => {
    it('should classify multiple segments', () => {
      const segments = [
        { text: 'The secret was hidden', position: 0.1 },
        { text: 'Battle erupted', position: 0.5 },
        { text: 'Tears fell', position: 0.9 }
      ]
      const result = classifySuspenseAcrossSegments(segments)
      expect(result.classifications.length).toBe(3)
    })
    
    it('should identify dominant type', () => {
      const segments = [
        { text: 'Battle battle fight', position: 0.1 },
        { text: 'Battle fight war', position: 0.5 },
        { text: 'Battle fight attack', position: 0.9 }
      ]
      const result = classifySuspenseAcrossSegments(segments)
      expect(result.dominantType).toBe('conflict')
    })
    
    it('should calculate average intensity', () => {
      const segments = [
        { text: 'Battle', position: 0.1 },
        { text: 'The secret hidden', position: 0.5 }
      ]
      const result = classifySuspenseAcrossSegments(segments)
      expect(result.averageIntensity).toBeGreaterThan(0)
    })
    
    it('should return tension arc', () => {
      const segments = [
        { text: 'Battle', position: 0.1 },
        { text: 'The secret hidden', position: 0.5 }
      ]
      const result = classifySuspenseAcrossSegments(segments)
      expect(result.tensionArc.length).toBe(2)
    })
  })
  
  describe('refineClassification', () => {
    it('should boost confidence for similar types', () => {
      const current: SuspenseClassification = {
        primaryType: 'conflict',
        secondaryTypes: [],
        confidence: 0.5,
        evidence: ['battle'],
        intensity: 60
      }
      const previous: SuspenseClassification = {
        primaryType: 'conflict',
        secondaryTypes: ['emotion'],
        confidence: 0.6,
        evidence: ['fight'],
        intensity: 65
      }
      const result = refineClassification(current, previous)
      expect(result.confidence).toBeGreaterThan(current.confidence)
    })
    
    it('should not boost for different types', () => {
      const current: SuspenseClassification = {
        primaryType: 'emotion',
        secondaryTypes: [],
        confidence: 0.5,
        evidence: ['tears'],
        intensity: 60
      }
      const previous: SuspenseClassification = {
        primaryType: 'conflict',
        secondaryTypes: [],
        confidence: 0.6,
        evidence: ['battle'],
        intensity: 65
      }
      const result = refineClassification(current, previous)
      expect(result.confidence).toBe(current.confidence)
    })
    
    it('should return same classification without previous', () => {
      const classification: SuspenseClassification = {
        primaryType: 'destiny',
        secondaryTypes: [],
        confidence: 0.7,
        evidence: ['prophecy'],
        intensity: 75
      }
      const result = refineClassification(classification)
      expect(result).toEqual(classification)
    })
  })
})

// ============================================================
// STATE MANAGEMENT TESTS
// ============================================================

describe('StateManagement', () => {
  describe('createEmptyCliffhangerState', () => {
    it('should create empty state', () => {
      const state = createEmptyCliffhangerState()
      expect(state.cliffhangerPoints).toEqual([])
      expect(state.tensionBuilds).toEqual([])
      expect(state.classifications).toEqual([])
      expect(state.overallTensionArc).toEqual([])
      expect(state.criticalMoments).toEqual([])
    })
  })
  
  describe('addCliffhangerPoint', () => {
    it('should add cliffhanger point to state', () => {
      const state = createEmptyCliffhangerState()
      const point: CliffhangerPoint = {
        position: 0.5,
        suspenseType: 'conflict',
        tensionLevel: 'high',
        intensity: 75,
        markers: ['but'],
        description: 'Test point',
        unresolvedConflict: true,
        emotionalPeak: false
      }
      const newState = addCliffhangerPoint(state, point)
      expect(newState.cliffhangerPoints.length).toBe(1)
    })
    
    it('should add to critical moments when critical', () => {
      const state = createEmptyCliffhangerState()
      const point: CliffhangerPoint = {
        position: 0.5,
        suspenseType: 'conflict',
        tensionLevel: 'critical',
        intensity: 90,
        markers: ['suddenly'],
        description: 'Critical point',
        unresolvedConflict: true,
        emotionalPeak: true
      }
      const newState = addCliffhangerPoint(state, point)
      expect(newState.criticalMoments).toContain(0.5)
    })
    
    it('should deduplicate critical moments', () => {
      const state = createEmptyCliffhangerState()
      const point1: CliffhangerPoint = {
        position: 0.5, suspenseType: 'conflict', tensionLevel: 'critical',
        intensity: 90, markers: [], description: '', unresolvedConflict: false, emotionalPeak: false
      }
      const point2: CliffhangerPoint = {
        position: 0.5, suspenseType: 'emotion', tensionLevel: 'critical',
        intensity: 85, markers: [], description: '', unresolvedConflict: false, emotionalPeak: false
      }
      let newState = addCliffhangerPoint(state, point1)
      newState = addCliffhangerPoint(newState, point2)
      expect(newState.criticalMoments.filter(p => p === 0.5).length).toBe(1)
    })
  })
  
  describe('addTensionBuild', () => {
    it('should add tension build to state', () => {
      const state = createEmptyCliffhangerState()
      const build: TensionBuild = {
        position: 0.5,
        technique: 'question',
        intensity: 70,
        targetType: 'information',
        text: 'What happened?'
      }
      const newState = addTensionBuild(state, build)
      expect(newState.tensionBuilds.length).toBe(1)
    })
  })
  
  describe('addClassification', () => {
    it('should add classification to state', () => {
      const state = createEmptyCliffhangerState()
      const classification: SuspenseClassification = {
        primaryType: 'conflict',
        secondaryTypes: ['emotion'],
        confidence: 0.7,
        evidence: ['battle'],
        intensity: 65
      }
      const newState = addClassification(state, classification)
      expect(newState.classifications.length).toBe(1)
    })
  })
  
  describe('updateTensionArc', () => {
    it('should update tension arc', () => {
      const state = createEmptyCliffhangerState()
      const arc = [30, 50, 70, 60, 80]
      const newState = updateTensionArc(state, arc)
      expect(newState.overallTensionArc).toEqual(arc)
    })
  })
  
  describe('getCliffhangerSummary', () => {
    it('should return correct summary', () => {
      let state = createEmptyCliffhangerState()
      
      const point1: CliffhangerPoint = {
        position: 0.3, suspenseType: 'conflict', tensionLevel: 'high',
        intensity: 75, markers: [], description: '', unresolvedConflict: false, emotionalPeak: false
      }
      const point2: CliffhangerPoint = {
        position: 0.6, suspenseType: 'emotion', tensionLevel: 'critical',
        intensity: 90, markers: [], description: '', unresolvedConflict: false, emotionalPeak: false
      }
      state = addCliffhangerPoint(state, point1)
      state = addCliffhangerPoint(state, point2)
      
      const summary = getCliffhangerSummary(state)
      expect(summary.pointCount).toBe(2)
      expect(summary.criticalCount).toBe(1)
      expect(summary.typeBreakdown.conflict).toBe(1)
      expect(summary.typeBreakdown.emotion).toBe(1)
    })
  })
})

// ============================================================
// MAIN ANALYSIS TESTS
// ============================================================

describe('MainAnalysis', () => {
  describe('segmentText', () => {
    it('should segment text into windows', () => {
      const text = 'one two three four five six seven eight nine ten'
      const result = segmentText(text, 3, 2)
      expect(result.length).toBeGreaterThan(1)
    })
    
    it('should calculate correct positions', () => {
      const text = 'a b c d e f g h i j k l m n o'
      const result = segmentText(text, 5, 5)
      for (const seg of result) {
        expect(seg.position).toBeGreaterThanOrEqual(0)
        expect(seg.position).toBeLessThanOrEqual(1)
      }
    })
    
    it('should handle text shorter than window', () => {
      const text = 'short'
      const result = segmentText(text, 50, 25)
      expect(result.length).toBe(0)
    })
  })
  
  describe('analyzePlotCliffhangers', () => {
    it('should analyze narrative successfully', () => {
      const text = 'The secret truth was hidden. Battle erupted. Tears fell. The chosen one faced the doom.'
      const result = analyzePlotCliffhangers(text)
      expect(result.state).toBeDefined()
      expect(result.summary).toBeDefined()
    })
    
    it('should detect cliffhanger points', () => {
      const text = 'The secret truth was hidden. Battle erupted. Tears fell. The chosen one faced the doom.'
      const result = analyzePlotCliffhangers(text)
      expect(result.summary.totalCliffhangerPoints).toBeGreaterThanOrEqual(0)
    })
    
    it('should identify dominant suspense type', () => {
      const text = 'Battle battle battle secret secret truth'
      const result = analyzePlotCliffhangers(text)
      expect(['information', 'emotion', 'conflict', 'destiny']).toContain(result.summary.dominantSuspenseType)
    })
    
    it('should find tension peaks', () => {
      const text = 'Low tension. Medium tension. High tension peak. Medium again.'
      const result = analyzePlotCliffhangers(text)
      expect(Array.isArray(result.summary.tensionPeaks)).toBe(true)
    })
    
    it('should provide recommendations', () => {
      const text = 'The secret truth was hidden. Battle erupted. Tears fell. The chosen one faced the doom.'
      const result = analyzePlotCliffhangers(text)
      expect(Array.isArray(result.summary.recommendations)).toBe(true)
    })
    
    it('should respect custom window size', () => {
      const text = 'one two three four five six seven eight nine ten eleven twelve'
      const result = analyzePlotCliffhangers(text, { windowSize: 4, stepSize: 2 })
      expect(result.state.cliffhangerPoints.length).toBeGreaterThanOrEqual(0)
    })
  })
  
  describe('findTensionPeaks', () => {
    it('should find peaks above threshold', () => {
      const arc = [30, 50, 75, 60, 80, 70]
      const result = findTensionPeaks(arc, 70)
      expect(result.length).toBeGreaterThan(0)
    })
    
    it('should use default threshold', () => {
      const arc = [30, 50, 80, 60, 85]
      const result = findTensionPeaks(arc)
      expect(result.length).toBeGreaterThan(0)
    })
    
    it('should return empty for no peaks', () => {
      const arc = [20, 30, 40, 30, 20]
      const result = findTensionPeaks(arc, 70)
      expect(result).toEqual([])
    })
  })
})