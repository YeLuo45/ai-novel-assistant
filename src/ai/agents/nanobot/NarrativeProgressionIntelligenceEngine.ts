/**
 * NarrativeProgressionIntelligenceEngine — V535
 * Tracks narrative progression, milestone detection, and story health metrics.
 * Inspired by: thunderbolt (feedback loops) + ruflo (hierarchical decomposition) + claude-code (precise control)
 */

export interface NarrativeMilestone {
  id: string
  chapter: number
  type: 'setup' | 'inciting' | 'rising' | 'climax' | 'falling' | 'resolution' | 'theme_reveal' | 'character_arc'
  description: string
  intensity: number  // 0-100
  achieved: boolean
  prerequisiteMilestones: string[]
}

export interface CharacterArcProgress {
  characterId: string
  arcType: 'transformation' | 'growth' | 'fall' | 'stasis' | 'revelation'
  startState: string
  currentState: string
  targetState: string
  progressPercent: number  // 0-100
  keyMoments: Array<{ chapter: number, description: string }>
}

export interface ProgressionState {
  milestones: Record<string, NarrativeMilestone>
  characterArcs: Record<string, CharacterArcProgress>
  globalProgressScore: number  // 0-100
  storyHealth: {
    pacingHealth: number      // 0-100
    tensionHealth: number     // 0-100
    characterHealth: number   // 0-100
    thematicHealth: number     // 0-100
    overall: number           // weighted average
  }
  chapterProgress: Array<{ chapter: number, progress: number, velocity: number }>
  predictedCompletion: number | null  // estimated remaining chapters
}

export function createEmptyState(): ProgressionState {
  return {
    milestones: {},
    characterArcs: {},
    globalProgressScore: 0,
    storyHealth: {
      pacingHealth: 100,
      tensionHealth: 100,
      characterHealth: 100,
      thematicHealth: 100,
      overall: 100
    },
    chapterProgress: [],
    predictedCompletion: null
  }
}

export function registerMilestone(
  state: ProgressionState,
  milestoneId: string,
  chapter: number,
  milestoneType: NarrativeMilestone['type'],
  description: string,
  intensity: number,
  prerequisiteMilestones: string[] = []
): ProgressionState {
  if (state.milestones[milestoneId]) return state

  return {
    ...state,
    milestones: {
      ...state.milestones,
      [milestoneId]: {
        id: milestoneId,
        chapter,
        type: milestoneType,
        description,
        intensity,
        achieved: false,
        prerequisiteMilestones
      }
    }
  }
}

export function achieveMilestone(state: ProgressionState, milestoneId: string, chapter: number): ProgressionState {
  const milestone = state.milestones[milestoneId]
  if (!milestone || milestone.achieved) return state

  // Check prerequisites
  for (const prereqId of milestone.prerequisiteMilestones) {
    const prereq = state.milestones[prereqId]
    if (prereq && !prereq.achieved) return state
  }

  return {
    ...state,
    milestones: {
      ...state.milestones,
      [milestoneId]: {
        ...milestone,
        achieved: true,
        chapter
      }
    }
  }
}

export function initCharacterArc(
  state: ProgressionState,
  characterId: string,
  arcType: CharacterArcProgress['arcType'],
  startState: string,
  targetState: string
): ProgressionState {
  if (state.characterArcs[characterId]) return state

  return {
    ...state,
    characterArcs: {
      ...state.characterArcs,
      [characterId]: {
        characterId,
        arcType,
        startState,
        currentState: startState,
        targetState,
        progressPercent: 0,
        keyMoments: []
      }
    }
  }
}

export function updateCharacterArc(
  state: ProgressionState,
  characterId: string,
  chapter: number,
  newState: string,
  momentDescription: string
): ProgressionState {
  const arc = state.characterArcs[characterId]
  if (!arc) return state

  // Calculate progress based on state similarity
  let progressPercent = arc.progressPercent
  if (newState === arc.targetState) {
    progressPercent = 100
  } else if (newState !== arc.currentState) {
    // Simple incremental progress for state changes
    const stateChangeBonus = Math.round(100 / (5))  // Assume ~5 major states
    progressPercent = Math.min(95, arc.progressPercent + stateChangeBonus)
  }

  const keyMoments = [...arc.keyMoments, { chapter, description: momentDescription }]

  return {
    ...state,
    characterArcs: {
      ...state.characterArcs,
      [characterId]: {
        ...arc,
        currentState: newState,
        progressPercent,
        keyMoments
      }
    }
  }
}

export function updateChapterProgress(state: ProgressionState, chapter: number, progress: number): ProgressionState {
  const existingIdx = state.chapterProgress.findIndex(cp => cp.chapter === chapter)
  const velocity = existingIdx >= 0 ? progress - state.chapterProgress[existingIdx].progress : progress

  const chapterProgress = [...state.chapterProgress]
  if (existingIdx >= 0) {
    chapterProgress[existingIdx] = { chapter, progress, velocity }
  } else {
    chapterProgress.push({ chapter, progress, velocity })
  }

  // Sort by chapter
  chapterProgress.sort((a, b) => a.chapter - b.chapter)

  // Predict completion
  let predictedCompletion: number | null = null
  if (chapterProgress.length >= 3) {
    const recentChapters = chapterProgress.slice(-3)
    const avgVelocity = recentChapters.reduce((s, cp) => s + cp.velocity, 0) / 3
    if (avgVelocity > 0) {
      const remaining = 100 - progress
      predictedCompletion = Math.ceil(chapter + remaining / avgVelocity)
    }
  }

  return { ...state, chapterProgress, predictedCompletion }
}

export function updateStoryHealth(
  state: ProgressionState,
  pacingHealth?: number,
  tensionHealth?: number,
  characterHealth?: number,
  thematicHealth?: number
): ProgressionState {
  const storyHealth = { ...state.storyHealth }
  let updated = false

  if (pacingHealth !== undefined) { storyHealth.pacingHealth = pacingHealth; updated = true }
  if (tensionHealth !== undefined) { storyHealth.tensionHealth = tensionHealth; updated = true }
  if (characterHealth !== undefined) { storyHealth.characterHealth = characterHealth; updated = true }
  if (thematicHealth !== undefined) { storyHealth.thematicHealth = thematicHealth; updated = true }

  if (updated) {
    storyHealth.overall = Math.round(
      (storyHealth.pacingHealth * 0.2 +
       storyHealth.tensionHealth * 0.3 +
       storyHealth.characterHealth * 0.3 +
       storyHealth.thematicHealth * 0.2)
    )
  }

  return { ...state, storyHealth }
}

export function calculateGlobalProgress(state: ProgressionState): number {
  const milestoneWeight = 0.4
  const arcWeight = 0.3
  const healthWeight = 0.3

  const achievedMilestones = Object.values(state.milestones).filter(m => m.achieved).length
  const totalMilestones = Object.keys(state.milestones).length
  const milestoneProgress = totalMilestones > 0 ? (achievedMilestones / totalMilestones) * 100 : 0

  const arcProgresses = Object.values(state.characterArcs).map(a => a.progressPercent)
  const avgArcProgress = arcProgresses.length > 0
    ? arcProgresses.reduce((s, p) => s + p, 0) / arcProgresses.length
    : 0

  const healthScore = state.storyHealth.overall

  const globalProgress = Math.round(
    milestoneProgress * milestoneWeight +
    avgArcProgress * arcWeight +
    healthScore * healthWeight
  )

  return globalProgress
}

export function getNextRecommendedMilestone(state: ProgressionState): NarrativeMilestone | null {
  const unachieved = Object.values(state.milestones)
    .filter(m => !m.achieved)
    .filter(m => m.prerequisiteMilestones.every(prereqId => state.milestones[prereqId]?.achieved))
    .sort((a, b) => a.chapter - b.chapter || b.intensity - a.intensity)

  return unachieved[0] || null
}

export function getProgressionSummary(state: ProgressionState): {
  totalMilestones: number
  achievedMilestones: number
  totalCharacterArcs: number
  completeCharacterArcs: number
  globalProgressScore: number
  storyHealthOverall: number
  predictedCompletion: number | null
} {
  const milestones = Object.values(state.milestones)
  const arcs = Object.values(state.characterArcs)

  return {
    totalMilestones: milestones.length,
    achievedMilestones: milestones.filter(m => m.achieved).length,
    totalCharacterArcs: arcs.length,
    completeCharacterArcs: arcs.filter(a => a.progressPercent >= 100).length,
    globalProgressScore: calculateGlobalProgress(state),
    storyHealthOverall: state.storyHealth.overall,
    predictedCompletion: state.predictedCompletion
  }
}