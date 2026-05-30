// DialogueEmotionAnalyzer - V280: Dialogue emotion analyzer - emotional undertones
// Inspired by: thunderbolt (feedback loops) + chatdev (role specialization)

export type Emotion = 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation' | 'neutral'

export interface DialogueEmotionData {
  chapter: string
  speaker: string
  dialogue: string
  emotion: Emotion
  intensity: number  // 0-100
  subtext: string
}

export interface DialogueEmotionAnalyzerState {
  analyses: DialogueEmotionData[]
  emotionCounts: { [emotion in Emotion]: number }
}

export function createEmptyEmotionAnalyzerState(): DialogueEmotionAnalyzerState {
  return { analyses: [], emotionCounts: { joy: 0, anger: 0, sadness: 0, fear: 0, surprise: 0, disgust: 0, trust: 0, anticipation: 0, neutral: 0 } }
}

function detectEmotion(text: string): Emotion {
  const lower = text.toLowerCase()
  if (lower.includes('happy') || lower.includes('joy') || lower.includes('love') || lower.includes('great')) return 'joy'
  if (lower.includes('angry') || lower.includes('hate') || lower.includes('furious')) return 'anger'
  if (lower.includes('sad') || lower.includes('cry') || lower.includes('sorry')) return 'sadness'
  if (lower.includes('afraid') || lower.includes('fear') || lower.includes('scared')) return 'fear'
  if (lower.includes('wow') || lower.includes('surprise')) return 'surprise'
  if (lower.includes('gross') || lower.includes('disgust')) return 'disgust'
  if (lower.includes('!')) return 'anger'
  return 'neutral'
}

export function analyzeDialogue(
  state: DialogueEmotionAnalyzerState,
  chapter: string,
  speaker: string,
  dialogue: string,
  intensity: number
): DialogueEmotionAnalyzerState {
  const emotion = detectEmotion(dialogue)
  const subtext = emotion !== 'neutral' ? 'Underlying ' + emotion + ' detected' : 'Literal text'
  const analysis: DialogueEmotionData = { chapter, speaker, dialogue, emotion, intensity, subtext }
  const newCounts = { ...state.emotionCounts }
  newCounts[emotion]++
  return { analyses: [...state.analyses, analysis], emotionCounts: newCounts }
}

export function getEmotionTrajectory(state: DialogueEmotionAnalyzerState, speaker: string): DialogueEmotionData[] {
  return state.analyses.filter(a => a.speaker === speaker)
}

export function getConflictPoints(state: DialogueEmotionAnalyzerState): DialogueEmotionData[] {
  return state.analyses.filter(a => a.emotion === 'anger' && a.intensity >= 80)
}

export function formatEmotionSummary(state: DialogueEmotionAnalyzerState): string {
  return "=== Dialogue Emotion Summary ===\nDialogues: " + state.analyses.length + "\n"
}

export function formatEmotionDashboard(state: DialogueEmotionAnalyzerState): string {
  let s = "=== Dialogue Emotion Dashboard ===\nAnalyses: " + state.analyses.length + "\n"
  for (const [emotion, count] of Object.entries(state.emotionCounts)) {
    if (count > 0) s += "  " + emotion + ": " + count + "\n"
  }
  return s
}
