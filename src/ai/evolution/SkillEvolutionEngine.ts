/**
 * SkillEvolutionEngine - V103
 * Skill Graph Self-Evolution Engine Based on Writing Outcomes
 * 
 * Inspired by:
 * - thunderbolt: pipeline feedback loops for continuous skill improvement
 * - nanobot: distributed mesh agents with autonomous specialization
 * - generic-agent: autonomous goal pursuit with self-improvement
 * - ruflo: hierarchical decomposition for multi-level skill analysis
 * 
 * Extends PatternEvolver with skill-level analysis:
 * - Tracks writer skill progression over sessions
 * - Identifies skill gaps and recommends focus areas
 * - Self-tunes difficulty based on success rates
 * - Maps pattern usage to skill development
 */

import type { PatternEvolverState } from './PatternEvolver'
import type { WritingSessionState } from '../session/WritingSessionManager'

// =============================================================================
// Types
// =============================================================================

export interface SkillLevel {
  skillId: string
  level: number           // 1-10
  experience: number      // 0-100 accumulated XP
  lastPracticed: number   // timestamp
  masteryScore: number    // 0-100 calculated mastery
}

export interface SkillProgressionRecord {
  skillId: string
  sessionId: string
  timestamp: number
  practiceDuration: number // minutes
  successRate: number    // 0-1
  difficultyRating: number // 1-5
  qualityDelta: number   // quality before vs after
  xpGained: number
}

export interface SkillRecommendation {
  skillId: string
  skillName: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  suggestedPractice: string
  expectedImprovement: number // 0-100
}

export interface SkillEvolutionConfig {
  xpPerQualityPoint: number       // XP gained per quality improvement point (default: 2)
  xpPerSession: number            // base XP per completed session (default: 10)
  levelUpThreshold: number       // XP needed per level (default: 100)
  practiceSessionMin: number     // min session duration in minutes (default: 5)
  masteryDecayRate: number        // monthly decay when not practiced (default: 0.05)
  skillCategories: string[]       // skill categories to track
}

export interface SkillEvolutionState {
  config: SkillEvolutionConfig
  skillLevels: Map<string, SkillLevel>
  progressionRecords: SkillProgressionRecord[]
  lastSkillUpdate: number
  totalSessionsAnalyzed: number
}

export const DEFAULT_SKILL_EVOLUTION_CONFIG: SkillEvolutionConfig = {
  xpPerQualityPoint: 2,
  xpPerSession: 10,
  levelUpThreshold: 100,
  practiceSessionMin: 5,
  masteryDecayRate: 0.05,
  skillCategories: ['dialogue', 'scene', 'character', 'pacing', 'worldbuilding', 'style', 'narrative', 'editing'],
}

export function createEmptySkillEvolutionState(config: Partial<SkillEvolutionConfig> = {}): SkillEvolutionState {
  return {
    config: { ...DEFAULT_SKILL_EVOLUTION_CONFIG, ...config },
    skillLevels: new Map(),
    progressionRecords: [],
    lastSkillUpdate: Date.now(),
    totalSessionsAnalyzed: 0,
  }
}

export function calculateXpGained(
  qualityDelta: number,
  sessionDuration: number,
  successRate: number,
  config: SkillEvolutionConfig
): number {
  const qualityXp = Math.max(0, qualityDelta) * config.xpPerQualityPoint
  const durationXp = Math.floor(sessionDuration / 5) * config.xpPerSession
  const successBonus = successRate > 0.8 ? 5 : successRate > 0.5 ? 2 : 0
  return qualityXp + durationXp + successBonus
}

export function calculateMasteryScore(
  level: number,
  experience: number,
  lastPracticed: number,
  config: SkillEvolutionConfig
): number {
  // Base mastery from level (0-70)
  const levelMastery = (level / 10) * 70

  // Experience bonus (0-20)
  const experienceBonus = Math.min(20, (experience / config.levelUpThreshold) * 20)

  // Recency bonus (0-10, decays if not practiced recently)
  const daysSincePractice = (Date.now() - lastPracticed) / (1000 * 60 * 60 * 24)
  const recencyBonus = Math.max(0, 10 - daysSincePractice * config.masteryDecayRate * 30)

  return Math.min(100, levelMastery + experienceBonus + recencyBonus)
}

export function updateSkillLevel(
  state: SkillEvolutionState,
  skillId: string,
  xpGained: number
): SkillEvolutionState {
  let skillLevel = state.skillLevels.get(skillId)

  if (!skillLevel) {
    skillLevel = {
      skillId,
      level: 1,
      experience: 0,
      lastPracticed: Date.now(),
      masteryScore: 0,
    }
  }

  const newExperience = skillLevel.experience + xpGained
  const newLevel = Math.min(10, Math.floor(newExperience / state.config.levelUpThreshold) + 1)
  const leftoverXp = newExperience % state.config.levelUpThreshold

  const updatedSkillLevel: SkillLevel = {
    ...skillLevel,
    level: newLevel,
    experience: leftoverXp,
    lastPracticed: Date.now(),
    masteryScore: calculateMasteryScore(newLevel, leftoverXp, skillLevel.lastPracticed, state.config),
  }

  const newSkillLevels = new Map(state.skillLevels)
  newSkillLevels.set(skillId, updatedSkillLevel)

  return { ...state, skillLevels: newSkillLevels }
}

export function recordSkillProgression(
  state: SkillEvolutionState,
  skillId: string,
  sessionId: string,
  practiceDuration: number,
  successRate: number,
  difficultyRating: number,
  qualityDelta: number
): SkillEvolutionState {
  const xpGained = calculateXpGained(qualityDelta, practiceDuration, successRate, state.config)

  const record: SkillProgressionRecord = {
    skillId,
    sessionId,
    timestamp: Date.now(),
    practiceDuration,
    successRate,
    difficultyRating,
    qualityDelta,
    xpGained,
  }

  const evolvedState = updateSkillLevel(state, skillId, xpGained)

  return {
    ...evolvedState,
    progressionRecords: [...evolvedState.progressionRecords, record],
    totalSessionsAnalyzed: evolvedState.totalSessionsAnalyzed + 1,
    lastSkillUpdate: Date.now(),
  }
}

export function getSkillRecommendations(
  state: SkillEvolutionState
): SkillRecommendation[] {
  const recommendations: SkillRecommendation[] = []

  for (const category of state.config.skillCategories) {
    const skillLevel = state.skillLevels.get(category)
    const recentRecords = state.progressionRecords.filter(
      r => r.skillId === category && Date.now() - r.timestamp < 7 * 24 * 60 * 60 * 1000
    )

    if (!skillLevel) {
      recommendations.push({
        skillId: category,
        skillName: category,
        priority: 'high',
        reason: 'Skill has not been practiced yet',
        suggestedPractice: `Start practicing ${category} with low-difficulty exercises`,
        expectedImprovement: 20,
      })
    } else if (skillLevel.masteryScore < 40) {
      const avgDifficulty = recentRecords.length > 0
        ? recentRecords.reduce((s, r) => s + r.difficultyRating, 0) / recentRecords.length
        : 3
      recommendations.push({
        skillId: category,
        skillName: category,
        priority: 'high',
        reason: `Mastery score ${skillLevel.masteryScore.toFixed(0)} is below threshold`,
        suggestedPractice: avgDifficulty > 3 ? `Practice ${category} with easier exercises` : `Focus on ${category} fundamentals`,
        expectedImprovement: 25,
      })
    } else if (skillLevel.masteryScore < 70) {
      recommendations.push({
        skillId: category,
        skillName: category,
        priority: 'medium',
        reason: `Skill at intermediate level (${skillLevel.masteryScore.toFixed(0)} mastery)`,
        suggestedPractice: `Challenge yourself with harder ${category} exercises`,
        expectedImprovement: 15,
      })
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

export function analyzeSkillTrends(
  state: SkillEvolutionState,
  skillId: string,
  windowDays: number = 30
): {
  trend: 'improving' | 'stable' | 'declining'
  sessionsInWindow: number
  averageXpPerSession: number
  averageSuccessRate: number
  recommendedDifficulty: number
} {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const recentRecords = state.progressionRecords.filter(
    r => r.skillId === skillId && r.timestamp >= cutoff
  )

  if (recentRecords.length === 0) {
    return {
      trend: 'stable',
      sessionsInWindow: 0,
      averageXpPerSession: 0,
      averageSuccessRate: 0,
      recommendedDifficulty: 3,
    }
  }

  const avgXp = recentRecords.reduce((s, r) => s + r.xpGained, 0) / recentRecords.length
  const avgSuccess = recentRecords.reduce((s, r) => s + r.successRate, 0) / recentRecords.length

  // Calculate trend by comparing halves
  const halfPoint = Math.floor(recentRecords.length / 2)
  const olderRecords = recentRecords.slice(0, halfPoint)
  const newerRecords = recentRecords.slice(halfPoint)

  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (olderRecords.length > 0 && newerRecords.length > 0) {
    const olderXpAvg = olderRecords.reduce((s, r) => s + r.xpGained, 0) / olderRecords.length
    const newerXpAvg = newerRecords.reduce((s, r) => s + r.xpGained, 0) / newerRecords.length
    const diff = newerXpAvg - olderXpAvg
    if (diff > 3) trend = 'improving'
    else if (diff < -3) trend = 'declining'
  }

  // Recommend difficulty based on success rate
  let recommendedDifficulty = 3
  if (avgSuccess > 0.85) recommendedDifficulty = 5
  else if (avgSuccess > 0.7) recommendedDifficulty = 4
  else if (avgSuccess > 0.5) recommendedDifficulty = 3
  else if (avgSuccess > 0.3) recommendedDifficulty = 2
  else recommendedDifficulty = 1

  return {
    trend,
    sessionsInWindow: recentRecords.length,
    averageXpPerSession: avgXp,
    averageSuccessRate: avgSuccess,
    recommendedDifficulty,
  }
}

export function evolveSkillFromSessions(
  state: SkillEvolutionState,
  sessions: WritingSessionState[]
): SkillEvolutionState {
  let evolvedState = { ...state, totalSessionsAnalyzed: state.totalSessionsAnalyzed + sessions.length }

  for (const session of sessions) {
    const sessionDuration = (session.lastUpdateTime - session.startTime) / (1000 * 60)
    if (sessionDuration < state.config.practiceSessionMin) continue

    const qualityDelta = session.currentQualityScore - (session.rollingQualityScores[0] ?? 50)
    const successRate = session.currentQualityScore > 60 ? 0.8 : session.currentQualityScore > 40 ? 0.5 : 0.2

    // Infer skill from active context
    const activeCharacters = session.activeContext?.activeCharacters ?? []
    if (activeCharacters.length > 0) {
      evolvedState = recordSkillProgression(
        evolvedState,
        'character',
        session.id,
        sessionDuration,
        successRate,
        3,
        qualityDelta
      )
    }

    // Track narrative/scence based on tool usage
    const toolCallCount = session.totalToolCalls
    if (toolCallCount > 10) {
      evolvedState = recordSkillProgression(
        evolvedState,
        'pacing',
        session.id,
        sessionDuration,
        successRate,
        3,
        qualityDelta
      )
    }
  }

  return evolvedState
}

export function formatSkillEvolutionSummary(state: SkillEvolutionState): string {
  const lines = [
    '=== Skill Evolution Summary ===',
    `Sessions Analyzed: ${state.totalSessionsAnalyzed}`,
    `Skills Tracked: ${state.skillLevels.size}`,
    '',
  ]

  lines.push('--- Skill Levels ---')
  for (const [skillId, level] of Array.from(state.skillLevels.entries())) {
    lines.push(`${skillId}: Lv${level.level} (${level.masteryScore.toFixed(0)} mastery, ${level.experience} XP)`)
  }

  if (state.skillLevels.size === 0) {
    lines.push('No skills tracked yet')
  }

  lines.push('')
  lines.push('--- Recommendations ---')
  const recs = getSkillRecommendations(state)
  if (recs.length === 0) {
    lines.push('No recommendations')
  } else {
    for (const rec of recs.slice(0, 5)) {
      lines.push(`[${rec.priority.toUpperCase()}] ${rec.skillName}: ${rec.reason}`)
    }
  }

  return lines.join('\n')
}