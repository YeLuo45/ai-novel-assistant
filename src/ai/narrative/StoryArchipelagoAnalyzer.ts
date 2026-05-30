/**
 * StoryArchipelagoAnalyzer Types - V85
 * Story Universe Analysis: Interconnected Subplot Map
 * 
 * Analyzes the story universe as an archipelago of interconnected islands (subplots),
 * where each subplot is an island connected by bridges (shared characters, events, themes).
 * Inspired by nanobot's distributed agent mesh and ruflo's hierarchical decomposition.
 * 
 * Key concepts:
 * - SubplotIsland: A self-contained story thread
 * - Bridge: Shared elements connecting islands (characters, locations, events, themes)
 * - ArchipelagoMap: Complete universe showing all islands and their connections
 * - SeepageEffect: When conflict/mystery from one island affects another
 */

import type { SkillNode } from '../evolution/SkillGraph'

// ===============================================================================
// Core Types
// ===============================================================================

export type SubplotType = 'main' | 'sub' | 'filler' | 'backstory' | 'foreshadowing'

export interface SubplotIsland {
  id: string
  name: string
  type: SubplotType
  importance: number             // 0-1: how central to main plot
  chapterRange: [number, number] // start and end chapters
  primaryCharacters: string[]    // Characters central to this subplot
  themes: string[]               // Thematic elements
  tensionLevel: number           // 0-1 current tension
  resolutionLevel: number        // 0-1 how resolved this subplot is
  connections: string[]          // IDs of connected SubplotIslands
  bridges: Bridge[]              // Connections to other islands
}

export interface Bridge {
  type: 'character' | 'location' | 'event' | 'theme' | 'item' | 'revelation'
  targetIslandId: string
  sharedElements: string[]        // e.g., character names, location names
  strength: number               // 0-1: how strongly connected
  description: string
  bidirectional: boolean         // Does the connection go both ways?
}

export interface ArchipelagoMap {
  islands: SubplotIsland[]
  bridges: Bridge[]
  totalChapters: number
  mainPlotId: string             // ID of the main plot island
  orphanedIslands: string[]      // Islands with no connections to main plot
  parallelSubplots: string[][]   // Groups of subplots that run simultaneously
}

export interface SeepageEffect {
  sourceIslandId: string
  targetIslandId: string
  effectType: 'tension_ripple' | 'revelation_leak' | 'character_migration' | 'theme_infection'
  magnitude: number              // 0-1 how strong the effect
  description: string
  chapter: number
}

// ===============================================================================
// Analysis Types
// ===============================================================================

export interface ArchipelagoAnalysis {
  map: ArchipelagoMap
  complexityScore: number         // 0-100 overall complexity
  mainPlotIndependence: number   // 0-1 how independent main plot is from subplots
  subplotDensity: number          // subplots per chapter
  overConnectedIslands: string[]  // Islands with too many connections
  underConnectedIslands: string[] // Islands with too few connections
  seepageEffects: SeepageEffect[]
  recommendations: string[]
}

export interface SubplotContribution {
  islandId: string
  name: string
  contribution: number            // 0-1 how much it adds to main plot
  dependency: number             // 0-1 how much it depends on main plot
  healthScore: number            // 0-100 overall subplot health
}

export interface IslandHealthReport {
  islandId: string
  healthScore: number            // 0-100
  tensionBalance: number         // 0-1
  resolutionBalance: number      // 0-1
  connectionHealth: number       // 0-1
  issues: string[]
  suggestions: string[]
}

// ===============================================================================
// Configuration
// ===============================================================================

export interface ArchipelagoConfig {
  maxConnectionsPerIsland: number     // Warn if more (risk of convolution)
  minConnectionsPerIsland: number    // Warn if less (risk of orphan)
  minIslandImportance: number       // Minimum importance to be considered significant
  tensionWarningThreshold: number    // 0-1 above which tension is warned
  maxParallelSubplots: number        // Maximum subplots that should run in parallel
}

// ===============================================================================
// Factory Functions
// ===============================================================================

export const DEFAULT_ARCHIPELAGO_CONFIG: ArchipelagoConfig = {
  maxConnectionsPerIsland: 5,
  minConnectionsPerIsland: 1,
  minIslandImportance: 0.2,
  tensionWarningThreshold: 0.8,
  maxParallelSubplots: 4
}

/**
 * Create a new subplot island
 */
export function createSubplotIsland(
  id: string,
  name: string,
  type: SubplotType,
  chapterRange: [number, number],
  primaryCharacters: string[] = []
): SubplotIsland {
  return {
    id,
    name,
    type,
    importance: type === 'main' ? 1.0 : type === 'sub' ? 0.7 : 0.4,
    chapterRange,
    primaryCharacters,
    themes: [],
    tensionLevel: 0.3,
    resolutionLevel: 0.0,
    connections: [],
    bridges: []
  }
}

/**
 * Add a bridge between two islands
 */
export function addBridge(
  island: SubplotIsland,
  bridge: Omit<Bridge, 'targetIslandId'>
): SubplotIsland {
  const newBridge: Bridge = { ...bridge, targetIslandId: '' }
  return {
    ...island,
    bridges: [...island.bridges, newBridge],
    connections: [...island.connections]
  }
}

/**
 * Calculate overall archipelago complexity
 */
export function calculateComplexity(map: ArchipelagoMap): number {
  const islandCount = map.islands.length
  const bridgeCount = map.bridges.length
  const avgConnections = islandCount > 0 ? bridgeCount / islandCount : 0
  const connectionVariance = calculateConnectionVariance(map.islands)
  const chapterSpan = map.totalChapters || 1

  // Complexity increases with islands, connections, and variance
  const baseComplexity = Math.min(100, islandCount * 5 + bridgeCount * 2)
  const varianceBonus = Math.min(20, connectionVariance * 10)
  const spanBonus = Math.min(20, chapterSpan * 0.5)

  return Math.min(100, Math.round(baseComplexity + varianceBonus + spanBonus))
}

function calculateConnectionVariance(islands: SubplotIsland[]): number {
  if (islands.length < 2) return 0
  const connections = islands.map(i => i.connections.length)
  const mean = connections.reduce((a, b) => a + b, 0) / connections.length
  const variance = connections.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / connections.length
  return Math.sqrt(variance)
}

/**
 * Detect seepage effects between islands
 */
export function detectSeepageEffects(map: ArchipelagoMap): SeepageEffect[] {
  const effects: SeepageEffect[] = []

  for (const bridge of map.bridges) {
    if (bridge.type === 'event' && bridge.strength > 0.6) {
      // High-strength event bridges cause tension ripples
      effects.push({
        sourceIslandId: '',  // Would be set by caller
        targetIslandId: bridge.targetIslandId,
        effectType: 'tension_ripple',
        magnitude: bridge.strength,
        description: `Event bridge "${bridge.description}" creates tension spillover`,
        chapter: 0  // Would be derived from chapter ranges
      })
    }

    if (bridge.type === 'revelation' && bridge.strength > 0.5) {
      // Revelation bridges cause information seepage
      effects.push({
        sourceIslandId: '',
        targetIslandId: bridge.targetIslandId,
        effectType: 'revelation_leak',
        magnitude: bridge.strength,
        description: `Revelation shared via ${bridge.sharedElements.join(', ')}`,
        chapter: 0
      })
    }

    if (bridge.type === 'character' && bridge.strength > 0.7) {
      // Strong character bridges cause character migration
      effects.push({
        sourceIslandId: '',
        targetIslandId: bridge.targetIslandId,
        effectType: 'character_migration',
        magnitude: bridge.strength,
        description: `Character bridge ${bridge.sharedElements.join(', ')} causes crossover`,
        chapter: 0
      })
    }
  }

  return effects
}

/**
 * Identify orphaned islands (not connected to main plot)
 */
export function findOrphanedIslands(map: ArchipelagoMap): string[] {
  if (!map.mainPlotId) return map.islands.map(i => i.id)

  const connected = new Set<string>([map.mainPlotId])
  let changed = true

  while (changed) {
    changed = false
    for (const island of map.islands) {
      if (connected.has(island.id)) {
        for (const connId of island.connections) {
          if (!connected.has(connId)) {
            connected.add(connId)
            changed = true
          }
        }
      }
    }
  }

  return map.islands.filter(i => !connected.has(i.id)).map(i => i.id)
}

/**
 * Calculate subplot health
 */
export function calculateIslandHealth(
  island: SubplotIsland,
  config: ArchipelagoConfig
): IslandHealthReport {
  const issues: string[] = []
  const suggestions: string[] = []

  // Tension balance
  let tensionBalance = 1.0
  if (island.tensionLevel > config.tensionWarningThreshold) {
    issues.push(`High tension (${(island.tensionLevel * 100).toFixed(0)}%) may overwhelm readers`)
    tensionBalance = 1 - (island.tensionLevel - config.tensionWarningThreshold)
    suggestions.push('Consider resolving some tension before adding more conflict')
  }

  // Resolution balance
  let resolutionBalance = 1.0
  const storyProgress = island.chapterRange[1] / 100  // Rough estimate
  if (island.resolutionLevel < storyProgress * 0.5) {
    issues.push(`Subplot may be under-resolved (${(island.resolutionLevel * 100).toFixed(0)}%)`)
    resolutionBalance = island.resolutionLevel
    suggestions.push('Increase resolution beats for this subplot')
  }

  // Connection health
  let connectionHealth = 1.0
  if (island.connections.length > config.maxConnectionsPerIsland) {
    issues.push(`Too many connections (${island.connections.length}) - risk of convolution`)
    connectionHealth = config.maxConnectionsPerIsland / island.connections.length
    suggestions.push('Consider simplifying connections or splitting subplot')
  }
  if (island.connections.length < config.minConnectionsPerIsland && island.type !== 'main') {
    issues.push(`Few connections (${island.connections.length}) - risk of orphan`)
    connectionHealth = island.connections.length / config.minConnectionsPerIsland
    suggestions.push('Add more bridges to main plot or other significant subplots')
  }

  // Overall health
  const healthScore = Math.round(
    tensionBalance * 30 +
    resolutionBalance * 30 +
    connectionHealth * 40
  )

  return {
    islandId: island.id,
    healthScore,
    tensionBalance: Math.round(tensionBalance * 100) / 100,
    resolutionBalance: Math.round(resolutionBalance * 100) / 100,
    connectionHealth: Math.round(connectionHealth * 100) / 100,
    issues,
    suggestions
  }
}

/**
 * Generate archipelago analysis
 */
export function analyzeArchipelago(
  map: ArchipelagoMap,
  config: ArchipelagoConfig = DEFAULT_ARCHIPELAGO_CONFIG
): ArchipelagoAnalysis {
  const complexityScore = calculateComplexity(map)
  const orphanedIslands = findOrphanedIslands(map)
  const seepageEffects = detectSeepageEffects(map)

  // Find over/under connected islands
  const overConnectedIslands = map.islands
    .filter(i => i.connections.length > config.maxConnectionsPerIsland)
    .map(i => i.id)

  const underConnectedIslands = map.islands
    .filter(i => i.connections.length < config.minConnectionsPerIsland && i.type !== 'main')
    .map(i => i.id)

  // Generate recommendations
  const recommendations: string[] = []

  if (orphanedIslands.length > 0) {
    recommendations.push(`${orphanedIslands.length} subplot(s) are disconnected from main plot - consider adding bridges`)
  }

  if (overConnectedIslands.length > 0) {
    recommendations.push(`${overConnectedIslands.length} subplot(s) have too many connections - risk of confusing readers`)
  }

  if (complexityScore > 70) {
    recommendations.push(`High complexity (${complexityScore}) - consider simplifying or consolidating subplots`)
  }

  const totalSubplots = map.islands.filter(i => i.type !== 'main').length
  const subplotDensity = map.totalChapters > 0 ? totalSubplots / map.totalChapters : 0

  // Main plot independence
  const mainIsland = map.islands.find(i => i.id === map.mainPlotId)
  const mainPlotIndependence = mainIsland
    ? 1 - (mainIsland.connections.length / Math.max(1, map.islands.length - 1))
    : 0.5

  return {
    map,
    complexityScore,
    mainPlotIndependence: Math.round(mainPlotIndependence * 100) / 100,
    subplotDensity: Math.round(subplotDensity * 100) / 100,
    overConnectedIslands,
    underConnectedIslands,
    seepageEffects,
    recommendations
  }
}

/**
 * Calculate subplot contributions
 */
export function calculateSubplotContributions(
  map: ArchipelagoMap
): SubplotContribution[] {
  return map.islands
    .filter(island => island.type !== 'main')
    .map(island => {
      // How much this subplot contributes to main plot
      const mainIsland = map.islands.find(i => i.id === map.mainPlotId)
      const sharedChars = island.primaryCharacters.filter(c =>
        mainIsland?.primaryCharacters.includes(c)
      ).length
      const contribution = island.connections.includes(map.mainPlotId)
        ? 0.7 + (sharedChars * 0.1)
        : 0.3

      // How much this subplot depends on main plot
      const dependency = island.type === 'backstory'
        ? 0.8
        : island.type === 'foreshadowing'
        ? 0.6
        : sharedChars > 0 ? 0.5 : 0.3

      const healthScore = Math.round(
        island.importance * 40 +
        island.resolutionLevel * 30 +
        (island.bridges.length > 0 ? 30 : 0)
      )

      return {
        islandId: island.id,
        name: island.name,
        contribution: Math.min(1, contribution),
        dependency: Math.min(1, dependency),
        healthScore
      }
    })
    .sort((a, b) => b.contribution - a.contribution)
}

/**
 * Format archipelago summary for display
 */
export function formatArchipelagoSummary(analysis: ArchipelagoAnalysis): string {
  const lines = [
    `=== Story Archipelago Analysis ===`,
    `Complexity: ${analysis.complexityScore}/100`,
    `Main Plot Independence: ${(analysis.mainPlotIndependence * 100).toFixed(0)}%`,
    `Subplot Density: ${analysis.subplotDensity}/chapter`,
    `Islands: ${analysis.map.islands.length}`,
    `Bridges: ${analysis.map.bridges.length}`,
    `Orphaned: ${analysis.map.orphanedIslands.length}`,
    ``
  ]

  if (analysis.recommendations.length > 0) {
    lines.push(`Recommendations:`)
    for (const rec of analysis.recommendations) {
      lines.push(`  - ${rec}`)
    }
  }

  if (analysis.seepageEffects.length > 0) {
    lines.push(``, `Seepage Effects (${analysis.seepageEffects.length}):`)
    for (const effect of analysis.seepageEffects.slice(0, 3)) {
      lines.push(`  - ${effect.effectType}: ${effect.description}`)
    }
  }

  return lines.join('\n')
}