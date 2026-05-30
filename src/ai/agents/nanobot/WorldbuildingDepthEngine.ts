export interface LoreEntry {
  entryId: string
  category: string  // 'history' | 'magic' | 'geography' | 'culture' | 'technology'
  name: string
  description: string
  consistencyScore: number  // 0-100
}

export interface WorldbuildingState {
  lore: Map<string, LoreEntry>
  currentChapter: number
  depthScore: number  // 0-100
  consistencyScore: number  // 0-100
}

function createEntryId(): string {
  return 'lore_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function assessConsistency(entry: LoreEntry, existing: LoreEntry[]): number {
  if (existing.length === 0) return 100
  let score = 100
  for (const e of existing) {
    if (e.category === entry.category && e.name === entry.name) {
      score -= 20  // duplicate
    }
    if (e.category === entry.category && e.description.length > 20 && entry.description.length > 20) {
      // Check for contradictions
      const words1 = new Set(entry.description.toLowerCase().split(' ').filter(w => w.length > 4))
      const words2 = new Set(e.description.toLowerCase().split(' ').filter(w => w.length > 4))
      const overlap = [...words1].filter(w => words2.has(w))
      if (overlap.length > 5 && entry.description !== e.description) {
        score -= 5
      }
    }
  }
  return Math.max(0, score)
}

export function createEmptyWorldbuildingState(): WorldbuildingState {
  return { lore: new Map(), currentChapter: 0, depthScore: 0, consistencyScore: 100 }
}

export function addLoreEntry(
  state: WorldbuildingState,
  category: string,
  name: string,
  description: string
): WorldbuildingState {
  const entry: LoreEntry = {
    entryId: createEntryId(),
    category,
    name,
    description,
    consistencyScore: 100,
  }

  const newLore = new Map(state.lore)
  const key = category + ':' + name

  // Check for existing entries in same category for consistency scoring
  const existingInCategory = [...newLore.values()].filter(e => e.category === category)
  entry.consistencyScore = assessConsistency(entry, existingInCategory)

  newLore.set(key, entry)

  // Recalculate scores
  const entries = [...newLore.values()]
  const depthScore = Math.min(100, Math.round((entries.length / 5) * 50 + (entries.reduce((sum, e) => sum + e.description.length, 0) / 500) * 50))
  const avgConsistency = entries.length > 0 ? Math.round(entries.reduce((sum, e) => sum + e.consistencyScore, 0) / entries.length) : 100

  return { ...state, lore: newLore, depthScore, consistencyScore: avgConsistency, currentChapter: Math.max(state.currentChapter, state.currentChapter) }
}

export function getLoreByCategory(state: WorldbuildingState, category: string): LoreEntry[] {
  return [...state.lore.values()].filter(e => e.category === category)
}

export function getLoreEntry(state: WorldbuildingState, category: string, name: string): LoreEntry | null {
  return state.lore.get(category + ':' + name) || null
}

export function formatWorldbuildingSummary(state: WorldbuildingState): string {
  let s = "=== Worldbuilding Summary ===" + "\n"
  s += "Lore Entries: " + state.lore.size + "\n"
  s += "Depth Score: " + state.depthScore + "\n"
  s += "Consistency: " + state.consistencyScore + "\n"
  return s
}

export function formatWorldbuildingDashboard(state: WorldbuildingState): string {
  let s = "=== Worldbuilding Dashboard ===" + "\n"
  s += "Depth Score: " + state.depthScore + " | Consistency: " + state.consistencyScore + "\n"
  s += "Total Lore: " + state.lore.size + " entries" + "\n"

  const categories = [...new Set([...state.lore.values()].map(e => e.category))]
  if (categories.length > 0) {
    s += "\n--- Categories ---" + "\n"
    for (const cat of categories) {
      const count = [...state.lore.values()].filter(e => e.category === cat).length
      s += "  " + cat + ": " + count + "\n"
    }
  }

  return s
}
