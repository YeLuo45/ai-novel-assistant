/**
 * MetaNarrativeAnalysisEngine Tests — V520
 * Comprehensive tests for MetaLayerDetector, SelfAwarenessScorer, NarrativeFramingAnalyzer
 */

import { describe, it, expect } from 'vitest'
import {
  // Core analysis functions
  detectMetaLayer,
  calculateSelfAwareness,
  analyzeFraming,
  analyzeMetaNarrative,
  getMetaNarrativeSummary,
  
  // Utility functions
  splitIntoSentences,
  
  // Types for type checking
  MetaLayerDetectionResult,
  SelfAwarenessScore,
  NarrativeFramingResult,
  MetaNarrativeAnalysisResult,
  MetaNarrativeElement,
  FramingType
} from './MetaNarrativeAnalysisEngine'

// ============================================================
// SPLIT INTO SENTENCES TESTS
// ============================================================

describe('splitIntoSentences', () => {
  it('should split Chinese sentences by 。', () => {
    const result = splitIntoSentences('这是第一句。这是第二句。第三句。')
    expect(result).toEqual(['这是第一句', '这是第二句', '第三句'])
  })
  
  it('should split English sentences by .', () => {
    const result = splitIntoSentences('This is first. This is second. Third.')
    expect(result).toEqual(['This is first', 'This is second', 'Third'])
  })
  
  it('should split mixed punctuation', () => {
    const result = splitIntoSentences('你好！Hello? Are you ok? 是的。')
    expect(result).toEqual(['你好', 'Hello', 'Are you ok', '是的'])
  })
  
  it('should handle empty string', () => {
    expect(splitIntoSentences('')).toEqual([])
  })
  
  it('should handle string with only spaces', () => {
    expect(splitIntoSentences('   ')).toEqual([])
  })
  
  it('should trim whitespace from sentences', () => {
    const result = splitIntoSentences('  句一  。 句二  。')
    expect(result).toEqual(['句一', '句二'])
  })
})

// ============================================================
// META LAYER DETECTOR TESTS
// ============================================================

describe('detectMetaLayer', () => {
  describe('author intervention detection', () => {
    it('should detect Chinese author intervention markers', () => {
      const result = detectMetaLayer('我亲爱的读者，这故事要从头说起。')
      expect(result.detectedElements).toContain('author_intervention')
      expect(result.hasMetaElements).toBe(true)
    })
    
    it('should detect English author intervention markers', () => {
      const result = detectMetaLayer('Dear reader, let me tell you a story.')
      expect(result.detectedElements).toContain('author_intervention')
    })
    
    it('should detect multiple author markers', () => {
      const result = detectMetaLayer('亲爱的读者，你们或许会问，笔者必须说明。')
      expect(result.detectedElements).toContain('author_intervention')
    })
  })
  
  describe('textual self-reference detection', () => {
    it('should detect Chinese self-reference markers', () => {
      const result = detectMetaLayer('这本书讲述了一个神奇的故事。')
      expect(result.detectedElements).toContain('textual_self_reference')
    })
    
    it('should detect English self-reference markers', () => {
      const result = detectMetaLayer('This story begins with a mysterious letter.')
      expect(result.detectedElements).toContain('textual_self_reference')
    })
  })
  
  describe('framed narrative detection', () => {
    it('should detect Chinese frame story markers', () => {
      const result = detectMetaLayer('故事发生在很久以前的某个王国。')
      expect(result.detectedElements).toContain('framed_narrative')
    })
    
    it('should detect English frame story markers', () => {
      const result = detectMetaLayer('Once upon a time in a distant land, there lived a king.')
      expect(result.detectedElements).toContain('framed_narrative')
    })
  })
  
  describe('embedded story detection', () => {
    it('should detect Chinese embedded story markers', () => {
      const result = detectMetaLayer('故事里说，很久以前有一座城堡。')
      expect(result.detectedElements).toContain('embedded_story')
    })
    
    it('should detect English embedded story markers', () => {
      const result = detectMetaLayer('The story goes that a dragon once lived here.')
      expect(result.detectedElements).toContain('embedded_story')
    })
  })
  
  describe('fourth wall break detection', () => {
    it('should detect Chinese fourth wall break markers', () => {
      const result = detectMetaLayer('你不会相信接下来发生了什么。')
      expect(result.detectedElements).toContain('打破第四面墙')
    })
    
    it('should detect English fourth wall break markers', () => {
      const result = detectMetaLayer('You, watching at home, will not believe this.')
      expect(result.detectedElements).toContain('打破第四面墙')
    })
  })
  
  describe('self-aware commentary detection', () => {
    it('should detect Chinese self-aware markers', () => {
      const result = detectMetaLayer('这很奇怪，这个故事太meta了。')
      expect(result.detectedElements).toContain('自我意识评论')
    })
    
    it('should detect English self-aware markers', () => {
      const result = detectMetaLayer('This is strange, how meta this all is.')
      expect(result.detectedElements).toContain('自我意识评论')
    })
  })
  
  describe('confidence and layer depth', () => {
    it('should calculate confidence based on coverage', () => {
      const result = detectMetaLayer('亲爱的读者，我亲爱的读者，我亲爱的读者。')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
    
    it('should calculate layer depth based on element count', () => {
      const result = detectMetaLayer('故事发生在很久以前。亲爱的读者，这本书说的是...')
      expect(result.layerDepth).toBeGreaterThan(0)
    })
    
    it('should return hasMetaElements true when elements found', () => {
      const result = detectMetaLayer('once upon a time there was a king.')
      expect(result.hasMetaElements).toBe(true)
    })
    
    it('should return hasMetaElements false for plain text', () => {
      const result = detectMetaLayer('The quick brown fox jumps over the lazy dog.')
      expect(result.hasMetaElements).toBe(false)
    })
  })
  
  describe('position tracking', () => {
    it('should track positions of detected elements', () => {
      const result = detectMetaLayer('once upon a time. dear reader, let me tell you.')
      expect(result.positions.length).toBeGreaterThan(0)
      result.positions.forEach(pos => {
        expect(pos.startIndex).toBeLessThan(pos.endIndex)
        expect(pos.context.length).toBeGreaterThan(0)
      })
    })
  })
})

// ============================================================
// SELF-AWARENESS SCORER TESTS
// ============================================================

describe('calculateSelfAwareness', () => {
  describe('reflection dimension', () => {
    it('should detect reflection markers', () => {
      const result = calculateSelfAwareness('这本书正在讲述一个故事。写作是艰难的。')
      expect(result.dimensionScores.reflection).toBeGreaterThan(0)
    })
    
    it('should score zero for plain text', () => {
      const result = calculateSelfAwareness('The cat sat on the mat.')
      expect(result.dimensionScores.reflection).toBe(0)
    })
  })
  
  describe('audience dimension', () => {
    it('should detect audience markers', () => {
      const result = calculateSelfAwareness('亲爱的读者，你可能会想知道接下来发生了什么。')
      expect(result.dimensionScores.audience).toBeGreaterThan(0)
    })
    
    it('should recognize reader presence', () => {
      const result = calculateSelfAwareness('You, dear reader, should pay attention.')
      expect(result.dimensionScores.audience).toBeGreaterThan(0)
    })
  })
  
  describe('construction dimension', () => {
    it('should detect construction markers', () => {
      const result = calculateSelfAwareness('情节发展出人意表，人物塑造生动，叙事节奏明快。')
      expect(result.dimensionScores.construction).toBeGreaterThan(0)
    })
    
    it('should recognize narrative elements', () => {
      const result = calculateSelfAwareness('The plot thickens, the character develops, the scene changes.')
      expect(result.dimensionScores.construction).toBeGreaterThan(0)
    })
  })
  
  describe('genre dimension', () => {
    it('should detect genre markers', () => {
      const result = calculateSelfAwareness('这是一个悬疑推理故事，带有科幻和奇幻元素。')
      expect(result.dimensionScores.genre).toBeGreaterThan(0)
    })
    
    it('should recognize genre conventions', () => {
      const result = calculateSelfAwareness('This mystery follows the genre trope of detective fiction.')
      expect(result.dimensionScores.genre).toBeGreaterThan(0)
    })
  })
  
  describe('overall score calculation', () => {
    it('should calculate weighted overall score', () => {
      const result = calculateSelfAwareness('亲爱的读者，这本书的情节是悬疑类型。')
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(1)
    })
  })
  
  describe('level determination', () => {
    it('should return none for plain text', () => {
      const result = calculateSelfAwareness('The sun is shining. Birds are singing.')
      expect(result.level).toBe('none')
    })
    
    it('should return minimal for low awareness', () => {
      const result = calculateSelfAwareness('Once upon a time.')
      expect(['none', 'minimal']).toContain(result.level)
    })
    
    it('should detect high self-awareness', () => {
      const text = '亲爱的读者，当你读这本书时，你会发现这个故事是关于写作本身的。情节、人物、类型，所有元素都在反思叙事的本质。'
      const result = calculateSelfAwareness(text)
      expect(['moderate', 'high', 'complete']).toContain(result.level)
    })
  })
  
  describe('marker collection', () => {
    it('should collect markers array', () => {
      const result = calculateSelfAwareness('这本书的读者会发现情节很有趣。')
      expect(result.markers.length).toBeGreaterThan(0)
    })
    
    it('should include dimension counts in markers', () => {
      const result = calculateSelfAwareness('once upon a time in a mysterious genre.')
      result.markers.forEach(marker => {
        expect(typeof marker).toBe('string')
        expect(marker.length).toBeGreaterThan(0)
      })
    })
  })
})

// ============================================================
// NARRATIVE FRAMING ANALYZER TESTS
// ============================================================

describe('analyzeFraming', () => {
  describe('nested frame detection', () => {
    it('should detect frame story structure', () => {
      const result = analyzeFraming('故事发生在很久以前的一个王国。主角开始了冒险。')
      expect(result.framingType).toBe('nested')
    })
    
    it('should count frames', () => {
      const result = analyzeFraming('故事开始。很久以前有个人。')
      expect(result.frameCount).toBeGreaterThan(0)
    })
  })
  
  describe('embedded story detection', () => {
    it('should detect embedded narratives', () => {
      const result = analyzeFraming('故事里说有个人去了远方。据说那里很美。')
      expect(['embedded', 'nested']).toContain(result.framingType)
    })
  })
  
  describe('recursive framing', () => {
    it('should detect self-referential framing', () => {
      const result = analyzeFraming('这本书的内容是关于写作的。')
      expect(result.framingType).toBe('recursive')
    })
  })
  
  describe('juxtaposed framing', () => {
    it('should detect juxtaposition markers', () => {
      const result = analyzeFraming('故事开始了。然而，另一边发生了不同的事。')
      expect(result.hasFrameTransition).toBe(true)
    })
    
    it('should count transitions', () => {
      const result = analyzeFraming('一方面是如此。另一方面是那样。')
      expect(result.transitionCount).toBeGreaterThan(0)
    })
  })
  
  describe('contrasted framing', () => {
    it('should detect contrast markers', () => {
      const result = analyzeFraming('城市很热闹。相比之下，农村很安静。')
      expect(result.hasFrameTransition).toBe(true)
    })
  })
  
  describe('nesting level', () => {
    it('should calculate nesting level', () => {
      const result = analyzeFraming('故事发生在很久以前。然而，同时另一个故事也在进行。')
      expect(result.nestingLevel).toBeGreaterThan(0)
    })
  })
  
  describe('frame tracking', () => {
    it('should track individual frames', () => {
      const result = analyzeFraming('故事开始。很久以前有个人。与此同时，远处发生了一件事。')
      expect(result.frames.length).toBeGreaterThan(0)
      result.frames.forEach(frame => {
        expect(frame.startIndex).toBeLessThan(frame.endIndex)
        expect(frame.label.length).toBeGreaterThan(0)
      })
    })
  })
  
  describe('no framing', () => {
    it('should handle plain narrative without framing', () => {
      const result = analyzeFraming('The cat walked down the street. It was a normal day.')
      expect(result.framingType).toBe('none')
      expect(result.frameCount).toBe(0)
    })
  })
})

// ============================================================
// COMPREHENSIVE ANALYSIS TESTS
// ============================================================

describe('analyzeMetaNarrative', () => {
  it('should combine all analysis results', () => {
    const result = analyzeMetaNarrative('once upon a time, dear reader, this book tells a story.')
    expect(result.metaLayer).toBeDefined()
    expect(result.selfAwareness).toBeDefined()
    expect(result.framing).toBeDefined()
  })
  
  it('should calculate overall meta depth', () => {
    const result = analyzeMetaNarrative('once upon a time, dear reader.')
    expect(result.overallMetaDepth).toBeGreaterThanOrEqual(0)
    expect(result.overallMetaDepth).toBeLessThanOrEqual(1)
  })
  
  it('should generate suggestions', () => {
    const result = analyzeMetaNarrative('The quick brown fox jumps over the lazy dog.')
    expect(Array.isArray(result.suggestions)).toBe(true)
  })
  
  it('should suggest meta elements for long plain text', () => {
    const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(50)
    const result = analyzeMetaNarrative(longText)
    expect(result.suggestions.some(s => s.includes('meta'))).toBe(true)
  })
  
  it('should suggest frame narrative when missing', () => {
    const result = analyzeMetaNarrative('The cat sat on the mat.')
    expect(result.suggestions.some(s => s.includes('frame'))).toBe(true)
  })
})

// ============================================================
// SUMMARY FUNCTION TESTS
// ============================================================

describe('getMetaNarrativeSummary', () => {
  it('should return summary object', () => {
    const result = analyzeMetaNarrative('once upon a time.')
    const summary = getMetaNarrativeSummary(result)
    
    expect(summary.hasMetaElements).toBeDefined()
    expect(summary.selfAwarenessLevel).toBeDefined()
    expect(summary.framingType).toBeDefined()
    expect(summary.metaDepth).toBeDefined()
    expect(summary.suggestionCount).toBeDefined()
  })
  
  it('should reflect actual analysis results', () => {
    const analysisResult = analyzeMetaNarrative('once upon a time, dear reader.')
    const summary = getMetaNarrativeSummary(analysisResult)
    
    expect(summary.hasMetaElements).toBe(analysisResult.metaLayer.hasMetaElements)
    expect(summary.metaDepth).toBeCloseTo(analysisResult.overallMetaDepth, 2)
  })
})

// ============================================================
// EDGE CASES
// ============================================================

describe('edge cases', () => {
  it('should handle empty string in detectMetaLayer', () => {
    const result = detectMetaLayer('')
    expect(result.hasMetaElements).toBe(false)
    expect(result.detectedElements).toEqual([])
    expect(result.confidence).toBe(0)
  })
  
  it('should handle empty string in calculateSelfAwareness', () => {
    const result = calculateSelfAwareness('')
    expect(result.score).toBe(0)
    expect(result.level).toBe('none')
  })
  
  it('should handle empty string in analyzeFraming', () => {
    const result = analyzeFraming('')
    expect(result.framingType).toBe('none')
    expect(result.frameCount).toBe(0)
  })
  
  it('should handle single character', () => {
    const result = analyzeMetaNarrative('A')
    expect(result.overallMetaDepth).toBeGreaterThanOrEqual(0)
  })
  
  it('should handle very long text', () => {
    const longText = 'once upon a time '.repeat(1000) + 'dear reader '
    const result = analyzeMetaNarrative(longText)
    expect(result.metaLayer.positions.length).toBeGreaterThan(0)
    expect(result.selfAwareness.markers.length).toBeGreaterThan(0)
  })
  
  it('should handle mixed language text', () => {
    const mixed = 'once upon a time 从前. dear reader 亲爱的读者. this book 这本书.'
    const result = analyzeMetaNarrative(mixed)
    expect(result.metaLayer.hasMetaElements).toBe(true)
  })
})

// ============================================================
// TYPE TESTS
// ============================================================

describe('type exports', () => {
  it('should export MetaNarrativeElement type', () => {
    const elements: MetaNarrativeElement[] = [
      'author_intervention',
      'textual_self_reference',
      'framed_narrative',
      'embedded_story',
      '打破第四面墙',
      '自我意识评论',
      '文本层次'
    ]
    expect(elements.length).toBe(7)
  })
  
  it('should export FramingType', () => {
    const types: FramingType[] = [
      'nested',
      'juxtaposed',
      'contrasted',
      'embedded',
      'recursive',
      'none'
    ]
    expect(types.length).toBe(6)
  })
})