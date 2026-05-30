// DialogueSubtextLayerEngine - V296: Dialogue subtext layering - multiple levels of meaning
// Inspired by: nanobot (layered architecture) + thunderbolt (feedback loops)

export type SubtextLayer = 'literal' | 'implied' | 'hidden' | 'unconscious'
export type PowerDynamic = 'dominant' | 'submissive' | 'equal' | 'shifting'

export interface SubtextEntry {
  chapter: number
  speaker: string
  surfaceText: string
  layers: SubtextLayer[]
  powerDynamic: PowerDynamic
  emotionalUndertone: string
  tensionLevel: number  // 0-100
}

export interface SubtextLayerState {
  entries: SubtextEntry[]
  currentChapter: number
  averageTension: number
  powerDynamicCount: { [key in PowerDynamic]: number }
}

export function createEmptySubtextLayerState(): SubtextLayerState {
  return {
    entries: [],
    currentChapter: 0,
    averageTension: 0,
    powerDynamicCount: { dominant: 0, submissive: 0, equal: 0, shifting: 0 }
  }
}

function detectSubtextLayers(text: string): SubtextLayer[] {
  const layers: SubtextLayer[] = ['literal']
  const lower = text.toLowerCase()
  if (lower.includes('表面上') || lower.includes('actually') || lower.includes('but')) layers.push('implied')
  if (lower.includes('隐藏') || lower.includes('secretly') || lower.includes('hidden')) layers.push('hidden')
  if (lower.includes('本能') || lower.includes('instinct') || lower.includes('unconsciously')) layers.push('unconscious')
  return layers
}

function detectPowerDynamic(speaker: string, listener: string, text: string): PowerDynamic {
  const lower = text.toLowerCase()
  const questionMark = text.includes('?')
  const exclamationMark = text.includes('!')
  
  if (questionMark && !exclamationMark) return 'submissive'
  if (exclamationMark && !questionMark) return 'dominant'
  if (lower.includes('please') || lower.includes('sorry')) return 'submissive'
  if (lower.includes('should') || lower.includes('must')) return 'dominant'
  return 'equal'
}

function detectEmotionalUndertone(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('angry') || lower.includes('furious')) return 'hostile'
  if (lower.includes('sad') || lower.includes('cry')) return 'melancholic'
  if (lower.includes('love') || lower.includes('care')) return 'affectionate'
  if (lower.includes('fear') || lower.includes('afraid')) return 'anxious'
  if (lower.includes('hope') || lower.includes('wish')) return 'optimistic'
  return 'neutral'
}

function computeTensionLevel(text: string, powerDynamic: PowerDynamic): number {
  let tension = 30
  if (text.includes('!')) tension += 15
  if (text.includes('?')) tension += 10
  if (powerDynamic === 'dominant') tension += 20
  if (powerDynamic === 'submissive') tension += 10
  return Math.min(100, tension)
}

export function analyzeSubtext(
  state: SubtextLayerState,
  chapter: number,
  speaker: string,
  listener: string,
  surfaceText: string
): SubtextLayerState {
  const layers = detectSubtextLayers(surfaceText)
  const powerDynamic = detectPowerDynamic(speaker, listener, surfaceText)
  const emotionalUndertone = detectEmotionalUndertone(surfaceText)
  const tensionLevel = computeTensionLevel(surfaceText, powerDynamic)

  const entry: SubtextEntry = {
    chapter,
    speaker,
    surfaceText,
    layers,
    powerDynamic,
    emotionalUndertone,
    tensionLevel,
  }

  const newEntries = [...state.entries, entry]
  const totalTension = newEntries.reduce((s, e) => s + e.tensionLevel, 0)
  const averageTension = Math.round(totalTension / newEntries.length)

  const powerDynamicCount = { ...state.powerDynamicCount }
  powerDynamicCount[powerDynamic]++

  return {
    entries: newEntries,
    currentChapter: Math.max(state.currentChapter, chapter),
    averageTension,
    powerDynamicCount,
  }
}

export function getSubtextEntriesBySpeaker(state: SubtextLayerState, speaker: string): SubtextEntry[] {
  return state.entries.filter(e => e.speaker === speaker)
}

export function getHighTensionEntries(state: SubtextLayerState, threshold: number = 70): SubtextEntry[] {
  return state.entries.filter(e => e.tensionLevel >= threshold)
}

export function getEntriesByLayer(state: SubtextLayerState, layer: SubtextLayer): SubtextEntry[] {
  return state.entries.filter(e => e.layers.includes(layer))
}

export function formatSubtextLayerSummary(state: SubtextLayerState): string {
  let s = "=== Dialogue Subtext Layer Summary ===\n"
  s += "Total Entries: " + state.entries.length + "\n"
  s += "Average Tension: " + state.averageTension + "\n"
  s += "Power Dynamics: dominant=" + state.powerDynamicCount.dominant + " submissive=" + state.powerDynamicCount.submissive + "\n"
  return s
}

export function formatSubtextLayerDashboard(state: SubtextLayerState): string {
  let s = "=== Dialogue Subtext Layer Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Entries: " + state.entries.length + "\n"
  s += "Average Tension: " + state.averageTension + "\n"

  if (state.entries.length > 0) {
    s += "\n--- Power Dynamic Distribution ---\n"
    for (const [key, count] of Object.entries(state.powerDynamicCount)) {
      if (count > 0) s += "  " + key + ": " + count + "\n"
    }

    s += "\n--- Recent High Tension Entries ---\n"
    const highTension = state.entries.filter(e => e.tensionLevel >= 70).slice(-3)
    for (const e of highTension) {
      s += "  Ch" + e.chapter + " " + e.speaker + ": " + e.tensionLevel + " [" + e.layers.join(',') + "]\n"
    }
  }
  return s
}