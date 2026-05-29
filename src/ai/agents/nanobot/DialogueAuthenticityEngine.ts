export type SpeechPattern = 'formal' | 'casual' | 'regional' | 'formal_casual' | 'educated' | 'street'

export interface DialogueEntry {
  dialogueId: string
  chapter: number
  speaker: string
  authenticityScore: number  // 0-100
  hasSubtext: boolean
  speechPattern: SpeechPattern
  fillerWordCount: number
  overlapWithOtherCharacters: number  // how many other characters share similar speech patterns
}

export interface DialogueAuthenticityState {
  entries: DialogueEntry[]
  currentChapter: number
  averageAuthenticity: number
  dialoguesWithSubtext: number
  authenticityScore: number  // overall 0-100
}

function createDialogueId(): string {
  return 'diag_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyDialogueAuthenticityState(): DialogueAuthenticityState {
  return { entries: [], currentChapter: 0, averageAuthenticity: 0, dialoguesWithSubtext: 0, authenticityScore: 100 }
}

export function analyzeDialogue(
  state: DialogueAuthenticityState,
  chapter: number,
  speaker: string,
  dialogueText: string,
  speechPattern: SpeechPattern,
  hasSubtext: boolean,
  fillerWordCount: number
): DialogueAuthenticityState {
  let authenticityScore = 70  // base score

  // Filler words reduce authenticity
  const fillerRatio = fillerWordCount / Math.max(1, dialogueText.split(' ').length)
  authenticityScore -= Math.round(fillerRatio * 50)

  // Subtext adds authenticity
  if (hasSubtext) authenticityScore += 15

  // Very short or very long dialogue reduces authenticity
  const wordCount = dialogueText.split(' ').length
  if (wordCount < 5 || wordCount > 400) authenticityScore -= 15

  authenticityScore = Math.max(0, Math.min(100, authenticityScore))

  const entry: DialogueEntry = {
    dialogueId: createDialogueId(),
    chapter,
    speaker,
    authenticityScore,
    hasSubtext,
    speechPattern,
    fillerWordCount,
    overlapWithOtherCharacters: 0,
  }

  const newEntries = [...state.entries, entry]
  const totalAuth = newEntries.reduce((s, e) => s + e.authenticityScore, 0)
  const averageAuthenticity = Math.round(totalAuth / newEntries.length)
  const dialoguesWithSubtext = newEntries.filter(e => e.hasSubtext).length

  return {
    entries: newEntries,
    currentChapter: chapter,
    averageAuthenticity,
    dialoguesWithSubtext,
    authenticityScore: averageAuthenticity,
  }
}

export function getDialoguesBySpeaker(state: DialogueAuthenticityState, speaker: string): DialogueEntry[] {
  return state.entries.filter(e => e.speaker === speaker)
}

export function getDialoguesWithSubtext(state: DialogueAuthenticityState): DialogueEntry[] {
  return state.entries.filter(e => e.hasSubtext)
}

export function formatDialogueAuthenticitySummary(state: DialogueAuthenticityState): string {
  let s = "=== Dialogue Authenticity Summary ===" + "\n"
  s += "Total Dialogues: " + state.entries.length + "\n"
  s += "Average Authenticity: " + state.averageAuthenticity + "\n"
  s += "Dialogues with Subtext: " + state.dialoguesWithSubtext + "\n"
  return s
}

export function formatDialogueAuthenticityDashboard(state: DialogueAuthenticityState): string {
  let s = "=== Dialogue Authenticity Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Authenticity: " + state.authenticityScore + "\n"
  s += "Total: " + state.entries.length + " | With Subtext: " + state.dialoguesWithSubtext + "\n"

  if (state.entries.length > 0) {
    s += "\n--- Recent Dialogues ---" + "\n"
    for (const e of state.entries.slice(-4)) {
      const subtextFlag = e.hasSubtext ? " [SUBTEXT]" : ""
      s += "  Ch" + e.chapter + " " + e.speaker + " score=" + e.authenticityScore + " [" + e.speechPattern + "]" + subtextFlag + "\n"
    }
  }

  return s
}
