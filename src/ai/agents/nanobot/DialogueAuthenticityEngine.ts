/**
 * DialogueAuthenticityEngine — V413
 * Dialogue authenticity analysis, character voice consistency, natural speech pattern detection.
 * Inspired by: chatdev (character analysis), generic-agent (validation), thunderbolt (feedback loops)
 */

export type SpeechPattern = 'formal' | 'casual' | 'regional' | 'educated' | 'traumatic' | 'powerful' | 'submissive' | 'cryptic'

export interface DialogueMarker {
  characterId: string
  chapterId: string
  avgSentenceLength: number  // words per line
  formalityLevel: number  // 0-100
  questionFrequency: number  // 0-100 (how often asks questions)
  interruptionRate: number  // 0-100 (overlaps/abrupt endings)
  speechPattern: SpeechPattern
  vocabularyComplexity: number  // 0-100
  uniquePhrases: string[]  // character's catchphrases
}

export interface DialogueAuthenticityReport {
  totalDialogueMarkers: number
  charactersAnalyzed: number
  inconsistentCharacters: string[]
  avgAuthenticityScore: number
  recommendations: string[]
}

export interface DialogueAuthenticityState {
  markers: DialogueMarker[]
  report: DialogueAuthenticityReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): DialogueAuthenticityState {
  return { markers: [], report: null, typeAlias: {} }
}

export function analyzeDialogue(
  state: DialogueAuthenticityState,
  characterId: string,
  chapterId: string,
  lines: string[]
): DialogueAuthenticityState {
  if (lines.length === 0) return state
  
  const avgSentenceLength = lines.reduce((s, l) => s + l.split(' ').length, 0) / lines.length
  const questionCount = lines.filter(l => l.includes('?')).length
  const questionFrequency = (questionCount / lines.length) * 100
  
  // Calculate formality based on vocabulary
  const formalWords = ['therefore', 'however', 'moreover', 'consequently', 'nevertheless']
  const formalCount = lines.reduce((s, l) => s + formalWords.filter(w => l.toLowerCase().includes(w)).length, 0)
  const formalityLevel = Math.min(100, Math.max(0, 30 + formalCount * 15 + (avgSentenceLength - 5) * 5))
  
  // Vocabulary complexity
  const allWords = lines.flatMap(l => l.split(' '))
  const uniqueRatio = new Set(allWords).size / Math.max(1, allWords.length)
  const vocabularyComplexity = Math.min(100, uniqueRatio * 150 + avgSentenceLength * 2)
  
  // Detect speech pattern
  let speechPattern: SpeechPattern = 'casual'
  if (formalityLevel > 70) speechPattern = 'formal'
  else if (formalityLevel < 30) speechPattern = 'casual'
  if (questionFrequency > 40) speechPattern = 'submissive'
  if (lines.some(l => l.length > 60)) speechPattern = 'educated'
  
  const marker: DialogueMarker = {
    characterId,
    chapterId,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    formalityLevel: Math.round(formalityLevel),
    questionFrequency: Math.round(questionFrequency),
    interruptionRate: 20,
    speechPattern,
    vocabularyComplexity: Math.round(vocabularyComplexity),
    uniquePhrases: [],
  }
  
  const markers = [...state.markers.filter(m => !(m.characterId === characterId && m.chapterId === chapterId)), marker]
  return { ...state, markers }
}

export function registerUniquePhrase(state: DialogueAuthenticityState, characterId: string, phrase: string): DialogueAuthenticityState {
  const markers = state.markers.map(m => {
    if (m.characterId === characterId && !m.uniquePhrases.includes(phrase)) {
      return { ...m, uniquePhrases: [...m.uniquePhrases, phrase] }
    }
    return m
  })
  return { ...state, markers }
}

export function generateDialogueReport(state: DialogueAuthenticityState): DialogueAuthenticityReport {
  if (state.markers.length === 0) {
    return { totalDialogueMarkers: 0, charactersAnalyzed: 0, inconsistentCharacters: [], avgAuthenticityScore: 0, recommendations: [] }
  }
  
  const characters = new Set(state.markers.map(m => m.characterId))
  const charactersAnalyzed = characters.size
  
  // Find inconsistent characters (varying formality across chapters)
  const inconsistentCharacters: string[] = []
  for (const charId of characters) {
    const charMarkers = state.markers.filter(m => m.characterId === charId)
    if (charMarkers.length > 1) {
      const formalities = charMarkers.map(m => m.formalityLevel)
      const avg = formalities.reduce((a, b) => a + b, 0) / formalities.length
      const variance = formalities.reduce((s, f) => s + Math.abs(f - avg), 0) / formalities.length
      if (variance > 25) inconsistentCharacters.push(charId)
    }
  }
  
  // Authenticity score based on consistency and pattern clarity
  let avgAuthenticityScore = 70
  avgAuthenticityScore -= inconsistentCharacters.length * 5
  avgAuthenticityScore += state.markers.filter(m => m.uniquePhrases.length > 0).length * 3
  
  const recommendations: string[] = []
  if (inconsistentCharacters.length > 0) {
    recommendations.push(`${inconsistentCharacters.length} characters have inconsistent dialogue voices`)
  }
  if (avgAuthenticityScore < 60) recommendations.push('Dialogue authenticity needs work - maintain consistent character voices')
  if (state.markers.filter(m => m.questionFrequency > 50).length > charactersAnalyzed * 0.5) {
    recommendations.push('Many characters ask too many questions - vary speech patterns')
  }
  if (avgAuthenticityScore > 80) recommendations.push('Strong dialogue authenticity - keep voices consistent')
  if (charactersAnalyzed > 10) recommendations.push('Many characters - ensure each has distinct voice')
  
  return {
    totalDialogueMarkers: state.markers.length,
    charactersAnalyzed,
    inconsistentCharacters,
    avgAuthenticityScore: Math.max(0, Math.min(100, Math.round(avgAuthenticityScore))),
    recommendations,
  }
}

export function getCharacterVoiceProfile(state: DialogueAuthenticityState, characterId: string): DialogueMarker | null {
  const markers = state.markers.filter(m => m.characterId === characterId)
  if (markers.length === 0) return null
  
  return {
    characterId,
    chapterId: 'aggregate',
    avgSentenceLength: Math.round(markers.reduce((s, m) => s + m.avgSentenceLength, 0) / markers.length * 10) / 10,
    formalityLevel: Math.round(markers.reduce((s, m) => s + m.formalityLevel, 0) / markers.length),
    questionFrequency: Math.round(markers.reduce((s, m) => s + m.questionFrequency, 0) / markers.length),
    interruptionRate: Math.round(markers.reduce((s, m) => s + m.interruptionRate, 0) / markers.length),
    speechPattern: markers[0].speechPattern,
    vocabularyComplexity: Math.round(markers.reduce((s, m) => s + m.vocabularyComplexity, 0) / markers.length),
    uniquePhrases: [...new Set(markers.flatMap(m => m.uniquePhrases))],
  }
}
