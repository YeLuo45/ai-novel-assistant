/**
 * AdaptiveNarrativePlanner — V333
 * Long-term narrative arc planning, multi-threaded story management, adaptive plot evolution.
 * Inspired by: generic-agent (autonomous planning), ruflo (hierarchical decomposition), thunderbolt (feedback loops)
 */

export interface NarrativeArc {
  arcId: string
  name: string
  startChapter: number
  endChapter: number
  primaryThread: string
  subThreads: string[]
  milestones: { chapter: number; event: string; achieved: boolean }[]
  tension arc: number[]  // tension at each chapter in arc
}

export interface PlotThread {
  threadId: string
  name: string
  priority: number        // 1-10, higher = more central
  dependencyIds: string[] // threads that must progress first
  chapters: Map<number, string>  // chapter -> summary
  resonanceWith: string[] // threads that amplify each other
}

export interface StoryEvolutionPlan {
  currentArc: string
  nextChapters: { chapter: number; focus: string; threads: string[]; targetTension: number }[]
  adaptationTriggers: { condition: string; action: string }[]
  riskFactors: { threadId: string; risk: string; mitigation: string }[]
}

export interface AdaptiveNarrativeState {
  arcs: Map<string, NarrativeArc>
  threads: Map<string, PlotThread>
  evolutionPlan: StoryEvolutionPlan | null
  completedMilestones: string[]
  activeThreads: string[]
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): AdaptiveNarrativeState {
  return {
    arcs: new Map(),
    threads: new Map(),
    evolutionPlan: null,
    completedMilestones: [],
    activeThreads: [],
    typeAlias: {},
  }
}

// Create a narrative arc
export function createArc(
  state: AdaptiveNarrativeState,
  arcId: string,
  name: string,
  startChapter: number,
  endChapter: number,
  primaryThread: string,
  subThreads: string[] = []
): AdaptiveNarrativeState {
  const arc: NarrativeArc = {
    arcId,
    name,
    startChapter,
    endChapter,
    primaryThread,
    subThreads,
    milestones: [],
    tensionArc: [],
  }

  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, arc)
  return { ...state, arcs: newArcs }
}

// Create a plot thread
export function createThread(
  state: AdaptiveNarrativeState,
  threadId: string,
  name: string,
  priority: number,
  dependencyIds: string[] = [],
  resonanceWith: string[] = []
): AdaptiveNarrativeState {
  const thread: PlotThread = {
    threadId,
    name,
    priority,
    dependencyIds,
    chapters: new Map(),
    resonanceWith,
  }

  const newThreads = new Map(state.threads)
  newThreads.set(threadId, thread)
  return { ...state, threads: newThreads }
}

// Add milestone to arc
export function addMilestone(
  state: AdaptiveNarrativeState,
  arcId: string,
  chapter: number,
  event: string
): AdaptiveNarrativeState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state

  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, {
    ...arc,
    milestones: [...arc.milestones, { chapter, event, achieved: false }],
  })
  return { ...state, arcs: newArcs }
}

// Mark milestone as achieved
export function achieveMilestone(
  state: AdaptiveNarrativeState,
  arcId: string,
  milestoneIndex: number
): AdaptiveNarrativeState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state

  const newMilestones = [...arc.milestones]
  newMilestones[milestoneIndex] = { ...newMilestones[milestoneIndex], achieved: true }

  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, { ...arc, milestones: newMilestones })

  return {
    ...state,
    arcs: newArcs,
    completedMilestones: [...state.completedMilestones, `${arcId}:${milestoneIndex}`],
  }
}

// Update thread progress for a chapter
export function updateThreadProgress(
  state: AdaptiveNarrativeState,
  threadId: string,
  chapter: number,
  summary: string
): AdaptiveNarrativeState {
  const thread = state.threads.get(threadId)
  if (!thread) return state

  const newThreads = new Map(state.threads)
  const newChapters = new Map(thread.chapters)
  newChapters.set(chapter, summary)
  newThreads.set(threadId, { ...thread, chapters: newChapters })

  return { ...state, threads: newThreads }
}

// Generate story evolution plan
export function generateEvolutionPlan(
  state: AdaptiveNarrativeState,
  currentChapter: number,
  targetChapterCount: number
): StoryEvolutionPlan {
  const nextChapters: StoryEvolutionPlan['nextChapters'] = []

  // Find the active arc
  let activeArc: NarrativeArc | null = null
  for (const arc of state.arcs.values()) {
    if (currentChapter >= arc.startChapter && currentChapter <= arc.endChapter) {
      activeArc = arc
      break
    }
  }

  if (!activeArc) {
    // Create a default plan
    for (let ch = currentChapter + 1; ch <= targetChapterCount; ch++) {
      nextChapters.push({ chapter: ch, focus: 'advance main plot', threads: [], targetTension: 50 })
    }
  } else {
    // Plan based on arc milestones
    const remainingMilestones = activeArc.milestones.filter(m => m.chapter >= currentChapter && !m.achieved)
    
    for (let ch = currentChapter + 1; ch <= targetChapterCount; ch++) {
      const nearby = remainingMilestones.find(m => Math.abs(m.chapter - ch) <= 2)
      nextChapters.push({
        chapter: ch,
        focus: nearby ? nearby.event : 'advance plot',
        threads: [activeArc.primaryThread, ...activeArc.subThreads],
        targetTension: calculateTargetTension(ch, activeArc),
      })
    }
  }

  const adaptationTriggers = generateAdaptationTriggers(state, currentChapter)
  const riskFactors = analyzeRiskFactors(state, currentChapter)

  return {
    currentArc: activeArc?.arcId || 'unknown',
    nextChapters,
    adaptationTriggers,
    riskFactors,
  }
}

function calculateTargetTension(chapter: number, arc: NarrativeArc): number {
  const total = arc.endChapter - arc.startChapter
  const progress = (chapter - arc.startChapter) / total
  // Classic tension arc: slow rise, peak at ~75%, then resolve
  if (progress < 0.5) return Math.round(30 + progress * 80)
  if (progress < 0.75) return Math.round(70 + (progress - 0.5) * 80)
  return Math.round(110 - (progress - 0.75) * 120)
}

function generateAdaptationTriggers(
  state: AdaptiveNarrativeState,
  currentChapter: number
): { condition: string; action: string }[] {
  const triggers: { condition: string; action: string }[] = []

  // Check for thread dependency issues
  for (const thread of state.threads.values()) {
    for (const depId of thread.dependencyIds) {
      const dep = state.threads.get(depId)
      if (dep && dep.chapters.size === 0) {
        triggers.push({
          condition: `Thread ${thread.name} depends on ${dep.name} but ${dep.name} has no progress`,
          action: `Prioritize development of ${dep.name} before advancing ${thread.name}`,
        })
      }
    }
  }

  // Check for low-priority thread blocking high-priority
  if (state.threads.size > 3) {
    triggers.push({
      condition: 'Multiple active threads may dilute reader focus',
      action: 'Consider consolidating threads or deferring lower-priority threads',
    })
  }

  return triggers
}

function analyzeRiskFactors(
  state: AdaptiveNarrativeState,
  currentChapter: number
): { threadId: string; risk: string; mitigation: string }[] {
  const risks: { threadId: string; risk: string; mitigation: string }[] = []

  for (const thread of state.threads.values()) {
    if (thread.chapters.size === 0 && currentChapter > 5) {
      risks.push({
        threadId: thread.threadId,
        risk: `${thread.name} has no progress despite being active`,
        mitigation: 'Add dedicated chapter for this thread soon',
      })
    }

    if (thread.dependencyIds.length > 2) {
      risks.push({
        threadId: thread.threadId,
        risk: `${thread.name} has too many dependencies (${thread.dependencyIds.length})`,
        mitigation: 'Simplify thread dependencies to avoid blocking',
      })
    }
  }

  return risks
}

// Validate story structure
export function validateStoryStructure(
  state: AdaptiveNarrativeState
): {
  valid: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []

  if (state.arcs.size === 0) {
    issues.push('No narrative arcs defined')
  }

  if (state.threads.size === 0) {
    issues.push('No plot threads defined')
  } else {
    // Check for orphaned threads (no arc references them)
    const threadIds = new Set(state.threads.keys())
    for (const arc of state.arcs.values()) {
      threadIds.delete(arc.primaryThread)
      for (const st of arc.subThreads) threadIds.delete(st)
    }
    if (threadIds.size > 0) {
      suggestions.push(`${threadIds.size} threads not connected to any arc`)}
  }

  // Check for circular dependencies
  const visited = new Set<string>()
  const stack = new Set<string>()

  function hasCycle(threadId: string): boolean {
    if (stack.has(threadId)) return true
    if (visited.has(threadId)) return false
    stack.add(threadId)
    const thread = state.threads.get(threadId)
    if (thread) {
      for (const depId of thread.dependencyIds) {
        if (hasCycle(depId)) return true
      }
    }
    stack.delete(threadId)
    visited.add(threadId)
    return false
  }

  for (const threadId of state.threads.keys()) {
    if (hasCycle(threadId)) {
      issues.push(`Circular dependency detected in thread ${threadId}`)
      break
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  }
}

// Get thread priority ordering
export function getThreadPriorityOrder(state: AdaptiveNarrativeState): string[] {
  return Array.from(state.threads.values())
    .sort((a, b) => b.priority - a.priority)
    .map(t => t.threadId)
}

// Get arc completion percentage
export function getArcCompletion(
  state: AdaptiveNarrativeState,
  arcId: string,
  currentChapter: number
): number {
  const arc = state.arcs.get(arcId)
  if (!arc) return 0

  const progress = (currentChapter - arc.startChapter) / (arc.endChapter - arc.startChapter)
  const milestoneProgress = arc.milestones.filter(m => m.achieved).length / Math.max(1, arc.milestones.length)

  return Math.round((Math.min(1, progress) * 0.7 + milestoneProgress * 0.3) * 100)
}

// Suggest next actions based on current state
export function suggestNextActions(
  state: AdaptiveNarrativeState,
  currentChapter: number
): { priority: number; action: string; reason: string }[] {
  const actions: { priority: number; action: string; reason: string }[] = []

  // Check for unachieved milestones coming soon
  for (const arc of state.arcs.values()) {
    const upcoming = arc.milestones
      .filter(m => m.chapter > currentChapter && m.chapter <= currentChapter + 3 && !m.achieved)
    if (upcoming.length > 0) {
      actions.push({
        priority: 10 - upcoming[0].chapter + currentChapter,
        action: `Prepare milestone: ${upcoming[0].event}`,
        reason: `Milestone at chapter ${upcoming[0].chapter}`,
      })
    }
  }

  // Check for threads that need progress
  for (const thread of state.threads.values()) {
    if (thread.chapters.size === 0 && currentChapter > 3) {
      actions.push({
        priority: 5,
        action: `Develop thread: ${thread.name}`,
        reason: 'Thread has no progress yet',
      })
    }
  }

  // Check for low-tension chapters ahead
  const plan = generateEvolutionPlan(state, currentChapter, currentChapter + 5)
  for (const ch of plan.nextChapters) {
    if (ch.targetTension < 40) {
      actions.push({
        priority: 3,
        action: `Build tension in chapter ${ch.chapter}`,
        reason: `Target tension ${ch.targetTension} is low`,
      })
    }
  }

  return actions.sort((a, b) => b.priority - a.priority)
}
