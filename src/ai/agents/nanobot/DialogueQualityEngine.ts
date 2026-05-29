/**
 * DialogueQualityEngine — V361
 * Dialogue analysis, authenticity scoring, speech pattern recognition.
 * Inspired by: thunderbolt (feedback loops), chatdev (role analysis)
 */

export interface SpeechPattern {
  characterId: string
  avgSentenceLength: number
  commonWords: string[]
  questionFrequency: number
  exclamationFrequency: number
  dialects: string[]
  formalityLevel: number  // 0-100 (casual to formal)
}

export interface DialogueAnalysis {
  authenticityScore: number  // 0-100
  naturalnessScore: number
  distinctivenessScore: number
  emotionalAuthenticity: number
  issues: string[]
}

export interface DialogueQualityState {
  speechPatterns: Record<string, SpeechPattern>
  dialogueHistory: DialogueRecord[]
  overallQuality: DialogueAnalysis
  typeAlias: Record<string, unknown>
}

export interface DialogueRecord {
  characterId: string
  text: string
  timestamp: number
  context?: string
}

export function createEmptyState(): DialogueQualityState {
  return {
    speechPatterns: {},
    dialogueHistory: [],
    overallQuality: { authenticityScore: 0, naturalnessScore: 0, distinctivenessScore: 0, emotionalAuthenticity: 0, issues: [] },
    typeAlias: {},
  }
}

export function analyzeDialogue(
  state: DialogueQualityState,
  characterId: string,
  text: string,
  context?: string
): DialogueAnalysis {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const questions = (text.match(/\?/g) || []).length
  const exclamations = (text.match(/!/g) || []).length
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length
  const hasContractions = /\w+'/g.test(text) ? 1 : 0
  const dialogueActions = (text.match(/\[.*?\]/g) || []).length
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 0
  let authenticityScore = 50
  if (avgSentenceLength >= 10 && avgSentenceLength <= 25) authenticityScore += 15
  if (questions > 0) authenticityScore += Math.min(10, questions * 3)
  if (exclamations > 0) authenticityScore += Math.min(5, exclamations * 2)
  if (lexicalDiversity > 0.4) authenticityScore += 10
  if (dialogueActions > 0) authenticityScore += 5
  let naturalnessScore = 50
  if (hasContractions) naturalnessScore += 10
  if (avgSentenceLength < 40) naturalnessScore += 10
  if (words.length >= 10 && words.length <= 200) naturalnessScore += 10
  const distinctivenessScore = Math.min(100, Math.round(lexicalDiversity * 80 + (100 - avgSentenceLength / 2)))
  const emotionalAuthenticity = Math.min(100, Math.round((questions + exclamations) * 5 + naturalnessScore * 0.3))
  const issues: string[] = []
  if (avgSentenceLength > 35) issues.push('Very long sentences may sound unnatural')
  if (lexicalDiversity < 0.2) issues.push('Low vocabulary variety detected')
  if (questions === 0 && exclamations === 0 && sentences.length > 5) issues.push('Monotone dialogue - consider adding emotional variation')
  return {
    authenticityScore: Math.min(100, authenticityScore),
    naturalnessScore: Math.min(100, naturalnessScore),
    distinctivenessScore: Math.min(100, distinctivenessScore),
    emotionalAuthenticity: Math.min(100, emotionalAuthenticity),
    issues,
  }
}

export function recordDialogue(
  state: DialogueQualityState,
  characterId: string,
  text: string,
  context?: string
): DialogueQualityState {
  const record: DialogueRecord = { characterId, text, timestamp: Date.now(), context }
  const dialogueHistory = [...state.dialogueHistory, record].slice(-100)
  const analysis = analyzeDialogue(state, characterId, text, context)
  const overallQuality: DialogueAnalysis = {
    authenticityScore: (state.overallQuality.authenticityScore + analysis.authenticityScore) / 2,
    naturalnessScore: (state.overallQuality.naturalnessScore + analysis.naturalnessScore) / 2,
    distinctivenessScore: (state.overallQuality.distinctivenessScore + analysis.distinctivenessScore) / 2,
    emotionalAuthenticity: (state.overallQuality.emotionalAuthenticity + analysis.emotionalAuthenticity) / 2,
    issues: [...state.overallQuality.issues, ...analysis.issues].slice(-10),
  }
  return { ...state, dialogueHistory, overallQuality }
}

export function getSpeechPattern(state: DialogueQualityState, characterId: string): SpeechPattern | null {
  return state.speechPatterns[characterId] || null
}

export function learnSpeechPattern(state: DialogueQualityState, characterId: string, samples: string[]): DialogueQualityState {
  const allText = samples.join(' ')
  const words = allText.split(/\s+/).filter(w => w.length > 0)
  const sentences = samples.flatMap(s => s.split(/[.!?]+/)).filter(s => s.trim().length > 0)
  const questions = (allText.match(/\?/g) || []).length
  const exclamations = (allText.match(/!/g) || []).length
  const wordFreq: Record<string, number> = {}
  for (const w of words) {
    const lower = w.toLowerCase().replace(/[^a-z]/g, '')
    if (lower.length > 3) wordFreq[lower] = (wordFreq[lower] || 0) + 1
  }
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(e => e[0])
  const pattern: SpeechPattern = {
    characterId,
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : words.length,
    commonWords: topWords,
    questionFrequency: questions / samples.length,
    exclamationFrequency: exclamations / samples.length,
    dialects: [],
    formalityLevel: 50,
  }
  return { ...state, speechPatterns: { ...state.speechPatterns, [characterId]: pattern } }
}

export function compareDialogueQuality(state: DialogueQualityState, charId1: string, charId2: string) {
  const hist1 = state.dialogueHistory.filter(d => d.characterId === charId1)
  const hist2 = state.dialogueHistory.filter(d => d.characterId === charId2)
  if (hist1.length === 0 && hist2.length === 0) return null
  const avgAuth1 = hist1.length > 0 ? hist1.reduce((s, d) => {
    const a = analyzeDialogue(state, charId1, d.text)
    return s + a.authenticityScore
  }, 0) / hist1.length : 50
  const avgAuth2 = hist2.length > 0 ? hist2.reduce((s, d) => {
    const a = analyzeDialogue(state, charId2, d.text)
    return s + a.authenticityScore
  }, 0) / hist2.length : 50
  return {
    moreNatural: avgAuth1 > avgAuth2 ? charId1 : charId2,
    qualityDiff: Math.abs(avgAuth1 - avgAuth2),
  }
}
