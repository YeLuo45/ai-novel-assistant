export interface DialogueSegment {
  segmentId: string
  chapter: number
  speaker: string
  text: string
  authenticityScore: number  // 0-100
  subtextDepth: number  // 0-100
  subtextHint: string
}

export interface DialogueAuthenticityState {
  segments: DialogueSegment[]
  characterVoices: Map<string, { wordCount: number; patternCount: number }>
  currentChapter: number
  averageAuthenticity: number  // 0-100
}

function createSegmentId(): string {
  return 'dlg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessAuthenticity(text: string): number {
  const words = text.split(' ')
  let score = 50

  // Natural dialogue tends to be concise
  if (words.length >= 5 && words.length <= 30) score += 15
  if (words.length > 50) score -= 10
  if (words.length < 3) score -= 10

  // Contains common filler words (natural speech)
  const fillers = ['um', 'uh', 'well', 'like', 'you know', 'actually']
  const lower = text.toLowerCase()
  const fillerCount = fillers.filter(f => lower.includes(f)).length
  score += fillerCount * 3

  // Contains contractions (natural speech)
  const contractions = ["i'm", "don't", "can't", "won't", "it's", "that's", "you're"]
  const contractionCount = contractions.filter(c => lower.includes(c)).length
  score += contractionCount * 5

  return Math.max(0, Math.min(100, score))
}

function assessSubtextDepth(text: string): { depth: number; hint: string } {
  const lower = text.toLowerCase()

  if (lower.includes('implied') || lower.includes('meaning')) return { depth: 80, hint: 'Metaphorical expression' }
  if (lower.includes('hint') || lower.includes('suggest')) return { depth: 70, hint: 'Hinting at something' }
  if (lower.includes('maybe') || lower.includes('perhaps')) return { depth: 60, hint: 'Hedged statement' }
  if (lower.includes('always') || lower.includes('never')) return { depth: 55, hint: 'Absolute statement with subtext' }
  if (lower.includes('fine') || lower.includes('whatever')) return { depth: 65, hint: 'Dismissive with hidden emotion' }
  if (lower.includes('okay') || lower.includes('sure')) return { depth: 50, hint: 'Agreement with reservations' }

  return { depth: 40, hint: 'Direct statement' }
}

export function createEmptyDialogueAuthenticityState(): DialogueAuthenticityState {
  return { segments: [], characterVoices: new Map(), currentChapter: 0, averageAuthenticity: 0 }
}

export function recordDialogue(
  state: DialogueAuthenticityState,
  chapter: number,
  speaker: string,
  text: string
): DialogueAuthenticityState {
  const authenticity = assessAuthenticity(text)
  const { depth: subtextDepth, hint: subtextHint } = assessSubtextDepth(text)

  const segment: DialogueSegment = {
    segmentId: createSegmentId(),
    chapter,
    speaker,
    text,
    authenticityScore: authenticity,
    subtextDepth,
    subtextHint,
  }

  const newSegments = [...state.segments, segment]

  // Track character voice patterns
  const newVoices = new Map(state.characterVoices)
  const voice = newVoices.get(speaker) || { wordCount: 0, patternCount: 0 }
  newVoices.set(speaker, {
    wordCount: voice.wordCount + text.split(' ').length,
    patternCount: voice.patternCount + 1,
  })

  const avgAuthenticity = Math.round(newSegments.reduce((sum, s) => sum + s.authenticityScore, 0) / newSegments.length)

  return {
    ...state,
    segments: newSegments,
    characterVoices: newVoices,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageAuthenticity: avgAuthenticity,
  }
}

export function getDialogueAtChapter(state: DialogueAuthenticityState, chapter: number): DialogueSegment[] {
  return state.segments.filter(s => s.chapter === chapter)
}

export function getAverageAuthenticity(state: DialogueAuthenticityState): number {
  return state.averageAuthenticity
}

export function formatDialogueSummary(state: DialogueAuthenticityState): string {
  let s = "=== Dialogue Authenticity Summary ===" + "\n"
  s += "Segments: " + state.segments.length + "\n"
  s += "Avg Authenticity: " + state.averageAuthenticity + "\n"
  s += "Characters: " + state.characterVoices.size + "\n"
  return s
}

export function formatDialogueDashboard(state: DialogueAuthenticityState): string {
  let s = "=== Dialogue Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Avg Authenticity: " + state.averageAuthenticity + "\n"
  s += "Segments: " + state.segments.length + " | Characters: " + state.characterVoices.size + "\n"

  const deepSubtext = state.segments.filter(seg => seg.subtextDepth >= 60)
  if (deepSubtext.length > 0) {
    s += "\n--- Deep Subtext Segments ---" + "\n"
    for (const seg of deepSubtext.slice(0, 3)) {
      s += "  Ch " + seg.chapter + " [" + seg.speaker + "] " + seg.subtextHint + "\n"
    }
  }

  return s
}
