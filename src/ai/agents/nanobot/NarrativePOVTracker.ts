/**
 * NarrativePOVTracker — V439
 * Point-of-view consistency, character perspective management, narrator reliability analysis.
 * Inspired by: chatdev (character consistency), ruflo (structural analysis), thunderbolt (feedback loops)
 */

export type POVType = 'first_person' | 'third_limited' | 'third_omniscient' | 'second_person' | 'multiple'
export type NarratorReliability = 'reliable' | 'unreliable' | 'shifting'

export interface POVShift {
  id: string
  chapterId: string
  position: number  // 0-100
  fromPOV: POVType
  toPOV: POVType
  character: string
  isIntentional: boolean
}

export interface POVReport {
  totalShifts: number
  intentionalShifts: number
  accidentalShifts: number
  povDistribution: Record<POVType, number>
  unreliablePassages: number
  recommendations: string[]
}

export interface NarrativePOVState {
  shifts: POVShift[]
  currentPOV: POVType
  narratorReliability: NarratorReliability
  report: POVReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativePOVState {
  return { shifts: [], currentPOV: 'third_limited', narratorReliability: 'reliable', report: null, typeAlias: {} }
}

export function recordPOVShift(
  state: NarrativePOVState,
  chapterId: string,
  position: number,
  fromPOV: POVType,
  toPOV: POVType,
  character: string,
  isIntentional: boolean = false
): NarrativePOVState {
  const id = `pov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const shift: POVShift = { id, chapterId, position, fromPOV, toPOV, character, isIntentional }
  
  // Check for accidental shifts (same chapter, rapid position changes)
  const accidental = !isIntentional && state.shifts.some(s => s.chapterId === chapterId)
  
  return {
    ...state,
    shifts: [...state.shifts, shift],
    currentPOV: toPOV,
  }
}

export function markUnreliableNarrator(state: NarrativePOVState, isUnreliable: boolean): NarrativePOVState {
  return { ...state, narratorReliability: isUnreliable ? 'unreliable' : 'reliable' }
}

export function generatePOVReport(state: NarrativePOVState): POVReport {
  if (state.shifts.length === 0) {
    return { totalShifts: 0, intentionalShifts: 0, accidentalShifts: 0, povDistribution: { first_person: 0, third_limited: 0, third_omniscient: 0, second_person: 0, multiple: 0 }, unreliablePassages: 0, recommendations: [] }
  }
  
  const totalShifts = state.shifts.length
  const intentionalShifts = state.shifts.filter(s => s.isIntentional).length
  const accidentalShifts = state.shifts.filter(s => !s.isIntentional).length
  
  // POV distribution by destination
  const povDistribution: Record<POVType, number> = { first_person: 0, third_limited: 0, third_omniscient: 0, second_person: 0, multiple: 0 }
  for (const shift of state.shifts) povDistribution[shift.toPOV]++
  
  const unreliablePassages = state.shifts.filter(s => !s.isIntentional).length
  
  const recommendations: string[] = []
  if (accidentalShifts > totalShifts * 0.3) {
    recommendations.push(`${accidentalShifts} accidental POV shifts - maintain consistency`)
  }
  if (state.narratorReliability === 'unreliable') {
    recommendations.push('Unreliable narrator - ensure clues support the deception')
  }
  if (state.shifts.filter(s => s.toPOV === 'multiple').length > 5) {
    recommendations.push('Multiple POV used extensively - ensure each is distinct')
  }
  if (povDistribution['third_limited'] === 0 && totalShifts > 10) {
    recommendations.push('No third-limited narration - consider limited perspectives for intimacy')
  }
  if (accidentalShifts === 0 && totalShifts > 0) {
    recommendations.push('All POV shifts intentional - good narrative control')
  }
  
  return { totalShifts, intentionalShifts, accidentalShifts, povDistribution, unreliablePassages, recommendations }
}

export function getChapterShifts(state: NarrativePOVState, chapterId: string): POVShift[] {
  return state.shifts.filter(s => s.chapterId === chapterId)
}

export function getPOVByCharacter(state: NarrativePOVState, character: string): POVShift[] {
  return state.shifts.filter(s => s.character === character)
}
