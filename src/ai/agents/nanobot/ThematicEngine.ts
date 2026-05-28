/**
 * ThematicEngine - V164
 * Theme Detection & Symbolic Motif Tracking Engine
 * 
 * Design references:
 * - thunderbolt: pipeline feedback loops for continuous theme monitoring
 * - ruflo: hierarchical decomposition (theme → motif → symbol → instance)
 * - generic-agent: autonomous goal-driven theme exploration and discovery
 * - nanobot: distributed mesh for cross-chapter thematic consistency
 * - chatdev: multi-perspective theme interpretation validation
 */

export type ThematicLayer = 'surface' | 'pattern' | 'meaning' | 'philosophical'
export type MotifType = 'symbolic' | 'narrative' | 'visual' | 'linguistic' | 'structural'
export type ConsistencyStatus = 'consistent' | 'developing' | 'conflicting' | 'faded'

export interface Theme {
  themeId: string
  name: string
  weight: number  // 0-100, importance relative to other themes
  firstAppearance: number  // chapter number
  lastAppearance: number
  layers: ThematicLayer[]
  emotionalValence: number  // -100 (dark) to +100 (light)
  keyMotifs: string[]  // motif IDs
}

export interface SymbolicMotif {
  motifId: string
  name: string
  type: MotifType
  firstChapter: number
  occurrences: number
  associatedThemes: string[]
  consistencyHistory: ConsistencyStatus[]
  semanticField: string[]  // related concept words
  manifestationForms: string[]  // physical forms this motif takes
}

export interface ThematicState {
  themes: Map<string, Theme>
  motifs: Map<string, SymbolicMotif>
  currentChapter: number
  thematicTension: number  // 0-100, amount of unresolved thematic conflict
  meaningLayers: Map<number, string>  // chapter → meaning summary
  dominantTheme: string | null
  thematicArc: Array<{ chapter: number; dominantTheme: string; tensionLevel: number }>
}

export function createEmptyThematicState(): ThematicState {
  return {
    themes: new Map(),
    motifs: new Map(),
    currentChapter: 0,
    thematicTension: 0,
    meaningLayers: new Map(),
    dominantTheme: null,
    thematicArc: [],
  };
}

// Theme Management
export function registerTheme(state: ThematicState, name: string, weight: number, emotionalValence: number): ThematicState {
  const themeId = 'theme_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
  const firstAppearance = state.currentChapter || 1
  const theme: Theme = {
    themeId,
    name,
    weight,
    firstAppearance,
    lastAppearance: firstAppearance,
    layers: ['surface'],
    emotionalValence,
    keyMotifs: [],
  };
  const newThemes = new Map(state.themes)
  newThemes.set(themeId, theme)
  return {
    ...state,
    themes: newThemes,
    dominantTheme: state.dominantTheme || themeId,
  };
}

export function updateTheme(state: ThematicState, themeId: string, updates: Partial<Theme>): ThematicState {
  const theme = state.themes.get(themeId)
  if (!theme) return state
  const newThemes = new Map(state.themes)
  newThemes.set(themeId, { ...theme, ...updates, lastAppearance: state.currentChapter })
  return { ...state, themes: newThemes }
}

export function findThemeByName(state: ThematicState, name: string): Theme | undefined {
  for (const t of state.themes.values()) {
    if (t.name.toLowerCase() === name.toLowerCase()) return t
  }
  return undefined
}

// Motif Management
export function registerMotif(state: ThematicState, name: string, motifType: MotifType, semanticField: string[], manifestationForms: string[]): ThematicState {
  const motifId = 'motif_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
  const motif: SymbolicMotif = {
    motifId,
    name,
    type: motifType,
    firstChapter: state.currentChapter || 1,
    occurrences: 0,
    associatedThemes: [],
    consistencyHistory: [],
    semanticField,
    manifestationForms,
  }
  const newMotifs = new Map(state.motifs)
  newMotifs.set(motifId, motif)
  return { ...state, motifs: newMotifs }
}

export function recordMotifOccurrence(state: ThematicState, motifId: string, themeId?: string): ThematicState {
  const motif = state.motifs.get(motifId)
  if (!motif) return state
  
  const newMotifs = new Map(state.motifs)
  const newThemes = new Map(state.themes)
  
  const updatedMotif: SymbolicMotif = {
    ...motif,
    occurrences: motif.occurrences + 1,
    consistencyHistory: [...motif.consistencyHistory.slice(-9), 'consistent'],
  }
  newMotifs.set(motifId, updatedMotif)
  
  // Link motif to theme if provided
  if (themeId) {
    const theme = newThemes.get(themeId)
    if (theme && !theme.keyMotifs.includes(motifId)) {
      newThemes.set(themeId, {
        ...theme,
        keyMotifs: [...theme.keyMotifs, motifId],
      })
    }
  }
  
  return { ...state, motifs: newMotifs, themes: newThemes }
}

// Theme Detection (keyword-based analysis)
export function detectThemes(text: string, state: ThematicState): string[] {
  const textLower = text.toLowerCase()
  const detectedThemes: string[] = []
  
  const themeKeywords: Record<string, string[]> = {
    'love': ['love', 'heart', 'passion', 'devotion', 'affection', 'romance', 'desire', 'longing'],
    'death': ['death', 'die', 'dead', 'kill', 'murder', 'end', 'fate', 'mortal', 'grave'],
    'power': ['power', 'control', 'rule', ' authority', 'dominate', 'strength', 'force', 'might'],
    'identity': ['self', 'identity', 'who am i', 'becoming', 'transform', 'change', '真实自我'],
    'redemption': ['redemption', 'forgive', 'sin', 'guilt', 'atone', ' salvation', 'absolve'],
    'nature': ['nature', 'forest', 'river', 'mountain', 'wild', 'earth', 'wind', 'fire'],
    'war': ['war', 'battle', 'fight', 'conflict', 'enemy', 'soldier', 'weapon', 'blood'],
    'freedom': ['freedom', 'free', 'escape', 'break free', 'liberate', 'independence'],
  }
  
  for (const [themeName, keywords] of Object.entries(themeKeywords)) {
    const matches = keywords.filter(k => textLower.includes(k)).length
    if (matches >= 2) {
      detectedThemes.push(themeName)
    }
  }
  
  return detectedThemes
}

// Motif Detection
export function detectMotifs(text: string, state: ThematicState): string[] {
  const textLower = text.toLowerCase()
  const detectedMotifIds: string[] = []
  
  for (const motif of state.motifs.values()) {
    const semanticMatches = motif.semanticField.filter(term => textLower.includes(term.toLowerCase())).length
    const formMatches = motif.manifestationForms.filter(form => textLower.includes(form.toLowerCase())).length
    
    if (semanticMatches >= 2 || formMatches >= 1) {
      detectedMotifIds.push(motif.motifId)
    }
  }
  
  return detectedMotifIds
}

// Chapter Analysis
export function analyzeChapter(state: ThematicState, chapter: number, text: string): ThematicState {
  let newState = { ...state, currentChapter: chapter }
  
  // Detect themes
  const detectedThemeNames = detectThemes(text, newState)
  const newThemes = new Map(newState.themes)
  const newMotifs = new Map(newState.motifs)
  
  for (const themeName of detectedThemeNames) {
    const existing = findThemeByName(newState, themeName)
    if (existing) {
      newThemes.set(existing.themeId, {
        ...existing,
        weight: Math.min(100, existing.weight + 5),
        lastAppearance: chapter,
      })
    } else {
      const themeId = 'theme_' + themeName + '_' + Date.now()
      const theme: Theme = {
        themeId,
        name: themeName,
        weight: 40,
        firstAppearance: chapter,
        lastAppearance: chapter,
        layers: ['surface'],
        emotionalValence: themeName === 'death' ? -60 : themeName === 'love' ? 60 : 0,
        keyMotifs: [],
      }
      newThemes.set(themeId, theme)
    }
  }
  
  // Detect motifs
  const detectedMotifIds = detectMotifs(text, newState)
  for (const motifId of detectedMotifIds) {
    const motif = newMotifs.get(motifId)
    if (motif) {
      newMotifs.set(motifId, {
        ...motif,
        occurrences: motif.occurrences + 1,
        consistencyHistory: [...motif.consistencyHistory.slice(-9), 'consistent'],
      })
    }
  }
  
  // Update dominant theme
  let dominantThemeId = newState.dominantTheme
  if (newThemes.size > 0) {
    let maxWeight = 0
    for (const t of newThemes.values()) {
      if (t.weight > maxWeight) {
        maxWeight = t.weight
        dominantThemeId = t.themeId
      }
    }
  }
  
  // Calculate thematic tension (unresolved themes / total themes)
  const unresolvedCount = Array.from(newThemes.values()).filter(t => t.lastAppearance < chapter - 2).length
  const thematicTension = newThemes.size > 0 ? Math.round((unresolvedCount / newThemes.size) * 100) : 0
  
  // Record arc
  const dominantTheme = dominantThemeId ? newThemes.get(dominantThemeId)?.name || '' : ''
  const arcEntry = { chapter, dominantTheme, tensionLevel: 100 - thematicTension }
  const thematicArc = [...newState.thematicArc.slice(-49), arcEntry]
  
  return {
    ...newState,
    themes: newThemes,
    motifs: newMotifs,
    dominantTheme: dominantThemeId,
    thematicTension,
    thematicArc,
  }
}

// Consistency Validation
export function validateThematicConsistency(state: ThematicState): { valid: boolean; conflicts: string[] } {
  const conflicts: string[] = []
  
  // Check for conflicting emotional valences in themes that appear in same chapter
  const themeList = Array.from(state.themes.values())
  for (let i = 0; i < themeList.length; i++) {
    for (let j = i + 1; j < themeList.length; j++) {
      const t1 = themeList[i]
      const t2 = themeList[j]
      // If themes have opposite valences and close temporal proximity
      if (Math.abs(t1.emotionalValence - t2.emotionalValence) > 120 &&
          Math.abs(t1.lastAppearance - t2.lastAppearance) <= 3) {
        conflicts.push(`${t1.name} (${t1.emotionalValence}) conflicts with ${t2.name} (${t2.emotionalValence})`)
      }
    }
  }
  
  // Check motif consistency history
  for (const motif of state.motifs.values()) {
    const recent = motif.consistencyHistory.slice(-5)
    const fadedCount = recent.filter(s => s === 'faded').length
    if (fadedCount >= 3) {
      conflicts.push(`Motif "${motif.name}" has faded (${motif.occurrences} total occurrences)`)
    }
  }
  
  return { valid: conflicts.length === 0, conflicts }
}

// Formatters
export function formatThematicSummary(state: ThematicState): string {
  let s = '=== Thematic Architecture ===\n'
  s += 'Current Chapter: ' + state.currentChapter + '\n'
  s += 'Active Themes: ' + state.themes.size + '\n'
  s += 'Active Motifs: ' + state.motifs.size + '\n'
  s += 'Thematic Tension: ' + state.thematicTension + '%\n'
  
  if (state.dominantTheme) {
    const dt = state.themes.get(state.dominantTheme)
    if (dt) s += 'Dominant Theme: ' + dt.name + ' (weight: ' + dt.weight + ')\n'
  }
  
  if (state.themes.size > 0) {
    s += '\n--- Theme Weights ---\n'
    const sorted = Array.from(state.themes.values()).sort((a, b) => b.weight - a.weight)
    for (const t of sorted.slice(0, 5)) {
      s += '  ' + t.name + ': ' + t.weight + ' (valence: ' + t.emotionalValence + ')\n'
    }
  }
  
  if (state.motifs.size > 0) {
    s += '\n--- Motif Occurrences ---\n'
    const sorted = Array.from(state.motifs.values()).sort((a, b) => b.occurrences - a.occurrences)
    for (const m of sorted.slice(0, 5)) {
      s += '  ' + m.name + ': ' + m.occurrences + ' occurrences\n'
    }
  }
  
  return s
}

export function formatThematicDashboard(state: ThematicState): string {
  let s = '=== Thematic Architecture Dashboard ===\n'
  s += 'Chapters Analyzed: ' + state.currentChapter + '\n'
  
  if (state.thematicArc.length > 0) {
    s += '\n--- Thematic Arc ---\n'
    for (const entry of state.thematicArc.slice(-10)) {
      s += '  Chapter ' + entry.chapter + ': ' + entry.dominantTheme + ' (tension: ' + entry.tensionLevel + '%)\n'
    }
  }
  
  if (state.meaningLayers.size > 0) {
    s += '\n--- Meaning Layers ---\n'
    for (const [ch, summary] of state.meaningLayers) {
      s += '  Ch ' + ch + ': ' + summary.substring(0, 60) + '\n'
    }
  }
  
  const consistency = validateThematicConsistency(state)
  s += '\n--- Consistency: ' + (consistency.valid ? 'VALID' : 'CONFLICTS DETECTED') + ' ---\n'
  if (!consistency.valid) {
    for (const c of consistency.conflicts) s += '  ✗ ' + c + '\n'
  }
  
  return s
}
