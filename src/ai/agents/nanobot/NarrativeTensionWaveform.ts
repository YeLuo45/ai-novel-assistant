// NarrativeTensionWaveform - V260: tracks narrative tension as a waveform over story progression
// Tracks tension peaks, valleys, and rhythm patterns for dramatic arc visualization

export type TensionPhase = "rising" | "falling" | "plateau" | "peak" | "valley" | "climax" | "resolution"

export interface TensionDataPoint {
  pointId: string
  chapter: number
  position: number  // position within chapter 0-100
  tensionLevel: number  // 0-100
  phase: TensionPhase
  isClimax: boolean
  description: string
}

export interface TensionWaveformState {
  dataPoints: TensionDataPoint[]
  currentChapter: number
  averageTension: number
  tensionVariance: number
  peakCount: number
  valleyCount: number
  overallTensionScore: number  // 0-100
  waveformRhythm: TensionPhase[]
}

function createPointId(): string {
  return "tpoint_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 5)
}

export function createEmptyTensionWaveformState(): TensionWaveformState {
  return {
    dataPoints: [],
    currentChapter: 0,
    averageTension: 50,
    tensionVariance: 0,
    peakCount: 0,
    valleyCount: 0,
    overallTensionScore: 50,
    waveformRhythm: [],
  }
}

export function addTensionPoint(
  state: TensionWaveformState,
  chapter: number,
  position: number,
  tensionLevel: number,
  phase: TensionPhase,
  isClimax: boolean,
  description: string
): TensionWaveformState {
  const point: TensionDataPoint = {
    pointId: createPointId(),
    chapter,
    position,
    tensionLevel: Math.max(0, Math.min(100, tensionLevel)),
    phase,
    isClimax,
    description,
  }

  const newPoints = [...state.dataPoints, point]
  return recalculateWaveform(state, newPoints, chapter)
}

export function recalculateWaveform(
  state: TensionWaveformState,
  newPoints: TensionDataPoint[],
  currentChapter: number
): TensionWaveformState {
  const count = newPoints.length
  const totalTension = newPoints.reduce((s, p) => s + p.tensionLevel, 0)
  const averageTension = count > 0 ? Math.round(totalTension / count) : 50

  // Calculate variance
  const squaredDiffs = newPoints.map(p => Math.pow(p.tensionLevel - averageTension, 2))
  const variance = count > 0 ? Math.round(squaredDiffs.reduce((s, d) => s + d, 0) / count) : 0

  // Count peaks and valleys
  let peakCount = 0
  let valleyCount = 0
  const rhythm: TensionPhase[] = []

  for (let i = 0; i < count; i++) {
    const p = newPoints[i]
    rhythm.push(p.phase)

    if (p.isClimax || p.phase === "peak" || p.phase === "climax") {
      peakCount++
    }
    if (p.phase === "valley" || p.phase === "resolution") {
      valleyCount++
    }
  }

  // Overall tension score combines average, peaks, and variance
  const peakBonus = Math.min(20, peakCount * 3)
  const tensionScore = Math.max(0, Math.min(100, averageTension + peakBonus - Math.round(variance / 10)))

  return {
    dataPoints: newPoints,
    currentChapter,
    averageTension,
    tensionVariance: variance,
    peakCount,
    valleyCount,
    overallTensionScore: tensionScore,
    waveformRhythm: rhythm,
  }
}

export function getTensionAtChapter(state: TensionWaveformState, chapter: number): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.chapter === chapter)
}

export function getTensionAtPosition(
  state: TensionWaveformState,
  chapter: number,
  position: number
): TensionDataPoint | null {
  return state.dataPoints.find(p => p.chapter === chapter && p.position === position) || null
}

export function getPeakTensions(state: TensionWaveformState): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.phase === "peak" || p.phase === "climax" || p.isClimax)
}

export function getValleyTensions(state: TensionWaveformState): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.phase === "valley" || p.phase === "resolution")
}

export function getWaveformTrend(state: TensionWaveformState): "rising" | "falling" | "stable" {
  if (state.dataPoints.length < 2) return "stable"
  const recent = state.dataPoints.slice(-5)
  const first = recent[0].tensionLevel
  const last = recent[recent.length - 1].tensionLevel
  const diff = last - first
  if (diff > 10) return "rising"
  if (diff < -10) return "falling"
  return "stable"
}

export function formatTensionSummary(state: TensionWaveformState): string {
  let s = "=== Tension Waveform Summary ===\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Data Points: " + state.dataPoints.length + "\n"
  s += "Average Tension: " + state.averageTension + "\n"
  s += "Variance: " + state.tensionVariance + "\n"
  s += "Peaks: " + state.peakCount + " | Valleys: " + state.valleyCount + "\n"
  s += "Overall Score: " + state.overallTensionScore + "\n"
  s += "Trend: " + getWaveformTrend(state) + "\n"
  return s
}

export function formatTensionDashboard(state: TensionWaveformState): string {
  let s = "=== Tension Waveform Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Score: " + state.overallTensionScore + "\n"
  s += "Points: " + state.dataPoints.length + " | Peaks: " + state.peakCount + " | Valleys: " + state.valleyCount + "\n"

  if (state.dataPoints.length > 0) {
    s += "\n--- Recent Tension Points ---\n"
    for (const p of state.dataPoints.slice(-6)) {
      const climaxFlag = p.isClimax ? " [CLIMAX]" : ""
      const phaseTag = "[" + p.phase + "]"
      s += "  Ch" + p.chapter + "." + p.position + " tension=" + p.tensionLevel + " " + phaseTag + climaxFlag + "\n"
    }
  }

  return s
}

export function formatWaveformVisual(state: TensionWaveformState, width: number = 40): string {
  if (state.dataPoints.length === 0) return "No waveform data"

  let visual = "=== Tension Waveform Visual ===\n"
  const points = state.dataPoints.slice(-width)
  const maxLen = points.length

  // Create ASCII waveform
  const scale = 10
  for (let row = 100; row >= 0; row -= scale) {
    let line = ""
    for (let i = 0; i < maxLen; i++) {
      const p = points[i]
      if (p.tensionLevel >= row && p.tensionLevel < row + scale) {
        if (p.isClimax) {
          line += "*"
        } else if (p.phase === "peak") {
          line += "^"
        } else if (p.phase === "valley") {
          line += "v"
        } else {
          line += "-"
        }
      } else {
        line += " "
      }
    }
    visual += row.toString().padStart(3) + " |" + line + "|\n"
  }

  visual += "     +" + "-".repeat(maxLen) + "\n"
  visual += "      Chapter progression ->\n"

  return visual
}