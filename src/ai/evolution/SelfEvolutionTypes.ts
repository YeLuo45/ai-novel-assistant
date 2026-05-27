/**
 * Self-Evolution Types - V66
 * Self-Evolution Closed Loop: Tool Success Tracking → Pattern Recognition → Skill Crystallization → Skill Demotion/Deprecation
 */

export type SkillLevel = 'nascent' | 'developing' | 'stable' | 'mastered' | 'deprecated'

export type EvolutionEvent = 
  | 'skill_crystallized'
  | 'skill_promoted'
  | 'skill_demoted'
  | 'skill_deprecated'
  | 'pattern_detected'

export interface ToolCallRecord {
  id: string
  toolId: string
  toolName: string
  timestamp: number
  success: boolean
  durationMs: number
  inputComplexity: number // 0-1 normalized
  outputQuality?: number // 0-1 if evaluable
  error?: string
  context?: {
    genre?: string
    writingStage?: string
    agentType?: string
  }
}

export interface SuccessPattern {
  id: string
  toolId: string
  pattern: string // e.g., "genre=fantasy, stage=plotting, complexity>0.7"
  occurrences: number
  avgSuccessRate: number
  avgDurationMs: number
  lastObserved: number
  confidence: number // 0-1
}

export interface CrystallizedSkill {
  id: string
  name: string
  description: string
  sourceToolId?: string
  rules: SkillRule[]
  level: SkillLevel
  successRate: number
  totalActivations: number
  lastActivated: number
  createdAt: number
  evolvedAt: number
  metadata: Record<string, unknown>
}

export interface SkillRule {
  id: string
  condition: string // e.g., "context.genre === 'fantasy' && inputComplexity > 0.6"
  action: string // e.g., "prefer_tool: plot-generator-v3"
  priority: number
  successCount: number
  failureCount: number
  lastMatched: number
}

export interface EvolutionMetrics {
  toolId: string
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  avgDurationMs: number
  successRate: number
  patternCount: number
  skillCount: number
  lastUpdated: number
}

// Evolution thresholds
export const EVOLUTION_THRESHOLDS = {
  // Pattern detection
  MIN_PATTERN_OCCURRENCES: 5,
  MIN_PATTERN_CONFIDENCE: 0.7,
  
  // Skill crystallization
  MIN_SKILL_SUCCESS_RATE: 0.85,
  MIN_CRYSTALLIZATION_OCCURRENCES: 10,
  
  // Skill promotion
  PROMOTE_SUCCESS_RATE: 0.9,
  PROMOTE_OCCURRENCES: 20,
  PROMOTE_CONFIDENCE: 0.85,
  
  // Skill demotion
  DEMOTE_SUCCESS_RATE: 0.6,
  DEMOTE_OCCURRENCES: 15,
  
  // Skill deprecation
  DEPRECATE_SUCCESS_RATE: 0.4,
  DEPRECATE_OCCURRENCES: 30,
  
  // Time windows (ms)
  PATTERN_WINDOW_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  SKILL_CHECK_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
} as const

export interface EvolutionConfig {
  enableAutoEvolution: boolean
  enableAutoCrystallization: boolean
  enableAutoDemotion: boolean
  checkIntervalMs: number
  patternWindowMs: number
  minPatternOccurrences: number
  minCrystallizationOccurrences: number
}

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  enableAutoEvolution: true,
  enableAutoCrystallization: true,
  enableAutoDemotion: true,
  checkIntervalMs: EVOLUTION_THRESHOLDS.SKILL_CHECK_INTERVAL_MS,
  patternWindowMs: EVOLUTION_THRESHOLDS.PATTERN_WINDOW_MS,
  minPatternOccurrences: EVOLUTION_THRESHOLDS.MIN_PATTERN_OCCURRENCES,
  minCrystallizationOccurrences: EVOLUTION_THRESHOLDS.MIN_CRYSTALLIZATION_OCCURRENCES,
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function calculateSuccessRate(successful: number, total: number): number {
  if (total === 0) return 0
  return Math.round((successful / total) * 1000) / 1000
}

export function calculateAvgDuration(records: ToolCallRecord[]): number {
  if (records.length === 0) return 0
  const sum = records.reduce((acc, r) => acc + r.durationMs, 0)
  return Math.round(sum / records.length)
}