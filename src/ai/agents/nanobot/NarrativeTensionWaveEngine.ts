/**
 * NarrativeTensionWaveEngine — V463
 * Tension wave patterns, emotional ups and downs visualization, pacing rhythm analysis.
 * Inspired by: thunderbolt (feedback loops), ruflo (hierarchical patterns), chatdev (rhythm)
 */

export type TensionPattern = 'rising' | 'falling' | 'plateau' | 'zigzag' | 'climax' | 'valley'

export interface TensionWave {
  id: string
  chapterRange: [number, number]
  pattern: TensionPattern
  peakTension: number  // 0-100
  valleyTension: number  // 0-100
  waveLength: number  // chapters
  intensity: number  // 0-100
}

export interface TensionReport {
  totalWaves: number
  avgIntensity: number
  dominantPattern: TensionPattern | null
  climacticChapter: number | null
  recommendations: string[]
}

export interface NarrativeTensionWaveState {
  waves: TensionWave[]
  report: TensionReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeTensionWaveState {
  return { waves: [], report: null, typeAlias: {} }
}

export function registerWave(
  state: NarrativeTensionWaveState,
  startChapter: number,
  endChapter: number,
  pattern: TensionPattern,
  peakTension: number,
  valleyTension: number
): NarrativeTensionWaveState {
  const id = `wave_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const wave: TensionWave = {
    id,
    chapterRange: [startChapter, endChapter],
    pattern,
    peakTension: Math.max(0, Math.min(100, peakTension)),
    valleyTension: Math.max(0, Math.min(100, valleyTension)),
    waveLength: endChapter - startChapter,
    intensity: Math.abs(peakTension - valleyTension),
  }
  const waves = [...state.waves, wave].sort((a, b) => a.chapterRange[0] - b.chapterRange[0])
  return { ...state, waves }
}

export function detectPattern(waves: TensionWave[]): TensionPattern {
  if (waves.length === 0) return 'plateau'
  const intensities = waves.map(w => w.intensity)
  const avgIntensity = intensities.reduce((s, i) => s + i, 0) / intensities.length
  const rising = waves.filter(w => w.peakTension > w.valleyTension)
  const falling = waves.filter(w => w.peakTension < w.valleyTension)
  
  if (avgIntensity < 10) return 'plateau'
  if (rising.length > waves.length * 0.7) return 'rising'
  if (falling.length > waves.length * 0.7) return 'falling'
  if (intensities.some(i => i > 60)) return 'climax'
  return 'zigzag'
}

export function generateTensionReport(state: NarrativeTensionWaveState): TensionReport {
  if (state.waves.length === 0) {
    return { totalWaves: 0, avgIntensity: 0, dominantPattern: null, climacticChapter: null, recommendations: [] }
  }
  
  const totalWaves = state.waves.length
  const avgIntensity = Math.round(state.waves.reduce((s, w) => s + w.intensity, 0) / totalWaves)
  const dominantPattern = detectPattern(state.waves)
  const climacticChapter = state.waves.reduce((max, w) => w.peakTension > max.peakTension ? w : max, state.waves[0]).chapterRange[1]
  
  const recommendations: string[] = []
  if (avgIntensity < 30) {
    recommendations.push('Low tension variation - add more dramatic ups and downs')
  }
  if (dominantPattern === 'plateau') {
    recommendations.push('Flat tension throughout - introduce rising and falling waves')
  }
  if (state.waves.some(w => w.pattern === 'rising' && w.intensity > 70)) {
    recommendations.push('Strong rising tension detected - plan climax carefully')
  }
  if (dominantPattern === 'zigzag' && avgIntensity > 50) {
    recommendations.push('Erratic tension - smooth out the rhythm for better reader experience')
  }
  if (avgIntensity > 60 && dominantPattern === 'rising') {
    recommendations.push('High sustained tension - consider relief moments to prevent fatigue')
  }
  
  return { totalWaves, avgIntensity, dominantPattern, climacticChapter, recommendations }
}

export function getChapterTension(state: NarrativeTensionWaveState, chapter: number): number | null {
  for (const wave of state.waves) {
    if (chapter >= wave.chapterRange[0] && chapter <= wave.chapterRange[1]) {
      const progress = (chapter - wave.chapterRange[0]) / wave.waveLength
      if (wave.pattern === 'rising') return Math.round(wave.valleyTension + (wave.peakTension - wave.valleyTension) * progress)
      if (wave.pattern === 'falling') return Math.round(wave.peakTension - (wave.peakTension - wave.valleyTension) * progress)
      return Math.round((wave.peakTension + wave.valleyTension) / 2)
    }
  }
  return null
}
