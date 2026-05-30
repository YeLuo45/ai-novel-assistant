/**
 * NarrativeMidpointEngine — V447
 * Midpoint analysis, middle chapter architecture, reversal and pivot point detection.
 * Inspired by: ruflo (hierarchical decomposition), generic-agent (optimization), thunderbolt (feedback loops)
 */

export type MidpointType = 'reversal' | 'revelation' | 'commitment' | 'crisis' | 'false_victory' | 'false_defeat'

export interface MidpointBeat {
  id: string
  chapterNumber: number
  midpointType: MidpointType | null
  content: string
  tensionLevel: number  // 0-100
  impactScore: number  // 0-100
  pivotEffect: number  // -100 to +100 (negative=setback, positive=breakthrough)
}

export interface MidpointArchitecture {
  midpointChapter: number | null
  midpointType: MidpointType | null
  pivotEffect: number
  tensionAtMidpoint: number
  reversalDetected: boolean
}

export interface MidpointReport {
  architecture: MidpointArchitecture | null
  totalBeats: number
  pivotCount: number
  avgImpact: number
  recommendations: string[]
}

export interface NarrativeMidpointState {
  beats: MidpointBeat[]
  architecture: MidpointArchitecture | null
  report: MidpointReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeMidpointState {
  return { beats: [], architecture: null, report: null, typeAlias: {} }
}

export function registerMidpointBeat(
  state: NarrativeMidpointState,
  chapterNumber: number,
  midpointType: MidpointType,
  content: string,
  tensionLevel: number,
  impactScore: number,
  pivotEffect: number
): NarrativeMidpointState {
  const id = `mid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const beat: MidpointBeat = { id, chapterNumber, midpointType, content, tensionLevel: Math.max(0, Math.min(100, tensionLevel)), impactScore: Math.max(0, Math.min(100, impactScore)), pivotEffect: Math.max(-100, Math.min(100, pivotEffect)) }
  
  // Replace existing beat for same chapter if any
  const beats = state.beats.filter(b => b.chapterNumber !== chapterNumber)
  beats.push(beat)
  beats.sort((a, b) => a.chapterNumber - b.chapterNumber)
  
  // Recalculate architecture
  const midpointChapter = findMidpointChapter(beats)
  const midBeat = beats.find(b => b.chapterNumber === midpointChapter)
  const reversalDetected = Math.abs(midBeat?.pivotEffect || 0) > 50
  
  const architecture: MidpointArchitecture = {
    midpointChapter,
    midpointType: midBeat?.midpointType || null,
    pivotEffect: midBeat?.pivotEffect || 0,
    tensionAtMidpoint: midBeat?.tensionLevel || 50,
    reversalDetected,
  }
  
  return { ...state, beats, architecture }
}

export function findMidpointChapter(beats: MidpointBeat[]): number | null {
  if (beats.length === 0) return null
  if (beats.length === 1) return beats[0].chapterNumber
  
  const chapters = beats.map(b => b.chapterNumber).sort((a, b) => a - b)
  const midIdx = Math.floor(chapters.length / 2)
  return chapters[midIdx]
}

export function generateMidpointReport(state: NarrativeMidpointState): MidpointReport {
  if (state.beats.length === 0) {
    return { architecture: null, totalBeats: 0, pivotCount: 0, avgImpact: 0, recommendations: ['Add midpoint beats'] }
  }
  
  const totalBeats = state.beats.length
  const pivotCount = state.beats.filter(b => Math.abs(b.pivotEffect) > 30).length
  const avgImpact = Math.round(state.beats.reduce((s, b) => s + b.impactScore, 0) / totalBeats)
  
  const recommendations: string[] = []
  if (!state.architecture?.midpointType) recommendations.push('No clear midpoint type - define the pivot')
  if (state.architecture?.pivotEffect && Math.abs(state.architecture.pivotEffect) < 20) {
    recommendations.push('Midpoint pivot too weak - strengthen the turning point')
  }
  if (pivotCount === 0) recommendations.push('No significant pivots detected - add reversal moments')
  if (avgImpact < 50) recommendations.push('Low midpoint impact - make the middle more dramatic')
  if (state.architecture?.tensionAtMidpoint && state.architecture.tensionAtMidpoint < 60) {
    recommendations.push('Midpoint tension too low - raise stakes at the middle')
  }
  if (state.beats.length < 3) recommendations.push('Few midpoint beats - track more chapter moments')
  if (state.architecture?.reversalDetected) recommendations.push('Strong reversal at midpoint - good dramatic structure')
  if (avgImpact > 80) recommendations.push('Excellent midpoint impact - maintain momentum to climax')
  
  return { architecture: state.architecture, totalBeats, pivotCount, avgImpact, recommendations }
}

export function getMidpointByChapter(state: NarrativeMidpointState, chapterNumber: number): MidpointBeat | null {
  return state.beats.find(b => b.chapterNumber === chapterNumber) || null
}

export function compareMidpointImpact(state: NarrativeMidpointState, ch1: number, ch2: number): {
  higherImpact: number
  impact1: number
  impact2: number
} {
  const b1 = state.beats.find(b => b.chapterNumber === ch1)
  const b2 = state.beats.find(b => b.chapterNumber === ch2)
  if (!b1 || !b2) return { higherImpact: ch1, impact1: 0, impact2: 0 }
  return { higherImpact: b1.impactScore > b2.impactScore ? ch1 : ch2, impact1: b1.impactScore, impact2: b2.impactScore }
}
