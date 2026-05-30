/**
 * PlotContinuityEngine Types - V91
 * Narrative Thread Continuity and Causal Integrity
 * 
 * Tracks narrative threads across chapters ensuring:
 * - Thread state consistency (promises made must be paid off)
 * - Causal chain integrity (events must have valid causes)
 * - Foreshadowing registration and payoff tracking
 * - Plot hole detection (unresolved setup, broken continuity)
 * - Timeline consistency across parallel storylines
 * 
 * Inspired by thunderbolt's pipeline architecture + ruflo's hierarchical decomposition.
 */

import type { SkillNode } from '../evolution/SkillGraph'

// ===============================================================================
// Narrative Thread Types
// ===============================================================================

export type ThreadType = 'main_plot' | 'subplot' | 'character_arc' | 'relationship' | 'mystery' | 'world_building'

export type ThreadStatus = 'active' | 'paid_off' | 'abandoned' | 'deferred'

export interface NarrativeThread {
  id: string
  type: ThreadType
  name: string
  introducedChapter: number
  description: string                    // What the thread is about
  setupCount: number                      // Number of times this thread was set up
  payoffCount: number                     // Number of times this thread was resolved
  status: ThreadStatus
  urgency: number                         // 0-1 how urgently it needs resolution
  parentThreadId?: string                 // For sub-threads
  connectedThreads: string[]              // Related threads
}

export interface ThreadState {
  setupPromises: SetupPromise[]
  unresolvedPayoffs: string[]             // Payoffs not yet delivered
  pendingForeshadowing: Foreshadow[]
  satisfiedThreads: string[]              // Threads fully paid off
  abandonedThreads: string[]             // Threads abandoned without payoff
}

export interface SetupPromise {
  id: string
  threadId: string
  setupText: string                      // What was promised
  setupChapter: number
  promisedPayoffChapter?: number         // Optional deadline
  fulfilled: boolean
  fulfilledChapter?: number
  description: string                    // Human-readable description
}

export interface Foreshadow {
  id: string
  threadId: string
  hintText: string
  chapter: number
  strength: number                       // 0-1 how obvious the hint was
  paidOff: boolean
  payoffChapter?: number
  payoffQuality: number                  // 0-1 how well it was paid off
}

export interface PlotHole {
  id: string
  type: 'broken_continuity' | 'unfulfilled_setup' | 'causality_gap' | 'timeline_inconsistency' | 'character_knowledge_inconsistency'
  severity: 'critical' | 'major' | 'minor'
  description: string
  affectedThreads: string[]
  chapter: number
  suggestion: string
}

export interface ContinuityReport {
  isClean: boolean
  plotHoles: PlotHole[]
  threadStates: ThreadState
  warnings: string[]
  suggestions: string[]
  overallHealthScore: number             // 0-100
}

// ===============================================================================
// Timeline Consistency Types
// ===============================================================================

export interface TimelineEntry {
  chapter: number
  eventName: string
  description: string
  characters: string[]
  location?: string
  causality: string[]                    // Events this leads to
  reverseCausedBy: string[]              // Events that caused this
  isPivotal: boolean                    // Major plot point
  affectsThreads: string[]
}

export interface ParallelTimeline {
  id: string
  name: string                           // e.g., "Main Story", "Backstory", "Flashback"
  startChapter: number
  endChapter: number
  entries: TimelineEntry[]
  threadIds: string[]
}

export interface TimelineConflict {
  type: 'ordering' | 'simultaneity' | 'causality'
  eventAId: string
  eventBId: string
  description: string
  severity: 'critical' | 'major' | 'minor'
}

// ===============================================================================
// Configuration
// ===============================================================================

export interface ContinuityConfig {
  maxThreadsPerType: number
  foreshadowWindowChapters: number       // How far ahead foreshadowing can be placed
  setupPayoffMaxGap: number             // Max chapters between setup and payoff
  minForeshadowStrength: number         // Minimum strength for foreshadow to count
  threadUrgencyGrowthRate: number      // How fast urgency grows per chapter
  deferredPayoffPenalty: number         // Penalty score for late payoffs
}

export const DEFAULT_CONTINUITY_CONFIG: ContinuityConfig = {
  maxThreadsPerType: 10,
  foreshadowWindowChapters: 20,
  setupPayoffMaxGap: 30,
  minForeshadowStrength: 0.3,
  threadUrgencyGrowthRate: 0.05,
  deferredPayoffPenalty: 10
}

// ===============================================================================
// Factory Functions
// ===============================================================================

/**
 * Create narrative thread
 */
export function createThread(
  id: string,
  type: ThreadType,
  name: string,
  chapter: number,
  description: string
): NarrativeThread {
  return {
    id,
    type,
    name,
    introducedChapter: chapter,
    description,
    setupCount: 0,
    payoffCount: 0,
    status: 'active',
    urgency: 0,
    connectedThreads: []
  }
}

/**
 * Create setup promise
 */
export function createSetupPromise(
  threadId: string,
  setupText: string,
  chapter: number,
  description: string
): SetupPromise {
  return {
    id: `sp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    setupText,
    setupChapter: chapter,
    fulfilled: false,
    description
  }
}

/**
 * Create foreshadow
 */
export function createForeshadow(
  threadId: string,
  hintText: string,
  chapter: number,
  strength: number = 0.5
): Foreshadow {
  return {
    id: `fs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    hintText,
    chapter,
    strength,
    paidOff: false,
    payoffQuality: 0
  }
}

/**
 * Create plot hole
 */
export function createPlotHole(
  type: PlotHole['type'],
  description: string,
  severity: PlotHole['severity'],
  chapter: number,
  suggestion: string,
  affectedThreads: string[] = []
): PlotHole {
  return {
    id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    severity,
    description,
    affectedThreads,
    chapter,
    suggestion
  }
}

// =============================================================================
// Thread State Management
// =============================================================================

/**
 * Create empty thread state
 */
export function createEmptyThreadState(): ThreadState {
  return {
    setupPromises: [],
    unresolvedPayoffs: [],
    pendingForeshadowing: [],
    satisfiedThreads: [],
    abandonedThreads: []
  }
}

/**
 * Register setup promise
 */
export function registerSetup(
  state: ThreadState,
  threadId: string,
  setupText: string,
  chapter: number,
  description: string
): ThreadState {
  const promise = createSetupPromise(threadId, setupText, chapter, description)
  return {
    ...state,
    setupPromises: [...state.setupPromises, promise],
    unresolvedPayoffs: [...state.unresolvedPayoffs, promise.id]
  }
}

/**
 * Register foreshadowing
 */
export function registerForeshadow(
  state: ThreadState,
  threadId: string,
  hintText: string,
  chapter: number,
  strength: number = 0.5
): ThreadState {
  const foreshadow = createForeshadow(threadId, hintText, chapter, strength)
  return {
    ...state,
    pendingForeshadowing: [...state.pendingForeshadowing, foreshadow]
  }
}

/**
 * Fulfil setup promise (payoff)
 */
export function fulfilSetup(
  state: ThreadState,
  promiseId: string,
  chapter: number
): ThreadState {
  const promises = state.setupPromises.map(p =>
    p.id === promiseId
      ? { ...p, fulfilled: true, fulfilledChapter: chapter }
      : p
  )
  return {
    ...state,
    setupPromises: promises,
    unresolvedPayoffs: state.unresolvedPayoffs.filter(id => id !== promiseId)
  }
}

/**
 * Pay off foreshadow
 */
export function payOffForeshadow(
  state: ThreadState,
  foreshadowId: string,
  chapter: number,
  quality: number = 0.8
): ThreadState {
  const foreshadowing = state.pendingForeshadowing.map(f =>
    f.id === foreshadowId
      ? { ...f, paidOff: true, payoffChapter: chapter, payoffQuality: quality }
      : f
  )
  return {
    ...state,
    pendingForeshadowing: foreshadowing
  }
}

/**
 * Abandon thread
 */
export function abandonThread(
  state: ThreadState,
  threadId: string
): ThreadState {
  return {
    ...state,
    satisfiedThreads: state.satisfiedThreads.filter(id => id !== threadId),
    abandonedThreads: [...state.abandonedThreads, threadId],
    unresolvedPayoffs: state.unresolvedPayoffs.filter(id => {
      const promise = state.setupPromises.find(p => p.id === id)
      return promise?.threadId !== threadId
    })
  }
}

// =============================================================================
// Analysis Functions
// =============================================================================

/**
 * Calculate thread urgency
 */
export function calculateThreadUrgency(
  thread: NarrativeThread,
  currentChapter: number,
  config: ContinuityConfig = DEFAULT_CONTINUITY_CONFIG
): number {
  if (thread.status !== 'active') return 0

  const chaptersActive = currentChapter - thread.introducedChapter
  const baseUrgency = thread.setupCount - thread.payoffCount
  const timeUrgency = chaptersActive * config.threadUrgencyGrowthRate
  const unresolvedPromises = thread.setupCount - thread.payoffCount

  return Math.min(1, Math.max(0, baseUrgency * 0.5 + timeUrgency * 0.3 + unresolvedPromises * 0.2))
}

/**
 * Detect plot holes
 */
export function detectPlotHoles(
  state: ThreadState,
  threads: Map<string, NarrativeThread>,
  currentChapter: number,
  config: ContinuityConfig = DEFAULT_CONTINUITY_CONFIG
): PlotHole[] {
  const holes: PlotHole[] = []

  // Unfulfilled setup promises
  for (const promise of state.setupPromises) {
    if (promise.fulfilled) continue

    const gap = currentChapter - promise.setupChapter
    if (gap > config.setupPayoffMaxGap) {
      const thread = threads.get(promise.threadId)
      holes.push(createPlotHole(
        'unfulfilled_setup',
        `Setup promise "${promise.description}" from chapter ${promise.setupChapter} has not been fulfilled after ${gap} chapters`,
        gap > config.setupPayoffMaxGap * 1.5 ? 'major' : 'minor',
        promise.setupChapter,
        `Resolve this setup in the next ${config.foreshadowWindowChapters} chapters or explicitly abandon/defer it`,
        [promise.threadId]
      ))
    }
  }

  // Abandoned threads without payoff
  for (const thread of Array.from(threads.values())) {
    if (thread.status === 'abandoned' && thread.setupCount > thread.payoffCount) {
      holes.push(createPlotHole(
        'unfulfilled_setup',
        `Thread "${thread.name}" was abandoned with ${thread.setupCount - thread.payoffCount} unfulfilled setups`,
        'minor',
        thread.introducedChapter,
        'Either resolve the thread or explicitly mark it as deferred',
        [thread.id]
      ))
    }
  }

  // Threads with too many setups without payoff
  for (const thread of Array.from(threads.values())) {
    if (thread.status === 'active' && thread.setupCount > thread.payoffCount + 3) {
      holes.push(createPlotHole(
        'unfulfilled_setup',
        `Thread "${thread.name}" has ${thread.setupCount} setups but only ${thread.payoffCount} payoffs`,
        'minor',
        thread.introducedChapter,
        `Distribute payoffs more evenly across the thread lifecycle`,
        [thread.id]
      ))
    }
  }

  // Unpaid foreshadowing beyond window
  for (const foreshadow of state.pendingForeshadowing) {
    if (foreshadow.paidOff) continue

    const gap = currentChapter - foreshadow.chapter
    if (gap > config.foreshadowWindowChapters) {
      holes.push(createPlotHole(
        'unfulfilled_setup',
        `Foreshadowing "${foreshadow.hintText}" from chapter ${foreshadow.chapter} has not been paid off after ${gap} chapters`,
        'minor',
        foreshadow.chapter,
        `Pay off this foreshadowing or adjust the setup`,
        [foreshadow.threadId]
      ))
    }
  }

  return holes
}

/**
 * Check timeline consistency
 */
export function checkTimelineConsistency(
  timelines: ParallelTimeline[]
): TimelineConflict[] {
  const conflicts: TimelineConflict[] = []

  for (const timeline of timelines) {
    const entries = timeline.entries.sort((a, b) => a.chapter - b.chapter)

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]
        const b = entries[j]

        // Check causality chain
        if (a.causality.includes(b.eventName) && a.chapter >= b.chapter) {
          conflicts.push({
            type: 'causality',
            eventAId: a.eventName,
            eventBId: b.eventName,
            description: `Event "${a.eventName}" causes "${b.eventName}" but occurs at same or later chapter`,
            severity: 'critical'
          })
        }
      }
    }
  }

  // Check cross-timeline simultaneity conflicts
  for (let i = 0; i < timelines.length; i++) {
    for (let j = i + 1; j < timelines.length; j++) {
      const tlA = timelines[i]
      const tlB = timelines[j]

      for (const entryA of tlA.entries) {
        for (const entryB of tlB.entries) {
          if (entryA.chapter === entryB.chapter) {
            // Same chapter, different timelines - check for character conflicts
            const sharedChars = entryA.characters.filter(c => entryB.characters.includes(c))
            if (sharedChars.length > 0 && entryA.location !== entryB.location) {
              conflicts.push({
                type: 'simultaneity',
                eventAId: entryA.eventName,
                eventBId: entryB.eventName,
                description: `Characters [${sharedChars.join(', ')}] appear in both "${entryA.eventName}" and "${entryB.eventName}" at chapter ${entryA.chapter} but in different locations`,
                severity: 'major'
              })
            }
          }
        }
      }
    }
  }

  return conflicts
}

/**
 * Generate continuity report
 */
export function generateContinuityReport(
  state: ThreadState,
  threads: Map<string, NarrativeThread>,
  timelines: ParallelTimeline[],
  currentChapter: number,
  config: ContinuityConfig = DEFAULT_CONTINUITY_CONFIG
): ContinuityReport {
  const plotHoles = detectPlotHoles(state, threads, currentChapter, config)
  const timelineConflicts = checkTimelineConsistency(timelines)

  const criticalHoles = plotHoles.filter(h => h.severity === 'critical')
  const isClean = criticalHoles.length === 0 && timelineConflicts.filter(c => c.severity === 'critical').length === 0

  // Calculate health score
  const totalThreads = threads.size
  const activeThreads = Array.from(threads.values()).filter(t => t.status === 'active').length
  const satisfiedThreads = state.satisfiedThreads.length
  const unresolvedCount = state.unresolvedPayoffs.length

  let healthScore = 100
  healthScore -= criticalHoles.length * 20
  healthScore -= plotHoles.filter(h => h.severity === 'major').length * 10
  healthScore -= plotHoles.filter(h => h.severity === 'minor').length * 3
  healthScore -= unresolvedCount * 2
  healthScore -= timelineConflicts.filter(c => c.severity === 'critical').length * 15

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)))

  const warnings: string[] = []
  const suggestions: string[] = []

  if (unresolvedCount > 5) {
    warnings.push(`${unresolvedCount} unresolved setup promises - risk of forgotten setups`)
  }

  if (plotHoles.length > 0) {
    warnings.push(`${plotHoles.length} plot holes detected`)
  }

  if (activeThreads > 15) {
    suggestions.push(`Consider consolidating threads - ${activeThreads} active threads may overwhelm readers`)
  }

  const allHoles = [
    ...plotHoles,
    ...timelineConflicts.map(c => ({
      id: `tc-${c.eventAId}`,
      type: 'timeline_inconsistency' as const,
      severity: c.severity,
      description: c.description,
      affectedThreads: [] as string[],
      chapter: 0,
      suggestion: 'Review timeline ordering and causality'
    }))
  ]

  return {
    isClean,
    plotHoles: allHoles,
    threadStates: state,
    warnings,
    suggestions,
    overallHealthScore: healthScore
  }
}

/**
 * Format continuity summary
 */
export function formatContinuitySummary(report: ContinuityReport): string {
  const lines = [
    `=== Plot Continuity Report ===`,
    `Health Score: ${report.overallHealthScore}/100`,
    `Status: ${report.isClean ? '✅ Clean' : '⚠️ Issues Found'}`,
    ``,
    `Threads:`,
    `  Active setups: ${report.threadStates.unresolvedPayoffs.length}`,
    `  Pending foreshadowing: ${report.threadStates.pendingForeshadowing.length}`,
    `  Satisfied threads: ${report.threadStates.satisfiedThreads.length}`,
    `  Abandoned: ${report.threadStates.abandonedThreads.length}`,
    ``
  ]

  if (report.warnings.length > 0) {
    lines.push(`Warnings:`)
    for (const w of report.warnings) {
      lines.push(`  ⚠️ ${w}`)
    }
    lines.push('')
  }

  if (report.suggestions.length > 0) {
    lines.push(`Suggestions:`)
    for (const s of report.suggestions) {
      lines.push(`  💡 ${s}`)
    }
    lines.push('')
  }

  if (report.plotHoles.length > 0) {
    lines.push(`Plot Holes (${report.plotHoles.length}):`)
    for (const hole of report.plotHoles.slice(0, 5)) {
      lines.push(`  [${hole.severity}] ${hole.description}`)
    }
    if (report.plotHoles.length > 5) {
      lines.push(`  ... and ${report.plotHoles.length - 5} more`)
    }
  }

  return lines.join('\n')
}

/**
 * Calculate thread satisfaction score
 */
export function calculateThreadSatisfaction(thread: NarrativeThread): number {
  if (thread.setupCount === 0) return 100
  const ratio = thread.payoffCount / thread.setupCount
  const statusBonus = thread.status === 'paid_off' ? 20 : thread.status === 'abandoned' ? -30 : 0
  return Math.min(100, Math.round(ratio * 100 + statusBonus))
}