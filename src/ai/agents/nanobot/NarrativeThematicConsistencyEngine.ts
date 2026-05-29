// NarrativeThematicConsistencyEngine - V301: Thematic consistency tracking & motif validation
// Inspired by: nanobot (mesh consistency) + chatdev (pattern recognition)

export type ThematicElement = 'motif' | 'symbol' | 'allegory' | 'leitmotif' | 'irony'
export type ConsistencyStatus = 'consistent' | 'inconsistent' | 'evolving' | 'degrading'

export interface ThematicEntry {
  id: string
  elementType: ThematicElement
  name: string
  firstAppearance: number  // chapter
  occurrences: number
  chapters: number[]       // chapters where it appears
  consistencyScore: number // 0-100
  evolutionTrack: Array<{chapter: number; meaning: string; context: string}>
}

export interface ThematicState {
  entries: ThematicEntry[]
  dominantThemes: string[]
  thematicThreads: Array<{theme: string; chapters: number[]; strength: number}>
  currentChapter: number
}

export function createEmptyThematicState(): ThematicState {
  return {
    entries: [],
    dominantThemes: [],
    thematicThreads: [],
    currentChapter: 0,
  }
}

function createEntryId(): string {
  return 'theme_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function detectElementType(text: string): ThematicElement {
  const lower = text.toLowerCase()
  if (lower.includes('symbol') || lower.includes('icon')) return 'symbol'
  if (lower.includes('allegor') || lower.includes('metaphor')) return 'allegory'
  if (lower.includes('recurring') || lower.includes('pattern')) return 'motif'
  if (lower.includes('irony') || lower.includes('ironic')) return 'irony'
  return 'leitmotif'
}

function computeConsistencyScore(entry: ThematicEntry): number {
  if (entry.chapters.length < 2) return 100
  const gaps: number[] = []
  for (let i = 1; i < entry.chapters.length; i++) {
    gaps.push(entry.chapters[i] - entry.chapters[i - 1])
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const variance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length
  
  if (avgGap <= 3 && variance <= 2) return 95
  if (avgGap <= 5) return 80
  if (avgGap <= 8) return 60
  return Math.max(30, 100 - avgGap * 5)
}

export function registerThematicElement(
  state: ThematicState,
  chapter: number,
  elementType: ThematicElement,
  name: string,
  meaning: string,
  context: string
): ThematicState {
  const existing = state.entries.find(e => e.name === name && e.elementType === elementType)
  
  let entries: ThematicEntry[]
  if (existing) {
    entries = state.entries.map(e => {
      if (e.name === name && e.elementType === elementType) {
        const chapters = [...e.chapters, chapter]
        const evolutionTrack = [...e.evolutionTrack, { chapter, meaning, context }]
        const consistencyScore = computeConsistencyScore({ ...e, chapters, evolutionTrack })
        return { ...e, occurrences: e.occurrences + 1, chapters, evolutionTrack, consistencyScore }
      }
      return e
    })
  } else {
    const newEntry: ThematicEntry = {
      id: createEntryId(),
      elementType,
      name,
      firstAppearance: chapter,
      occurrences: 1,
      chapters: [chapter],
      consistencyScore: 100,
      evolutionTrack: [{ chapter, meaning, context }],
    }
    entries = [...state.entries, newEntry]
  }

  const dominantThemes = entries
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 3)
    .map(e => e.name)

  const thematicThreads = entries.map(e => ({
    theme: e.name,
    chapters: e.chapters,
    strength: e.consistencyScore * e.occurrences / 100,
  })).sort((a, b) => b.strength - a.strength)

  return {
    entries,
    dominantThemes,
    thematicThreads: thematicThreads.slice(0, 5),
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

export function getThematicElement(state: ThematicState, name: string): ThematicEntry | null {
  return state.entries.find(e => e.name === name) || null
}

export function getConsistencyStatus(state: ThematicState, name: string): ConsistencyStatus {
  const entry = getThematicElement(state, name)
  if (!entry) return 'consistent'
  if (entry.consistencyScore >= 80) return 'consistent'
  if (entry.evolutionTrack.length > 3) return 'evolving'
  if (entry.consistencyScore < 50) return 'degrading'
  return 'inconsistent'
}

export function getThematicDensity(state: ThematicState, chapter: number): number {
  const count = state.entries.filter(e => e.chapters.includes(chapter)).length
  return Math.round(count / Math.max(1, state.entries.length) * 100)
}

export function formatThematicSummary(state: ThematicState): string {
  let s = "=== Thematic Consistency Summary ===\n"
  s += "Elements: " + state.entries.length + " | Dominant: " + state.dominantThemes.join(', ') + "\n"
  s += "Thematic Threads: " + state.thematicThreads.length + "\n"
  return s
}

export function formatThematicDashboard(state: ThematicState): string {
  let s = "=== Thematic Consistency Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + " | Elements: " + state.entries.length + "\n"
  s += "Dominant Themes: " + state.dominantThemes.join(', ') + "\n"

  if (state.entries.length > 0) {
    s += "\n--- Thematic Elements ---\n"
    for (const entry of state.entries.slice(0, 5)) {
      const status = getConsistencyStatus(state, entry.name)
      s += "  " + entry.name + " [" + entry.elementType + "]: " + entry.occurrences + "x score=" + entry.consistencyScore + " (" + status + ")\n"
    }
  }

  if (state.thematicThreads.length > 0) {
    s += "\n--- Thematic Threads ---\n"
    for (const thread of state.thematicThreads.slice(0, 3)) {
      s += "  " + thread.theme + ": strength=" + thread.strength.toFixed(1) + " chapters=" + thread.chapters.join(',') + "\n"
    }
  }
  return s
}