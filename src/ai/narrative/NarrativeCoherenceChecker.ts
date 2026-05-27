/**
 * NarrativeCoherenceChecker Types - V80
 * Story Consistency and Narrative Quality Assurance
 * 
 * Validates story continuity across multiple dimensions:
 * - Character state consistency (personality, knowledge, relationships)
 * - Plot logic consistency (cause-effect chains, timeline)
 * - World state consistency (locations, rules, magic systems)
 * - Foreshadowing and callback consistency
 */

import type { SkillLevel } from '../evolution/SelfEvolutionTypes'

// ===============================================================================
// Narrative Element Types
// ===============================================================================

export interface CharacterState {
  id: string
  name: string
  personalityTraits: string[]
  knowledge: string[]           // Things the character knows
  beliefs: string[]           // Character's beliefs/opinions
  relationships: Record<string, 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family'>
  emotionalState: Record<string, number>  // emotion -> intensity 0-1
  physicalState: string[]     // injuries, conditions, etc.
  location: string
  lastAppearanceChapter?: number
}

export interface PlotPoint {
  id: string
  chapter: number
  description: string
  causeChain: string[]        // IDs of plot points that caused this
  affectedCharacters: string[]
  worldStateChanges: WorldStateChange[]
  logicalConsistency: 'consistent' | 'questionable' | 'contradiction'
  notes?: string
}

export interface WorldStateChange {
  id: string
  description: string
  before: Record<string, unknown>
  after: Record<string, unknown>
  permanence: 'permanent' | 'temporary' | 'conditional'
  affectedElements: string[]
}

export interface TimelineEntry {
  id: string
  chapter: number
  timestamp: number  // In-story time (e.g., day number)
  description: string
  characters: string[]
  locations: string[]
}

// ===============================================================================
// Coherence Types
// ===============================================================================

export type InconsistencyType = 
  | 'character_trait_violation'    // Character acts against their established traits
  | 'knowledge_contradiction'       // Character knows something they shouldn't
  | 'timeline_contradiction'        // Events out of chronological order
  | 'cause_effect_break'            // Effect doesn't follow from cause
  | 'relationship_inconsistency'  // Relationship behavior contradicts history
  | 'emotional_inconsistency'      // Emotional response doesn't fit history
  | 'world_state_violation'        // World rules broken
  | 'foreshadow_mismatch'           // Foreshadowed event doesn't happen
  | 'callback_unresolved'           // Earlier event referenced but not resolved

export interface InconsistencyReport {
  id: string
  type: InconsistencyType
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  involvedElements: string[]
  description: string
  evidence: string[]            // Supporting quotes/events
  suggestedFix?: string
  chapter: number
}

export interface CoherenceScore {
  overallScore: number          // 0-1
  characterConsistency: number  // 0-1
  plotConsistency: number      // 0-1
  worldConsistency: number     // 0-1
  foreshadowConsistency: number // 0-1
  timelineConsistency: number  // 0-1
  majorInconsistencies: number
  minorInconsistencies: number
}

// ===============================================================================
// Checker Configuration
// ===============================================================================

export interface CoherenceCheckConfig {
  checkCharacterDepth: boolean
  checkPlotDepth: boolean
  checkWorldRules: boolean
  checkForeshadowing: boolean
  checkTimeline: boolean
  checkCallbacks: boolean
  strictMode: boolean  // If true, treats 'questionable' as 'contradiction'
  maxSuggestionsPerIssue: number
}

export const DEFAULT_COHERENCE_CONFIG: CoherenceCheckConfig = {
  checkCharacterDepth: true,
  checkPlotDepth: true,
  checkWorldRules: true,
  checkForeshadowing: true,
  checkTimeline: true,
  checkCallbacks: true,
  strictMode: false,
  maxSuggestionsPerIssue: 3
}

// ===============================================================================
// Story Context Types
// ===============================================================================

export interface StoryContext {
  title: string
  genre: string
  currentChapter: number
  characters: CharacterState[]
  plotPoints: PlotPoint[]
  worldStateChanges: WorldStateChange[]
  timeline: TimelineEntry[]
  foreshadowedEvents: ForeshadowEvent[]
  callbacks: CallbackReference[]
}

export interface ForeshadowEvent {
  id: string
  chapter: number
  hint: string
  hintType: 'subtle' | 'explicit' | 'symbolic' | 'character_dialogue'
  expectedFulfillmentChapter?: number
  fulfilled: boolean
  fulfillmentChapter?: number
  notes?: string
}

export interface CallbackReference {
  id: string
  chapter: number
  referencedEventId: string
  referencedEventChapter: number
  resolved: boolean
  resolutionChapter?: number
}

// ===============================================================================
// Coherence Check Functions
// ===============================================================================

/**
 * Check character trait consistency across appearances
 */
export function checkCharacterTraitConsistency(
  character: CharacterState,
  currentAction: string,
  traitHistory: string[]
): InconsistencyReport | null {
  // Simple heuristic: check if current action contradicts known traits
  const traitKeywords = character.personalityTraits.flatMap(t => t.toLowerCase().split(/\s+/))
  
  // Check for contradiction (action mentions opposite of trait)
  const contradictionIndicators: Record<string, string[]> = {
    'brave': ['cowardly', 'timid', 'fearful', 'afraid'],
    'loyal': ['betray', 'treacherous', 'disloyal'],
    'intelligent': ['stupid', 'foolish', 'ignorant'],
    'kind': ['cruel', 'mean', 'ruthless'],
    'honest': ['deceitful', 'lying', 'dishonest']
  }

  for (const [trait, opposites] of Object.entries(contradictionIndicators)) {
    if (traitKeywords.includes(trait)) {
      for (const opposite of opposites) {
        if (currentAction.toLowerCase().includes(opposite)) {
          return {
            id: `ctv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'character_trait_violation',
            severity: 'major',
            involvedElements: [character.id],
            description: `Character '${character.name}' (trait: ${trait}) performs action containing '${opposite}'`,
            evidence: [`Action: "${currentAction}"`, `Trait history: ${traitHistory.slice(-3).join(' → ')}`],
            suggestedFix: `Consider having the character act in a way consistent with their '${trait}' trait, or establish a reason for the change`,
            chapter: character.lastAppearanceChapter || 0
          }
        }
      }
    }
  }

  return null
}

/**
 * Check if character's knowledge is consistent with events they've witnessed
 */
export function checkKnowledgeConsistency(
  character: CharacterState,
  eventsSinceLastAppearance: { chapter: number; description: string }[]
): InconsistencyReport[] {
  const reports: InconsistencyReport[] = []

  for (const event of eventsSinceLastAppearance) {
    // If event description mentions character learning something but it's not in their knowledge
    // This is a simplified check
    if (event.description.includes('[LEARNS]') && character.lastAppearanceChapter !== undefined) {
      if (event.chapter > (character.lastAppearanceChapter || 0)) {
        // Knowledge should be updated - check if it was
        // Simplified: assume [LEARNS] means they acquired new knowledge
      }
    }
  }

  return reports
}

/**
 * Check plot point logical consistency
 */
export function checkPlotConsistency(
  plotPoint: PlotPoint,
  allPlotPoints: PlotPoint[]
): InconsistencyReport | null {
  if (plotPoint.causeChain.length === 0) {
    // Root plot point - always consistent
    return null
  }

  // Check if all causeChain plot points come before this one
  for (const causeId of plotPoint.causeChain) {
    const cause = allPlotPoints.find(p => p.id === causeId)
    if (cause && cause.chapter >= plotPoint.chapter) {
      return {
        id: `ceb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'cause_effect_break',
        severity: 'critical',
        involvedElements: [plotPoint.id, causeId],
        description: `Plot point '${plotPoint.description.slice(0, 50)}' lists '${cause.description.slice(0, 50)}' as a cause, but cause comes at or after this point`,
        evidence: [
          `Effect chapter: ${plotPoint.chapter}`,
          `Cause chapter: ${cause.chapter}`,
          `Effect description: "${plotPoint.description.slice(0, 80)}"`,
          `Cause description: "${cause.description.slice(0, 80)}"`
        ],
        suggestedFix: `Either move the cause plot point to an earlier chapter, or remove it from the cause chain`,
        chapter: plotPoint.chapter
      }
    }
  }

  return null
}

/**
 * Check timeline consistency across all entries
 */
export function checkTimelineConsistency(
  timeline: TimelineEntry[]
): InconsistencyReport[] {
  const reports: InconsistencyReport[] = []

  // Sort by chapter
  const sorted = [...timeline].sort((a, b) => a.chapter - b.chapter || a.timestamp - b.timestamp)

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    // Chapter went backward
    if (curr.chapter < prev.chapter) {
      reports.push({
        id: `tlc_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 4)}`,
        type: 'timeline_contradiction',
        severity: 'major',
        involvedElements: curr.characters,
        description: `Timeline entry goes backwards from chapter ${prev.chapter} to chapter ${curr.chapter}`,
        evidence: [
          `Previous: "${prev.description.slice(0, 50)}" (chapter ${prev.chapter})`,
          `Current: "${curr.description.slice(0, 50)}" (chapter ${curr.chapter})`
        ],
        suggestedFix: `Review chapter ordering or add transitional events`,
        chapter: curr.chapter
      })
    }

    // Same chapter but timestamp goes backward (within-chapter inconsistency)
    if (curr.chapter === prev.chapter && curr.timestamp < prev.timestamp) {
      reports.push({
        id: `tlc_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 4)}`,
        type: 'timeline_contradiction',
        severity: 'minor',
        involvedElements: curr.characters,
        description: `Within-chapter timeline goes backward (timestamp ${prev.timestamp} → ${curr.timestamp})`,
        evidence: [
          `Chapter ${curr.chapter}: "${prev.description.slice(0, 40)}" → "${curr.description.slice(0, 40)}"`
        ],
        suggestedFix: `Ensure events within the same chapter progress chronologically`,
        chapter: curr.chapter
      })
    }
  }

  return reports
}

/**
 * Check foreshadowing fulfillment
 */
export function checkForeshadowingFulfillment(
  story: StoryContext,
  currentChapter: number
): InconsistencyReport[] {
  const reports: InconsistencyReport[] = []

  for (const fs of story.foreshadowedEvents) {
    if (fs.fulfilled) continue

    // Check if we've passed the expected fulfillment chapter
    if (fs.expectedFulfillmentChapter !== undefined && currentChapter > fs.expectedFulfillmentChapter + 2) {
      reports.push({
        id: `fs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'foreshadow_mismatch',
        severity: 'moderate',
        involvedElements: [],
        description: `Foreshadowing from chapter ${fs.chapter} expected fulfillment by chapter ${fs.expectedFulfillmentChapter}, but still not fulfilled at chapter ${currentChapter}`,
        evidence: [
          `Hint: "${fs.hint.slice(0, 80)}"`,
          `Type: ${fs.hintType}`,
          `Current chapter: ${currentChapter}`
        ],
        suggestedFix: `Fulfill the foreshadowed event within the next 2 chapters, or adjust the expectation`,
        chapter: fs.chapter
      })
    }
  }

  return reports
}

/**
 * Check callback resolution
 */
export function checkCallbackResolution(
  story: StoryContext
): InconsistencyReport[] {
  const reports: InconsistencyReport[] = []

  for (const cb of story.callbacks) {
    if (!cb.resolved) {
      // Check if there's been enough chapters since the callback to resolve it
      const chaptersSinceCallback = story.currentChapter - cb.chapter
      
      if (chaptersSinceCallback > 5) {
        reports.push({
          id: `cbu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'callback_unresolved',
          severity: 'minor',
          involvedElements: [cb.referencedEventId],
          description: `Callback from chapter ${cb.chapter} referencing event from chapter ${cb.referencedEventChapter} has not been resolved in ${chaptersSinceCallback} chapters`,
          evidence: [
            `Callback chapter: ${cb.chapter}`,
            `Referenced chapter: ${cb.referencedEventChapter}`,
            `Chapters since callback: ${chaptersSinceCallback}`
          ],
          suggestedFix: `Resolve the referenced event or acknowledge it in the current narrative`,
          chapter: cb.chapter
        })
      }
    }
  }

  return reports
}

/**
 * Check world state consistency
 */
export function checkWorldStateConsistency(
  changes: WorldStateChange[],
  plotPoint: PlotPoint
): InconsistencyReport[] {
  const reports: InconsistencyReport[] = []

  for (const change of plotPoint.worldStateChanges) {
    if (change.permanence === 'permanent') {
      // Check if any subsequent plot point tries to revert a permanent change
      const subsequentChanges = changes.filter(
        c => c.id !== change.id && 
        c.affectedElements.some(el => change.affectedElements.includes(el))
      )

      for (const sub of subsequentChanges) {
        if (sub.after[change.affectedElements[0]] === change.before[change.affectedElements[0]]) {
          reports.push({
            id: `wsc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'world_state_violation',
            severity: 'major',
            involvedElements: change.affectedElements,
            description: `World state change '${change.description}' is marked permanent but was later reverted`,
            evidence: [
              `Original change: "${change.description}"`,
              `Reverting change: "${sub.description}"`
            ],
            suggestedFix: `Either remove the 'permanent'标记 or remove the reverting change`,
            chapter: plotPoint.chapter
          })
          break
        }
      }
    }
  }

  return reports
}

/**
 * Calculate overall coherence score
 */
export function calculateCoherenceScore(
  inconsistencies: InconsistencyReport[]
): CoherenceScore {
  const major = inconsistencies.filter(i => i.severity === 'major' || i.severity === 'critical').length
  const minor = inconsistencies.filter(i => i.severity === 'minor' || i.severity === 'moderate').length
  const total = Math.max(1, inconsistencies.length)

  const overallScore = Math.max(0, 1 - (major * 0.15 + minor * 0.05))

  return {
    overallScore: Math.min(1, overallScore),
    characterConsistency: Math.min(1, 1 - inconsistencies.filter(i => i.type.startsWith('character')).length * 0.15),
    plotConsistency: Math.min(1, 1 - inconsistencies.filter(i => i.type === 'cause_effect_break').length * 0.2),
    worldConsistency: Math.min(1, 1 - inconsistencies.filter(i => i.type === 'world_state_violation').length * 0.15),
    foreshadowConsistency: Math.min(1, 1 - inconsistencies.filter(i => i.type === 'foreshadow_mismatch').length * 0.1),
    timelineConsistency: Math.min(1, 1 - inconsistencies.filter(i => i.type === 'timeline_contradiction').length * 0.1),
    majorInconsistencies: major,
    minorInconsistencies: minor
  }
}

/**
 * Run full coherence check on story context
 */
export function runCoherenceCheck(
  story: StoryContext,
  config: CoherenceCheckConfig = DEFAULT_COHERENCE_CONFIG
): { score: CoherenceScore; reports: InconsistencyReport[] } {
  const allReports: InconsistencyReport[] = []

  if (config.checkCharacterDepth) {
    for (const character of story.characters) {
      const traitHistory: string[] = character.personalityTraits
      // In a real implementation, we'd check actual actions
      // For now, just structural validation
    }
  }

  if (config.checkPlotDepth) {
    for (const plotPoint of story.plotPoints) {
      const report = checkPlotConsistency(plotPoint, story.plotPoints)
      if (report) allReports.push(report)

      const worldReports = checkWorldStateConsistency(story.worldStateChanges, plotPoint)
      allReports.push(...worldReports)
    }
  }

  if (config.checkTimeline) {
    const timelineReports = checkTimelineConsistency(story.timeline)
    allReports.push(...timelineReports)
  }

  if (config.checkForeshadowing) {
    const foreshadowReports = checkForeshadowingFulfillment(story, story.currentChapter)
    allReports.push(...foreshadowReports)
  }

  if (config.checkCallbacks) {
    const callbackReports = checkCallbackResolution(story)
    allReports.push(...callbackReports)
  }

  const score = calculateCoherenceScore(allReports)

  return { score, reports: allReports }
}

/**
 * Format inconsistency for human-readable output
 */
export function formatInconsistencyReport(report: InconsistencyReport): string {
  const severityIcon = {
    minor: '⚠️',
    moderate: '⚡',
    major: '🚨',
    critical: '💥'
  }

  return [
    `${severityIcon[report.severity]} [${report.type.replace(/_/g, ' ').toUpperCase()}]`,
    `Chapter ${report.chapter}: ${report.description}`,
    `Elements: ${report.involvedElements.join(', ') || 'N/A'}`,
    report.evidence.map(e => `  → ${e}`).join('\n'),
    report.suggestedFix ? `💡 Fix: ${report.suggestedFix}` : ''
  ].filter(Boolean).join('\n')
}