export interface VocabularyPreference {
  word: string
  frequency: number
  context: string
  lastUsed: number
}

export interface PacingHabit {
  avgSentenceLength: number
  avgParagraphLength: number
  dialogueToNarrationRatio: number
  actionDensity: number
  descriptionDensity: number
}

export interface StyleFingerprint {
  uniqueWordRatio: number
  avgWordLength: number
  sentenceVariance: number
  paragraphVariance: number
  punctuationDensity: Record<string, number>
  firstPersonPronounRatio: number
  conjunctionRatio: number
}

export interface WritingPatternState {
  vocabulary: VocabularyPreference[]
  pacingHabit: PacingHabit | null
  fingerprint: StyleFingerprint | null
  totalWordsAnalyzed: number
  sessionsAnalyzed: number
  lastAnalysisTimestamp: number
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): WritingPatternState {
  return { vocabulary: [], pacingHabit: null, fingerprint: null, totalWordsAnalyzed: 0, sessionsAnalyzed: 0, lastAnalysisTimestamp: 0, typeAlias: {} }
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(w => w.length >= 2)
}

function countOccurrences(text: string, char: string): number {
  let count = 0
  let idx = text.indexOf(char)
  while (idx !== -1) { count++; idx = text.indexOf(char, idx + 1) }
  return count
}

export function analyzeVocabularyPreferences(state: WritingPatternState, text: string): WritingPatternState {
  const words = tokenize(text)
  const wordFreq: Record<string, number> = {}
  for (const w of words) { wordFreq[w] = (wordFreq[w] || 0) + 1 }
  const existing = new Map(state.vocabulary.map(v => [v.word, v]))
  for (const [word, freq] of Object.entries(wordFreq)) {
    const e = existing.get(word)
    if (e) { e.frequency += freq; e.lastUsed = Date.now() }
    else { existing.set(word, { word, frequency: freq, context: 'general', lastUsed: Date.now() }) }
  }
  const vocabulary = Array.from(existing.values()).sort((a, b) => b.frequency - a.frequency).slice(0, 500)
  return { ...state, vocabulary, totalWordsAnalyzed: state.totalWordsAnalyzed + words.length, sessionsAnalyzed: state.sessionsAnalyzed + 1, lastAnalysisTimestamp: Date.now() }
}

export function analyzePacingHabits(state: WritingPatternState, text: string): WritingPatternState {
  const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length)
  const paragraphLengths = paragraphs.map(p => p.trim().split(/\s+/).length)
  const avgSL = sentenceLengths.length > 0 ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length : 0
  const avgPL = paragraphLengths.length > 0 ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length : 0
  const dialogueCount = (text.match(/["""«»『』「」]/g) || []).length
  const wordCount = Math.max(1, text.split(/\s+/).length)
  const dialogueRatio = dialogueCount / wordCount
  const actionWords = ['ran', 'jumped', 'walked', 'moved', 'went', 'came', 'turned', 'looked', 'said', 'asked']
  const actionDensity = actionWords.reduce((count, w) => count + (text.toLowerCase().match(new RegExp(w, 'g')) || []).length, 0) / wordCount * 1000
  const descriptiveWords = ['was', 'were', 'seemed', 'appeared', 'felt', 'looked', 'sounded', 'smelled']
  const descDensity = descriptiveWords.reduce((count, w) => count + (text.toLowerCase().match(new RegExp(w, 'g')) || []).length, 0) / wordCount * 1000
  const pacingHabit: PacingHabit = { avgSentenceLength: Math.round(avgSL * 10) / 10, avgParagraphLength: Math.round(avgPL * 10) / 10, dialogueToNarrationRatio: Math.round(dialogueRatio * 100) / 100, actionDensity: Math.round(actionDensity * 10) / 10, descriptionDensity: Math.round(descDensity * 10) / 10 }
  return { ...state, pacingHabit }
}

export function extractStyleFingerprint(state: WritingPatternState, text: string): WritingPatternState {
  const words = tokenize(text)
  const totalWords = words.length
  const uniqueWords = new Set(words)
  const uniqueWordRatio = totalWords > 0 ? uniqueWords.size / totalWords : 0
  const avgWordLength = words.length > 0 ? words.reduce((s, w) => s + w.length, 0) / words.length : 0
  const sentenceLengths = text.split(/[.!?。！？]+/).filter(s => s.trim().length > 0).map(s => s.trim().split(/\s+/).length)
  const meanSL = sentenceLengths.length > 0 ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length : 0
  const sentenceVariance = sentenceLengths.length > 1 ? sentenceLengths.reduce((s, len) => s + (len - meanSL) ** 2, 0) / sentenceLengths.length : 0
  const paragraphLengths = text.split(/\n\n+/).filter(p => p.trim().length > 0).map(p => p.trim().split(/\s+/).length)
  const meanPL = paragraphLengths.length > 0 ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length : 0
  const paragraphVariance = paragraphLengths.length > 1 ? paragraphLengths.reduce((s, len) => s + (len - meanPL) ** 2, 0) / paragraphLengths.length : 0
  const punctuation: Record<string, number> = {}
  const totalChars = Math.max(1, text.length)
  const punctChars = [',', '，', '.', '。', '-', '—', '!', '?', '"', '"']
  for (const p of punctChars) {
    const count = countOccurrences(text, p)
    punctuation[p] = Math.round((count / totalChars) * 1000) / 10
  }
  const firstPersonWords = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our']
  const firstPersonCount = words.filter(w => firstPersonWords.includes(w)).length
  const firstPersonPronounRatio = totalWords > 0 ? firstPersonCount / totalWords : 0
  const conjunctions = ['and', 'but', 'or', 'so', 'because', 'when', 'if', 'while']
  const conjunctionCount = words.filter(w => conjunctions.includes(w)).length
  const conjunctionRatio = totalWords > 0 ? conjunctionCount / totalWords : 0
  const fingerprint: StyleFingerprint = { uniqueWordRatio: Math.round(uniqueWordRatio * 1000) / 1000, avgWordLength: Math.round(avgWordLength * 100) / 100, sentenceVariance: Math.round(sentenceVariance * 10) / 10, paragraphVariance: Math.round(paragraphVariance * 10) / 10, punctuationDensity: punctuation, firstPersonPronounRatio: Math.round(firstPersonPronounRatio * 1000) / 1000, conjunctionRatio: Math.round(conjunctionRatio * 1000) / 1000 }
  return { ...state, fingerprint }
}

export function analyzeWritingSample(state: WritingPatternState, text: string): WritingPatternState {
  let result = analyzeVocabularyPreferences(state, text)
  result = analyzePacingHabits(result, text)
  result = extractStyleFingerprint(result, text)
  return result
}

export function getMostCommonWords(state: WritingPatternState, count: number = 20) {
  return state.vocabulary.slice(0, count).map(v => ({ word: v.word, frequency: v.frequency }))
}

export function compareFingerprints(fp1: StyleFingerprint, fp2: StyleFingerprint) {
  const differences: string[] = []
  if (Math.abs(fp1.uniqueWordRatio - fp2.uniqueWordRatio) > 0.1) differences.push(`uniqueWordRatio: ${fp1.uniqueWordRatio} vs ${fp2.uniqueWordRatio}`)
  if (Math.abs(fp1.avgWordLength - fp2.avgWordLength) > 0.5) differences.push(`avgWordLength: ${fp1.avgWordLength} vs ${fp2.avgWordLength}`)
  if (Math.abs(fp1.sentenceVariance - fp2.sentenceVariance) > 5) differences.push(`sentenceVariance: ${fp1.sentenceVariance} vs ${fp2.sentenceVariance}`)
  if (Math.abs(fp1.firstPersonPronounRatio - fp2.firstPersonPronounRatio) > 0.05) differences.push(`firstPersonPronounRatio: ${fp1.firstPersonPronounRatio} vs ${fp2.firstPersonPronounRatio}`)
  const similarity = Math.max(0, 100 - differences.length * 10 - Math.abs(fp1.uniqueWordRatio - fp2.uniqueWordRatio) * 50)
  return { similarity: Math.round(similarity), differences }
}

export function checkStyleConsistency(state: WritingPatternState, text: string) {
  if (!state.fingerprint || state.sessionsAnalyzed < 3) return { consistent: true, similarityScore: 100, warnings: ['Insufficient data for comparison'] }
  const tempState = analyzeWritingSample(createEmptyState(), text)
  const newFingerprint = tempState.fingerprint!
  const comparison = compareFingerprints(state.fingerprint, newFingerprint)
  const warnings: string[] = []
  if (comparison.similarity < 70) warnings.push('Style significantly deviates from your usual pattern')
  if (comparison.differences.some(d => d.includes('uniqueWordRatio'))) warnings.push('Vocabulary diversity is unusual for you')
  return { consistent: comparison.similarity >= 60, similarityScore: comparison.similarity, warnings }
}

export function suggestVocabularyImprovements(state: WritingPatternState): string[] {
  const suggestions: string[] = []
  if (state.vocabulary.length < 50) { suggestions.push('Expand your active vocabulary — try using more varied descriptive words'); return suggestions }
  const overused = state.vocabulary.slice(0, 5)
  if (overused.length > 0) suggestions.push(`Consider varying overused words: ${overused.map(w => w.word).join(', ')}`)
  if (state.pacingHabit && state.pacingHabit.avgSentenceLength < 8) suggestions.push('Your sentences tend to be short — try varying sentence length for better rhythm')
  if (state.pacingHabit && state.pacingHabit.avgSentenceLength > 25) suggestions.push('Your sentences tend to be long — consider breaking up complex sentences')
  if (state.fingerprint && state.fingerprint.uniqueWordRatio < 0.4) suggestions.push('Try incorporating more unique words to enrich your vocabulary usage')
  return suggestions
}
