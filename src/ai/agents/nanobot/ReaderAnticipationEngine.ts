/**
 * ReaderAnticipationEngine — V461
 * Reader anticipation building, suspense architecture, expectation management for narrative tension.
 * Inspired by: thunderbolt (feedback loops), chatdev (engagement), generic-agent (optimization)
 */

export interface SuspenseBeat {
  id: string
  chapterNumber: number
  hookType: 'question' | 'danger' | 'mystery' | 'discovery' | 'reveal'
  anticipationLevel: number  // 0-100
  payoffStatus: 'pending' | 'delayed' | 'delivered' | 'subverted'
  deliveryChapter: number | null
  effectivenessScore: number  // 0-100
}

export interface AnticipationReport {
  totalBeats: number
  avgAnticipation: number
  pendingPayoffs: number
  avgEffectiveness: number
  recommendations: string[]
}

export interface ReaderAnticipationState {
  beats: SuspenseBeat[]
  report: AnticipationReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ReaderAnticipationState {
  return { beats: [], report: null, typeAlias: {} }
}

export function addSuspenseBeat(
  state: ReaderAnticipationState,
  chapterNumber: number,
  hookType: SuspenseBeat['hookType'],
  anticipationLevel: number
): ReaderAnticipationState {
  const id = `beat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const beat: SuspenseBeat = {
    id,
    chapterNumber,
    hookType,
    anticipationLevel: Math.max(0, Math.min(100, anticipationLevel)),
    payoffStatus: 'pending',
    deliveryChapter: null,
    effectivenessScore: 50,
  }
  const beats = [...state.beats, beat].sort((a, b) => a.chapterNumber - b.chapterNumber)
  return { ...state, beats }
}

export function deliverPayoff(
  state: ReaderAnticipationState,
  beatId: string,
  payoffChapter: number,
  subvert: boolean = false
): ReaderAnticipationState {
  const beats = state.beats.map(b => {
    if (b.id !== beatId) return b
    const delivered = subvert ? 'subverted' : 'delivered'
    const delay = payoffChapter - b.chapterNumber
    // Effectiveness: moderate delay (5-15 chapters) is best
    let effectiveness = 70
    if (delay < 3) effectiveness -= 20
    else if (delay > 20) effectiveness -= 15
    else if (delay < 8) effectiveness += 10
    if (subvert) effectiveness += 10  // subversion can be effective
    effectiveness = Math.max(0, Math.min(100, effectiveness))
    return { ...b, payoffStatus: delivered, deliveryChapter: payoffChapter, effectivenessScore: effectiveness }
  })
  return { ...state, beats }
}

export function delayPayoff(state: ReaderAnticipationState, beatId: string, newChapter: number): ReaderAnticipationState {
  const beats = state.beats.map(b => b.id === beatId ? { ...b, payoffStatus: 'delayed' as const } : b)
  return { ...state, beats }
}

export function generateAnticipationReport(state: ReaderAnticipationState): AnticipationReport {
  if (state.beats.length === 0) {
    return { totalBeats: 0, avgAnticipation: 0, pendingPayoffs: 0, avgEffectiveness: 0, recommendations: [] }
  }
  
  const totalBeats = state.beats.length
  const avgAnticipation = Math.round(state.beats.reduce((s, b) => s + b.anticipationLevel, 0) / totalBeats)
  const pendingPayoffs = state.beats.filter(b => b.payoffStatus === 'pending').length
  const deliveredBeats = state.beats.filter(b => b.payoffStatus === 'delivered' || b.payoffStatus === 'subverted')
  const avgEffectiveness = deliveredBeats.length > 0
    ? Math.round(deliveredBeats.reduce((s, b) => s + b.effectivenessScore, 0) / deliveredBeats.length)
    : 0
  
  const recommendations: string[] = []
  if (pendingPayoffs > totalBeats * 0.4) {
    recommendations.push(`${pendingPayoffs} unfulfilled promises - risk reader fatigue`)
  }
  if (avgAnticipation > 85) {
    recommendations.push('Very high anticipation - deliver payoffs soon to avoid disappointment')
  }
  if (deliveredBeats.length > 0 && avgEffectiveness < 50) {
    recommendations.push('Low payoff effectiveness - increase delay or add subversion')
  }
  if (state.beats.filter(b => b.payoffStatus === 'subverted').length > deliveredBeats.length * 0.5) {
    recommendations.push('Too many subverted expectations - balance with satisfying payoffs')
  }
  if (avgEffectiveness > 80) {
    recommendations.push('Excellent anticipation management - strong suspense architecture')
  }
  
  return { totalBeats, avgAnticipation, pendingPayoffs, avgEffectiveness, recommendations }
}

export function getPendingBeats(state: ReaderAnticipationState): SuspenseBeat[] {
  return state.beats.filter(b => b.payoffStatus === 'pending')
}

export function compareAnticipation(state: ReaderAnticipationState, beatId1: string, beatId2: string): {
  higherAnticipation: string
  score1: number
  score2: number
} {
  const b1 = state.beats.find(b => b.id === beatId1)
  const b2 = state.beats.find(b => b.id === beatId2)
  if (!b1 || !b2) return { higherAnticipation: beatId1, score1: 0, score2: 0 }
  return b1.anticipationLevel > b2.anticipationLevel ? { higherAnticipation: beatId1, score1: b1.anticipationLevel, score2: b2.anticipationLevel } : { higherAnticipation: beatId2, score1: b1.anticipationLevel, score2: b2.anticipationLevel }
}
