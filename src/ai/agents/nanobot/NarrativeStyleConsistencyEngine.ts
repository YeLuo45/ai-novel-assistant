// NarrativeStyleConsistencyEngine - V295: Narrative voice & style consistency tracking
// Inspired by: thunderbolt (feedback loops) + chatdev (role specialization)

export type NarrativeVoice = 'first_person' | 'third_limited' | 'third_omniscient' | 'second_person'
export type ToneRegister = 'formal' | 'informal' | 'conversational' | 'lyrical' | ' detached'

export interface StyleMarker {
  chapter: number
  sentenceLength: number
  vocabularyComplexity: number
  paragraphDensity: number  // avg sentences per paragraph
  dialogRatio: number       // 0-1, dialogue vs narration
  voice: NarrativeVoice
  tone: ToneRegister
}

export interface StyleConsistencyState {
  markers: StyleMarker[]
  voiceStabilityScore: number  // 0-100, how consistent the voice is
  toneStabilityScore: number
  driftEvents: Array<{chapter: number; type: string; severity: number}>
}

export function createEmptyStyleConsistencyState(): StyleConsistencyState {
  return { markers: [], voiceStabilityScore: 100, toneStabilityScore: 100, driftEvents: [] }
}

function computeComplexity(words: number, chars: number): number {
  return Math.round((chars / Math.max(1, words)) * 10) / 10
}

function detectVoice(text: string): NarrativeVoice {
  const lower = text.toLowerCase()
  if (lower.includes(' i ') || lower.startsWith('i ')) return 'first_person'
  if (lower.includes(' you ') || lower.includes('your ')) return 'second_person'
  return 'third_limited'
}

function detectTone(text: string): ToneRegister {
  const lower = text.toLowerCase()
  if (lower.includes(' ! ') || lower.includes('?')) return 'informal'
  if (lower.includes(' whilst ') || lower.includes(' moreover')) return 'formal'
  if (lower.includes('...') || lower.includes('—')) return 'lyrical'
  return 'conversational'
}

export function addStyleMarker(
  state: StyleConsistencyState,
  chapter: number,
  text: string,
  wordCount: number,
  charCount: number,
  paragraphCount: number,
  dialogRatio: number
): StyleConsistencyState {
  const complexity = computeComplexity(wordCount, charCount)
  const voice = detectVoice(text)
  const tone = detectTone(text)

  const marker: StyleMarker = {
    chapter,
    sentenceLength: Math.round(wordCount / Math.max(1, paragraphCount * 3)),
    vocabularyComplexity: complexity,
    paragraphDensity: Math.round(wordCount / Math.max(1, paragraphCount)),
    dialogRatio,
    voice,
    tone,
  }

  let voiceStability = state.voiceStabilityScore
  let toneStability = state.toneStabilityScore
  const driftEvents = [...state.driftEvents]

  if (state.markers.length > 0) {
    const prev = state.markers[state.markers.length - 1]
    if (prev.voice !== voice) {
      const severity = Math.min(30, 30 - (chapter - prev.chapter) * 2)
      if (severity > 10) driftEvents.push({ chapter, type: 'voice_shift', severity })
      voiceStability = Math.max(40, voiceStability - severity)
    }
    if (prev.tone !== tone) {
      const severity = Math.min(20, 20 - (chapter - prev.chapter) * 2)
      if (severity > 5) driftEvents.push({ chapter, type: 'tone_shift', severity })
      toneStability = Math.max(50, toneStability - severity)
    }
  }

  return {
    markers: [...state.markers, marker],
    voiceStabilityScore: voiceStability,
    toneStabilityScore: toneStability,
    driftEvents: driftEvents.slice(-9),
  }
}

export function getStyleDrift(state: StyleConsistencyState): {chapter: number; type: string; severity: number}[] {
  return state.driftEvents
}

export function getVoiceConsistencyScore(state: StyleConsistencyState): number {
  return state.voiceStabilityScore
}

export function getToneConsistencyScore(state: StyleConsistencyState): number {
  return state.toneStabilityScore
}

export function getAverageComplexity(state: StyleConsistencyState): number {
  if (state.markers.length === 0) return 0
  return Math.round(state.markers.reduce((s, m) => s + m.vocabularyComplexity, 0) / state.markers.length * 10) / 10
}

export function formatStyleConsistencySummary(state: StyleConsistencyState): string {
  let s = "=== Narrative Style Consistency Summary ===\n"
  s += "Markers: " + state.markers.length + "\n"
  s += "Voice Stability: " + state.voiceStabilityScore + "%\n"
  s += "Tone Stability: " + state.toneStabilityScore + "%\n"
  return s
}

export function formatStyleConsistencyDashboard(state: StyleConsistencyState): string {
  let s = "=== Narrative Style Consistency Dashboard ===\n"
  s += "Total Markers: " + state.markers.length + "\n"
  s += "Voice Stability: " + state.voiceStabilityScore + "% | Tone: " + state.toneStabilityScore + "%\n"
  if (state.driftEvents.length > 0) {
    s += "\n--- Recent Drift Events ---\n"
    for (const d of state.driftEvents.slice(-3)) {
      s += "  Ch" + d.chapter + ": " + d.type + " (severity=" + d.severity + ")\n"
    }
  }
  return s
}