// AuthorVoiceEvolutionTracker - V286: Author voice evolution tracking
export interface VoiceSample {
  chapter: number
  sentenceComplexity: number
  vocabularyRichness: number
  avgSentenceLength: number
  styleLabel: string
}

export interface AuthorVoiceState {
  samples: VoiceSample[]
  voiceTrend: 'stable' | 'improving' | 'declining'
}

export function createEmptyVoiceEvolutionState(): AuthorVoiceState {
  return { samples: [], voiceTrend: 'stable' }
}

export function recordVoiceSample(
  state: AuthorVoiceState,
  chapter: number,
  sentenceComplexity: number,
  vocabularyRichness: number,
  avgSentenceLength: number,
  styleLabel: string
): AuthorVoiceState {
  const sample: VoiceSample = { chapter, sentenceComplexity, vocabularyRichness, avgSentenceLength, styleLabel }
  return { samples: [...state.samples, sample], voiceTrend: state.voiceTrend }
}

export function getVoiceTrend(state: AuthorVoiceState): 'stable' | 'improving' | 'declining' {
  if (state.samples.length < 3) return 'stable'
  const recent = state.samples.slice(-3)
  const scores = recent.map(s => s.sentenceComplexity + s.vocabularyRichness)
  const first = scores[0], last = scores[scores.length - 1]
  if (last > first + 10) return 'improving'
  if (last < first - 10) return 'declining'
  return 'stable'
}

export function getVoiceConsistency(state: AuthorVoiceState): number {
  if (state.samples.length < 2) return 100
  const scores = state.samples.map(s => s.sentenceComplexity)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / scores.length
  const stdDev = Math.sqrt(variance)
  return Math.max(0, Math.round(100 - stdDev))
}

export function getVoiceSignature(state: AuthorVoiceState): string {
  if (state.samples.length === 0) return 'unknown'
  const counts: { [key: string]: number } = {}
  for (const s of state.samples) {
    counts[s.styleLabel] = (counts[s.styleLabel] || 0) + 1
  }
  return Object.entries(counts).reduce((max, [k, v]) => v > (counts[max] || 0) ? k : max, state.samples[0].styleLabel)
}

export function formatVoiceEvolutionSummary(state: AuthorVoiceState): string {
  return "Samples: " + state.samples.length + " | Trend: " + state.voiceTrend + "\n"
}

export function formatVoiceEvolutionDashboard(state: AuthorVoiceState): string {
  const sig = getVoiceSignature(state)
  const consistency = getVoiceConsistency(state)
  return "Samples: " + state.samples.length + " | Signature: " + sig + " | Consistency: " + consistency + "\n"
}
