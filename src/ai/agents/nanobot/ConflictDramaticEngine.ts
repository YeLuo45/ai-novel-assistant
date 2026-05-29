export type ConflictType = 'internal' | 'interpersonal' | 'group' | 'societal' | 'cosmic'
export type ConflictStatus = 'building' | 'active' | 'stalled' | 'resolved' | 'abandoned'

export interface Conflict {
  conflictId: string
  type: ConflictType
  description: string
  parties: string[]  // character or group names involved
  status: ConflictStatus
  intensity: number  // 0-100
  firstChapter: number
  resolutionChapter?: number
}

export interface DramaticTensionCurve {
  chapter: number
  tension: number  // 0-100
  description: string
}

export interface ConflictDramaticState {
  conflicts: Conflict[]
  tensionCurve: DramaticTensionCurve[]
  currentChapter: number
  averageIntensity: number
  resolvedCount: number
}

function createConflictId(): string {
  return 'conflict_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function createPointId(): string {
  return 'point_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyConflictDramaticState(): ConflictDramaticState {
  return { conflicts: [], tensionCurve: [], currentChapter: 0, averageIntensity: 0, resolvedCount: 0 }
}

export function createConflict(
  state: ConflictDramaticState,
  type: ConflictType,
  description: string,
  parties: string[]
): ConflictDramaticState {
  const conflict: Conflict = {
    conflictId: createConflictId(),
    type,
    description,
    parties,
    status: 'building',
    intensity: 30,
    firstChapter: state.currentChapter || 1,
  }

  const newConflicts = [...state.conflicts, conflict]
  const avgIntensity = Math.round(newConflicts.reduce((sum, c) => sum + c.intensity, 0) / newConflicts.length)

  return {
    ...state,
    conflicts: newConflicts,
    averageIntensity: avgIntensity,
  }
}

export function escalateConflict(
  state: ConflictDramaticState,
  conflictId: string,
  intensityDelta: number
): ConflictDramaticState {
  const newConflicts = state.conflicts.map(c => {
    if (c.conflictId !== conflictId) return c
    return {
      ...c,
      intensity: Math.min(100, c.intensity + intensityDelta),
      status: 'active' as ConflictStatus,
    }
  })

  const avgIntensity = Math.round(newConflicts.reduce((sum, c) => sum + c.intensity, 0) / newConflicts.length)

  return {
    ...state,
    conflicts: newConflicts,
    averageIntensity: avgIntensity,
  }
}

export function resolveConflict(
  state: ConflictDramaticState,
  conflictId: string
): ConflictDramaticState {
  const newConflicts = state.conflicts.map(c => {
    if (c.conflictId !== conflictId) return c
    return { ...c, status: 'resolved' as ConflictStatus, resolutionChapter: state.currentChapter }
  })

  const resolvedCount = newConflicts.filter(c => c.status === 'resolved').length

  return {
    ...state,
    conflicts: newConflicts,
    resolvedCount,
  }
}

export function recordTensionPoint(
  state: ConflictDramaticState,
  chapter: number,
  tension: number,
  description: string
): ConflictDramaticState {
  const point: DramaticTensionCurve = {
    chapter,
    tension: Math.max(0, Math.min(100, tension)),
    description,
  }

  const newCurve = [...state.tensionCurve, point]
  newCurve.sort((a, b) => a.chapter - b.chapter)

  return {
    ...state,
    tensionCurve: newCurve,
    currentChapter: Math.max(state.currentChapter, chapter),
  }
}

export function getActiveConflicts(state: ConflictDramaticState): Conflict[] {
  return state.conflicts.filter(c => c.status === 'active' || c.status === 'building')
}

export function getConflictById(state: ConflictDramaticState, conflictId: string): Conflict | null {
  return state.conflicts.find(c => c.conflictId === conflictId) || null
}

export function formatConflictSummary(state: ConflictDramaticState): string {
  let s = "=== Conflict & Dramatic Summary ===" + "\n"
  s += "Conflicts: " + state.conflicts.length + " (active: " + getActiveConflicts(state).length + ")\n"
  s += "Resolved: " + state.resolvedCount + "\n"
  s += "Avg Intensity: " + state.averageIntensity + "\n"
  return s
}

export function formatConflictDashboard(state: ConflictDramaticState): string {
  let s = "=== Conflict & Dramatic Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Active: " + getActiveConflicts(state).length + " | Resolved: " + state.resolvedCount + " | Avg Intensity: " + state.averageIntensity + "\n"

  const activeConflicts = getActiveConflicts(state)
  if (activeConflicts.length > 0) {
    s += "\n--- Active Conflicts ---" + "\n"
    for (const c of activeConflicts.slice(0, 4)) {
      s += "  [" + c.type + "] " + c.description.slice(0, 40) + " intensity=" + c.intensity + "\n"
    }
  }

  if (state.tensionCurve.length > 0) {
    s += "\n--- Tension Trend ---" + "\n"
    const last3 = state.tensionCurve.slice(-3)
    for (const p of last3) {
      s += "  Ch " + p.chapter + " tension=" + p.tension + "\n"
    }
  }

  return s
}
