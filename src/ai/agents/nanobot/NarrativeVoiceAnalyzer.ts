/**
 * NarrativeVoiceAnalyzer — V373
 * Narrative voice consistency, tone coherence, style fingerprinting across chapters.
 * Inspired by: chatdev (style analysis), ruflo (hierarchical coherence), claude-code (feedback)
 */

export type VoiceDimension = 'formality' | 'sentenceComplexity' | 'vocabularyRichness' | 'emotionalTone' | 'pacing' | 'perspective'

export interface VoiceProfile {
  avgSentenceLength: number
  avgParagraphLength: number
  formalityScore: number  // 0-100 (casual → formal)
  vocabularyScore: number  // 0-100 (common → literary)
  emotionalTone: number  // 0-100 (restrained → intense)
  pacingScore: number  // 0-100 (slow → fast)
  uniqueWordRatio: number  // 0-1
  dialogueRatio: number  // 0-1
}

export interface ChapterVoice {
  chapterId: string
  profile: VoiceProfile
  consistencyScore: number  // 0-100 vs overall voice
  deviantDimensions: VoiceDimension[]
}

export interface NarrativeVoiceState {
  overallProfile: VoiceProfile
  chapterVoices: Record<string, ChapterVoice>
  recentProfiles: VoiceProfile[]  // last 10 chapters
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeVoiceState {
  return {
    overallProfile: { avgSentenceLength: 15, avgParagraphLength: 100, formalityScore: 50, vocabularyScore: 50, emotionalTone: 50, pacingScore: 50, uniqueWordRatio: 0.4, dialogueRatio: 0.2 },
    chapterVoices: {},
    recentProfiles: [],
    typeAlias: {},
  }
}

function analyzeText(text: string): VoiceProfile {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const paragraphs = text.split(/\n\n/).filter(p => p.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()))
  const dialogueCount = (text.match(/"[^"]*"/g) || []).length
  const totalLength = words.length
  
  const avgSentenceLength = sentences.length > 0 ? totalLength / sentences.length : totalLength
  const avgParagraphLength = paragraphs.length > 0 ? totalLength / paragraphs.length : totalLength
  const uniqueWordRatio = totalLength > 0 ? uniqueWords.size / totalLength : 0
  const dialogueRatio = totalLength > 0 ? dialogueCount * 10 / totalLength : 0
  
  // Formality: long sentences + low dialogue = formal
  const formalityScore = Math.min(100, Math.max(0, (avgSentenceLength / 30 * 50) + (1 - dialogueRatio) * 50))
  // Vocabulary: high unique word ratio = rich vocabulary
  const vocabularyScore = Math.min(100, uniqueWordRatio * 200)
  // Emotional tone: punctuation density, exclamation, caps
  const exclamationCount = (text.match(/!/g) || []).length
  const capsRatio = words.filter(w => w === w.toUpperCase() && w.length > 1).length / totalLength
  const emotionalTone = Math.min(100, (exclamationCount / Math.max(1, sentences.length) * 200) + capsRatio * 300)
  // Pacing: short sentences + action words = fast pace
  const actionWords = (text.match(/\b(ran|hit|shot|crashed|exploded|fell|rushed|broke)\b/gi) || []).length
  const pacingScore = Math.min(100, (100 - avgSentenceLength / 2) + actionWords * 10)
  
  return {
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgParagraphLength: Math.round(avgParagraphLength * 10) / 10,
    formalityScore: Math.round(formalityScore),
    vocabularyScore: Math.round(vocabularyScore),
    emotionalTone: Math.round(emotionalTone),
    pacingScore: Math.round(pacingScore),
    uniqueWordRatio: Math.round(uniqueWordRatio * 1000) / 1000,
    dialogueRatio: Math.round(Math.min(1, dialogueRatio) * 1000) / 1000,
  }
}

export function analyzeChapterVoice(
  state: NarrativeVoiceState,
  chapterId: string,
  text: string
): NarrativeVoiceState {
  const profile = analyzeText(text)
  
  // Update overall profile with exponential moving average
  const alpha = 0.2
  const overall: VoiceProfile = {
    avgSentenceLength: state.overallProfile.avgSentenceLength * (1 - alpha) + profile.avgSentenceLength * alpha,
    avgParagraphLength: state.overallProfile.avgParagraphLength * (1 - alpha) + profile.avgParagraphLength * alpha,
    formalityScore: state.overallProfile.formalityScore * (1 - alpha) + profile.formalityScore * alpha,
    vocabularyScore: state.overallProfile.vocabularyScore * (1 - alpha) + profile.vocabularyScore * alpha,
    emotionalTone: state.overallProfile.emotionalTone * (1 - alpha) + profile.emotionalTone * alpha,
    pacingScore: state.overallProfile.pacingScore * (1 - alpha) + profile.pacingScore * alpha,
    uniqueWordRatio: state.overallProfile.uniqueWordRatio * (1 - alpha) + profile.uniqueWordRatio * alpha,
    dialogueRatio: state.overallProfile.dialogueRatio * (1 - alpha) + profile.dialogueRatio * alpha,
  }
  
  // Calculate consistency score
  const dimensions: VoiceDimension[] = ['formality', 'sentenceComplexity', 'vocabularyRichness', 'emotionalTone', 'pacing', 'perspective']
  const deviantDimensions: VoiceDimension[] = []
  let consistencySum = 0
  
  const checks: [VoiceDimension, number, number][] = [
    ['formality', overall.formalityScore, profile.formalityScore],
    ['sentenceComplexity', overall.avgSentenceLength, profile.avgSentenceLength],
    ['vocabularyRichness', overall.vocabularyScore, profile.vocabularyScore],
    ['emotionalTone', overall.emotionalTone, profile.emotionalTone],
    ['pacing', overall.pacingScore, profile.pacingScore],
    ['perspective', overall.dialogueRatio * 100, profile.dialogueRatio * 100],
  ]
  
  for (const [dim, overallVal, chapterVal] of checks) {
    const diff = Math.abs(overallVal - chapterVal)
    if (diff > 20) deviantDimensions.push(dim)
    consistencySum += Math.max(0, 100 - diff)
  }
  
  const consistencyScore = Math.round(consistencySum / checks.length)
  
  const chapterVoice: ChapterVoice = { chapterId, profile, consistencyScore, deviantDimensions }
  const chapterVoices = { ...state.chapterVoices, [chapterId]: chapterVoice }
  const recentProfiles = [...state.recentProfiles, profile].slice(-10)
  
  return { ...state, overallProfile: overall, chapterVoices, recentProfiles }
}

export function getVoiceConsistency(state: NarrativeVoiceState, chapterId: string): number {
  return state.chapterVoices[chapterId]?.consistencyScore ?? 0
}

export function compareChapterVoices(state: NarrativeVoiceState, ch1: string, ch2: string) {
  const v1 = state.chapterVoices[ch1]
  const v2 = state.chapterVoices[ch2]
  if (!v1 || !v2) return null
  return {
    moreFormal: v1.profile.formalityScore > v2.profile.formalityScore ? ch1 : ch2,
    richerVocabulary: v1.profile.vocabularyScore > v2.profile.vocabularyScore ? ch1 : ch2,
    moreIntense: v1.profile.emotionalTone > v2.profile.emotionalTone ? ch1 : ch2,
    fasterPaced: v1.profile.pacingScore > v2.profile.pacingScore ? ch1 : ch2,
  }
}

export function detectVoiceDrift(state: NarrativeVoiceState): { hasDrift: boolean; driftedChapters: string[] } {
  const voices = Object.values(state.chapterVoices)
  if (voices.length < 3) return { hasDrift: false, driftedChapters: [] }
  const driftedChapters = voices.filter(v => v.consistencyScore < 70).map(v => v.chapterId)
  return { hasDrift: driftedChapters.length > voices.length * 0.3, driftedChapters }
}
