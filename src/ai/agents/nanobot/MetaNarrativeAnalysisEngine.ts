/**
 * MetaNarrativeAnalysisEngine — V520
 * Meta-narrative element detection, self-awareness scoring, and narrative framing analysis.
 * Inspired by: chatdev-design (multi-role collaboration) + literary theory (genette, rorty)
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type MetaNarrativeElement = 
  | 'author_intervention'    // Author directly addresses reader/characters
  | 'textual_self_reference' // Text references itself
  | 'framed_narrative'       // Story within a story (framework narrative)
  | 'embedded_story'         // Embedded narrative within main narrative
  | '打破第四面墙'           // Breaking the fourth wall
  | '自我意识评论'          // Self-aware commentary
  | '文本层次'              // Textual layering

export interface MetaLayerDetectionResult {
  hasMetaElements: boolean
  detectedElements: MetaNarrativeElement[]
  confidence: number         // 0-1, overall confidence of detection
  layerDepth: number        // 1-N, nesting depth of meta-narrative
  positions: Array<{
    element: MetaNarrativeElement
    startIndex: number
    endIndex: number
    context: string
  }>
}

export interface SelfAwarenessScore {
  score: number             // 0-1, overall self-awareness level
  dimensionScores: {
    reflection: number      // Text's awareness of being text
    audience: number        // Awareness of reader presence
    construction: number    // Awareness of narrative construction
    genre: number           // Awareness of genre conventions
  }
  markers: string[]         // Detected self-awareness markers
  level: 'none' | 'minimal' | 'moderate' | 'high' | 'complete'
}

export type FramingType = 'nested' | 'juxtaposed' | 'contrasted' | 'embedded' | 'recursive' | 'none'

export interface NarrativeFramingResult {
  framingType: FramingType
  frameCount: number
  nestingLevel: number
  frames: Array<{
    type: FramingType
    startIndex: number
    endIndex: number
    label: string
    isFrameStory: boolean
  }>
  hasFrameTransition: boolean
  transitionCount: number
}

export interface MetaNarrativeAnalysisResult {
  metaLayer: MetaLayerDetectionResult
  selfAwareness: SelfAwarenessScore
  framing: NarrativeFramingResult
  overallMetaDepth: number   // 0-1, composite score of meta-narrative presence
  suggestions: string[]      // Writing suggestions for meta-narrative aspects
}

// ============================================================
// MARKER DICTIONARIES
// ============================================================

const AUTHOR_INTERVENTION_MARKERS = [
  '我亲爱的读者', '我想说', '亲爱的读者', '作者在此', '笔者', 
  '正如读者所知', '你们或许会问', '请允许我', '在此必须说明',
  'i must tell you', 'dear reader', 'i want to say', 'as the author',
  'let me tell you', 'you might wonder', 'i confess', 'honestly speaking'
]

const SELF_REFERENCE_MARKERS = [
  '这本书', '这篇故事', '这段文字', '这个故事', '此书',
  'this book', 'this story', 'this narrative', 'this text', 'this chapter',
  'as i wrote', 'as this story', 'in these pages', 'the very sentence'
]

const FRAME_STORY_MARKERS = [
  '故事发生在', '很久以前', '在那遥远的地方', '讲述的是',
  '话说从前', '这是一个关于', '故事开始于',
  'once upon a time', 'long ago', 'in a land far away', 'the tale of',
  'this is a story about', 'the story begins', 'it was a dark and stormy night',
  '一方面', '另一方面', 'on one hand', 'on the other hand'
]

const EMBEDDED_STORY_MARKERS = [
  '故事里说', '据说', '传说', '书中写道', '记录显示',
  '正如故事所述', '民间流传',
  'the story goes', 'they say', 'legend has it', 'as the story goes',
  'it is said', 'according to legend', ' folklore tells'
]

const FOURTH_WALL_BREAK_MARKERS = [
  '你不会相信', '停下来想想', '想象一下', '你可能在想',
  '现在', '此时此刻', '亲爱的观众',
  'you would not believe', 'stop and think', 'imagine', 'you might be thinking',
  'right now', 'at this moment', 'dear audience', 'looking at you',
  'dear viewer', 'you at home', 'watching at home'
]

const SELF_AWARE_COMMENTARY_MARKERS = [
  '这很奇怪', 'meta', '自相矛盾', '自我指涉', '太meta了',
  'this is strange', 'how meta', 'self-referential', 'too meta',
  'this is weird', 'breaking pattern', 'defying expectations'
]

// ============================================================
// META LAYER DETECTOR
// ============================================================

/**
 * Detect meta-narrative elements in text
 */
export function detectMetaLayer(text: string): MetaLayerDetectionResult {
  const positions: MetaLayerDetectionResult['positions'] = []
  const detectedElements = new Set<MetaNarrativeElement>()
  
  const sentences = splitIntoSentences(text)
  let sentenceIndex = 0
  let charOffset = 0
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    
    // Author intervention
    if (AUTHOR_INTERVENTION_MARKERS.some(m => trimmed.toLowerCase().includes(m.toLowerCase()))) {
      detectedElements.add('author_intervention')
      positions.push({
        element: 'author_intervention',
        startIndex: charOffset,
        endIndex: charOffset + sentence.length,
        context: trimmed
      })
    }
    
    // Textual self-reference
    if (SELF_REFERENCE_MARKERS.some(m => trimmed.toLowerCase().includes(m.toLowerCase()))) {
      detectedElements.add('textual_self_reference')
      positions.push({
        element: 'textual_self_reference',
        startIndex: charOffset,
        endIndex: charOffset + sentence.length,
        context: trimmed
      })
    }
    
    // Frame story
    if (FRAME_STORY_MARKERS.some(m => trimmed.toLowerCase().includes(m.toLowerCase()))) {
      detectedElements.add('framed_narrative')
      positions.push({
        element: 'framed_narrative',
        startIndex: charOffset,
        endIndex: charOffset + sentence.length,
        context: trimmed
      })
    }
    
    // Embedded story
    if (EMBEDDED_STORY_MARKERS.some(m => trimmed.toLowerCase().includes(m.toLowerCase()))) {
      detectedElements.add('embedded_story')
      positions.push({
        element: 'embedded_story',
        startIndex: charOffset,
        endIndex: charOffset + sentence.length,
        context: trimmed
      })
    }
    
    // Fourth wall break
    if (FOURTH_WALL_BREAK_MARKERS.some(m => trimmed.toLowerCase().includes(m.toLowerCase()))) {
      detectedElements.add('打破第四面墙')
      positions.push({
        element: '打破第四面墙',
        startIndex: charOffset,
        endIndex: charOffset + sentence.length,
        context: trimmed
      })
    }
    
    // Self-aware commentary
    if (SELF_AWARE_COMMENTARY_MARKERS.some(m => trimmed.toLowerCase().includes(m.toLowerCase()))) {
      detectedElements.add('自我意识评论')
      positions.push({
        element: '自我意识评论',
        startIndex: charOffset,
        endIndex: charOffset + sentence.length,
        context: trimmed
      })
    }
    
    charOffset += sentence.length + 1
    sentenceIndex++
  }
  
  // Calculate layer depth based on number of different element types
  const layerDepth = detectedElements.size > 0 ? detectedElements.size : 1
  
  // Calculate confidence based on coverage
  const totalChars = text.length
  const coveredChars = positions.reduce((sum, p) => sum + (p.endIndex - p.startIndex), 0)
  const confidence = totalChars > 0 ? Math.min(1, (coveredChars / totalChars) * 10 + 0.3) : 0
  
  return {
    hasMetaElements: detectedElements.size > 0,
    detectedElements: Array.from(detectedElements),
    confidence: Math.min(1, confidence),
    layerDepth,
    positions
  }
}

// ============================================================
// SELF-AWARENESS SCORER
// ============================================================

const REFLECTION_MARKERS = [
  '这本书', '这篇文字', '这段叙述', '这个故事', '写作', '写成',
  'this book', 'this text', 'this narrative', 'this story', 'writing', 'written',
  'as i write', 'as i have written', 'the act of writing'
]

const AUDIENCE_MARKERS = [
  '你', '读者', '观众', '你们', 
  'you', 'reader', 'readers', 'audience', 'viewer', 'viewers',
  'dear reader', 'gentle reader', 'valued reader'
]

const CONSTRUCTION_MARKERS = [
  '情节', '故事线', '人物', '叙事', '章节', '场景',
  'plot', 'storyline', 'character', 'narrative', 'chapter', 'scene',
  'twist', 'ending', 'beginning', 'middle', 'resolution'
]

const GENRE_MARKERS = [
  '悬疑', '科幻', '奇幻', '言情', '恐怖', '类型', '流派',
  'mystery', 'sci-fi', 'fantasy', 'romance', 'horror', 'genre',
  'trope', 'convention', 'cliché', 'stereotype'
]

/**
 * Calculate self-awareness score for text
 */
export function calculateSelfAwareness(text: string): SelfAwarenessScore {
  const lowerText = text.toLowerCase()
  const sentences = splitIntoSentences(text)
  
  const reflectionCount = sentences.filter(s => 
    REFLECTION_MARKERS.some(m => s.toLowerCase().includes(m.toLowerCase()))
  ).length
  
  const audienceCount = sentences.filter(s =>
    AUDIENCE_MARKERS.some(m => s.toLowerCase().includes(m.toLowerCase()))
  ).length
  
  const constructionCount = sentences.filter(s =>
    CONSTRUCTION_MARKERS.some(m => s.toLowerCase().includes(m.toLowerCase()))
  ).length
  
  const genreCount = sentences.filter(s =>
    GENRE_MARKERS.some(m => s.toLowerCase().includes(m.toLowerCase()))
  ).length
  
  const totalSentences = Math.max(1, sentences.length)
  
  // Normalize scores to 0-1
  const reflection = Math.min(1, reflectionCount / totalSentences * 5)
  const audience = Math.min(1, audienceCount / totalSentences * 5)
  const construction = Math.min(1, constructionCount / totalSentences * 5)
  const genre = Math.min(1, genreCount / totalSentences * 5)
  
  // Collect markers
  const markers: string[] = []
  if (reflectionCount > 0) markers.push(`reflection(${reflectionCount})`)
  if (audienceCount > 0) markers.push(`audience(${audienceCount})`)
  if (constructionCount > 0) markers.push(`construction(${constructionCount})`)
  if (genreCount > 0) markers.push(`genre({${genreCount}})`)
  
  // Calculate overall score
  const score = (reflection * 0.3 + audience * 0.25 + construction * 0.25 + genre * 0.2)
  
  // Determine level
  let level: SelfAwarenessScore['level']
  if (score < 0.1) level = 'none'
  else if (score < 0.3) level = 'minimal'
  else if (score < 0.5) level = 'moderate'
  else if (score < 0.8) level = 'high'
  else level = 'complete'
  
  return {
    score: Math.min(1, score),
    dimensionScores: { reflection, audience, construction, genre },
    markers,
    level
  }
}

// ============================================================
// NARRATIVE FRAMING ANALYZER
// ============================================================

/**
 * Analyze narrative framing structure
 */
export function analyzeFraming(text: string): NarrativeFramingResult {
  const sentences = splitIntoSentences(text)
  const frames: NarrativeFramingResult['frames'] = []
  let currentFrame: typeof frames[0] | null = null
  let nestingLevel = 0
  let transitionCount = 0
  let frameCount = 0
  let lastFramingType: FramingType | null = null
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim()
    const lower = sentence.toLowerCase()
    let framingType: FramingType = 'none'
    let isFrameStory = false
    
    // Detect frame story markers
    if (FRAME_STORY_MARKERS.some(m => lower.includes(m.toLowerCase()))) {
      framingType = 'nested'
      isFrameStory = true
    }
    // Detect embedded story markers
    else if (EMBEDDED_STORY_MARKERS.some(m => lower.includes(m.toLowerCase()))) {
      framingType = 'embedded'
    }
    // Detect self-reference (recursive framing)
    else if (SELF_REFERENCE_MARKERS.some(m => lower.includes(m.toLowerCase()))) {
      framingType = 'recursive'
    }
    
    // Detect juxtaposition/contrast markers
    if (lower.includes('然而') || lower.includes('but') || lower.includes('however') || 
        lower.includes('与此同时') || lower.includes('at the same time')) {
      if (framingType !== 'none') {
        transitionCount++
      }
      if (framingType === 'none') framingType = 'juxtaposed'
    }
    
    // Detect contrast markers
    if (lower.includes('相比之下') || lower.includes('in contrast') || lower.includes('unlike') ||
        lower.includes('相反') || lower.includes('on the other hand')) {
      if (framingType !== 'none') {
        transitionCount++
      }
      if (framingType === 'none') framingType = 'contrasted'
    }
    
    if (framingType !== 'none') {
      if (!currentFrame || currentFrame.type !== framingType) {
        // Frame transition
        if (currentFrame) {
          currentFrame.endIndex = sentences.slice(0, i).join('').length
          frames.push(currentFrame)
        }
        currentFrame = {
          type: framingType,
          startIndex: sentences.slice(0, i).join('').length,
          endIndex: 0,
          label: sentence.slice(0, Math.min(50, sentence.length)),
          isFrameStory
        }
        nestingLevel++
        frameCount++
        transitionCount++
        lastFramingType = framingType
      }
    } else if (currentFrame) {
      // Close current frame
      currentFrame.endIndex = sentences.slice(0, i + 1).join('').length
      frames.push(currentFrame)
      currentFrame = null
      lastFramingType = null
    }
  }
  
  // Close any open frame
  if (currentFrame) {
    currentFrame.endIndex = text.length
    frames.push(currentFrame)
  }
  
  // Determine overall framing type
  let overallType: FramingType = 'none'
  if (frames.length > 0) {
    const typeCounts = frames.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1
      return acc
    }, {} as Record<FramingType, number>)
    
    const maxType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
    overallType = (maxType[0] as FramingType) || 'none'
  }
  
  return {
    framingType: overallType,
    frameCount,
    nestingLevel: Math.max(1, nestingLevel),
    frames,
    hasFrameTransition: transitionCount > 0,
    transitionCount
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Split text into sentences
 */
export function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation: 。！？!.?
  return text
    .split(/(?<=[。！？!?\.])/)
    .map(s => s.replace(/^[　\s]+|[。！？!?\.]+$/g, '').trim())
    .filter(s => s.length > 0)
}

/**
 * Combine multiple analysis results into comprehensive result
 */
export function analyzeMetaNarrative(text: string): MetaNarrativeAnalysisResult {
  const metaLayer = detectMetaLayer(text)
  const selfAwareness = calculateSelfAwareness(text)
  const framing = analyzeFraming(text)
  
  // Calculate overall meta depth
  const metaDepth = (
    (metaLayer.hasMetaElements ? 0.4 : 0) +
    (metaLayer.confidence * 0.2) +
    (selfAwareness.score * 0.25) +
    (framing.frameCount > 0 ? 0.15 : 0)
  )
  
  // Generate suggestions
  const suggestions: string[] = []
  
  if (!metaLayer.hasMetaElements && text.length > 1000) {
    suggestions.push('Consider adding subtle meta-narrative elements to increase depth')
  }
  
  if (selfAwareness.level === 'none' && text.length > 500) {
    suggestions.push('The text could benefit from characters acknowledging their fictional nature')
  }
  
  if (framing.frameCount === 0) {
    suggestions.push('A frame narrative structure could add complexity and depth')
  }
  
  if (metaLayer.detectedElements.length > 3) {
    suggestions.push('Multiple meta-layers detected - ensure transitions are smooth')
  }
  
  return {
    metaLayer,
    selfAwareness,
    framing,
    overallMetaDepth: Math.min(1, metaDepth),
    suggestions
  }
}

/**
 * Get a summary of meta-narrative analysis
 */
export function getMetaNarrativeSummary(result: MetaNarrativeAnalysisResult): {
  hasMetaElements: boolean
  selfAwarenessLevel: string
  framingType: string
  metaDepth: number
  suggestionCount: number
} {
  return {
    hasMetaElements: result.metaLayer.hasMetaElements,
    selfAwarenessLevel: result.selfAwareness.level,
    framingType: result.framing.framingType,
    metaDepth: result.overallMetaDepth,
    suggestionCount: result.suggestions.length
  }
}

// ============================================================
// EXPORTS (at bottom only)
// ============================================================