// StyleConsistencyChecker - enforces narrative style consistency (voice, tense, POV)

export type NarrativeVoice = 'first_person' | 'second_person' | 'third_limited' | 'third_omniscient' | 'third_objective'
export type NarrativeTense = 'past' | 'present' | 'future'
export type PointOfView = 'protagonist' | 'antagonist' | 'multiple' | 'omniscient' | 'observer'

export interface StyleViolation {
  violationId: string
  type: 'voice' | 'tense' | 'pov' | 'register'
  chapter: number
  severity: 'minor' | 'major' | 'critical'
  description: string
  detectedAt: number
}

export interface StyleConsistencyState {
  establishedVoice: NarrativeVoice | null
  establishedTense: NarrativeTense
  establishedPOV: PointOfView
  violations: StyleViolation[]
  currentChapter: number
  voiceConsistencyScore: number
  tenseConsistencyScore: number
  povConsistencyScore: number
  overallStyleScore: number
}

function createViolationId(): string {
  return 'viol_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyStyleConsistencyState(): StyleConsistencyState {
  return {
    establishedVoice: null,
    establishedTense: 'past',
    establishedPOV: 'protagonist',
    violations: [],
    currentChapter: 0,
    voiceConsistencyScore: 100,
    tenseConsistencyScore: 100,
    povConsistencyScore: 100,
    overallStyleScore: 100,
  }
}

export function establishStyle(
  state: StyleConsistencyState,
  chapter: number,
  voice: NarrativeVoice,
  tense: NarrativeTense,
  pov: PointOfView
): StyleConsistencyState {
  let voiceScore = state.voiceConsistencyScore
  let tenseScore = state.tenseConsistencyScore
  let povScore = state.povConsistencyScore
  const newViolations = [...state.violations]

  if (state.establishedVoice === null) {
    voiceScore = 100
  } else if (state.establishedVoice !== voice) {
    voiceScore = Math.max(0, voiceScore - 25)
    newViolations.push({
      violationId: createViolationId(),
      type: 'voice',
      chapter,
      severity: voiceScore < 50 ? 'major' : 'minor',
      description: `Voice shift from ${state.establishedVoice} to ${voice} in chapter ${chapter}`,
      detectedAt: Date.now(),
    })
  }

  if (state.establishedTense !== tense) {
    tenseScore = Math.max(0, tenseScore - 30)
    newViolations.push({
      violationId: createViolationId(),
      type: 'tense',
      chapter,
      severity: tenseScore < 50 ? 'major' : 'minor',
      description: `Tense shift from ${state.establishedTense} to ${tense} in chapter ${chapter}`,
      detectedAt: Date.now(),
    })
  }

  if (state.establishedPOV !== pov) {
    povScore = Math.max(0, povScore - 25)
    newViolations.push({
      violationId: createViolationId(),
      type: 'pov',
      chapter,
      severity: povScore < 50 ? 'major' : 'minor',
      description: `POV shift from ${state.establishedPOV} to ${pov} in chapter ${chapter}`,
      detectedAt: Date.now(),
    })
  }

  const establishedVoice = state.establishedVoice !== null ? state.establishedVoice : voice
  const establishedTense = state.establishedTense
  const establishedPOV = state.establishedPOV
  const overallStyleScore = Math.round((voiceScore + tenseScore + povScore) / 3)

  return {
    establishedVoice,
    establishedTense,
    establishedPOV,
    violations: newViolations,
    currentChapter: chapter,
    voiceConsistencyScore: voiceScore,
    tenseConsistencyScore: tenseScore,
    povConsistencyScore: povScore,
    overallStyleScore,
  }
}

export function getViolationsByChapter(state: StyleConsistencyState, chapter: number): StyleViolation[] {
  return state.violations.filter(v => v.chapter === chapter)
}

export function getViolationsByType(state: StyleConsistencyState, type: StyleViolation['type']): StyleViolation[] {
  return state.violations.filter(v => v.type === type)
}

export function getCriticalViolations(state: StyleConsistencyState): StyleViolation[] {
  return state.violations.filter(v => v.severity === 'critical')
}

export function formatStyleConsistencySummary(state: StyleConsistencyState): string {
  let s = "=== Style Consistency Summary ===\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Overall Style Score: " + state.overallStyleScore + "\n"
  s += "Voice: " + state.voiceConsistencyScore + " | Tense: " + state.tenseConsistencyScore + " | POV: " + state.povConsistencyScore + "\n"
  s += "Total Violations: " + state.violations.length + "\n"
  s += "Critical: " + getCriticalViolations(state).length + "\n"
  return s
}

export function formatStyleConsistencyDashboard(state: StyleConsistencyState): string {
  let s = "=== Style Consistency Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Style Score: " + state.overallStyleScore + "\n"
  s += "Voice: " + state.voiceConsistencyScore + " | Tense: " + state.tenseConsistencyScore + " | POV: " + state.povConsistencyScore + "\n"

  if (state.violations.length > 0) {
    s += "\n--- Recent Violations ---\n"
    for (const v of state.violations.slice(-4)) {
      s += "  Ch" + v.chapter + " [" + v.type + "] " + v.description + "\n"
    }
  }

  return s
}