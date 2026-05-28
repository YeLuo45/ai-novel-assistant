export interface EmotionalState {
  state: string  // e.g., 'hopeful', 'despair', 'angry', 'peaceful'
  intensity: number  // 0-100
  chapter: number
}

export interface EmotionalArc {
  characterId: string
  states: EmotionalState[]
  transformationScore: number  // 0-100
  arcType: 'growth' | 'decline' | 'cycle' | 'stable'
}

export interface EmotionalArcState {
  arcs: Map<string, EmotionalArc>
  currentChapter: number
}

function createStateId(): string {
  return 'emo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectArcType(states: EmotionalState[]): 'growth' | 'decline' | 'cycle' | 'stable' {
  if (states.length < 3) return 'stable'
  const intensities = states.map(s => s.intensity)
  const first = intensities[0]
  const last = intensities[intensities.length - 1]
  const mid = intensities[Math.floor(intensities.length / 2)]

  if (last > first && last > mid) return 'growth'
  if (last < first && last < mid) return 'decline'
  // Check for cycle: high-low-high or low-high-low
  const peaks = intensities.filter((v, i) => i > 0 && i < intensities.length - 1 && v > intensities[i-1] && v > intensities[i+1])
  const valleys = intensities.filter((v, i) => i > 0 && i < intensities.length - 1 && v < intensities[i-1] && v < intensities[i+1])
  if (peaks.length >= 1 && valleys.length >= 1) return 'cycle'
  return 'stable'
}

function assessTransformation(arc: EmotionalArc): number {
  if (arc.states.length < 2) return 0
  const first = arc.states[0]
  const last = arc.states[arc.states.length - 1]
  const stateChange = first.state !== last.state ? 30 : 0
  const intensityDiff = Math.abs(last.intensity - first.intensity)
  return Math.min(100, stateChange + intensityDiff * 0.5)
}

export function createEmptyEmotionalArcState(): EmotionalArcState {
  return { arcs: new Map(), currentChapter: 0 }
}

export function recordEmotionalState(
  state: EmotionalArcState,
  characterId: string,
  chapter: number,
  emotion: string,
  intensity: number
): EmotionalArcState {
  const newArcs = new Map(state.arcs)
  let arc = newArcs.get(characterId)
  if (!arc) {
    arc = { characterId, states: [], transformationScore: 0, arcType: 'stable' }
  }

  const emotionalState: EmotionalState = { state: emotion.toLowerCase(), chapter, intensity }
  const newStates = [...arc.states, emotionalState]
  const newArc: EmotionalArc = {
    ...arc,
    states: newStates,
    arcType: detectArcType(newStates),
    transformationScore: assessTransformation({ ...arc, states: newStates }),
  }

  newArcs.set(characterId, newArc)
  return { arcs: newArcs, currentChapter: Math.max(state.currentChapter, chapter) }
}

export function getCharacterArc(state: EmotionalArcState, characterId: string): EmotionalArc | null {
  return state.arcs.get(characterId) || null
}

export function getArcSummary(state: EmotionalArcState): { characterId: string; arcType: string; transformationScore: number }[] {
  const summaries: { characterId: string; arcType: string; transformationScore: number }[] = []
  for (const [id, arc] of state.arcs) {
    summaries.push({ characterId: id, arcType: arc.arcType, transformationScore: arc.transformationScore })
  }
  return summaries
}

export function formatEmotionalSummary(state: EmotionalArcState): string {
  let s = "=== Emotional Arc Summary ===" + "\n"
  s += "Characters: " + state.arcs.size + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  return s
}

export function formatEmotionalDashboard(state: EmotionalArcState): string {
  let s = "=== Emotional Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"

  if (state.arcs.size > 0) {
    s += "\n--- Character Arcs ---" + "\n"
    for (const [, arc] of state.arcs) {
      s += "  " + arc.characterId + ": " + arc.arcType + " (transform=" + arc.transformationScore + ")" + "\n"
    }
  }

  return s
}
