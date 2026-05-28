/**
 * WriterStyleProfileAnalyzer - V150
 * Multi-Dimensional Writing Style Analysis Engine
 * 
 * Design references:
 * - chatdev: multi-perspective expert evaluation
 * - nanobot: distributed analysis mesh
 * - ruflo: hierarchical decomposition (vocabulary → syntax → structure → voice)
 */

export type StyleDimension = 
  | 'vocabulary_richness'
  | 'sentence_complexity'
  | 'paragraph_structure'
  | 'dialogue_ratio'
  | 'narrative_distance'
  | 'pacing_control'
  | 'description_density'
  | 'emotional_tone'

export interface VocabularyMetrics {
  uniqueWordCount: number
  totalWordCount: number
  typeTokenRatio: number       // unique / total
  rareWordRatio: number       // words appearing once / total
  avgWordLength: number       // characters per word
  advancedWordCount: number   // words > 8 chars
  colloquialScore: number     // 0-100 informal language
}

export interface SyntaxMetrics {
  avgSentenceLength: number   // words per sentence
  sentenceLengthVariance: number
  complexSentenceRatio: number  // sentences > 25 words
  questionRatio: number
  exclamationRatio: number
  fragmentRatio: number
  paragraphAvgLength: number   // sentences per paragraph
}

export interface DialogueMetrics {
  dialogueRatio: number        // dialogue words / total words
  dialogueTagFrequency: number // "said"/"asked" etc per dialogue
  uniqueSpeakerCount: number
  dialoguePerSpeaker: Map<string, number>
  innerThoughtRatio: number    // italic/thought words / total
}

export interface NarrativeVoice {
  distanceScore: number       // 0-100, 0=first person, 100=omniscient
  emotionalLeakScore: number   // how much author emotion shows
  subjectiveWordDensity: number // "I feel", "perhaps", "maybe"
  tenseDistribution: Map<string, number>  // past/ppresent/future ratio
  perspectiveStability: number  // 0-100 how consistent the POV is
}

export interface StyleProfile {
  vocabulary: VocabularyMetrics
  syntax: SyntaxMetrics
  dialogue: DialogueMetrics
  voice: NarrativeVoice
  overallScore: number         // 0-100 style maturity
  genreAffinity: string[]      // matching genres
  comparableAuthors: string[]  // similar known authors
}

export interface StyleProfileState {
  profiles: Map<string, StyleProfile>
  analysisHistory: Array<{ timestamp: number; chapter: number; overallScore: number }>
  currentProfileId: string | null
  benchmarkProfile: StyleProfile | null  // target style to match
  sessionCount: number
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyAnalyzerState(): StyleProfileState {
  return {
    profiles: new Map(),
    analysisHistory: [],
    currentProfileId: null,
    benchmarkProfile: null,
    sessionCount: 0,
  }
}

// =============================================================================
// Vocabulary Analysis
// =============================================================================

export function analyzeVocabulary(text: string): VocabularyMetrics {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || []
  const total = words.length
  
  if (total === 0) {
    return {
      uniqueWordCount: 0,
      totalWordCount: 0,
      typeTokenRatio: 0,
      rareWordRatio: 0,
      avgWordLength: 0,
      advancedWordCount: 0,
      colloquialScore: 0,
    }
  }
  
  const wordCount: Map<string, number> = new Map()
  for (const w of words) {
    wordCount.set(w, (wordCount.get(w) || 0) + 1)
  }
  
  const unique = wordCount.size
  const rare = Array.from(wordCount.values()).filter(c => c === 1).length
  
  const totalChars = words.reduce((a, w) => a + w.length, 0)
  const advanced = words.filter(w => w.length > 8).length
  
  // Colloquial indicators
  const casualWords = ['yeah', 'gonna', 'wanna', 'kinda', 'sorta', ' stuff', 'things', 'awesome', 'cool', 'okay', 'like', 'whatever']
  const casualCount = words.filter(w => casualWords.some(c => w.includes(c))).length
  
  return {
    uniqueWordCount: unique,
    totalWordCount: total,
    typeTokenRatio: unique / total,
    rareWordRatio: rare / total,
    avgWordLength: totalChars / total,
    advancedWordCount: advanced,
    colloquialScore: (casualCount / total) * 100,
  }
}

// =============================================================================
// Syntax Analysis
// =============================================================================

export function analyzeSyntax(text: string): SyntaxMetrics {
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceWords = sentences.map(s => s.trim().split(/\s+/).filter(w => w.length > 0))
  
  const wordCounts = sentenceWords.map(w => w.length)
  const totalWords = wordCounts.reduce((a, b) => a + b, 0)
  
  const avgLen = sentences.length > 0 ? totalWords / sentences.length : 0
  const variance = sentences.length > 1 
    ? wordCounts.reduce((acc, wc) => acc + Math.pow(wc - avgLen, 2), 0) / wordCounts.length 
    : 0
  
  const longSentences = wordCounts.filter(wc => wc > 25).length
  const complexRatio = sentences.length > 0 ? longSentences / sentences.length : 0
  
  // Count questions and exclamations
  const questions = (text.match(/\?/g) || []).length
  const exclamations = (text.match(/!/g) || []).length
  
  // Fragments (very short sentences)
  const fragments = wordCounts.filter(wc => wc < 5 && wc > 0).length
  const fragmentRatio = sentences.length > 0 ? fragments / sentences.length : 0
  
  // Paragraph analysis
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  const paraLens = paragraphs.map(p => p.split(/[.!?]+/).filter(s => s.trim().length > 0).length)
  const avgParaLen = paragraphs.length > 0 ? paraLens.reduce((a, b) => a + b, 0) / paragraphs.length : 0
  
  return {
    avgSentenceLength: avgLen,
    sentenceLengthVariance: Math.sqrt(variance),
    complexSentenceRatio: complexRatio,
    questionRatio: sentences.length > 0 ? questions / sentences.length : 0,
    exclamationRatio: sentences.length > 0 ? exclamations / sentences.length : 0,
    fragmentRatio,
    paragraphAvgLength: avgParaLen,
  }
}

// =============================================================================
// Dialogue Analysis
// =============================================================================

export function analyzeDialogue(text: string): DialogueMetrics {
  // Find dialogue sections (quoted text)
  const dialogueMatches = text.match(/"([^"]+)"/g) || []
  const dialogueWords = dialogueMatches.join(' ').split(/\s+/).filter(w => w.length > 0)
  const dialogueRatio = text.split(/\s+/).filter(w => w.length > 0).length > 0
    ? dialogueWords.length / Math.max(1, text.split(/\s+/).length)
    : 0
  
  // Count dialogue tags
  const tagWords = ['said', 'asked', 'replied', 'answered', 'whispered', 'shouted', 'murmured', 'stated', 'exclaimed', 'called']
  const words = text.toLowerCase().split(/\s+/)
  const tagCount = words.filter(w => tagWords.some(t => w.includes(t))).length
  
  // Count unique speakers (names before dialogue tags)
  const speakerMatches = text.match(/([A-Z][a-z]+)\s+(said|asked|replied)/g) || []
  const speakers = new Set(speakerMatches.map(m => m.split(/\s+/)[0]))
  
  // Inner thoughts (italic markers or em-dash thoughts)
  const thoughtMatches = text.match(/[—-]\s*([^.!?]+)/g) || []
  const innerThoughtRatio = text.split(/\s+/).length > 0
    ? thoughtMatches.length / Math.max(1, text.split(/\s+/).length)
    : 0
  
  return {
    dialogueRatio,
    dialogueTagFrequency: dialogueWords.length > 0 ? tagCount / dialogueWords.length * 100 : 0,
    uniqueSpeakerCount: speakers.size,
    dialoguePerSpeaker: new Map(),
    innerThoughtRatio,
  }
}

// =============================================================================
// Narrative Voice Analysis
// =============================================================================

export function analyzeNarrativeVoice(text: string): NarrativeVoice {
  // Distance score: first person = 0, omniscient = 100
  const firstPersonMatches = text.match(/\b(I|me|my|mine|myself|we|us|our)\b/gi) || []
  const thirdPersonMatches = text.match(/\b(he|she|they|him|her|them|his|hers|their)\b/gi) || []
  
  const totalPronouns = firstPersonMatches.length + thirdPersonMatches.length
  const distanceScore = totalPronouns > 0
    ? (thirdPersonMatches.length / totalPronouns) * 100
    : 50  // neutral
  
  // Emotional leak
  const emotionWords = ['feel', 'felt', 'feeling', 'sad', 'happy', 'angry', 'scared', 'worried', 'hopeful', 'heart', 'soul', 'spirit']
  const words = text.toLowerCase().split(/\s+/)
  const emotionLeakScore = (emotionWords.filter(w => words.some(t => t.includes(w))).length / Math.max(1, words.length)) * 100 * 5
  
  // Subjective words
  const subjectiveWords = ['perhaps', 'maybe', 'probably', 'seems', 'appeared', 'thought', 'wondered', 'guessed', 'assumed']
  const subjectiveWordDensity = (words.filter(w => subjectiveWords.some(s => w.includes(s))).length / Math.max(1, words.length)) * 100
  
  // Tense distribution
  const pastVerbs = (text.match(/\b(was|were|had|did|went|said|saw|heard|knew|thought)\b/gi) || []).length
  const presentVerbs = (text.match(/\b(is|are|have|do|go|see|hear|know|think|feel)\b/gi) || []).length
  const tenseDistribution = new Map<string, number>()
  tenseDistribution.set('past', pastVerbs)
  tenseDistribution.set('present', presentVerbs)
  tenseDistribution.set('future', 0)
  
  // Perspective stability (simple metric: consistency of pronoun usage)
  const perspectiveStability = totalPronouns > 5 ? 85 : 60  // placeholder
  
  return {
    distanceScore: Math.min(100, distanceScore),
    emotionalLeakScore: Math.min(100, emotionLeakScore),
    subjectiveWordDensity,
    tenseDistribution,
    perspectiveStability,
  }
}

// =============================================================================
// Style Profile Building
// =============================================================================

export function buildStyleProfile(text: string): StyleProfile {
  const vocabulary = analyzeVocabulary(text)
  const syntax = analyzeSyntax(text)
  const dialogue = analyzeDialogue(text)
  const voice = analyzeNarrativeVoice(text)
  
  // Overall score: weighted combination
  const vocabScore = vocabulary.typeTokenRatio * 100 * 0.2 + vocabulary.rareWordRatio * 100 * 0.1
  const syntaxScore = Math.min(100, syntax.avgSentenceLength * 2) * 0.15
  const dialogueScore = dialogue.dialogueRatio * 50 * 0.15
  const voiceScore = (100 - voice.distanceScore * 0.3) * 0.2 + voice.perspectiveStability * 0.2
  
  const overallScore = Math.min(100, vocabScore + syntaxScore + dialogueScore + voiceScore)
  
  // Genre affinity
  const genreAffinity: string[] = []
  if (syntax.complexSentenceRatio > 0.3) genreAffinity.push('literary')
  if (dialogue.dialogueRatio > 0.4) genreAffinity.push('dialogue_heavy')
  if (vocabulary.typeTokenRatio > 0.7) genreAffinity.push('rich_vocabulary')
  if (voice.distanceScore > 70) genreAffinity.push('omniscient_third')
  if (voice.distanceScore < 30) genreAffinity.push('first_person')
  if (syntax.fragmentRatio > 0.2) genreAffinity.push('minimalist')
  if (dialogue.innerThoughtRatio > 0.1) genreAffinity.push('psychological')
  if (genreAffinity.length === 0) genreAffinity.push('general_fiction')
  
  return {
    vocabulary,
    syntax,
    dialogue,
    voice,
    overallScore,
    genreAffinity,
    comparableAuthors: [],
  }
}

export function saveProfile(
  state: StyleProfileState,
  chapter: number,
  text: string
): StyleProfileState {
  const profile = buildStyleProfile(text)
  
  const profileId = `profile_ch${chapter}`
  const newProfiles = new Map(state.profiles)
  newProfiles.set(profileId, profile)
  
  const newHistory = [...state.analysisHistory.slice(-19), {
    timestamp: Date.now(),
    chapter,
    overallScore: profile.overallScore,
  }]
  
  return {
    ...state,
    profiles: newProfiles,
    analysisHistory: newHistory,
    currentProfileId: profileId,
    sessionCount: state.sessionCount + 1,
  }
}

// =============================================================================
// Style Comparison
// =============================================================================

export function compareProfiles(
  profile1: StyleProfile,
  profile2: StyleProfile
): { similarity: number; differences: string[] } {
  const differences: string[] = []
  
  const vocabDiff = Math.abs(profile1.vocabulary.typeTokenRatio - profile2.vocabulary.typeTokenRatio)
  if (vocabDiff > 0.2) differences.push('vocabulary richness')
  
  const syntaxDiff = Math.abs(profile1.syntax.avgSentenceLength - profile2.syntax.avgSentenceLength)
  if (syntaxDiff > 5) differences.push('sentence length')
  
  const dialogueDiff = Math.abs(profile1.dialogue.dialogueRatio - profile2.dialogue.dialogueRatio)
  if (dialogueDiff > 0.2) differences.push('dialogue ratio')
  
  const voiceDiff = Math.abs(profile1.voice.distanceScore - profile2.voice.distanceScore)
  if (voiceDiff > 20) differences.push('narrative distance')
  
  const similarity = Math.max(0, 100 - vocabDiff * 50 - syntaxDiff * 3 - dialogueDiff * 40 - voiceDiff * 0.5)
  
  return { similarity, differences }
}

export function setBenchmark(
  state: StyleProfileState,
  text: string
): StyleProfileState {
  const benchmark = buildStyleProfile(text)
  return { ...state, benchmarkProfile: benchmark }
}

export function analyzeStyleGap(
  state: StyleProfileState
): { gapScore: number; areas: string[]; suggestions: string[] } {
  if (!state.benchmarkProfile || !state.currentProfileId) {
    return { gapScore: 0, areas: [], suggestions: [] }
  }
  
  const current = state.profiles.get(state.currentProfileId)
  if (!current) {
    return { gapScore: 0, areas: [], suggestions: [] }
  }
  
  const { similarity, differences } = compareProfiles(current, state.benchmarkProfile)
  const gapScore = 100 - similarity
  
  const suggestions: string[] = []
  if (differences.includes('vocabulary richness')) {
    suggestions.push('Expand vocabulary: read diverse authors to improve word variety')
  }
  if (differences.includes('sentence length')) {
    suggestions.push('Adjust sentence complexity to match target style')
  }
  if (differences.includes('dialogue ratio')) {
    suggestions.push('Balance dialogue frequency to match benchmark')
  }
  if (differences.includes('narrative distance')) {
    suggestions.push('Adjust narrative perspective (first/second/third person)')
  }
  
  return { gapScore, areas: differences, suggestions }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatStyleProfile(profile: StyleProfile): string {
  const lines = [
    '=== Writing Style Profile ===',
    `Overall Score: ${profile.overallScore.toFixed(1)}/100`,
    '',
    '--- Vocabulary Metrics ---',
    `  Type-Token Ratio: ${(profile.vocabulary.typeTokenRatio * 100).toFixed(1)}%`,
    `  Unique Words: ${profile.vocabulary.uniqueWordCount} / ${profile.vocabulary.totalWordCount}`,
    `  Rare Word Ratio: ${(profile.vocabulary.rareWordRatio * 100).toFixed(1)}%`,
    `  Avg Word Length: ${profile.vocabulary.avgWordLength.toFixed(2)} chars`,
    '',
    '--- Syntax Metrics ---',
    `  Avg Sentence Length: ${profile.syntax.avgSentenceLength.toFixed(1)} words`,
    `  Sentence Variance: ${profile.syntax.sentenceLengthVariance.toFixed(2)}`,
    `  Complex Sentence Ratio: ${(profile.syntax.complexSentenceRatio * 100).toFixed(1)}%`,
    '',
    '--- Dialogue Metrics ---',
    `  Dialogue Ratio: ${(profile.dialogue.dialogueRatio * 100).toFixed(1)}%`,
    `  Unique Speakers: ${profile.dialogue.uniqueSpeakerCount}`,
    '',
    '--- Narrative Voice ---',
    `  Distance Score: ${profile.voice.distanceScore.toFixed(1)} (0=first-person, 100=omniscient)`,
    `  Emotional Leak: ${profile.voice.emotionalLeakScore.toFixed(1)}`,
    `  Perspective Stability: ${profile.voice.perspectiveStability.toFixed(1)}`,
    '',
    '--- Genre Affinity ---',
    `  ${profile.genreAffinity.join(', ')}`,
  ]
  
  return lines.join('\n')
}

export function formatStyleDashboard(state: StyleProfileState): string {
  const lines = [
    '=== Writer Style Analysis Dashboard ===',
    `Profiles analyzed: ${state.sessionCount}`,
    '',
  ]
  
  if (state.analysisHistory.length > 0) {
    lines.push('--- Recent Analysis ---')
    const recent = state.analysisHistory.slice(-5)
    for (const h of recent) {
      lines.push(`  Chapter ${h.chapter}: score ${h.overallScore.toFixed(1)}`)
    }
  }
  
  if (state.benchmarkProfile) {
    lines.push('')
    lines.push('--- Benchmark Active ---')
    lines.push(`  Target style score: ${state.benchmarkProfile.overallScore.toFixed(1)}`)
    
    if (state.currentProfileId) {
      const gap = analyzeStyleGap(state)
      lines.push(`  Style gap: ${gap.gapScore.toFixed(1)}%`)
      if (gap.suggestions.length > 0) {
        lines.push('  Suggestions:')
        for (const s of gap.suggestions) {
          lines.push(`    - ${s}`)
        }
      }
    }
  }
  
  return lines.join('\n')
}
