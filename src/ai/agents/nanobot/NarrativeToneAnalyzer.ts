export type NarrativeTone = 'comedic' | 'dramatic' | 'tragic' | 'romantic' | 'horror' | 'mysterious' | 'epic' | 'intimate' | 'satirical' | 'neutral'

export interface ToneShift {
  shiftId: string
  chapter: number
  fromTone: NarrativeTone
  toTone: NarrativeTone
  smoothness: number  // 0-100 how smooth the transition was
  reason: string
}

export interface NarrativeToneState {
  currentTone: NarrativeTone
  toneHistory: Array<{ chapter: number; tone: NarrativeTone }>
  shifts: ToneShift[]
  currentChapter: number
  toneConsistencyScore: number  // 0-100
  abruptShifts: number[]  // chapters with jarring tone changes
}

function createShiftId(): string {
  return 'tone_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function calculateSmoothness(fromTone: NarrativeTone, toTone: NarrativeTone): number {
  // Similar tones transition smoothly
  const similarTones: Record<NarrativeTone, NarrativeTone[]> = {
    comedic: ['satirical', 'romantic'],
    dramatic: ['tragic', 'epic', 'intimate'],
    tragic: ['dramatic', 'horror', 'mysterious'],
    romantic: ['intimate', 'dramatic', 'comedic'],
    horror: ['mysterious', 'tragic'],
    mysterious: ['horror', 'tragic', 'dramatic'],
    epic: ['dramatic', 'tragic'],
    intimate: ['romantic', 'dramatic'],
    satirical: ['comedic'],
    neutral: ['comedic', 'dramatic', 'mysterious', 'romantic', 'epic', 'intimate'],
  }

  if (fromTone === toTone) return 100

  const similar = similarTones[fromTone] || []
  if (similar.includes(toTone)) return 80

  // Opposite tones
  const opposites: Record<NarrativeTone, NarrativeTone[]> = {
    comedic: ['tragic', 'dramatic', 'horror'],
    dramatic: ['comedic', 'satirical'],
    tragic: ['comedic', 'satirical'],
    romantic: ['horror', 'tragic'],
    horror: ['comedic', 'romantic', 'satirical'],
    mysterious: ['comedic', 'satirical'],
    epic: ['satirical', 'comedic'],
    intimate: ['horror', 'epic'],
    satirical: ['dramatic', 'epic', 'romantic', 'intimate'],
    neutral: [],
  }

  if (opposites[fromTone]?.includes(toTone)) return 20
  return 50
}

export function createEmptyNarrativeToneState(): NarrativeToneState {
  return { currentTone: 'neutral', toneHistory: [], shifts: [], currentChapter: 0, toneConsistencyScore: 100, abruptShifts: [] }
}

export function setNarrativeTone(
  state: NarrativeToneState,
  chapter: number,
  newTone: NarrativeTone,
  reason: string = ''
): NarrativeToneState {
  const fromTone = state.currentTone

  // Only record a shift when coming from a non-neutral tone AND tone changed
  if (fromTone !== 'neutral' && fromTone !== newTone) {
    const smoothness = calculateSmoothness(fromTone, newTone)
    const shift: ToneShift = {
      shiftId: createShiftId(),
      chapter,
      fromTone,
      toTone: newTone,
      smoothness,
      reason: reason || 'Author-defined shift',
    }

    const shifts = [...state.shifts, shift]
    const abruptShifts = [...state.abruptShifts]
    if (smoothness < 30) abruptShifts.push(chapter)

    // Recalculate consistency
    const totalSmoothness = shifts.reduce((s, sh) => s + sh.smoothness, 0)
    const consistency = Math.round(totalSmoothness / shifts.length)

    return {
      ...state,
      currentTone: newTone,
      currentChapter: chapter,
      toneHistory: [...state.toneHistory, { chapter, tone: newTone }],
      shifts,
      toneConsistencyScore: consistency,
      abruptShifts,
    }
  }

  return {
    ...state,
    currentTone: newTone,
    currentChapter: Math.max(state.currentChapter, chapter),
    toneHistory: [...state.toneHistory, { chapter, tone: newTone }],
  }
}

export function getToneAtChapter(state: NarrativeToneState, chapter: number): NarrativeTone | null {
  const entry = state.toneHistory.find(h => h.chapter === chapter)
  if (entry) return entry.tone
  // If no entry for this exact chapter, find the most recent tone before it
  const before = state.toneHistory.filter(h => h.chapter <= chapter)
  return before.length > 0 ? before[before.length - 1].tone : 'neutral'
}

export function getToneConsistencyScore(state: NarrativeToneState): number {
  return state.toneConsistencyScore
}

export function formatToneSummary(state: NarrativeToneState): string {
  let s = "=== Narrative Tone Summary ===" + "\n"
  s += "Current Tone: " + state.currentTone + "\n"
  s += "Tone Shifts: " + state.shifts.length + "\n"
  s += "Consistency Score: " + state.toneConsistencyScore + "\n"
  return s
}

export function formatToneDashboard(state: NarrativeToneState): string {
  let s = "=== Narrative Tone Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Tone: " + state.currentTone + " | Consistency: " + state.toneConsistencyScore + "\n"

  if (state.shifts.length > 0) {
    s += "\n--- Recent Tone Shifts ---" + "\n"
    for (const shift of state.shifts.slice(-4)) {
      s += "  Ch" + shift.chapter + " " + shift.fromTone + " → " + shift.toTone + " [" + shift.smoothness + "] " + shift.reason + "\n"
    }
  }

  if (state.abruptShifts.length > 0) {
    s += "\n--- Abrupt Shifts ---" + "\n"
    for (const ch of state.abruptShifts.slice(-3)) {
      s += "  Chapter " + ch + "\n"
    }
  }

  return s
}
