/**
 * NarrativeInsightDiscoveryEngine — V513
 * Extracts deep character insights, thematic implications, and symbolic meanings from narrative text.
 * Inspired by: nanobot (distributed mesh) + ruflo (hierarchical decomposition) + generic-agent (autonomous reasoning)
 *
 * This engine processes narrative text to discover:
 * - Character arc insights (motivation shifts, internal conflicts)
 * - Thematic implications (central questions, moral dimensions)
 * - Symbolic patterns (recurring motifs, metaphor networks)
 * - Narrative causation chains (cause-effect relationships)
 */

export type InsightCategory = 'character' | 'theme' | 'symbol' | 'causation' | 'motif' | 'emotional'
export type InsightConfidence = 'low' | 'medium' | 'high'
export type SymbolicType = 'object' | 'action' | 'place' | 'character' | 'event' | 'color' | 'weather'

export interface NarrativeInsight {
  id: string
  category: InsightCategory
  content: string          // The discovered insight text
  sourceExcerpt: string   // Original text that triggered this insight
  position: number        // 0-100 position in narrative
  confidence: InsightConfidence
  significance: number    // 0-100, how important this insight is
  relatedInsights: string[] // IDs of related insights
  chapterRef?: number
  depth: number            // 0-5, how deep/profound the insight is
  tags: string[]
}

export interface SymbolicPattern {
  id: string
  symbol: string
  type: SymbolicType
  occurrences: { excerpt: string, position: number, chapter: number }[]
  meaning: string         // Interpreted meaning in context
  evolution: string        // How the symbol's meaning changes across the narrative
  frequency: number
  interconnectedSymbols: string[] // IDs of related symbols
}

export interface ThematicThread {
  id: string
  theme: string            // Central theme name
  description: string      // What this theme explores
  manifestations: { excerpt: string, position: number, chapter: number }[]
  connectedInsights: string[]
  progressionArc: number[] // Intensity at different story stages (0-100 per act)
  resolutionStatus: 'unresolved' | 'partially_resolved' | 'resolved' | 'subverted'
}

export interface CausationChain {
  id: string
  cause: string            // Event/action that starts the chain
  effects: { event: string, indirect: boolean, chapters: number[] }[]
  complexity: number       // 1-5, how many branching paths
  totalAffectedCharacters: number
  chapters: number[]
}

export interface InsightState {
  insights: Record<string, NarrativeInsight>
  symbols: Record<string, SymbolicPattern>
  themes: Record<string, ThematicThread>
  causationChains: Record<string, CausationChain>
  discoveryQueue: string[] // IDs of insights pending full analysis
  totalAnalyzed: number
  avgDepth: number
  dominantThemes: { theme: string, weight: number }[]
}

export function createEmptyState(): InsightState {
  return {
    insights: {},
    symbols: {},
    themes: {},
    causationChains: {},
    discoveryQueue: [],
    totalAnalyzed: 0,
    avgDepth: 0,
    dominantThemes: []
  }
}

// --- Core Insight Extraction ---

export function addInsight(
  state: InsightState,
  category: InsightCategory,
  content: string,
  sourceExcerpt: string,
  position: number,
  confidence: InsightConfidence,
  significance: number,
  chapterRef?: number,
  depth: number = 1,
  tags: string[] = []
): InsightState {
  const id = `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

  const insight: NarrativeInsight = {
    id,
    category,
    content,
    sourceExcerpt,
    position,
    confidence,
    significance: Math.max(0, Math.min(100, significance)),
    relatedInsights: [],
    chapterRef,
    depth: Math.max(0, Math.min(5, depth)),
    tags
  }

  // Link related insights by finding overlapping themes/tags
  const related = Object.values(state.insights)
    .filter(other => other.id !== id && other.category === category)
    .filter(other => tags.some(t => other.tags.includes(t)) || content.includes(other.content.slice(0, 20)))
    .slice(0, 3)
    .map(i => i.id)

  insight.relatedInsights = related

  // Update avg depth
  const allDepths = [...Object.values(state.insights).map(i => i.depth), insight.depth]
  const avgDepth = allDepths.reduce((s, d) => s + d, 0) / allDepths.length

  return {
    ...state,
    insights: { ...state.insights, [id]: insight },
    totalAnalyzed: state.totalAnalyzed + 1,
    avgDepth: Math.round(avgDepth * 10) / 10,
    discoveryQueue: [...state.discoveryQueue, id]
  }
}

// --- Symbolic Pattern Detection ---

export function addSymbol(
  state: InsightState,
  symbol: string,
  type: SymbolicType,
  excerpt: string,
  position: number,
  chapter: number,
  meaning?: string
): InsightState {
  const existing = Object.values(state.symbols).find(s => s.symbol.toLowerCase() === symbol.toLowerCase())

  if (existing) {
    // Add occurrence
    const newOccurrences = [...existing.occurrences, { excerpt, position, chapter }]
    const frequency = newOccurrences.length

    return {
      ...state,
      symbols: {
        ...state.symbols,
        [existing.id]: { ...existing, occurrences: newOccurrences, frequency }
      }
    }
  }

  const id = `symbol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const pattern: SymbolicPattern = {
    id,
    symbol,
    type,
    occurrences: [{ excerpt, position, chapter }],
    meaning: meaning || `Symbol of ${symbol} (context-dependent)`,
    evolution: 'Initial appearance',
    frequency: 1,
    interconnectedSymbols: []
  }

  return {
    ...state,
    symbols: { ...state.symbols, [id]: pattern }
  }
}

export function linkSymbols(
  state: InsightState,
  symbolId1: string,
  symbolId2: string
): InsightState {
  const s1 = state.symbols[symbolId1]
  const s2 = state.symbols[symbolId2]
  if (!s1 || !s2) return state

  return {
    ...state,
    symbols: {
      ...state.symbols,
      [symbolId1]: { ...s1, interconnectedSymbols: Array.from(new Set([...s1.interconnectedSymbols, symbolId2])) },
      [symbolId2]: { ...s2, interconnectedSymbols: Array.from(new Set([...s2.interconnectedSymbols, symbolId1])) }
    }
  }
}

export function interpretSymbol(
  state: InsightState,
  symbolId: string,
  meaning: string,
  evolution?: string
): InsightState {
  const symbol = state.symbols[symbolId]
  if (!symbol) return state

  return {
    ...state,
    symbols: {
      ...state.symbols,
      [symbolId]: {
        ...symbol,
        meaning,
        evolution: evolution || symbol.evolution
      }
    }
  }
}

// --- Thematic Thread Tracking ---

export function addTheme(
  state: InsightState,
  theme: string,
  description: string,
  excerpt: string,
  position: number,
  chapter: number
): InsightState {
  const existing = Object.values(state.themes).find(t => t.theme.toLowerCase() === theme.toLowerCase())

  if (existing) {
    const newManifestations = [...existing.manifestations, { excerpt, position, chapter }]
    const newProgression = updateProgression(existing.progressionArc, position, chapter)

    return {
      ...state,
      themes: {
        ...state.themes,
        [existing.id]: {
          ...existing,
          manifestations: newManifestations,
          progressionArc: newProgression
        }
      }
    }
  }

  const id = `theme_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const thread: ThematicThread = {
    id,
    theme,
    description,
    manifestations: [{ excerpt, position, chapter }],
    connectedInsights: [],
    progressionArc: [50],
    resolutionStatus: 'unresolved'
  }

  return {
    ...state,
    themes: { ...state.themes, [id]: thread }
  }
}

function updateProgression(existingArc: number[], position: number, chapter: number): number[] {
  // Extend progression to cover new position
  const newArc = [...existingArc]
  const targetLength = Math.max(existingArc.length, chapter + 1)
  while (newArc.length < targetLength) {
    newArc.push(50) // Default intensity
  }
  // Increase intensity at this chapter
  newArc[chapter] = Math.min(100, newArc[chapter] + 10)
  return newArc
}

export function connectInsightToTheme(
  state: InsightState,
  insightId: string,
  themeId: string
): InsightState {
  const theme = state.themes[themeId]
  if (!theme) return state

  return {
    ...state,
    themes: {
      ...state.themes,
      [themeId]: {
        ...theme,
        connectedInsights: Array.from(new Set([...theme.connectedInsights, insightId]))
      }
    }
  }
}

export function resolveTheme(
  state: InsightState,
  themeId: string,
  status: ThematicThread['resolutionStatus']
): InsightState {
  const theme = state.themes[themeId]
  if (!theme) return state

  return {
    ...state,
    themes: { ...state.themes, [themeId]: { ...theme, resolutionStatus: status } }
  }
}

// --- Causation Chain Analysis ---

export function addCausationChain(
  state: InsightState,
  cause: string,
  firstEffect: string,
  chapter: number,
  indirect: boolean = false
): InsightState {
  const id = `chain_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const chain: CausationChain = {
    id,
    cause,
    effects: [{ event: firstEffect, indirect, chapters: [chapter] }],
    complexity: 1,
    totalAffectedCharacters: 1,
    chapters: [chapter]
  }

  return {
    ...state,
    causationChains: { ...state.causationChains, [id]: chain }
  }
}

export function extendCausationChain(
  state: InsightState,
  chainId: string,
  newEffect: string,
  chapter: number,
  indirect: boolean = false
): InsightState {
  const chain = state.causationChains[chainId]
  if (!chain) return state

  const existingEffect = chain.effects.find(e => e.event === newEffect)
  let newEffects
  if (existingEffect) {
    newEffects = chain.effects.map(e =>
      e.event === newEffect
        ? { ...e, chapters: Array.from(new Set([...e.chapters, chapter])) }
        : e
    )
  } else {
    newEffects = [...chain.effects, { event: newEffect, indirect, chapters: [chapter] }]
  }

  return {
    ...state,
    causationChains: {
      ...state.causationChains,
      [chainId]: {
        ...chain,
        effects: newEffects,
        complexity: chain.complexity + (existingEffect ? 0 : 1),
        chapters: Array.from(new Set([...chain.chapters, chapter]))
      }
    }
  }
}

export function markCharacterAffected(
  state: InsightState,
  chainId: string,
  count: number = 1
): InsightState {
  const chain = state.causationChains[chainId]
  if (!chain) return state

  return {
    ...state,
    causationChains: {
      ...state.causationChains,
      [chainId]: {
        ...chain,
        totalAffectedCharacters: chain.totalAffectedCharacters + count
      }
    }
  }
}

// --- Query Functions ---

export function getInsightsByCategory(state: InsightState, category: InsightCategory): NarrativeInsight[] {
  return Object.values(state.insights)
    .filter(i => i.category === category)
    .sort((a, b) => b.significance - a.significance)
}

export function getSignificantInsights(state: InsightState, threshold: number = 70): NarrativeInsight[] {
  return Object.values(state.insights)
    .filter(i => i.significance >= threshold)
    .sort((a, b) => b.depth - a.depth)
}

export function getSymbolPatterns(state: InsightState, minFrequency: number = 2): SymbolicPattern[] {
  return Object.values(state.symbols)
    .filter(s => s.frequency >= minFrequency)
    .sort((a, b) => b.frequency - a.frequency)
}

export function getThemeSummary(state: InsightState): { theme: string, manifestationCount: number, status: string }[] {
  return Object.values(state.themes)
    .map(t => ({ theme: t.theme, manifestationCount: t.manifestations.length, status: t.resolutionStatus }))
    .sort((a, b) => b.manifestationCount - a.manifestationCount)
}

export function getCausationChains(state: InsightState, minComplexity: number = 2): CausationChain[] {
  return Object.values(state.causationChains)
    .filter(c => c.complexity >= minComplexity)
    .sort((a, b) => b.complexity - a.complexity)
}

export function getDeepInsights(state: InsightState, minDepth: number = 3): NarrativeInsight[] {
  return Object.values(state.insights)
    .filter(i => i.depth >= minDepth)
    .sort((a, b) => b.significance - a.significance)
}

export function getInsightSummary(state: InsightState): {
  total: number,
  byCategory: Record<InsightCategory, number>,
  avgDepth: number,
  highSignificance: number,
  dominantThemes: { theme: string, weight: number }[]
} {
  const allInsights = Object.values(state.insights)
  const byCategory = {} as Record<InsightCategory, number>
  for (const cat of ['character', 'theme', 'symbol', 'causation', 'motif', 'emotional'] as InsightCategory[]) {
    byCategory[cat] = allInsights.filter(i => i.category === cat).length
  }

  return {
    total: allInsights.length,
    byCategory,
    avgDepth: state.avgDepth,
    highSignificance: allInsights.filter(i => i.significance >= 80).length,
    dominantThemes: state.dominantThemes.slice(0, 5)
  }
}

export function updateDominantThemes(state: InsightState): InsightState {
  const themeWeights: Record<string, number> = {}
  for (const theme of Object.values(state.themes)) {
    themeWeights[theme.theme] = theme.manifestations.length * 10 + theme.progressionArc.reduce((s, v) => s + v, 0) / (theme.progressionArc.length || 1)
  }

  const sorted = Object.entries(themeWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, weight]) => ({ theme, weight: Math.round(weight) }))

  return { ...state, dominantThemes: sorted }
}