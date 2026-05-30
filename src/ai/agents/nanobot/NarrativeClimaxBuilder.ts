/**
 * NarrativeClimaxBuilder — V449
 * Climax architecture, high-tension scene construction, peak moment engineering for maximum impact.
 * Inspired by: thunderbolt (peak feedback), generic-agent (optimization), chatdev (emotional arcs)
 */

export type ClimaxType = 'action' | 'emotional' | 'revelation' | 'decision' | 'confrontation' | 'sacrifice'

export interface ClimaxBeat {
  id: string
  chapterNumber: number
  climaxType: ClimaxType | null
  content: string
  tensionLevel: number  // 0-100
  emotionalIntensity: number  // 0-100
  pageCount: number  // how many pages this climax spans
  isPeaked: boolean
}

export interface ClimaxArchitecture {
  climaxChapter: number | null
  climaxType: ClimaxType | null
  peakTension: number
  peakIntensity: number
  buildupQuality: number  // 0-100 (how well tension was built)
}

export interface ClimaxReport {
  architecture: ClimaxArchitecture | null
  totalBeats: number
  climaxCount: number
  avgTension: number
  recommendations: string[]
}

export interface NarrativeClimaxState {
  beats: ClimaxBeat[]
  architecture: ClimaxArchitecture | null
  report: ClimaxReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeClimaxState {
  return { beats: [], architecture: null, report: null, typeAlias: {} }
}

export function registerClimaxBeat(
  state: NarrativeClimaxState,
  chapterNumber: number,
  climaxType: ClimaxType | null,
  content: string,
  tensionLevel: number,
  emotionalIntensity: number,
  pageCount: number
): NarrativeClimaxState {
  const id = `climax_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const tension = Math.max(0, Math.min(100, tensionLevel))
  const intensity = Math.max(0, Math.min(100, emotionalIntensity))
  
  const beat: ClimaxBeat = { id, chapterNumber, climaxType, content, tensionLevel: tension, emotionalIntensity: intensity, pageCount, isPeaked: tension >= 90 || intensity >= 90 }
  
  const beats = state.beats.filter(b => b.chapterNumber !== chapterNumber)
  beats.push(beat)
  beats.sort((a, b) => a.chapterNumber - b.chapterNumber)
  
  // Build architecture
  const peakBeat = beats.reduce((peak, b) => {
    if (!peak || b.tensionLevel > peak.tensionLevel) return b
    return peak
  }, beats[0] || null)
  
  const buildupQuality = beats.length > 1
    ? Math.max(0, Math.min(100, Math.round(
        beats.slice(0, -1).reduce((s, b) => s + b.tensionLevel, 0) / (beats.length - 1) * 1.2
      )))
    : 50
  
  const architecture: ClimaxArchitecture = {
    climaxChapter: peakBeat?.chapterNumber || null,
    climaxType: peakBeat?.climaxType || null,
    peakTension: peakBeat?.tensionLevel || 0,
    peakIntensity: peakBeat?.emotionalIntensity || 0,
    buildupQuality: Math.min(100, buildupQuality),
  }
  
  return { ...state, beats, architecture }
}

export function generateClimaxReport(state: NarrativeClimaxState): ClimaxReport {
  if (state.beats.length === 0) {
    return { architecture: null, totalBeats: 0, climaxCount: 0, avgTension: 0, recommendations: ['Add climax beats'] }
  }
  
  const totalBeats = state.beats.length
  const climaxCount = state.beats.filter(b => b.isPeaked).length
  const avgTension = Math.round(state.beats.reduce((s, b) => s + b.tensionLevel, 0) / totalBeats)
  
  const recommendations: string[] = []
  if (climaxCount === 0) recommendations.push('No peak climax detected - build to 90+ tension')
  if (state.architecture && state.architecture.peakTension < 80) {
    recommendations.push('Climax tension too low - push to 90+ for maximum impact')
  }
  if (avgTension < 60) recommendations.push('Overall tension too low - raise stakes throughout')
  if (state.architecture && state.architecture.buildupQuality < 50) {
    recommendations.push('Climax buildup weak - improve tension escalation')
  }
  if (climaxCount > 3) recommendations.push('Too many peaks - choose ONE true climax')
  if (state.beats.every(b => b.climaxType !== 'sacrifice')) {
    recommendations.push('No sacrifice moment - consider adding emotional climax')
  }
  if (state.architecture && state.architecture.peakIntensity > 90) {
    recommendations.push('Powerful emotional climax - deliver satisfying resolution')
  }
  
  return { architecture: state.architecture, totalBeats, climaxCount, avgTension, recommendations }
}

export function getClimaxByChapter(state: NarrativeClimaxState, chapterNumber: number): ClimaxBeat | null {
  return state.beats.find(b => b.chapterNumber === chapterNumber) || null
}

export function getPeakedBeats(state: NarrativeClimaxState): ClimaxBeat[] {
  return state.beats.filter(b => b.isPeaked)
}

export function compareClimaxIntensity(state: NarrativeClimaxState, ch1: number, ch2: number): {
  moreIntense: number
  intensity1: number
  intensity2: number
} {
  const b1 = state.beats.find(b => b.chapterNumber === ch1)
  const b2 = state.beats.find(b => b.chapterNumber === ch2)
  if (!b1 || !b2) return { moreIntense: ch1, intensity1: 0, intensity2: 0 }
  return { moreIntense: b1.emotionalIntensity > b2.emotionalIntensity ? ch1 : ch2, intensity1: b1.emotionalIntensity, intensity2: b2.emotionalIntensity }
}
