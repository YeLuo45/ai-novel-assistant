/**
 * StoryArcTracker - V142
 * Narrative Arc Progress Tracking System
 * 
 * Design references:
 * - ruflo: hierarchical decomposition (arc → act → chapter → scene)
 * - thunderbolt: pipeline feedback loops for progress monitoring
 * - chatdev: multi-stage role-based progress tracking
 * - nanobot: distributed state with milestone tracking
 */

export type ArcPhase = 'setup' | 'rising_action' | 'climax' | 'falling_action' | 'resolution' | 'denouement'
export type BeatType = 'inciting_incident' | 'rising_action' | 'crisis' | 'climax' | 'turning_point' | 'midpoint' | 'low_point' | 'resolution'

export interface StoryBeat {
  beatId: string
  beatType: BeatType
  chapter: number
  position: number        // 0-1 within chapter
  title: string
  description: string
  wordCountTarget: number
  wordCountActual: number
  completed: boolean
  timestamp: number
}

export interface StoryArc {
  arcId: string
  arcName: string
  phase: ArcPhase
  startChapter: number
  endChapter: number | null
  targetWordCount: number
  actualWordCount: number
  beats: StoryBeat[]
  progress: number         // 0-100
  pacingScore: number      // 0-100
}

export interface ChapterProgress {
  chapterNumber: number
  title: string
  wordCount: number
  targetWordCount: number
  arcId: string | null
  completionPercent: number
  emotionalBeat: string    // key moment in chapter
}

export interface StoryArcTrackerState {
  arcs: Map<string, StoryArc>
  chapters: Map<number, ChapterProgress>
  currentArcId: string | null
  totalWordCount: number
  targetWordCount: number
  averagePacingScore: number
  criticalMissingBeats: BeatType[]
  nextSuggestedBeat: BeatType | null
}

// =============================================================================
// State Management
// =============================================================================

export function createEmptyArcTrackerState(): StoryArcTrackerState {
  return {
    arcs: new Map(),
    chapters: new Map(),
    currentArcId: null,
    totalWordCount: 0,
    targetWordCount: 50000,
    averagePacingScore: 50,
    criticalMissingBeats: [],
    nextSuggestedBeat: null,
  }
}

// =============================================================================
// Arc Management
// =============================================================================

export function createArc(
  state: StoryArcTrackerState,
  arcName: string,
  startChapter: number = 1
): { state: StoryArcTrackerState; arcId: string } {
  const arcId = `arc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  
  const arc: StoryArc = {
    arcId,
    arcName,
    phase: 'setup',
    startChapter,
    endChapter: null,
    targetWordCount: 0,
    actualWordCount: 0,
    beats: [],
    progress: 0,
    pacingScore: 50,
  }
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, arc)
  
  return {
    state: { ...state, arcs: newArcs, currentArcId: arcId },
    arcId,
  }
}

export function updateArcProgress(
  state: StoryArcTrackerState,
  arcId: string
): StoryArcTrackerState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state
  
  const totalWords = arc.beats.reduce((s, b) => s + b.wordCountActual, 0)
  const totalTargets = arc.beats.reduce((s, b) => s + b.wordCountTarget, 0)
  const completedBeats = arc.beats.filter(b => b.completed).length
  const progress = arc.beats.length > 0 ? (completedBeats / arc.beats.length) * 100 : 0
  
  // Calculate pacing score based on chapter distribution
  let pacingScore = 50
  if (arc.beats.length > 1) {
    const sortedBeats = [...arc.beats].sort((a, b) => a.chapter - b.chapter || a.position - b.position)
    let paceVariations = 0
    for (let i = 1; i < sortedBeats.length; i++) {
      const prevWords = sortedBeats[i - 1].wordCountActual
      const currWords = sortedBeats[i].wordCountActual
      if (prevWords > 0 && currWords > 0) {
        const ratio = Math.max(prevWords, currWords) / Math.min(prevWords, currWords)
        if (ratio > 1.5) paceVariations++
      }
    }
    pacingScore = Math.max(0, Math.min(100, 50 + (paceVariations * 10 - arc.beats.length * 2)))
  }
  
  const updatedArc: StoryArc = {
    ...arc,
    actualWordCount: totalWords,
    targetWordCount: totalTargets,
    progress: Math.round(progress),
    pacingScore: Math.round(pacingScore),
  }
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, updatedArc)
  
  // Update average pacing
  let avgPacing = 0
  if (newArcs.size > 0) {
    avgPacing = Array.from(newArcs.values()).reduce((s, a) => s + a.pacingScore, 0) / newArcs.size
  }
  
  return {
    ...state,
    arcs: newArcs,
    averagePacingScore: Math.round(avgPacing),
  }
}

// =============================================================================
// Beat Management
// =============================================================================

export function addBeat(
  state: StoryArcTrackerState,
  arcId: string,
  beatType: BeatType,
  chapter: number,
  position: number,
  title: string,
  wordCountTarget: number = 2000
): StoryArcTrackerState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state
  
  const beat: StoryBeat = {
    beatId: `beat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    beatType,
    chapter,
    position,
    title,
    description: '',
    wordCountTarget,
    wordCountActual: 0,
    completed: false,
    timestamp: Date.now(),
  }
  
  const updatedArc: StoryArc = {
    ...arc,
    beats: [...arc.beats, beat],
  }
  
  // Auto-update arc phase based on beat position
  updatedArc.phase = inferArcPhase(updatedArc.beats)
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, updatedArc)
  
  const newState = { ...state, arcs: newArcs }
  return updateArcProgress(newState, arcId)
}

export function markBeatComplete(
  state: StoryArcTrackerState,
  arcId: string,
  beatId: string,
  wordCountActual: number
): StoryArcTrackerState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state
  
  const beatIndex = arc.beats.findIndex(b => b.beatId === beatId)
  if (beatIndex === -1) return state
  
  const updatedBeats = [...arc.beats]
  updatedBeats[beatIndex] = {
    ...updatedBeats[beatIndex],
    wordCountActual,
    completed: true,
  }
  
  const updatedArc: StoryArc = {
    ...arc,
    beats: updatedBeats,
  }
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, updatedArc)
  
  const newState = { ...state, arcs: newArcs }
  return updateArcProgress(newState, arcId)
}

export function updateBeatWordCount(
  state: StoryArcTrackerState,
  arcId: string,
  beatId: string,
  wordCount: number
): StoryArcTrackerState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state
  
  const beatIndex = arc.beats.findIndex(b => b.beatId === beatId)
  if (beatIndex === -1) return state
  
  const updatedBeats = [...arc.beats]
  updatedBeats[beatIndex] = {
    ...updatedBeats[beatIndex],
    wordCountActual: wordCount,
  }
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, { ...arc, beats: updatedBeats })
  
  return updateArcProgress({ ...state, arcs: newArcs }, arcId)
}

function inferArcPhase(beats: StoryBeat[]): ArcPhase {
  if (beats.length === 0) return 'setup'
  
  const sorted = [...beats].sort((a, b) => a.position - b.position)
  const climaxIdx = beats.findIndex(b => b.beatType === 'climax')
  
  if (climaxIdx === -1) return 'rising_action'
  if (climaxIdx === 0) return 'setup'
  if (climaxIdx >= sorted.length - 1) return 'falling_action'
  
  // Check if climax is in first third, middle, or last third
  const ratio = climaxIdx / sorted.length
  if (ratio < 0.3) return 'rising_action'
  if (ratio < 0.6) return 'climax'
  return 'falling_action'
}

// =============================================================================
// Chapter Progress
// =============================================================================

export function updateChapterProgress(
  state: StoryArcTrackerState,
  chapterNumber: number,
  wordCount: number,
  targetWordCount: number = 3000,
  arcId: string | null = null
): StoryArcTrackerState {
  const chapter: ChapterProgress = {
    chapterNumber,
    title: `Chapter ${chapterNumber}`,
    wordCount,
    targetWordCount,
    arcId,
    completionPercent: targetWordCount > 0 ? Math.round((wordCount / targetWordCount) * 100) : 0,
    emotionalBeat: '',
  }
  
  const newChapters = new Map(state.chapters)
  newChapters.set(chapterNumber, chapter)
  
  // Update total word count
  const totalWords = Array.from(newChapters.values()).reduce((s, c) => s + c.wordCount, 0)
  
  return {
    ...state,
    chapters: newChapters,
    totalWordCount: totalWords,
  }
}

// =============================================================================
// Missing Beat Analysis
// =============================================================================

export function analyzeMissingBeats(state: StoryArcTrackerState): StoryArcTrackerState {
  const requiredBeats: BeatType[] = ['inciting_incident', 'rising_action', 'midpoint', 'climax', 'turning_point', 'resolution']
  
  const currentArc = state.currentArcId ? state.arcs.get(state.currentArcId) : null
  if (!currentArc) return state
  
  const existingTypes = new Set(currentArc.beats.map(b => b.beatType))
  
  const missing: BeatType[] = []
  for (const beat of requiredBeats) {
    if (!existingTypes.has(beat)) {
      missing.push(beat)
    }
  }
  
  // Determine next suggestion based on what exists
  let nextSuggestion: BeatType | null = null
  
  const hasClimax = existingTypes.has('climax')
  const hasMidpoint = existingTypes.has('midpoint')
  const hasInciting = existingTypes.has('inciting_incident')
  
  if (!hasInciting) nextSuggestion = 'inciting_incident'
  else if (!hasMidpoint) nextSuggestion = 'midpoint'
  else if (!hasClimax) nextSuggestion = 'climax'
  else if (!existingTypes.has('rising_action')) nextSuggestion = 'rising_action'
  else if (!existingTypes.has('resolution')) nextSuggestion = 'resolution'
  
  return {
    ...state,
    criticalMissingBeats: missing,
    nextSuggestedBeat: nextSuggestion,
  }
}

// =============================================================================
// Arc Transition
// =============================================================================

export function transitionArcPhase(
  state: StoryArcTrackerState,
  arcId: string,
  newPhase: ArcPhase
): StoryArcTrackerState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, { ...arc, phase: newPhase })
  
  return { ...state, arcs: newArcs }
}

export function closeArc(
  state: StoryArcTrackerState,
  arcId: string,
  endChapter: number
): StoryArcTrackerState {
  const arc = state.arcs.get(arcId)
  if (!arc) return state
  
  const newArcs = new Map(state.arcs)
  newArcs.set(arcId, {
    ...arc,
    endChapter,
    phase: 'resolution',
  })
  
  return { ...state, arcs: newArcs }
}

// =============================================================================
// Formatters
// =============================================================================

export function formatArcSummary(state: StoryArcTrackerState, arcId: string): string {
  const arc = state.arcs.get(arcId)
  if (!arc) return `Arc ${arcId} not found`
  
  const lines = [
    `=== Arc: ${arc.arcName} ===`,
    `Phase: ${arc.phase}`,
    `Chapters: ${arc.startChapter}${arc.endChapter ? `-${arc.endChapter}` : '-ongoing'}`,
    `Progress: ${arc.progress}%`,
    `Word Count: ${arc.actualWordCount.toLocaleString()} / ${arc.targetWordCount.toLocaleString()} target`,
    `Pacing Score: ${arc.pacingScore}/100`,
    '',
    '--- Beats ---',
  ]
  
  const sorted = [...arc.beats].sort((a, b) => a.position - b.position)
  for (const beat of sorted) {
    const status = beat.completed ? '✓' : '○'
    const wc = `${beat.wordCountActual}/${beat.wordCountTarget}`
    lines.push(`  ${status} [${beat.beatType}] Ch${beat.chapter} pos=${beat.position.toFixed(2)}: ${beat.title} (${wc})`)
  }
  
  return lines.join('\n')
}

export function formatTrackerDashboard(state: StoryArcTrackerState): string {
  const lines = [
    '=== Story Arc Tracker Dashboard ===',
    `Total Words: ${state.totalWordCount.toLocaleString()} / ${state.targetWordCount.toLocaleString()} target`,
    `Progress: ${state.totalWordCount > 0 ? Math.round((state.totalWordCount / state.targetWordCount) * 100) : 0}%`,
    `Arcs: ${state.arcs.size} | Chapters: ${state.chapters.size}`,
    `Avg Pacing Score: ${state.averagePacingScore}/100`,
    '',
  ]
  
  if (state.currentArcId) {
    const arc = state.arcs.get(state.currentArcId)
    if (arc) {
      lines.push(`--- Current Arc: ${arc.arcName} ---`)
      lines.push(`  Phase: ${arc.phase} | Progress: ${arc.progress}%`)
      lines.push(`  Words: ${arc.actualWordCount.toLocaleString()} | Beats: ${arc.beats.length}`)
    }
  }
  
  if (state.nextSuggestedBeat) {
    lines.push('')
    lines.push(`Suggested Next Beat: ${state.nextSuggestedBeat}`)
  }
  
  if (state.criticalMissingBeats.length > 0) {
    lines.push('')
    lines.push('Missing Required Beats:')
    for (const beat of state.criticalMissingBeats) {
      lines.push(`  ! ${beat}`)
    }
  }
  
  // Show chapter progress if available
  if (state.chapters.size > 0) {
    lines.push('')
    lines.push('--- Chapter Progress ---')
    const sortedChapters = Array.from(state.chapters.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(-5)
    for (const [, chapter] of sortedChapters) {
      const bar = '█'.repeat(Math.floor(chapter.completionPercent / 10)) + '░'.repeat(10 - Math.floor(chapter.completionPercent / 10))
      lines.push(`  Ch${chapter.chapterNumber}: ${bar} ${chapter.completionPercent}% (${chapter.wordCount.toLocaleString()} words)`)
    }
  }
  
  return lines.join('\n')
}
