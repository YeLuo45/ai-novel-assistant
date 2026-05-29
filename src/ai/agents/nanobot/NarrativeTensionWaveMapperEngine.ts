// NarrativeTensionWaveMapperEngine - V299: Maps narrative tension as multi-layered waveforms
// Inspired by: thunderbolt (waveform tracking) + nanobot (mesh layers)

export type TensionLayer = 'external' | 'internal' | 'relational' | 'thematic'
export type TensionPattern = 'rising' | 'falling' | 'plateau' | 'spike' | 'valley' | 'wave'

export interface TensionDataPoint {
  chapter: number
  layer: TensionLayer
  tension: number  // 0-100
  trigger: string   // event that raised/lowered tension
  duration: number  // chapters this tension level persisted
}

export interface TensionWaveState {
  dataPoints: TensionDataPoint[]
  currentWaveform: TensionPattern
  layers: { [key in TensionLayer]: number }
  peakTension: number
  peakChapter: number | null
}

export function createEmptyTensionWaveState(): TensionWaveState {
  return {
    dataPoints: [],
    currentWaveform: 'plateau',
    layers: { external: 0, internal: 0, relational: 0, thematic: 0 },
    peakTension: 0,
    peakChapter: null,
  }
}

function detectTensionPattern(points: TensionDataPoint[]): TensionPattern {
  if (points.length < 3) return 'plateau'
  const tensions = points.map(p => p.tension)
  const first = tensions[0]
  const last = tensions[tensions.length - 1]
  const mid = tensions[Math.floor(tensions.length / 2)]
  
  if (last > first + 20) return 'rising'
  if (last < first - 20) return 'falling'
  if (Math.max(...tensions) - Math.min(...tensions) > 30) return 'wave'
  if (tensions.some(t => t > 80)) return 'spike'
  if (tensions.some(t => t < 20)) return 'valley'
  return 'plateau'
}

export function addTensionPoint(
  state: TensionWaveState,
  chapter: number,
  layer: TensionLayer,
  tension: number,
  trigger: string,
  duration: number = 1
): TensionWaveState {
  const point: TensionDataPoint = { chapter, layer, tension, trigger, duration }
  const newPoints = [...state.dataPoints, point]
  
  const layers = { ...state.layers }
  layers[layer] = Math.round((layers[layer] + tension) / 2)
  
  let peakTension = state.peakTension
  let peakChapter = state.peakChapter
  if (tension > peakTension) {
    peakTension = tension
    peakChapter = chapter
  }
  
  const currentWaveform = detectTensionPattern(newPoints)

  return {
    dataPoints: newPoints,
    currentWaveform,
    layers,
    peakTension,
    peakChapter,
  }
}

export function getTensionAtChapter(state: TensionWaveState, chapter: number): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.chapter === chapter)
}

export function getTensionByLayer(state: TensionWaveState, layer: TensionLayer): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.layer === layer)
}

export function getLayerTensionAverage(state: TensionWaveState, layer: TensionLayer): number {
  const layerPoints = getTensionByLayer(state, layer)
  if (layerPoints.length === 0) return 0
  return Math.round(layerPoints.reduce((s, p) => s + p.tension, 0) / layerPoints.length)
}

export function getTensionSpikes(state: TensionWaveState, threshold: number = 75): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.tension >= threshold)
}

export function getTensionValleys(state: TensionWaveState, threshold: number = 25): TensionDataPoint[] {
  return state.dataPoints.filter(p => p.tension <= threshold)
}

export function formatTensionWaveSummary(state: TensionWaveState): string {
  let s = "=== Narrative Tension Wave Summary ===\n"
  s += "Data Points: " + state.dataPoints.length + "\n"
  s += "Waveform: " + state.currentWaveform + "\n"
  s += "Peak: " + state.peakTension + " (Ch" + (state.peakChapter || 'N/A') + ")\n"
  return s
}

export function formatTensionWaveDashboard(state: TensionWaveState): string {
  let s = "=== Narrative Tension Wave Dashboard ===\n"
  s += "Points: " + state.dataPoints.length + " | Waveform: " + state.currentWaveform + "\n"
  s += "Peak: " + state.peakTension + " at Ch" + (state.peakChapter || 'N/A') + "\n"

  s += "\n--- Layer Averages ---\n"
  for (const [layer, avg] of Object.entries(state.layers)) {
    if (avg > 0) s += "  " + layer + ": " + avg + "\n"
  }

  if (state.dataPoints.length > 0) {
    s += "\n--- Recent Tension Points ---\n"
    for (const p of state.dataPoints.slice(-4)) {
      const bar = '█'.repeat(Math.round(p.tension / 10)) + '░'.repeat(10 - Math.round(p.tension / 10))
      s += "  Ch" + p.chapter + " [" + p.layer + "] " + bar + " " + p.tension + " \"" + p.trigger + "\"\n"
    }
  }
  return s
}