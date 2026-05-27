/**
 * PatternLibrary - V75
 * Persistent pattern storage and retrieval system
 * Integrates with SelfEvolutionEngine's Dexie DB
 */

import Dexie from 'dexie'
import {
  type PatternSearchQuery,
  type PatternStats,
  type PatternCatalogEntry,
  type PatternMatch,
  PATTERN_CATEGORIES,
  inferPatternCategory,
  parsePatternString,
  formatPatternForDisplay,
  createPatternId,
  matchPatternAgainstContext,
  calculateMatchScore
} from './PatternLibraryTypes'

// Reuse the same DB class name to share the database
export class PatternLibraryDB extends Dexie {
  patternCatalog!: Dexie.Table<PatternCatalogEntry, string>

  constructor() {
    super('PatternLibraryDB')
    this.version(1).stores({
      patternCatalog: 'id, toolId, category, genre, writingStage, confidence, lastObserved, usageCount, createdAt'
    })
  }
}

const patternDB = new PatternLibraryDB()

/**
 * Persist patterns from SelfEvolutionEngine to the pattern library
 */
export async function persistPatterns(
  patterns: import('./SelfEvolutionTypes').SuccessPattern[],
  toolName: string
): Promise<number> {
  await patternDB.open()
  let count = 0
  for (const pattern of patterns) {
    const tags: string[] = []
    const parsed = parsePatternString(pattern.pattern)
    if (parsed.genre) tags.push('genre')
    if (parsed.stage || parsed.writingStage) tags.push('writingStage')
    if (parsed.agentType) tags.push('agentType')

    const entry: PatternCatalogEntry = {
      id: createPatternId(pattern.toolId, pattern.pattern),
      toolId: pattern.toolId,
      toolName,
      pattern: pattern.pattern,
      displayPattern: formatPatternForDisplay(pattern.pattern),
      category: inferPatternCategory(pattern.pattern),
      genre: parsed.genre,
      writingStage: parsed.writingStage || parsed.stage,
      occurrences: pattern.occurrences,
      avgSuccessRate: pattern.avgSuccessRate,
      avgDurationMs: pattern.avgDurationMs,
      confidence: pattern.confidence,
      lastObserved: pattern.lastObserved,
      tags,
      usageCount: 0,
      createdAt: Date.now()
    }

    await patternDB.patternCatalog.put(entry)
    count++
  }
  return count
}

/**
 * Search patterns by query
 */
export async function searchPatterns(query: PatternSearchQuery): Promise<PatternCatalogEntry[]> {
  let collection = patternDB.patternCatalog.toCollection()

  if (query.toolId) {
    collection = collection.filter(e => e.toolId === query.toolId)
  }
  if (query.minConfidence !== undefined) {
    collection = collection.filter(e => e.confidence >= query.minConfidence!)
  }
  if (query.minOccurrences !== undefined) {
    collection = collection.filter(e => e.occurrences >= query.minOccurrences!)
  }

  const results = await collection.toArray()

  // Filter by age
  if (query.ageDays !== undefined) {
    const cutoff = Date.now() - query.ageDays * 24 * 60 * 60 * 1000
    return results.filter(e => e.lastObserved >= cutoff)
  }

  return results
}

/**
 * Find best matching patterns for a given context
 */
export async function findMatchingPatterns(
  context: Record<string, unknown>,
  options: { maxResults?: number; minScore?: number } = {}
): Promise<PatternMatch[]> {
  const { maxResults = 5, minScore = 0.2 } = options

  const allPatterns = await patternDB.patternCatalog.toArray()
  const matches: PatternMatch[] = []

  for (const entry of allPatterns) {
    const { matches: isMatch, matchedFields } = matchPatternAgainstContext(entry.pattern, context)
    if (!isMatch) continue

    const score = calculateMatchScore(entry, context)
    if (score >= minScore) {
      matches.push({ entry, matchScore: score, matchedFields })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.matchScore - a.matchScore)
  return matches.slice(0, maxResults)
}

/**
 * Get pattern statistics
 */
export async function getPatternStats(): Promise<PatternStats> {
  const all = await patternDB.patternCatalog.toArray()
  const now = Date.now()
  const staleCutoff = 7 * 24 * 60 * 60 * 1000

  const patternsByTool = new Map<string, number>()
  let totalConfidence = 0
  let recentCount = 0
  let staleCount = 0

  for (const entry of all) {
    patternsByTool.set(entry.toolId, (patternsByTool.get(entry.toolId) || 0) + 1)
    totalConfidence += entry.confidence
    if (now - entry.lastObserved < 24 * 60 * 60 * 1000) recentCount++
    if (now - entry.lastObserved > staleCutoff) staleCount++
  }

  return {
    totalPatterns: all.length,
    avgConfidence: all.length > 0 ? totalConfidence / all.length : 0,
    patternsByTool,
    recentPatterns: recentCount,
    stalePatterns: staleCount
  }
}

/**
 * Increment usage count for a pattern
 */
export async function incrementPatternUsage(patternId: string): Promise<void> {
  await patternDB.patternCatalog.update(patternId, {
    usageCount: (await patternDB.patternCatalog.get(patternId))?.usageCount ?? 0 + 1
  })
}

/**
 * Get top patterns by usage
 */
export async function getTopPatterns(limit: number = 10): Promise<PatternCatalogEntry[]> {
  return patternDB.patternCatalog
    .orderBy('usageCount')
    .reverse()
    .limit(limit)
    .toArray()
}

/**
 * Prune old patterns
 */
export async function prunePatterns(olderThanDays: number = 30): Promise<number> {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000
  const old = await patternDB.patternCatalog
    .filter(e => e.lastObserved < cutoff && e.usageCount === 0)
    .toArray()

  for (const entry of old) {
    await patternDB.patternCatalog.delete(entry.id)
  }
  return old.length
}

/**
 * Get patterns by tool
 */
export async function getPatternsByTool(toolId: string): Promise<PatternCatalogEntry[]> {
  return patternDB.patternCatalog
    .where('toolId')
    .equals(toolId)
    .toArray()
}

/**
 * Clear all patterns (for testing)
 */
export async function clearPatternLibrary(): Promise<void> {
  await patternDB.open()
  await patternDB.patternCatalog.clear()
}

export const patternLibrary = {
  persistPatterns,
  searchPatterns,
  findMatchingPatterns,
  getPatternStats,
  incrementPatternUsage,
  getTopPatterns,
  prunePatterns,
  getPatternsByTool,
  clearPatternLibrary
}

export default patternLibrary