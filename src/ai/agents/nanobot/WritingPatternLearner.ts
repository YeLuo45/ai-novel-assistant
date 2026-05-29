/**
 * WritingPatternLearner — V317
 * Personal style pattern mining, vocabulary preferences, pacing habits from user history.
 * Inspired by: nanobot (autonomous pattern discovery), ruflo (hierarchical analysis)
 */

export interface WritingPattern {
  patternId: string
  patternType: 'vocabulary' | 'structure' | 'pacing' | 'dialogue' | 'description' | 'narrative'
  occurrences: number
  confidence: number  // 0-1
  examples: string[]
  frequency: number   // per 1000 words
  lastSeen: number
}

export interface VocabularyPreference {
  word: string
  category: 'adjective' | 'verb' | 'adverb' | 'noun' | 'descriptor'
  frequency: number   // per 1000 words
  favorability: number // 0-1 author preference score
}

export interface PacingHabit {
  sceneLength: number      // avg words per scene
  chapterLength: number    // avg words per chapter
  dialogueRatio: number    // 0-1 dialogue to narration ratio
  actionDensity: number    // events per 1000 words
  pauseFrequency: number   // reflective passages per chapter
}

export interface StructurePattern {
  structureType: 'linear' | 'nonlinear' | 'parallel' | 'cyclic' | 'framed'
  chapterSequence: number[] // chapter order preference
  sceneTransitionStyle: 'abrupt' | 'smooth' | 'chapter-break' | 'cliffhanger'
  openingPattern: string
  closingPattern: string
}

export interface WritingPatternState {
  vocabularyProfile: Map<string, VocabularyPreference>
  pacingHabits: PacingHabit
  structurePatterns: StructurePattern
  discoveredPatterns: Map<string, WritingPattern>
  historicalTexts: Map<string, { wordCount: number; timestamp: number }>
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): WritingPatternState {
  return {
    vocabularyProfile: new Map(),
    pacingHabits: {
      sceneLength: 0,
      chapterLength: 0,
      dialogueRatio: 0,
      actionDensity: 0,
      pauseFrequency: 0,
    },
    structurePatterns: {
      structureType: 'linear',
      chapterSequence: [],
      sceneTransitionStyle: 'smooth',
      openingPattern: '',
      closingPattern: '',
    },
    discoveredPatterns: new Map(),
    historicalTexts: new Map(),
    typeAlias: {},
  }
}

// Analyze text and extract vocabulary preferences
export function analyzeVocabularyPreferences(
  state: WritingPatternState,
  text: string,
  textId: string,
  wordCount: number
): WritingPatternState {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const wordFreq = new Map<string, number>()
  
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  }

  const newVocab = new Map(state.vocabularyProfile)
  for (const [word, count] of wordFreq.entries()) {
    const freqPer1000 = (count / wordCount) * 1000
    const existing = newVocab.get(word)
    const updatedPref: VocabularyPreference = {
      word,
      category: categorizeWord(word),
      frequency: existing
        ? (existing.frequency * existing.occurrences + freqPer1000) / (existing.occurrences + 1)
        : freqPer1000,
      favorability: existing ? existing.favorability : 0.5,
      // Note: occurrences not tracked on VocabularyPreference, but we track how many texts used this word
    }
    newVocab.set(word, updatedPref)
  }

  const updatedHistorical = new Map(state.historicalTexts)
  updatedHistorical.set(textId, { wordCount, timestamp: Date.now() })

  return {
    ...state,
    vocabularyProfile: newVocab,
    historicalTexts: updatedHistorical,
  }
}

function categorizeWord(word: string): VocabularyPreference['category'] {
  // Simple heuristic - in production would use POS tagging
  const descriptor_endings = ['ful', 'less', 'ous', 'ive', 'able', 'al']
  const adverb_endings = ['ly', 'ward', 'wise']
  
  if (adverb_endings.some(e => word.endsWith(e))) return 'adverb'
  if (descriptor_endings.some(e => word.endsWith(e))) return 'adjective'
  if (word.endsWith('ly')) return 'adverb'
  return 'noun' // default
}

// Analyze pacing habits
export function analyzePacingHabits(
  state: WritingPatternState,
  sceneLengths: number[],
  chapterLengths: number[],
  dialogueRatios: number[],
  actionDensities: number[],
  pauseFrequencies: number[]
): WritingPatternState {
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0

  return {
    ...state,
    pacingHabits: {
      sceneLength: avg(sceneLengths) || state.pacingHabits.sceneLength,
      chapterLength: avg(chapterLengths) || state.pacingHabits.chapterLength,
      dialogueRatio: avg(dialogueRatios) || state.pacingHabits.dialogueRatio,
      actionDensity: avg(actionDensities) || state.pacingHabits.actionDensity,
      pauseFrequency: avg(pauseFrequencies) || state.pacingHabits.pauseFrequency,
    },
  }
}

// Detect structure patterns
export function detectStructurePatterns(
  state: WritingPatternState,
  openingText: string,
  closingText: string,
  chapterOrder: number[],
  transitionStyle: 'abrupt' | 'smooth' | 'chapter-break' | 'cliffhanger'
): WritingPatternState {
  // Classify structure type based on chapter order
  let structureType: StructurePattern['structureType'] = 'linear'
  
  if (chapterOrder.length >= 3) {
    const isIncreasing = chapterOrder.every((v, i) => i === 0 || v > chapterOrder[i - 1])
    const isDecreasing = chapterOrder.every((v, i) => i === 0 || v < chapterOrder[i - 1])
    
    if (!isIncreasing && !isDecreasing) {
      // Check for parallel structure
      const mid = Math.floor(chapterOrder.length / 2)
      const first = chapterOrder.slice(0, mid)
      const second = chapterOrder.slice(mid)
      const firstSorted = [...first].sort()
      const secondSorted = [...second].sort()
      if (JSON.stringify(firstSorted) === JSON.stringify(secondSorted.map(v => v + 1))) {
        structureType = 'parallel'
      } else if (JSON.stringify(chapterOrder.slice(0, 3)) === JSON.stringify(chapterOrder.slice(-3).sort())) {
        structureType = 'cyclic'
      } else {
        structureType = 'nonlinear'
      }
    } else if (isDecreasing) {
      structureType = 'framed'
    }
  }

  return {
    ...state,
    structurePatterns: {
      structureType,
      chapterSequence: chapterOrder,
      sceneTransitionStyle: transitionStyle,
      openingPattern: openingText.slice(0, 100),
      closingPattern: closingText.slice(0, 100),
    },
  }
}

// Discover patterns from historical texts
export function discoverPatterns(
  state: WritingPatternState,
  minOccurrences: number = 3
): WritingPatternState {
  const patterns = new Map(state.discoveredPatterns)

  // Analyze vocabulary for recurring phrases
  const phraseFreq = new Map<string, number>()
  const historicalEntries = Array.from(state.historicalTexts.entries())
  
  // For each historical text, extract bigrams and trigrams
  // This is a simplified version - real implementation would store text content
  for (const [textId] of historicalEntries) {
    // Simulated pattern detection from vocabulary profile
    for (const [word, pref] of state.vocabularyProfile.entries()) {
      if (pref.frequency > 5) { // recurring word
        const patternId = `vocab_${word}`
        const existing = patterns.get(patternId)
        if (existing) {
          existing.occurrences++
          existing.confidence = Math.min(1, existing.occurrences / 10)
        } else {
          patterns.set(patternId, {
            patternId,
            patternType: 'vocabulary',
            occurrences: 1,
            confidence: 0.3,
            examples: [word],
            frequency: pref.frequency,
            lastSeen: Date.now(),
          })
        }
      }
    }
    break // single text analysis for now
  }

  // Detect pacing patterns
  const ph = state.pacingHabits
  if (ph.sceneLength > 0) {
    const scenePattern: WritingPattern = {
      patternId: 'pacing_scene_length',
      patternType: 'pacing',
      occurrences: historicalEntries.length,
      confidence: Math.min(1, historicalEntries.length / 5),
      examples: [`Avg scene: ${ph.sceneLength.toFixed(0)} words`],
      frequency: ph.sceneLength / 1000,
      lastSeen: Date.now(),
    }
    patterns.set('pacing_scene_length', scenePattern)
  }

  // Detect dialogue vs narration patterns
  if (ph.dialogueRatio > 0) {
    const dialoguePattern: WritingPattern = {
      patternId: 'dialogue_ratio',
      patternType: 'dialogue',
      occurrences: historicalEntries.length,
      confidence: Math.min(1, historicalEntries.length / 5),
      examples: [`Dialogue ratio: ${(ph.dialogueRatio * 100).toFixed(0)}%`],
      frequency: ph.dialogueRatio,
      lastSeen: Date.now(),
    }
    patterns.set('dialogue_ratio', dialoguePattern)
  }

  // Filter by min occurrences
  for (const [id, pattern] of Array.from(patterns.entries())) {
    if (pattern.occurrences < minOccurrences) {
      patterns.delete(id)
    }
  }

  return { ...state, discoveredPatterns: patterns }
}

// Get top vocabulary preferences
export function getTopVocabularyPreferences(
  state: WritingPatternState,
  category?: VocabularyPreference['category'],
  topK: number = 20
): VocabularyPreference[] {
  let prefs = Array.from(state.vocabularyProfile.values())
  
  if (category) {
    prefs = prefs.filter(p => p.category === category)
  }

  return prefs
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, topK)
}

// Get personal style signature
export function getPersonalStyleSignature(
  state: WritingPatternState
): {
    uniqueWordCount: number
    avgSceneLength: number
    dialogueRatio: number
    structureType: string
    dominantPatternTypes: string[]
  } {
  return {
    uniqueWordCount: state.vocabularyProfile.size,
    avgSceneLength: state.pacingHabits.sceneLength,
    dialogueRatio: state.pacingHabits.dialogueRatio,
    structureType: state.structurePatterns.structureType,
    dominantPatternTypes: Array.from(state.discoveredPatterns.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 3)
      .map(p => p.patternType),
  }
}

// Compare with previous writing to detect evolution
export function compareWithPrevious(
  state: WritingPatternState,
  previousSignature: ReturnType<typeof getPersonalStyleSignature>
): {
  vocabularyChange: number   // -1 to 1
  pacingChange: number
  styleDrift: number
} {
  const current = getPersonalStyleSignature(state)
  
  // Vocabulary change (unique word ratio comparison)
  const prevUniqueRatio = previousSignature.uniqueWordCount > 0
    ? previousSignature.uniqueWordCount / 10000
    : 0.1
  const currUniqueRatio = current.uniqueWordCount / 10000
  const vocabularyChange = Math.max(-1, Math.min(1, (currUniqueRatio - prevUniqueRatio) / prevUniqueRatio))

  // Pacing change
  const prevPace = previousSignature.avgSceneLength
  const currPace = current.avgSceneLength
  const pacingChange = prevPace > 0
    ? Math.max(-1, Math.min(1, (currPace - prevPace) / prevPace))
    : 0

  // Style drift (overall)
  const styleDrift = (Math.abs(vocabularyChange) + Math.abs(pacingChange)) / 2

  return { vocabularyChange, pacingChange, styleDrift }
}

// Get suggested improvements based on patterns
export function getSuggestedImprovements(
  state: WritingPatternState
): string[] {
  const suggestions: string[] = []

  const ph = state.pacingHabits
  
  if (ph.dialogueRatio < 0.2) {
    suggestions.push('Consider adding more dialogue to increase pacing and reader engagement')
  }
  if (ph.dialogueRatio > 0.6) {
    suggestions.push('Heavy dialogue ratio - consider balancing with more descriptive passages')
  }
  if (ph.pauseFrequency < 0.5) {
    suggestions.push('Few reflective passages detected - strategic pauses can deepen emotional impact')
  }
  if (state.structurePatterns.structureType === 'linear') {
    suggestions.push('Linear structure detected - consider non-linear techniques for complexity')
  }
  if (state.discoveredPatterns.size < 3) {
    suggestions.push('Limited pattern detection - more writing samples needed for personalized insights')
  }

  return suggestions
}
