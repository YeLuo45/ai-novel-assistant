/**
 * ReaderDifficultyAnalysisEngine — V516
 * Readability calculation, difficulty classification, and adaptation suggestions.
 * Inspired by: Flesch-Kincaid readability formulas + adaptive feedback loops
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type DifficultyLevel = 'simple' | 'normal' | 'difficult' | 'expert'

export interface ReadabilityMetrics {
  fleschKincaidGrade: number        // US grade level (0-18+)
  fleschReadingEase: number         // 0-100 scale (higher = easier)
  averageSentenceLength: number     // words per sentence
  averageSyllablesPerWord: number    // syllable count / word count
  wordCount: number
  sentenceCount: number
  syllableCount: number
  complexWordCount: number           // words with 3+ syllables
  complexWordPercentage: number      // complex words / total words
  vocabularyDifficulty: number       // 0-1, based on word frequency patterns
  sentenceComplexityScore: number    // 0-1, based on clause structure
  overallReadabilityScore: number    // 0-100 composite score
}

export interface DifficultyClassification {
  level: DifficultyLevel
  confidence: number                // 0-1
  gradeRange: { min: number; max: number }
  characteristics: string[]
  targetAudience: string
}

export interface AdaptationSuggestion {
  type: 'reduce_difficulty' | 'increase_challenge' | 'maintain'
  priority: 'high' | 'medium' | 'low'
  focus: 'vocabulary' | 'sentence_structure' | 'both'
  suggestions: string[]
  estimatedImpact: number            // 0-1, how much it would change difficulty
  exampleChanges?: string[]
}

export interface ReaderDifficultyState {
  metrics: ReadabilityMetrics | null
  classification: DifficultyClassification | null
  suggestions: AdaptationSuggestion[]
  analysisHistory: ReadabilityMetrics[]
}

// ============================================================
// TOKENIZER & SYLLABLE COUNTER
// ============================================================

/**
 * Count syllables in a word using vowel groups heuristic
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length === 0) return 0
  
  // Handle special endings
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? Math.max(1, matches.length) : 1
}

/**
 * Check if a word is complex (3+ syllables)
 */
export function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0).length
}

/**
 * Count sentences (approximate by period, exclamation, question marks)
 */
export function countSentences(text: string): number {
  const matches = text.match(/[.!?]+/g)
  return matches ? Math.max(1, matches.length) : 1
}

/**
 * Count total syllables in text
 */
export function countTotalSyllables(text: string): number {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
  
  return words.reduce((sum, word) => sum + countSyllables(word), 0)
}

// ============================================================
// READABILITY CALCULATOR
// ============================================================

/**
 * Calculate Flesch-Kincaid Grade Level
 * FK Grade = 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
 */
export function calculateFleschKincaidGrade(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0
  
  const grade = 
    0.39 * (wordCount / sentenceCount) +
    11.8 * (syllableCount / wordCount) -
    15.59
  
  return Math.max(0, grade)
}

/**
 * Calculate Flesch Reading Ease Score
 * Score = 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
 */
export function calculateFleschReadingEase(
  wordCount: number,
  sentenceCount: number,
  syllableCount: number
): number {
  if (wordCount === 0 || sentenceCount === 0) return 0
  
  const score = 
    206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (syllableCount / wordCount)
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate vocabulary difficulty based on word length distribution
 */
export function calculateVocabularyDifficulty(
  wordCount: number,
  complexWordCount: number
): number {
  if (wordCount === 0) return 0
  return complexWordCount / wordCount
}

/**
 * Calculate sentence complexity score based on average length
 */
export function calculateSentenceComplexity(
  averageSentenceLength: number
): number {
  // Normal curve: optimal around 15-20 words, gets complex beyond that
  const optimal = 17
  const deviation = Math.abs(averageSentenceLength - optimal)
  const normalizedDeviation = Math.min(deviation / 30, 1) // cap at 30 word deviation
  return normalizedDeviation
}

/**
 * Calculate overall readability score (0-100, higher = easier)
 */
export function calculateOverallReadabilityScore(
  fleschReadingEase: number,
  vocabularyDifficulty: number,
  sentenceComplexity: number
): number {
  // Combine metrics: Flesch is already 0-100, convert others
  const vocabComponent = (1 - vocabularyDifficulty) * 33.33
  const sentenceComponent = (1 - sentenceComplexity) * 33.33
  const fleschComponent = fleschReadingEase * 0.333
  
  return Math.max(0, Math.min(100, fleschComponent + vocabComponent + sentenceComponent))
}

/**
 * Calculate comprehensive readability metrics
 */
export function calculateReadabilityMetrics(text: string): ReadabilityMetrics {
  const wordCount = countWords(text)
  const sentenceCount = countSentences(text)
  const syllableCount = countTotalSyllables(text)
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
  
  const complexWordCount = words.filter(isComplexWord).length
  const averageSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0
  const averageSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0
  const complexWordPercentage = wordCount > 0 ? (complexWordCount / wordCount) * 100 : 0
  
  const vocabularyDifficulty = calculateVocabularyDifficulty(wordCount, complexWordCount)
  const sentenceComplexityScore = calculateSentenceComplexity(averageSentenceLength)
  
  const fleschKincaidGrade = calculateFleschKincaidGrade(wordCount, sentenceCount, syllableCount)
  const fleschReadingEase = calculateFleschReadingEase(wordCount, sentenceCount, syllableCount)
  
  const overallReadabilityScore = calculateOverallReadabilityScore(
    fleschReadingEase,
    vocabularyDifficulty,
    sentenceComplexityScore
  )
  
  return {
    fleschKincaidGrade,
    fleschReadingEase,
    averageSentenceLength,
    averageSyllablesPerWord,
    wordCount,
    sentenceCount,
    syllableCount,
    complexWordCount,
    complexWordPercentage,
    vocabularyDifficulty,
    sentenceComplexityScore,
    overallReadabilityScore
  }
}

// ============================================================
// DIFFICULTY CLASSIFIER
// ============================================================

export interface DifficultyThresholds {
  simple: { maxGrade: number; maxEase: number }
  normal: { maxGrade: number; maxEase: number }
  difficult: { maxGrade: number; maxEase: number }
}

export const DEFAULT_DIFFICULTY_THRESHOLDS: DifficultyThresholds = {
  simple: { maxGrade: 5, maxEase: 80 },
  normal: { maxGrade: 10, maxEase: 60 },
  difficult: { maxGrade: 14, maxEase: 40 }
}

/**
 * Classify difficulty level based on readability metrics
 */
export function classifyDifficulty(
  metrics: ReadabilityMetrics,
  thresholds: DifficultyThresholds = DEFAULT_DIFFICULTY_THRESHOLDS
): DifficultyClassification {
  const { fleschKincaidGrade, fleschReadingEase, averageSentenceLength, complexWordPercentage } = metrics
  
  let level: DifficultyLevel
  let confidence: number
  let gradeRange: { min: number; max: number }
  let characteristics: string[] = []
  let targetAudience: string
  
  // Determine level based on multiple factors
  const gradeScore = fleschKincaidGrade
  const easeScore = fleschReadingEase
  
  if (gradeScore <= thresholds.simple.maxGrade || easeScore >= thresholds.simple.maxEase) {
    level = 'simple'
    gradeRange = { min: 1, max: 5 }
    targetAudience = 'General public, young adult readers, ESL learners'
    
    if (averageSentenceLength < 10) characteristics.push('Short, direct sentences')
    if (complexWordPercentage < 10) characteristics.push('Basic vocabulary')
    if (easeScore >= 80) characteristics.push('Highly readable prose')
    
    confidence = Math.min(1, easeScore / 100 + 0.3)
  } else if (gradeScore <= thresholds.normal.maxGrade || easeScore >= thresholds.normal.maxEase) {
    level = 'normal'
    gradeRange = { min: 6, max: 10 }
    targetAudience = 'Adult general readers, book club members'
    
    if (averageSentenceLength >= 10 && averageSentenceLength < 20) 
      characteristics.push('Varied sentence length')
    if (complexWordPercentage >= 10 && complexWordPercentage < 20) 
      characteristics.push('Moderate vocabulary range')
    if (easeScore >= 50 && easeScore < 70) 
      characteristics.push('Balanced complexity')
    
    confidence = 0.75
  } else if (gradeScore <= thresholds.difficult.maxGrade || easeScore >= thresholds.difficult.maxEase) {
    level = 'difficult'
    gradeRange = { min: 11, max: 14 }
    targetAudience = 'Educated adult readers, academic audience'
    
    if (averageSentenceLength >= 20) characteristics.push('Complex sentence structures')
    if (complexWordPercentage >= 20) characteristics.push('Specialized terminology')
    if (easeScore < 50) characteristics.push('Dense prose requiring focus')
    
    confidence = 0.8
  } else {
    level = 'expert'
    gradeRange = { min: 15, max: 18 }
    targetAudience = 'Scholarly readers, subject matter experts'
    
    if (averageSentenceLength >= 25) characteristics.push('Very long, complex sentences')
    if (complexWordPercentage >= 30) characteristics.push('Technical jargon dominant')
    if (easeScore < 30) characteristics.push('Academic writing style')
    
    confidence = 0.85
  }
  
  // Add automatic characteristics
  if (characteristics.length === 0) {
    if (level === 'simple') characteristics.push('Accessible writing style')
    else if (level === 'normal') characteristics.push('Standard literary prose')
    else if (level === 'difficult') characteristics.push('Sophisticated narrative')
    else characteristics.push('Expert-level writing')
  }
  
  return {
    level,
    confidence: Math.min(1, Math.max(0, confidence)),
    gradeRange,
    characteristics,
    targetAudience
  }
}

// ============================================================
// ADAPTATION SUGGESTION ENGINE
// ============================================================

export interface AdaptationThresholds {
  reduceThreshold: number    // Flesch Reading Ease below this triggers reduce suggestions
  increaseThreshold: number  // Flesch Reading Ease above this triggers increase suggestions
}

export const DEFAULT_ADAPTATION_THRESHOLDS: AdaptationThresholds = {
  reduceThreshold: 40,
  increaseThreshold: 75
}

/**
 * Generate suggestions to reduce reading difficulty
 */
export function generateReduceDifficultySuggestions(
  metrics: ReadabilityMetrics
): AdaptationSuggestion {
  const suggestions: string[] = []
  const exampleChanges: string[] = []
  
  const { 
    averageSentenceLength, 
    complexWordPercentage, 
    fleschKincaidGrade,
    wordCount 
  } = metrics
  
  // Sentence length suggestions
  if (averageSentenceLength > 20) {
    suggestions.push('Break long sentences into shorter ones (aim for 15-20 words average)')
    suggestions.push('Use more compound sentences with conjunctions')
    exampleChanges.push('"The house, which had been abandoned for many years, stood at the end of the road." → "The house had been abandoned for many years. It stood at the end of the road."')
  }
  
  // Vocabulary suggestions
  if (complexWordPercentage > 20) {
    suggestions.push('Replace complex words with simpler alternatives where possible')
    suggestions.push('Define technical terms when first introduced')
    exampleChanges.push('"The elucidate process." → "The explanation."')
  }
  
  // Paragraph structure
  if (fleschKincaidGrade > 10) {
    suggestions.push('Use more active voice constructions')
    suggestions.push('Add transitional phrases to connect ideas')
  }
  
  // Calculate estimated impact
  let estimatedImpact = 0.3
  if (averageSentenceLength > 25) estimatedImpact += 0.2
  if (complexWordPercentage > 25) estimatedImpact += 0.2
  if (fleschKincaidGrade > 12) estimatedImpact += 0.15
  
  return {
    type: 'reduce_difficulty',
    priority: estimatedImpact > 0.5 ? 'high' : estimatedImpact > 0.3 ? 'medium' : 'low',
    focus: complexWordPercentage > 15 && averageSentenceLength > 20 ? 'both' :
           complexWordPercentage > 15 ? 'vocabulary' : 'sentence_structure',
    suggestions,
    estimatedImpact: Math.min(1, estimatedImpact),
    exampleChanges: exampleChanges.length > 0 ? exampleChanges : undefined
  }
}

/**
 * Generate suggestions to increase reading challenge
 */
export function generateIncreaseChallengeSuggestions(
  metrics: ReadabilityMetrics
): AdaptationSuggestion {
  const suggestions: string[] = []
  const exampleChanges: string[] = []
  
  const { 
    averageSentenceLength, 
    complexWordPercentage, 
    fleschReadingEase,
    wordCount 
  } = metrics
  
  // Sentence variety suggestions
  if (averageSentenceLength < 12) {
    suggestions.push('Combine short sentences for more complex structures')
    suggestions.push('Introduce subordinate clauses and relative pronouns')
    exampleChanges.push('"He walked. The door opened." → "As he walked toward the door, it slowly opened."')
  }
  
  // Vocabulary enrichment
  if (complexWordPercentage < 10) {
    suggestions.push('Incorporate more sophisticated vocabulary')
    suggestions.push('Use domain-specific terminology to add depth')
    exampleChanges.push('"Make bigger" → "Amplify" or "Augment"')
  }
  
  // Prose density
  if (fleschReadingEase > 80) {
    suggestions.push('Add descriptive passages and internal monologue')
    suggestions.push('Use more varied sentence structures including inversions')
    suggestions.push('Incorporate literary devices (metaphor, symbolism)')
  }
  
  // Calculate estimated impact
  let estimatedImpact = 0.3
  if (averageSentenceLength < 10) estimatedImpact += 0.2
  if (complexWordPercentage < 5) estimatedImpact += 0.2
  if (fleschReadingEase > 85) estimatedImpact += 0.15
  
  return {
    type: 'increase_challenge',
    priority: estimatedImpact > 0.5 ? 'high' : estimatedImpact > 0.3 ? 'medium' : 'low',
    focus: complexWordPercentage < 10 && averageSentenceLength < 12 ? 'both' :
           complexWordPercentage < 10 ? 'vocabulary' : 'sentence_structure',
    suggestions,
    estimatedImpact: Math.min(1, estimatedImpact),
    exampleChanges: exampleChanges.length > 0 ? exampleChanges : undefined
  }
}

/**
 * Generate adaptation suggestions based on metrics and target
 */
export function generateAdaptationSuggestions(
  metrics: ReadabilityMetrics,
  thresholds: AdaptationThresholds = DEFAULT_ADAPTATION_THRESHOLDS,
  targetLevel?: DifficultyLevel
): AdaptationSuggestion {
  const { fleschReadingEase } = metrics
  
  // If target specified, generate accordingly
  if (targetLevel) {
    const currentLevel = classifyDifficulty(metrics).level
    const levelOrder: DifficultyLevel[] = ['simple', 'normal', 'difficult', 'expert']
    const currentIndex = levelOrder.indexOf(currentLevel)
    const targetIndex = levelOrder.indexOf(targetLevel)
    
    if (targetIndex < currentIndex) {
      return generateReduceDifficultySuggestions(metrics)
    } else if (targetIndex > currentIndex) {
      return generateIncreaseChallengeSuggestions(metrics)
    }
    return {
      type: 'maintain',
      priority: 'low',
      focus: 'both',
      suggestions: ['Current difficulty level matches target'],
      estimatedImpact: 0
    }
  }
  
  // Auto-detect based on thresholds
  if (fleschReadingEase < thresholds.reduceThreshold) {
    return generateReduceDifficultySuggestions(metrics)
  } else if (fleschReadingEase > thresholds.increaseThreshold) {
    return generateIncreaseChallengeSuggestions(metrics)
  }
  
  return {
    type: 'maintain',
    priority: 'low',
    focus: 'both',
    suggestions: ['Difficulty level is well-balanced for target audience'],
    estimatedImpact: 0
  }
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

export function createEmptyDifficultyState(): ReaderDifficultyState {
  return {
    metrics: null,
    classification: null,
    suggestions: [],
    analysisHistory: []
  }
}

export function analyzeTextDifficulty(text: string): ReaderDifficultyState {
  const metrics = calculateReadabilityMetrics(text)
  const classification = classifyDifficulty(metrics)
  const suggestions = [generateAdaptationSuggestions(metrics)]
  
  return {
    metrics,
    classification,
    suggestions,
    analysisHistory: [metrics]
  }
}

export function addAnalysisToHistory(
  state: ReaderDifficultyState,
  metrics: ReadabilityMetrics
): ReaderDifficultyState {
  return {
    ...state,
    analysisHistory: [...state.analysisHistory, metrics]
  }
}

export function getDifficultySummary(state: ReaderDifficultyState): {
  currentLevel: DifficultyLevel | null
  confidence: number
  readabilityScore: number
  wordCount: number
  suggestionCount: number
} {
  return {
    currentLevel: state.classification?.level ?? null,
    confidence: state.classification?.confidence ?? 0,
    readabilityScore: state.metrics?.overallReadabilityScore ?? 0,
    wordCount: state.metrics?.wordCount ?? 0,
    suggestionCount: state.suggestions.length
  }
}

// ============================================================
// COMPREHENSIVE ANALYSIS
// ============================================================

export interface DifficultyAnalysisResult {
  metrics: ReadabilityMetrics
  classification: DifficultyClassification
  suggestions: AdaptationSuggestion[]
  summary: {
    level: DifficultyLevel
    confidence: number
    readabilityScore: number
    wordCount: number
    sentenceCount: number
    primaryFocus: 'vocabulary' | 'sentence_structure' | 'both' | 'balanced'
    keyCharacteristic: string
    targetAudience: string
  }
}

/**
 * Perform comprehensive difficulty analysis on text
 */
export function analyzeReaderDifficulty(
  text: string,
  targetLevel?: DifficultyLevel
): DifficultyAnalysisResult {
  const metrics = calculateReadabilityMetrics(text)
  const classification = classifyDifficulty(metrics)
  
  // Generate primary and optional suggestions
  const primarySuggestion = generateAdaptationSuggestions(metrics, DEFAULT_ADAPTATION_THRESHOLDS, targetLevel)
  const suggestions: AdaptationSuggestion[] = [primarySuggestion]
  
  // Add contextual suggestions based on specific metrics
  if (metrics.averageSentenceLength > 25 && metrics.complexWordPercentage > 20) {
    const extraSuggestion: AdaptationSuggestion = {
      type: 'reduce_difficulty',
      priority: 'high',
      focus: 'both',
      suggestions: [
        'Both vocabulary and sentence structure contribute to high difficulty',
        'Consider a more balanced approach to maintain reader engagement'
      ],
      estimatedImpact: 0.4
    }
    suggestions.push(extraSuggestion)
  }
  
  // Determine primary focus area
  let primaryFocus: 'vocabulary' | 'sentence_structure' | 'both' | 'balanced' = 'balanced'
  const vocabContribution = metrics.complexWordPercentage
  const sentenceContribution = Math.min(metrics.averageSentenceLength / 30, 1) * 100
  
  if (Math.abs(vocabContribution - sentenceContribution) < 15) {
    primaryFocus = 'balanced'
  } else if (vocabContribution > sentenceContribution) {
    primaryFocus = 'vocabulary'
  } else {
    primaryFocus = 'sentence_structure'
  }
  
  const keyCharacteristic = classification.characteristics[0] || 'Standard prose'
  
  return {
    metrics,
    classification,
    suggestions,
    summary: {
      level: classification.level,
      confidence: classification.confidence,
      readabilityScore: metrics.overallReadabilityScore,
      wordCount: metrics.wordCount,
      sentenceCount: metrics.sentenceCount,
      primaryFocus,
      keyCharacteristic,
      targetAudience: classification.targetAudience
    }
  }
}