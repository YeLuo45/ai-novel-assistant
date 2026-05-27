/**
 * SelfEvolutionEngine - V66
 * Core engine for self-evolution closed loop:
 * Tool Success Tracking → Pattern Recognition → Skill Crystallization → Skill Demotion/Deprecation
 */

import { 
  type ToolCallRecord,
  type SuccessPattern,
  type CrystallizedSkill,
  type SkillRule,
  type EvolutionMetrics,
  type EvolutionConfig,
  type EvolutionEvent,
  type SkillLevel,
  DEFAULT_EVOLUTION_CONFIG,
  EVOLUTION_THRESHOLDS,
  generateId,
  calculateSuccessRate,
  calculateAvgDuration
} from './SelfEvolutionTypes'

import Dexie from 'dexie'

// ============================================================================
// Database Schema
// ============================================================================

export class SelfEvolutionDB extends Dexie {
  toolCallRecords!: Dexie.Table<ToolCallRecord, string>
  successPatterns!: Dexie.Table<SuccessPattern, string>
  crystallizedSkills!: Dexie.Table<CrystallizedSkill, string>
  evolutionEvents!: Dexie.Table<{ id: string; event: EvolutionEvent; timestamp: number; data: Record<string, unknown> }, string>

  constructor() {
    super('SelfEvolutionDB')
    this.version(1).stores({
      toolCallRecords: 'id, toolId, timestamp, success',
      successPatterns: 'id, toolId, lastObserved',
      crystallizedSkills: 'id, level, lastActivated',
      evolutionEvents: 'id, event, timestamp'
    })
  }
}

const db = new SelfEvolutionDB()

// ============================================================================
// SelfEvolutionEngine
// ============================================================================

export class SelfEvolutionEngine {
  private config: EvolutionConfig
  private checkInterval: ReturnType<typeof setInterval> | null = null

  constructor(config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG) {
    this.config = config
  }

  // --------------------------------------------------------------------------
  // Phase 1: Tool Call Tracking
  // --------------------------------------------------------------------------

  /**
   * Record a tool call result for later analysis
   */
  async recordToolCall(record: Omit<ToolCallRecord, 'id'>): Promise<string> {
    const id = generateId()
    const fullRecord: ToolCallRecord = { ...record, id }
    await db.toolCallRecords.add(fullRecord)
    return id
  }

  /**
   * Get metrics for a specific tool
   */
  async getToolMetrics(toolId: string): Promise<EvolutionMetrics | null> {
    const records = await db.toolCallRecords
      .where('toolId')
      .equals(toolId)
      .toArray()

    if (records.length === 0) return null

    const successful = records.filter(r => r.success).length
    const patterns = await db.successPatterns
      .where('toolId')
      .equals(toolId)
      .count()
    const skills = await db.crystallizedSkills.toArray()
    const skillsForTool = skills.filter(s => s.sourceToolId === toolId)

    return {
      toolId,
      totalCalls: records.length,
      successfulCalls: successful,
      failedCalls: records.length - successful,
      avgDurationMs: calculateAvgDuration(records),
      successRate: calculateSuccessRate(successful, records.length),
      patternCount: patterns,
      skillCount: skillsForTool.length,
      lastUpdated: Date.now()
    }
  }

  // --------------------------------------------------------------------------
  // Phase 2: Pattern Recognition
  // --------------------------------------------------------------------------

  /**
   * Detect success patterns from recent tool calls
   * Groups calls by context attributes and computes success rates
   */
  async detectPatterns(toolId: string): Promise<SuccessPattern[]> {
    const cutoff = Date.now() - this.config.patternWindowMs
    const records = await db.toolCallRecords
      .where('toolId')
      .equals(toolId)
      .filter(r => r.timestamp > cutoff)
      .toArray()

    if (records.length < EVOLUTION_THRESHOLDS.MIN_PATTERN_OCCURRENCES) {
      return []
    }

    // Group by context combination
    const groups = new Map<string, ToolCallRecord[]>()
    for (const record of records) {
      const key = this.makeContextKey(record.context)
      const group = groups.get(key) || []
      group.push(record)
      groups.set(key, group)
    }

    const patterns: SuccessPattern[] = []
    const entries = Array.from(groups.entries())
    for (let i = 0; i < entries.length; i++) {
      const [contextKey, groupRecords] = entries[i]
      if (groupRecords.length < EVOLUTION_THRESHOLDS.MIN_PATTERN_OCCURRENCES) continue

      const successful = groupRecords.filter(r => r.success).length
      const rate = calculateSuccessRate(successful, groupRecords.length)
      const avgDuration = calculateAvgDuration(groupRecords)

      // Calculate confidence based on sample size
      const confidence = Math.min(0.95, 0.5 + (groupRecords.length / 100))

      if (confidence >= EVOLUTION_THRESHOLDS.MIN_PATTERN_CONFIDENCE) {
        const maxTime = groupRecords.reduce((m, r) => r.timestamp > m ? r.timestamp : m, groupRecords[0]?.timestamp ?? 0)
        patterns.push({
          id: generateId(),
          toolId,
          pattern: contextKey,
          occurrences: groupRecords.length,
          avgSuccessRate: rate,
          avgDurationMs: avgDuration,
          lastObserved: maxTime,
          confidence
        })
      }
    }

    return patterns
  }

  private makeContextKey(context: ToolCallRecord['context']): string {
    const parts: string[] = []
    if (context.genre) parts.push(`genre=${context.genre}`)
    if (context.writingStage) parts.push(`stage=${context.writingStage}`)
    if (context.agentType) parts.push(`agent=${context.agentType}`)
    return parts.join(', ') || 'default'
  }

  // --------------------------------------------------------------------------
  // Phase 3: Skill Crystallization
  // --------------------------------------------------------------------------

  /**
   * Crystallize a pattern into a skill if thresholds are met
   */
  async crystallizePattern(pattern: SuccessPattern): Promise<CrystallizedSkill | null> {
    if (!this.config.enableAutoCrystallization) return null

    // Check if already crystallized
    const existing = await db.crystallizedSkills
      .where('id')
      .equals(`pattern-${pattern.id}`)
      .first()
    if (existing) return null

    if (
      pattern.occurrences < EVOLUTION_THRESHOLDS.MIN_CRYSTALLIZATION_OCCURRENCES ||
      pattern.avgSuccessRate < EVOLUTION_THRESHOLDS.MIN_SKILL_SUCCESS_RATE
    ) {
      return null
    }

    const skill: CrystallizedSkill = {
      id: generateId(),
      name: `Skill-${pattern.toolId}-${Date.now()}`,
      description: `Auto-crystallized from pattern: ${pattern.pattern}`,
      sourceToolId: pattern.toolId,
      rules: [{
        id: generateId(),
        condition: this.contextToCondition(pattern.pattern),
        action: `prefer_tool:${pattern.toolId}`,
        priority: pattern.confidence * 100,
        successCount: Math.floor(pattern.occurrences * pattern.avgSuccessRate),
        failureCount: Math.floor(pattern.occurrences * (1 - pattern.avgSuccessRate)),
        lastMatched: pattern.lastObserved
      }],
      level: 'nascent',
      successRate: pattern.avgSuccessRate,
      totalActivations: pattern.occurrences,
      lastActivated: pattern.lastObserved,
      createdAt: Date.now(),
      evolvedAt: Date.now(),
      metadata: {
        patternId: pattern.id,
        avgDurationMs: pattern.avgDurationMs,
        confidence: pattern.confidence
      }
    }

    await db.crystallizedSkills.add(skill)
    await this.logEvent('skill_crystallized', { pattern, skillId: skill.id })
    return skill
  }

  private contextToCondition(pattern: string): string {
    // Convert "genre=fantasy, stage=plotting" to TS condition
    const parts = pattern.split(', ').map(p => {
      const [key, value] = p.split('=')
      return `context.${key} === '${value}'`
    })
    return parts.join(' && ')
  }

  // --------------------------------------------------------------------------
  // Phase 4: Skill Lifecycle Management (Promotion / Demotion / Deprecation)
  // --------------------------------------------------------------------------

  /**
   * Evolve all skills: check promotion, demotion, or deprecation
   */
  async evolveSkills(): Promise<{ promoted: string[]; demoted: string[]; deprecated: string[] }> {
    if (!this.config.enableAutoEvolution) return { promoted: [], demoted: [], deprecated: [] }

    const skills = await db.crystallizedSkills.toArray()
    const promoted: string[] = []
    const demoted: string[] = []
    const deprecated: string[] = []

    for (const skill of skills) {
      if (skill.level === 'deprecated') continue

      const metrics = await this.getSkillMetrics(skill.id)
      if (!metrics) continue

      // Check deprecation
      if (
        metrics.successRate <= EVOLUTION_THRESHOLDS.DEPRECATE_SUCCESS_RATE &&
        metrics.totalCalls >= EVOLUTION_THRESHOLDS.DEPRECATE_OCCURRENCES
      ) {
        await this.updateSkillLevel(skill.id, 'deprecated')
        deprecated.push(skill.id)
        continue
      }

      // Check demotion
      if (
        metrics.successRate <= EVOLUTION_THRESHOLDS.DEMOTE_SUCCESS_RATE &&
        metrics.totalCalls >= EVOLUTION_THRESHOLDS.DEMOTE_OCCURRENCES &&
        skill.level !== 'nascent'
      ) {
        const newLevel = this.getNextLowerLevel(skill.level)
        await this.updateSkillLevel(skill.id, newLevel)
        await this.logEvent('skill_demoted', { skillId: skill.id, newLevel })
        demoted.push(skill.id)
        continue
      }

      // Check promotion
      if (
        metrics.successRate >= EVOLUTION_THRESHOLDS.PROMOTE_SUCCESS_RATE &&
        metrics.totalCalls >= EVOLUTION_THRESHOLDS.PROMOTE_OCCURRENCES &&
        skill.level !== 'mastered'
      ) {
        const newLevel = this.getNextHigherLevel(skill.level)
        await this.updateSkillLevel(skill.id, newLevel)
        await this.logEvent('skill_promoted', { skillId: skill.id, newLevel })
        promoted.push(skill.id)
      }
    }

    return { promoted, demoted, deprecated }
  }

  private async getSkillMetrics(skillId: string): Promise<{ successRate: number; totalCalls: number } | null> {
    const skill = await db.crystallizedSkills.get(skillId)
    if (!skill || !skill.sourceToolId) return null

    const metrics = await this.getToolMetrics(skill.sourceToolId)
    if (!metrics) return null

    return {
      successRate: metrics.successRate,
      totalCalls: metrics.totalCalls
    }
  }

  private async updateSkillLevel(skillId: string, newLevel: SkillLevel): Promise<void> {
    await db.crystallizedSkills.update(skillId, {
      level: newLevel,
      evolvedAt: Date.now()
    })
  }

  private getNextHigherLevel(level: SkillLevel): SkillLevel {
    const order: SkillLevel[] = ['nascent', 'developing', 'stable', 'mastered']
    const idx = order.indexOf(level)
    return idx < order.length - 1 ? order[idx + 1] : 'mastered'
  }

  private getNextLowerLevel(level: SkillLevel): SkillLevel {
    const order: SkillLevel[] = ['nascent', 'developing', 'stable', 'mastered']
    const idx = order.indexOf(level)
    return idx > 0 ? order[idx - 1] : 'nascent'
  }

  // --------------------------------------------------------------------------
  // Phase 5: Matching & Recommendation
  // --------------------------------------------------------------------------

  /**
   * Match context against crystallized skills and return recommended tool
   */
  async matchSkill(context: Record<string, unknown>): Promise<CrystallizedSkill | null> {
    const skills = await db.crystallizedSkills
      .where('level')
      .notEqual('deprecated')
      .toArray()

    let best: { skill: CrystallizedSkill; score: number } | null = null

    for (const skill of skills) {
      const score = this.evaluateSkillMatch(skill, context)
      if (score > 0 && (!best || score > best.score)) {
        best = { skill, score }
      }
    }

    if (best) {
      // Update activation stats
      await db.crystallizedSkills.update(best.skill.id, {
        totalActivations: best.skill.totalActivations + 1,
        lastActivated: Date.now()
      })
      return best.skill
    }

    return null
  }

  private evaluateSkillMatch(skill: CrystallizedSkill, context: Record<string, unknown>): number {
    let score = 0
    for (const rule of skill.rules) {
      try {
        // Simple eval for condition matching
        const conditionMet = this.testCondition(rule.condition, context)
        if (conditionMet) {
          score += rule.priority
        }
      } catch {
        // Invalid condition, skip
      }
    }
    return score * skill.successRate
  }

  private testCondition(condition: string, context: Record<string, unknown>): boolean {
    try {
      // Very simple condition parser - only supports equality checks
      const conditions = condition.split(' && ')
      for (const cond of conditions) {
        const match = cond.match(/context\.(\w+) === '([^']+)'/)
        if (!match) continue
        const key = match[1]
        const expected = match[2]
        const actual = context[key]
        if (String(actual) !== expected) return false
      }
      return true
    } catch {
      return false
    }
  }

  // --------------------------------------------------------------------------
  // Utility
  // --------------------------------------------------------------------------

  private async logEvent(event: EvolutionEvent, data: Record<string, unknown>): Promise<void> {
    await db.evolutionEvents.add({
      id: generateId(),
      event,
      timestamp: Date.now(),
      data
    })
  }

  /**
   * Start background evolution check loop
   */
  startAutoEvolution(): void {
    if (this.checkInterval) return
    this.checkInterval = setInterval(async () => {
      try {
        // Get all tools with recent calls
        const toolIds = new Set<string>()
        const cutoff = Date.now() - this.config.patternWindowMs
        await db.toolCallRecords
          .where('timestamp')
          .above(cutoff)
          .each(r => toolIds.add(r.toolId))

        const toolIdArray = Array.from(toolIds)
        for (let i = 0; i < toolIdArray.length; i++) {
          const toolId = toolIdArray[i]
          const patterns = await this.detectPatterns(toolId)
          for (const pattern of patterns) {
            await this.crystallizePattern(pattern)
          }
        }

        await this.evolveSkills()
      } catch (e) {
        console.error('[SelfEvolutionEngine] Auto-evolution error:', e)
      }
    }, this.config.checkIntervalMs)
  }

  stopAutoEvolution(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Get all crystallized skills
   */
  async getAllSkills(): Promise<CrystallizedSkill[]> {
    return db.crystallizedSkills.toArray()
  }

  /**
   * Get skill by ID
   */
  async getSkill(id: string): Promise<CrystallizedSkill | undefined> {
    return db.crystallizedSkills.get(id)
  }

  /**
   * Get evolution event log
   */
  async getEventLog(limit = 50): Promise<{ id: string; event: EvolutionEvent; timestamp: number; data: Record<string, unknown> }[]> {
    return db.evolutionEvents
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
  }
}

// Singleton instance
let engineInstance: SelfEvolutionEngine | null = null

export function getSelfEvolutionEngine(): SelfEvolutionEngine {
  if (!engineInstance) {
    engineInstance = new SelfEvolutionEngine()
  }
  return engineInstance
}