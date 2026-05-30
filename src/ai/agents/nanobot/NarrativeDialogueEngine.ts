/**
 * NarrativeDialogueEngine — V467
 * Dialogue rhythm analysis, speech patterns, conversation flow and authenticity tracking.
 * Inspired by: chatdev (dialogue synthesis), thunderbolt (feedback loops), generic-agent (optimization)
 */

export interface DialogueBeat {
  id: string
  chapterNumber: number
  speakerId: string
  speechRate: number  // words per minute equivalent
  interruptionLevel: number  // 0-100
  subtextIntensity: number  // 0-100 (hidden meaning)
  emotionalTone: number  // -100 to 100
  authenticity: number  // 0-100
}

export interface DialogueReport {
  totalBeats: number
  avgAuthenticity: number
  dominantEmotion: number  // average emotional tone
  recommendations: string[]
}

export interface NarrativeDialogueState {
  beats: DialogueBeat[]
  report: DialogueReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeDialogueState {
  return { beats: [], report: null, typeAlias: {} }
}

export function addDialogueBeat(
  state: NarrativeDialogueState,
  chapterNumber: number,
  speakerId: string,
  speechRate: number,
  interruptionLevel: number,
  subtextIntensity: number,
  emotionalTone: number
): NarrativeDialogueState {
  const id = `dlg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const authenticity = Math.max(10, Math.min(95, Math.round(85 - interruptionLevel * 0.3 + subtextIntensity * 0.2 - Math.abs(emotionalTone) * 0.1)))
  const beat: DialogueBeat = { id, chapterNumber, speakerId, speechRate: Math.max(0, speechRate), interruptionLevel: Math.max(0, Math.min(100, interruptionLevel)), subtextIntensity: Math.max(0, Math.min(100, subtextIntensity)), emotionalTone: Math.max(-100, Math.min(100, emotionalTone)), authenticity }
  const beats = [...state.beats, beat]
  return { ...state, beats }
}

export function generateDialogueReport(state: NarrativeDialogueState): DialogueReport {
  if (state.beats.length === 0) {
    return { totalBeats: 0, avgAuthenticity: 100, dominantEmotion: 0, recommendations: [] }
  }
  const totalBeats = state.beats.length
  const avgAuthenticity = Math.round(state.beats.reduce((s, b) => s + b.authenticity, 0) / totalBeats)
  const dominantEmotion = Math.round(state.beats.reduce((s, b) => s + b.emotionalTone, 0) / totalBeats)
  const recommendations: string[] = []
  if (avgAuthenticity < 60) recommendations.push('Low dialogue authenticity - consider natural speech patterns')
  if (state.beats.some(b => b.interruptionLevel > 70)) recommendations.push('High interruption level - use sparingly for impact')
  if (state.beats.filter(b => b.subtextIntensity > 70).length > totalBeats * 0.4) recommendations.push('Many high-subtext lines - balance with direct dialogue')
  if (dominantEmotion < -50) recommendations.push('Very negative emotional tone - ensure variety')
  return { totalBeats, avgAuthenticity, dominantEmotion, recommendations }
}

export function getSpeakerDialogue(state: NarrativeDialogueState, speakerId: string): DialogueBeat[] {
  return state.beats.filter(b => b.speakerId === speakerId)
}

export function getChapterDialogue(state: NarrativeDialogueState, chapter: number): DialogueBeat[] {
  return state.beats.filter(b => b.chapterNumber === chapter)
}
