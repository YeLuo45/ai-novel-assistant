/**
 * PatternLibrary Types - V75
 * Persistent pattern storage and retrieval system
 * 
 * Stores SuccessPattern instances in IndexedDB via Dexie
 * Enables cross-session pattern persistence and pattern search
 */

export type SkillLevel = 'nascent' | 'developing' | 'stable' | 'mastered' | 'deprecated'

export interface PatternSearchQuery {
  toolId?: string
  minConfidence?: number
  minOccurrences?: number
  genre?: string
  writingStage?: string
  ageDays?: number  // Patterns not observed in N days considered stale
}

export interface PatternStats {
  totalPatterns: number
  avgConfidence: number
  patternsByTool: Map<string, number>
  recentPatterns: number
  stalePatterns: number
}

export interface PatternCatalogEntry {
  id: string
  toolId: string
  toolName: string
  pattern: string
  displayPattern: string  // Human-readable
  category: string  // e.g., 'genre-specific', 'complexity-based', 'stage-specific'
  genre?: string
  writingStage?: string
  occurrences: number
  avgSuccessRate: number
  avgDurationMs: number
  confidence: number
  lastObserved: number
  tags: string[]
  usageCount: number  // Times retrieved for execution
  createdAt: number
}

export interface PatternMatch {
  entry: PatternCatalogEntry
  matchScore: number  // 0-1
  matchedFields: string[]  // Which fields matched
}

export const PATTERN_CATEGORIES = {
  GENRE_SPECIFIC: 'genre-specific',
  STAGE_SPECIFIC: 'stage-specific',
  COMPLEXITY_BASED: 'complexity-based',
  AGENT_SPECIFIC: 'agent-specific',
  TEMPORAL: 'temporal',
  CONTEXTUAL: 'contextual'
} as const

export function inferPatternCategory(pattern: string, context?: Record<string, unknown>): string {
  if (pattern.includes('genre=')) return PATTERN_CATEGORIES.GENRE_SPECIFIC
  if (pattern.includes('stage=') || pattern.includes('writingStage=')) return PATTERN_CATEGORIES.STAGE_SPECIFIC
  if (pattern.includes('complexity') || pattern.includes('inputComplexity')) return PATTERN_CATEGORIES.COMPLEXITY_BASED
  if (pattern.includes('agentType=')) return PATTERN_CATEGORIES.AGENT_SPECIFIC
  return PATTERN_CATEGORIES.CONTEXTUAL
}

export function parsePatternString(pattern: string): Record<string, string> {
  const result: Record<string, string> = {}
  const parts = pattern.split(',').map(s => s.trim())
  for (const part of parts) {
    const eqIdx = part.indexOf('=')
    if (eqIdx > 0) {
      const key = part.slice(0, eqIdx).trim()
      const value = part.slice(eqIdx + 1).trim()
      result[key] = value
    } else if (part.includes('>') || part.includes('<')) {
      const match = part.match(/^(\w+)\s*(>|>=|<|<=)\s*(.+)$/)
      if (match) {
        result[match[1]] = `${match[2]}${match[3]}`
      }
    }
  }
  return result
}

export function formatPatternForDisplay(pattern: string): string {
  const parsed = parsePatternString(pattern)
  const parts: string[] = []
  
  for (const [key, value] of Object.entries(parsed)) {
    const readableKeys: Record<string, string> = {
      'genre': 'Genre',
      'stage': 'Stage',
      'writingStage': 'Writing Stage',
      'complexity': 'Complexity',
      'inputComplexity': 'Input Complexity',
      'agentType': 'Agent'
    }
    const label = readableKeys[key] || key
    parts.push(`${label}: ${value}`)
  }
  
  return parts.join(' × ') || pattern
}

export function createPatternId(toolId: string, pattern: string): string {
  return `pattern_${toolId}_${pattern.slice(0, 50).replace(/\W/g, '_')}`
}

export function matchPatternAgainstContext(
  pattern: string,
  context: Record<string, unknown>
): { matches: boolean; matchedFields: string[] } {
  const parsed = parsePatternString(pattern)
  const matchedFields: string[] = []

  for (const [key, value] of Object.entries(parsed)) {
    if (key === 'genre' && context.genre === value) matchedFields.push('genre')
    if ((key === 'stage' || key === 'writingStage') && context.writingStage === value) matchedFields.push('writingStage')
    if (key === 'agentType' && context.agentType === value) matchedFields.push('agentType')
    
    if ((key === 'complexity' || key === 'inputComplexity') && typeof context[key as keyof typeof context] === 'number') {
      const numVal = parseFloat(value.replace(/[><=]/g, ''))
      const ctxVal = context[key as keyof typeof context] as number
      if (value.startsWith('>') && ctxVal > numVal) matchedFields.push(key)
      if (value.startsWith('>=') && ctxVal >= numVal) matchedFields.push(key)
      if (value.startsWith('<') && ctxVal < numVal) matchedFields.push(key)
      if (value.startsWith('<=') && ctxVal <= numVal) matchedFields.push(key)
      if (value.startsWith('=') && ctxVal === numVal) matchedFields.push(key)
    }
  }

  return {
    matches: matchedFields.length > 0,
    matchedFields
  }
}

export function calculateMatchScore(
  entry: PatternCatalogEntry,
  context: Record<string, unknown>,
  requiredFields: string[] = ['genre', 'writingStage']
): number {
  let score = 0
  let weightTotal = 0

  for (const field of requiredFields) {
    const weight = 1
    weightTotal += weight
    if (entry.tags.includes(field) || patternHasField(entry.pattern, field)) {
      score += weight
    }
  }

  // Confidence contributes 50% extra weight
  score += entry.confidence * 0.5
  weightTotal += 0.5

  return score / weightTotal
}

function patternHasField(pattern: string, field: string): boolean {
  return pattern.toLowerCase().includes(field.toLowerCase())
}