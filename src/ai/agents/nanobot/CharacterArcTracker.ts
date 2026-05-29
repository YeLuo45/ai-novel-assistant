// CharacterArcTracker - V258: Character Development Arc Tracking
// Inspired by: ruflo (hierarchical decomposition) + thunderbolt (pipeline)

export type ArcPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution'

export interface CharacterArc {
  arcId: string
  characterId: string
  phase: ArcPhase
  chapterStart: number
  chapterEnd: number | null
  intensity: number  // 0-100
  transformation: number  // 0-100 how much character changed
  milestone: string
}

export interface CharacterArcState {
  arcs: CharacterArc[]
  currentChapter: number
  characterCount: number
  averageTransformation: number
}

function createArcId(): string {
  return 'arc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyArcState(): CharacterArcState {
  return { arcs: [], currentChapter: 0, characterCount: 0, averageTransformation: 0 }
}

export function startArc(
  state: CharacterArcState,
  characterId: string,
  chapter: number,
  milestone: string
): CharacterArcState {
  const arc: CharacterArc = {
    arcId: createArcId(),
    characterId,
    phase: 'setup',
    chapterStart: chapter,
    chapterEnd: null,
    intensity: 30,
    transformation: 0,
    milestone,
  }
  return {
    ...state,
    arcs: [...state.arcs, arc],
    currentChapter: chapter,
    characterCount: state.characterCount + 1,
  }
}

export function evolveArc(
  state: CharacterArcState,
  arcId: string,
  phase: ArcPhase,
  intensity: number
): CharacterArcState {
  return {
    ...state,
    arcs: state.arcs.map(a =>
      a.arcId === arcId ? { ...a, phase, intensity } : a
    ),
  }
}

export function completeArc(
  state: CharacterArcState,
  arcId: string,
  transformation: number
): CharacterArcState {
  const completed = state.arcs.map(a =>
    a.arcId === arcId ? { ...a, chapterEnd: state.currentChapter, transformation } : a
  )
  const avgTrans = completed.reduce((s, a) => s + a.transformation, 0) / completed.length
  return { ...state, arcs: completed, averageTransformation: Math.round(avgTrans) }
}

export function getArcsByCharacter(state: CharacterArcState, characterId: string): CharacterArc[] {
  return state.arcs.filter(a => a.characterId === characterId)
}

export function getActiveArcs(state: CharacterArcState): CharacterArc[] {
  return state.arcs.filter(a => a.chapterEnd === null)
}

export function formatArcSummary(state: CharacterArcState): string {
  let s = "=== Character Arc Summary ===
"
  s += "Chapter: " + state.currentChapter + " | Characters: " + state.characterCount + "\n"
  s += "Active Arcs: " + getActiveArcs(state).length + " | Avg Transformation: " + state.averageTransformation + "\n"
  return s
}

export function formatArcDashboard(state: CharacterArcState): string {
  let s = "=== Arc Dashboard ===
"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Total Arcs: " + state.arcs.length + " | Avg Transformation: " + state.averageTransformation + "\n"
  if (state.arcs.length > 0) {
    s += "\n--- Recent Arcs ---\n"
    for (const a of state.arcs.slice(-3)) {
      s += "  [" + a.characterId + "] " + a.phase + " Ch" + a.chapterStart + "\n"
    }
  }
  return s
}
