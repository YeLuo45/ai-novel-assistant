/**
 * NarrativeVoiceConsistencyEngine - V166
 * Character Voice Consistency & Dialogue Pattern Tracking Engine
 * 
 * Design references:
 * - thunderbolt: feedback loops for voice drift detection
 * - nanobot: distributed mesh for cross-character voice consistency
 * - ruflo: hierarchical decomposition (character → voice → dialogue → vocabulary)
 * - chatdev: multi-agent dialogue consistency validation
 * - generic-agent: autonomous voice profile adaptation
 */

export type VocabularyType = 'formal' | 'casual' | 'technical' | 'poetic' | 'archaic' | 'colloquial'
export type SpeechPattern = 'declarative' | 'interrogative' | 'exclamatory' | 'fragment' | 'rambling'
export type VoiceConsistencyStatus = 'consistent' | 'drifting' | 'inconsistent' | 'evolving'

export interface VoiceProfile {
  characterId: string
  characterName: string
  vocabularyTypes: VocabularyType[]
  avgSentenceLength: number  // words per sentence
  avgParagraphLength: number  // sentences per paragraph
  commonPhrases: string[]  // signature phrases
  speechPatterns: SpeechPattern[]
  emotionalRange: { min: number; max: number }  // -100 to +100
  tics: string[]  // verbal tics, filler words
  formalityLevel: number  // 0-100
  uniqueWordRatio: number  // how varied vocabulary is
  firstPersonUsage: number  // ratio of first-person pronouns
  questionFrequency: number  // ratio of questions
  exclamationFrequency: number  // ratio of exclamations
}

export interface DialogueEntry {
  entryId: string
  characterId: string
  chapter: number
  text: string
  emotionalTone: number  // -100 to +100
  voiceConsistency: VoiceConsistencyStatus
  vocabularyTypes: VocabularyType[]
  speechPattern: SpeechPattern
  timestamp: number
}

export interface VoiceConsistencyState {
  profiles: Map<string, VoiceProfile>
  dialogues: Map<string, DialogueEntry[]>  // characterId -> entries
  currentChapter: number
  driftAlerts: Array<{ characterId: string; chapter: number; severity: number; reason: string }>
  globalConsistencyScore: number  // 0-100
}

export function createEmptyVoiceState(): VoiceConsistencyState {
  return {
    profiles: new Map(),
    dialogues: new Map(),
    currentChapter: 0,
    driftAlerts: [],
    globalConsistencyScore: 100,
  };
}

// Profile Management
export function createVoiceProfile(characterId: string, characterName: string): VoiceProfile {
  return {
    characterId,
    characterName,
    vocabularyTypes: ['casual'],
    avgSentenceLength: 15,
    avgParagraphLength: 4,
    commonPhrases: [],
    speechPatterns: ['declarative'],
    emotionalRange: { min: -20, max: 20 },
    tics: [],
    formalityLevel: 50,
    uniqueWordRatio: 0.6,
    firstPersonUsage: 0.3,
    questionFrequency: 0.1,
    exclamationFrequency: 0.05,
  };
}

export function registerCharacter(state: VoiceConsistencyState, characterId: string, characterName: string): VoiceConsistencyState {
  const profile = createVoiceProfile(characterId, characterName)
  const newProfiles = new Map(state.profiles)
  newProfiles.set(characterId, profile)
  return { ...state, profiles: newProfiles }
}

// Speech Analysis
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function countSentences(text: string): number {
  return (text.match(/[.!?]+/g) || []).length || 1
}

function analyzeVocabulary(text: string): VocabularyType[] {
  const lower = text.toLowerCase()
  const types: VocabularyType[] = ['casual']
  
  if (lower.includes('therefore') || lower.includes('hence') || lower.includes('consequently') || lower.includes('furthermore')) {
    if (!types.includes('formal')) types.push('formal')
  }
  if (lower.includes('utilize') || lower.includes('implement') || lower.includes('algorithm') || lower.includes('systematic')) {
    if (!types.includes('technical')) types.push('technical')
  }
  if (lower.includes('ye') || lower.includes('thy') || lower.includes('hath') || lower.includes('methinks')) {
    if (!types.includes('archaic')) types.push('archaic')
  }
  if (lower.includes('gonna') || lower.includes('wanna') || lower.includes('kinda') || lower.includes('sorta')) {
    if (!types.includes('colloquial')) types.push('colloquial')
  }
  
  return types
}

function analyzeSpeechPattern(text: string): SpeechPattern {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) return 'fragment'
  
  const questions = (text.match(/\?/g) || []).length
  const exclamations = (text.match(/!/g) || []).length
  const avgLength = sentences.reduce((a, s) => a + countWords(s), 0) / sentences.length
  
  if (questions / sentences.length > 0.4) return 'interrogative'
  if (exclamations / sentences.length > 0.3) return 'exclamatory'
  if (avgLength < 5) return 'fragment'
  if (avgLength > 35) return 'rambling'
  return 'declarative'
}

function analyzeEmotionalTone(text: string): number {
  const lower = text.toLowerCase()
  const positiveWords = ['happy', 'joy', 'love', 'excited', 'wonderful', 'beautiful', 'delighted', 'pleased', 'glad', 'cheerful']
  const negativeWords = ['sad', 'angry', 'fear', 'terrible', 'horrible', 'hate', 'despair', 'grief', 'miserable', 'depressed']
  
  let score = 0
  for (const w of positiveWords) if (lower.includes(w)) score += 10
  for (const w of negativeWords) if (lower.includes(w)) score -= 10
  return Math.max(-100, Math.min(100, score))
}

// Dialogue Recording
export function recordDialogue(state: VoiceConsistencyState, characterId: string, text: string): VoiceConsistencyState {
  const profile = state.profiles.get(characterId)
  if (!profile) return state
  
  const chapter = state.currentChapter || 1
  const entryId = 'dlg_' + Date.now()
  
  const entry: DialogueEntry = {
    entryId,
    characterId,
    chapter,
    text,
    emotionalTone: analyzeEmotionalTone(text),
    voiceConsistency: 'consistent',
    vocabularyTypes: analyzeVocabulary(text),
    speechPattern: analyzeSpeechPattern(text),
    timestamp: Date.now(),
  }
  
  // Update profile
  const newProfiles = new Map(state.profiles)
  const updatedProfile = updateProfileFromDialogue(profile, text, entry)
  newProfiles.set(characterId, updatedProfile)
  
  // Update dialogues
  const newDialogues = new Map(state.dialogues)
  const charDialogues = newDialogues.get(characterId) || []
  newDialogues.set(characterId, [...charDialogues, entry])
  
  return { ...state, profiles: newProfiles, dialogues: newDialogues }
}

function updateProfileFromDialogue(profile: VoiceProfile, text: string, entry: DialogueEntry): VoiceProfile {
  const words = countWords(text)
  const sentences = countSentences(text)
  const wordList = text.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const uniqueWords = new Set(wordList).size
  
  // Update vocabulary types
  const newVocabTypes = [...new Set([...profile.vocabularyTypes, ...entry.vocabularyTypes])]
  
  // Detect common phrases (3-4 word sequences that repeat)
  const phrases: string[] = []
  const wordArray = text.toLowerCase().split(/\s+/)
  for (let i = 0; i < wordArray.length - 2; i++) {
    const phrase = wordArray.slice(i, i + 3).join(' ')
    if (wordArray.filter(w => w === phrase.split(' ')[0]).length >= 2) {
      if (!phrases.includes(phrase)) phrases.push(phrase)
    }
  }
  const commonPhrases = [...new Set([...profile.commonPhrases, ...phrases])].slice(0, 20)
  
  // Calculate new averages
  const prevTotalWords = profile.avgSentenceLength * (profile.avgParagraphLength * 3)  // estimate
  const newAvgSentence = (profile.avgSentenceLength * 0.7) + (words / Math.max(1, sentences) * 0.3)
  
  // First person usage
  const firstPersonCount = (text.match(/\b(I|me|my|mine|myself|we|us|our)\b/gi) || []).length
  const firstPersonUsage = (profile.firstPersonUsage * 0.7) + ((firstPersonCount / words) * 0.3)
  
  // Question frequency
  const questions = (text.match(/\?/g) || []).length
  const questionFrequency = (profile.questionFrequency * 0.7) + ((questions / sentences) * 0.3)
  
  // Exclamation frequency
  const exclamations = (text.match(/!/g) || []).length
  const exclamationFrequency = (profile.exclamationFrequency * 0.7) + ((exclamations / sentences) * 0.3)
  
  return {
    ...profile,
    vocabularyTypes: newVocabTypes,
    avgSentenceLength: Math.round(newAvgSentence),
    commonPhrases,
    speechPatterns: [...new Set([...profile.speechPatterns, entry.speechPattern])],
    firstPersonUsage: Math.round(firstPersonUsage * 100) / 100,
    questionFrequency: Math.round(questionFrequency * 100) / 100,
    exclamationFrequency: Math.round(exclamationFrequency * 100) / 100,
  }
}

// Voice Drift Detection
export function detectVoiceDrift(state: VoiceConsistencyState, characterId: string): VoiceConsistencyStatus {
  const dialogues = state.dialogues.get(characterId) || []
  if (dialogues.length < 5) return 'consistent'
  
  const recent = dialogues.slice(-10)
  const older = dialogues.slice(-20, -10)
  
  if (older.length < 3) return 'consistent'
  
  // Compare recent vs older
  const recentAvgTone = recent.reduce((a, d) => a + d.emotionalTone, 0) / recent.length
  const olderAvgTone = older.reduce((a, d) => a + d.emotionalTone, 0) / older.length
  const toneDrift = Math.abs(recentAvgTone - olderAvgTone)
  
  // Check vocabulary consistency
  const recentVocab = recent.flatMap(d => d.vocabularyTypes)
  const olderVocab = older.flatMap(d => d.vocabularyTypes)
  const vocabOverlap = recentVocab.filter(v => olderVocab.includes(v)).length / Math.max(1, recentVocab.length)
  
  // Check speech pattern consistency
  const recentPatterns = recent.map(d => d.speechPattern)
  const olderPatterns = older.map(d => d.speechPattern)
  const patternMatch = recentPatterns.filter(p => olderPatterns.includes(p)).length / Math.max(1, recentPatterns.length)
  
  if (toneDrift > 60 || vocabOverlap < 0.3 || patternMatch < 0.3) {
    return 'inconsistent'
  }
  if (toneDrift > 40 || vocabOverlap < 0.5 || patternMatch < 0.5) {
    return 'drifting'
  }
  if (toneDrift > 20) {
    return 'evolving'
  }
  return 'consistent'
}

export function checkAllDrift(state: VoiceConsistencyState): VoiceConsistencyState {
  const newAlerts: typeof state.driftAlerts = []
  let totalDrift = 0
  let characterCount = 0
  
  for (const [characterId] of state.profiles) {
    const status = detectVoiceDrift(state, characterId)
    if (status === 'inconsistent' || status === 'drifting') {
      const severity = status === 'inconsistent' ? 80 : 50
      newAlerts.push({
        characterId,
        chapter: state.currentChapter,
        severity,
        reason: status === 'inconsistent' ? 'Major voice drift detected' : 'Minor voice drift detected',
      })
    }
    
    const score = status === 'consistent' ? 100 : status === 'evolving' ? 85 : status === 'drifting' ? 65 : 40
    totalDrift += score
    characterCount++
  }
  
  const globalConsistencyScore = characterCount > 0 ? Math.round(totalDrift / characterCount) : 100
  
  return {
    ...state,
    driftAlerts: [...state.driftAlerts.slice(-19), ...newAlerts],
    globalConsistencyScore,
  }
}

// Voice Comparison
export function compareCharacterVoices(state: VoiceConsistencyState, id1: string, id2: string): {similarity: number; differences: string[]} {
  const p1 = state.profiles.get(id1)
  const p2 = state.profiles.get(id2)
  if (!p1 || !p2) return { similarity: 0, differences: ['Character not found'] }
  
  const differences: string[] = []
  let similarity = 0
  
  if (Math.abs(p1.formalityLevel - p2.formalityLevel) > 30) {
    differences.push(`${p1.characterName} is more ${p1.formalityLevel > p2.formalityLevel ? 'formal' : 'casual'}`)
  }
  if (Math.abs(p1.firstPersonUsage - p2.firstPersonUsage) > 0.3) {
    differences.push(`${p1.characterName} uses first-person ${p1.firstPersonUsage > p2.firstPersonUsage ? 'more' : 'less'}`)
  }
  if (Math.abs(p1.questionFrequency - p2.questionFrequency) > 0.15) {
    differences.push(`${p1.characterName} asks ${p1.questionFrequency > p2.questionFrequency ? 'more' : 'less'} questions`)
  }
  
  // Calculate similarity score
  const vocabOverlap = p1.vocabularyTypes.filter(v => p2.vocabularyTypes.includes(v)).length / Math.max(1, p1.vocabularyTypes.length)
  const patternOverlap = p1.speechPatterns.filter(p => p2.speechPatterns.includes(p)).length / Math.max(1, p1.speechPatterns.length)
  const sentenceDiff = 1 - (Math.abs(p1.avgSentenceLength - p2.avgSentenceLength) / 30)
  similarity = Math.round(((vocabOverlap + patternOverlap + sentenceDiff) / 3) * 100)
  
  return { similarity, differences }
}

// Formatters
export function formatVoiceProfile(profile: VoiceProfile): string {
  let s = '=== Voice Profile: ' + profile.characterName + ' ===\n'
  s += 'Formality: ' + profile.formalityLevel + '%\n'
  s += 'Avg Sentence: ' + profile.avgSentenceLength + ' words\n'
  s += 'Vocabulary: ' + profile.vocabularyTypes.join(', ') + '\n'
  s += 'Speech Patterns: ' + profile.speechPatterns.join(', ') + '\n'
  s += 'First Person Usage: ' + Math.round(profile.firstPersonUsage * 100) + '%\n'
  s += 'Question Freq: ' + Math.round(profile.questionFrequency * 100) + '%\n'
  if (profile.commonPhrases.length > 0) {
    s += 'Signature Phrases: ' + profile.commonPhrases.slice(0, 5).join(', ') + '\n'
  }
  return s
}

export function formatVoiceDashboard(state: VoiceConsistencyState): string {
  let s = '=== Voice Consistency Dashboard ===\n'
  s += 'Characters Registered: ' + state.profiles.size + '\n'
  s += 'Global Consistency: ' + state.globalConsistencyScore + '%\n'
  s += 'Current Chapter: ' + state.currentChapter + '\n'
  
  if (state.driftAlerts.length > 0) {
    s += '\n--- Drift Alerts ---\n'
    for (const alert of state.driftAlerts.slice(-5)) {
      const charName = state.profiles.get(alert.characterId)?.characterName || alert.characterId
      s += '  ' + charName + ' (Ch ' + alert.chapter + '): ' + alert.reason + ' [severity: ' + alert.severity + ']\n'
    }
  }
  
  s += '\n--- Character Voices ---\n'
  for (const profile of state.profiles.values()) {
    const status = detectVoiceDrift(state, profile.characterId)
    const icon = status === 'consistent' ? '✓' : status === 'drifting' ? '~' : status === 'evolving' ? '→' : '✗'
    s += icon + ' ' + profile.characterName + ' (formality: ' + profile.formalityLevel + '%, sentences: ' + profile.avgSentenceLength + 'w)\n'
  }
  
  return s
}
