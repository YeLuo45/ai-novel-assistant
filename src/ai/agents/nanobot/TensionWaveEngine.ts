export interface TensionPoint {
  pointId: string
  chapter: number
  scene: string
  tensionLevel: number  // 0-100
  eventType: string
}

export interface TensionWaveState {
  points: TensionPoint[]
  currentChapter: number
  peaks: number[]  // chapter numbers of peak tension
  troughs: number[]  // chapter numbers of low tension
  averageTension: number
}

function createPointId(): string {
  return 'tp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function analyzeEventType(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('battle') || lower.includes('fight')) return 'combat'
  if (lower.includes('reveal') || lower.includes('discover')) return 'revelation'
  if (lower.includes('death') || lower.includes('kill')) return 'tragedy'
  if (lower.includes('meet') || lower.includes('together')) return 'connection'
  if (lower.includes('escape') || lower.includes('chase')) return 'pursuit'
  if (lower.includes('betray') || lower.includes('treason')) return 'betrayal'
  if (lower.includes('triumph') || lower.includes('victory')) return 'triumph'
  if (lower.includes('loss') || lower.includes('fail')) return 'setback'
  if (lower.includes('plan') || lower.includes('scheme')) return 'intrigue'
  return 'normal'
}

function calculateTensionLevel(eventType: string, text: string): number {
  const base: Record<string, number> = {
    combat: 85, revelation: 80, tragedy: 90, pursuit: 75,
    betrayal: 82, triumph: 70, setback: 65, intrigue: 60, normal: 30,
  }
  const baseLevel = base[eventType] || 30
  const lower = text.toLowerCase()
  const modifiers = (lower.includes('sudden') ? 10 : 0) + (lower.includes('intense') ? 8 : 0) + (lower.includes('quiet') ? -15 : 0)
  return Math.min(100, Math.max(0, baseLevel + modifiers))
}

export function createEmptyTensionWaveState(): TensionWaveState {
  return { points: [], currentChapter: 0, peaks: [], troughs: [], averageTension: 0 }
}

export function recordTensionPoint(
  state: TensionWaveState,
  chapter: number,
  scene: string,
  text: string
): TensionWaveState {
  const eventType = analyzeEventType(text)
  const tensionLevel = calculateTensionLevel(eventType, text)
  const point: TensionPoint = { pointId: createPointId(), chapter, scene, tensionLevel, eventType }

  const newPoints = [...state.points, point]
  const sorted = [...newPoints].sort((a, b) => a.chapter - b.chapter)

  // Find peaks and troughs
  const peaks: number[] = []
  const troughs: number[] = []
  for (let i = 1; i < sorted.length - 1; i++) {
    if (sorted[i].tensionLevel > sorted[i - 1].tensionLevel && sorted[i].tensionLevel > sorted[i + 1].tensionLevel) {
      peaks.push(sorted[i].chapter)
    }
    if (sorted[i].tensionLevel < sorted[i - 1].tensionLevel && sorted[i].tensionLevel < sorted[i + 1].tensionLevel) {
      troughs.push(sorted[i].chapter)
    }
  }

  const avg = newPoints.length > 0 ? Math.round(newPoints.reduce((sum, p) => sum + p.tensionLevel, 0) / newPoints.length) : 0

  return { ...state, points: newPoints, currentChapter: Math.max(state.currentChapter, chapter), peaks, troughs, averageTension: avg }
}

export function getTensionAtChapter(state: TensionWaveState, chapter: number): number | null {
  const point = state.points.find(p => p.chapter === chapter)
  return point ? point.tensionLevel : null
}

export function getNextPeak(state: TensionWaveState, fromChapter: number): number | null {
  const futurePeaks = state.peaks.filter(p => p > fromChapter)
  return futurePeaks.length > 0 ? futurePeaks[0] : null
}

export function getAverageTension(state: TensionWaveState): number {
  return state.averageTension
}

export function formatTensionSummary(state: TensionWaveState): string {
  let s = "=== Tension Wave Summary ===" + "\n"
  s += "Total Points: " + state.points.length + "\n"
  s += "Average Tension: " + state.averageTension + "\n"
  s += "Peaks: " + state.peaks.length + " (Ch " + state.peaks.join(", ") + ")" + "\n"
  s += "Troughs: " + state.troughs.length + "\n"
  return s
}

export function formatTensionDashboard(state: TensionWaveState): string {
  let s = "=== Tension Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Average: " + state.averageTension + "\n"

  if (state.points.length > 0) {
    s += "\n--- Recent Tension Points ---" + "\n"
    const recent = state.points.slice(-5)
    for (const p of recent) {
      s += "  Ch " + p.chapter + " [" + p.eventType + "] tension=" + p.tensionLevel + "\n"
    }
  }

  if (state.peaks.length > 0) {
    s += "\n--- Peak Chapters ---" + "\n"
    s += "  " + state.peaks.join(", ") + "\n"
  }

  return s
}
