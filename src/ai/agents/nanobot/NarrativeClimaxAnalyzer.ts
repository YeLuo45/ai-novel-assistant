// NarrativeClimaxAnalyzer - V256: tracks climax points, tension peaks, resolution quality
// Inspired by: thunderbolt (pipeline) + generic-agent (goal pursuit)

export type ClimaxType = 'action' | 'emotional' | 'revelation' | 'decision' | 'structural'

export interface ClimaxPoint {
  climaxId: string
  chapter: number
  climaxType: ClimaxType
  intensity: number  // 0-100
  resolutionQuality: number  // 0-100
  pagePosition: number  // position within chapter 0-100
  description: string
}

export interface ClimaxState {
  climaxes: ClimaxPoint[]
  currentChapter: number
  tensionPeak: number
  climaxCount: number
  averageIntensity: number
  overallDramaticCurve: number  // 0-100
}

function createClimaxId(): string {
  return 'climax_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyClimaxState(): ClimaxState {
  return { climaxes: [], currentChapter: 0, tensionPeak: 0, climaxCount: 0, averageIntensity: 0, overallDramaticCurve: 100 }
}

export function detectClimax(
  state: ClimaxState,
  chapter: number,
  climaxType: ClimaxType,
  intensity: number,
  pagePosition: number,
  description: string
): ClimaxState {
  const climax: ClimaxPoint = {
    climaxId: createClimaxId(),
    chapter,
    climaxType,
    intensity,
    resolutionQuality: 50,
    pagePosition,
    description,
  }
  const newClimaxes = [...state.climaxes, climax]
  const avgIntensity = Math.round(newClimaxes.reduce((s, c) => s + c.intensity, 0) / newClimaxes.length)
  const tensionPeak = Math.max(state.tensionPeak, intensity)
  const curve = Math.round((avgIntensity + tensionPeak) / 2)
  return {
    climaxes: newClimaxes,
    currentChapter: chapter,
    tensionPeak,
    climaxCount: newClimaxes.length,
    averageIntensity: avgIntensity,
    overallDramaticCurve: curve,
  }
}

export function markResolutionQuality(state: ClimaxState, climaxId: string, quality: number): ClimaxState {
  return {
    ...state,
    climaxes: state.climaxes.map(c => c.climaxId === climaxId ? { ...c, resolutionQuality: quality } : c),
  }
}

export function getClimaxesByType(state: ClimaxState, climaxType: ClimaxType): ClimaxPoint[] {
  return state.climaxes.filter(c => c.climaxType === climaxType)
}

export function getClimaxesByChapter(state: ClimaxState, chapter: number): ClimaxPoint[] {
  return state.climaxes.filter(c => c.chapter === chapter)
}

export function formatClimaxSummary(state: ClimaxState): string {
  let s = "=== Climax Analysis Summary ===\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Climaxes: " + state.climaxCount + " | Average Intensity: " + state.averageIntensity + "\n"
  s += "Tension Peak: " + state.tensionPeak + " | Dramatic Curve: " + state.overallDramaticCurve + "\n"
  return s
}

export function formatClimaxDashboard(state: ClimaxState): string {
  let s = "=== Climax Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Curve: " + state.overallDramaticCurve + "\n"
  s += "Total Climaxes: " + state.climaxCount + " | Peak Intensity: " + state.tensionPeak + "\n"
  if (state.climaxes.length > 0) {
    s += "\n--- Recent Climaxes ---\n"
    for (const c of state.climaxes.slice(-3)) {
      s += "  Ch" + c.chapter + " [" + c.climaxType + "] intensity=" + c.intensity + "\n"
    }
  }
  return s
}
