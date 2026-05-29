// CharacterMotivationEngine - V278: Character motivation deep analysis
// Inspired by: ruflo (hierarchical decomposition) + chatdev (role specialization)

export interface MotivationData {
  type: 'surface' | 'hidden'
  name: string
  intensity: number  // 0-100
  linkedTo: number  // index in chain array
}

export interface CharacterMotivationState {
  characters: {
    [characterId: string]: {
      surfaceMotivation: MotivationData[]
      hiddenMotivation: MotivationData[]
      chain: Array<{ from: number; to: number; label: string }>
    }
  }
}

export function createEmptyMotivationState(): CharacterMotivationState {
  return { characters: {} }
}

export function addSurfaceMotivation(
  state: CharacterMotivationState,
  characterId: string,
  motivationName: string,
  intensity: number
): CharacterMotivationState {
  const chars = { ...state.characters }
  if (!chars[characterId]) {
    chars[characterId] = { surfaceMotivation: [], hiddenMotivation: [], chain: [] }
  }
  const char = { ...chars[characterId] }
  char.surfaceMotivation = [
    ...char.surfaceMotivation,
    { type: 'surface', name: motivationName, intensity, linkedTo: -1 }
  ]
  chars[characterId] = char
  return { characters: chars }
}

export function addHiddenMotivation(
  state: CharacterMotivationState,
  characterId: string,
  motivationName: string,
  intensity: number
): CharacterMotivationState {
  const chars = { ...state.characters }
  if (!chars[characterId]) {
    chars[characterId] = { surfaceMotivation: [], hiddenMotivation: [], chain: [] }
  }
  const char = { ...chars[characterId] }
  char.hiddenMotivation = [
    ...char.hiddenMotivation,
    { type: 'hidden', name: motivationName, intensity, linkedTo: -1 }
  ]
  chars[characterId] = char
  return { characters: chars }
}

export function connectMotivationChain(
  state: CharacterMotivationState,
  characterId: string,
  surfaceIdx: number,
  hiddenIdx: number
): CharacterMotivationState {
  const chars = { ...state.characters }
  if (!chars[characterId]) return state
  const char = { ...chars[characterId] }
  if (surfaceIdx >= 0 && surfaceIdx < char.surfaceMotivation.length) {
    char.surfaceMotivation = char.surfaceMotivation.map((m, i) =>
      i === surfaceIdx ? { ...m, linkedTo: hiddenIdx } : m
    )
  }
  char.chain = [...char.chain, { from: surfaceIdx, to: hiddenIdx, label: 'drives' }]
  chars[characterId] = char
  return { characters: chars }
}

export function getCharacterMotivation(
  state: CharacterMotivationState,
  characterId: string
): { surfaceMotivation: MotivationData[], hiddenMotivation: MotivationData[], chain: Array<{ from: number; to: number; label: string }> } | null {
  const char = state.characters[characterId]
  if (!char) return null
  return { surfaceMotivation: char.surfaceMotivation, hiddenMotivation: char.hiddenMotivation, chain: char.chain }
}

export function getDominantMotivation(state: CharacterMotivationState, characterId: string): string | null {
  const char = state.characters[characterId]
  if (!char) return null
  const all = [...char.surfaceMotivation, ...char.hiddenMotivation]
  if (all.length === 0) return null
  return all.reduce((max, m) => m.intensity > (max?.intensity || 0) ? m : max, all[0]).name
}

export function formatMotivationSummary(state: CharacterMotivationState): string {
  const charKeys = Object.keys(state.characters)
  return "=== Character Motivation Summary ===\nCharacters: " + charKeys.length + "\n"
}

export function formatMotivationDashboard(state: CharacterMotivationState): string {
  let s = "=== Character Motivation Dashboard ===\n"
  for (const [id, char] of Object.entries(state.characters)) {
    s += id + ": surface=" + char.surfaceMotivation.length + " hidden=" + char.hiddenMotivation.length + "\n"
  }
  return s || "No characters tracked\n"
}
