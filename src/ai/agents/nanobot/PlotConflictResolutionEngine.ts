/**
 * PlotConflictResolutionEngine — V527
 * Models conflict escalation, climax timing, and resolution pacing.
 * Inspired by: thunderbolt (feedback pipeline) + generic-agent (autonomous goal pursuit)
 */

export interface ConflictNode {
  id: string
  type: 'internal' | 'external' | 'relational' | 'societal'
  parties: string[]
  stakes: string
  initialIntensity: number  // 0-100
  currentIntensity: number
  turningPoints: Array<{ chapter: number, event: string, delta: number }>
  resolutionCondition: string
}

export interface PlotConflictState {
  conflicts: Record<string, ConflictNode>
  activeConflicts: string[]
  resolvedConflicts: string[]
  globalTension: number[]   // tension at each chapter (0-100)
  climaxChapter: number | null
  resolutionPacing: 'rushed' | 'balanced' | 'gradual'
}

export function createEmptyState(): PlotConflictState {
  return {
    conflicts: {},
    activeConflicts: [],
    resolvedConflicts: [],
    globalTension: [],
    climaxChapter: null,
    resolutionPacing: 'balanced'
  }
}

export function introduceConflict(state: PlotConflictState, conflictId: string, conflictType: ConflictNode['type'], parties: string[], stakes: string, initialIntensity: number, resolutionCondition: string): PlotConflictState {
  if (state.conflicts[conflictId]) return state

  const node: ConflictNode = {
    id: conflictId,
    type: conflictType,
    parties,
    stakes,
    initialIntensity,
    currentIntensity: initialIntensity,
    turningPoints: [],
    resolutionCondition
  }

  return {
    ...state,
    conflicts: {
      ...state.conflicts,
      [conflictId]: node
    },
    activeConflicts: [...state.activeConflicts, conflictId]
  }
}

export function escalateConflict(state: PlotConflictState, conflictId: string, chapter: number, event: string, delta: number): PlotConflictState {
  const conflict = state.conflicts[conflictId]
  if (!conflict) return state

  const newIntensity = Math.min(100, Math.max(0, conflict.currentIntensity + delta))
  const turningPoints = [...conflict.turningPoints, { chapter, event, delta }]

  return {
    ...state,
    conflicts: {
      ...state.conflicts,
      [conflictId]: {
        ...conflict,
        currentIntensity: newIntensity,
        turningPoints
      }
    }
  }
}

export function deEscalateConflict(state: PlotConflictState, conflictId: string, chapter: number, event: string, delta: number): PlotConflictState {
  return escalateConflict(state, conflictId, chapter, event, -delta)
}

export function resolveConflict(state: PlotConflictState, conflictId: string, chapter: number): PlotConflictState {
  const conflict = state.conflicts[conflictId]
  if (!conflict || !state.activeConflicts.includes(conflictId)) return state

  const resolvedConflicts = [...state.resolvedConflicts, conflictId]
  const activeConflicts = state.activeConflicts.filter(id => id !== conflictId)

  return {
    ...state,
    conflicts: {
      ...state.conflicts,
      [conflictId]: {
        ...conflict,
        currentIntensity: 0
      }
    },
    activeConflicts,
    resolvedConflicts
  }
}

export function updateGlobalTension(state: PlotConflictState, chapter: number): PlotConflictState {
  const activeConflicts = state.activeConflicts.map(id => state.conflicts[id]).filter(Boolean)
  if (activeConflicts.length === 0) return state

  const avgIntensity = activeConflicts.reduce((sum, c) => sum + c.currentIntensity, 0) / activeConflicts.length
  const globalTension = [...state.globalTension]
  globalTension[chapter] = Math.round(avgIntensity)

  // Detect climax: highest tension point before final descent
  let climaxChapter = state.climaxChapter
  if (climaxChapter === null || avgIntensity > (globalTension[climaxChapter] || 0)) {
    climaxChapter = chapter
  }

  return { ...state, globalTension, climaxChapter }
}

export function calculateResolutionPacing(state: PlotConflictState): PlotConflictState {
  if (state.resolvedConflicts.length === 0) return state

  const resolvedCount = state.resolvedConflicts.length
  const chaptersWithConflict = state.globalTension.filter(t => t > 0).length

  let resolutionPacing: PlotConflictState['resolutionPacing'] = 'balanced'
  if (chaptersWithConflict > 0) {
    const ratio = resolvedCount / chaptersWithConflict
    if (ratio > 0.5) resolutionPacing = 'rushed'
    else if (ratio < 0.2) resolutionPacing = 'gradual'
  }

  return { ...state, resolutionPacing }
}

export function findClimaxPoint(state: PlotConflictState): number | null {
  if (state.globalTension.length === 0) return null

  let maxTension = 0
  let climaxChapter = 0

  for (let i = 0; i < state.globalTension.length; i++) {
    if ((state.globalTension[i] || 0) > maxTension) {
      maxTension = state.globalTension[i] || 0
      climaxChapter = i
    }
  }

  return climaxChapter || null
}

export function getConflictById(state: PlotConflictState, conflictId: string): ConflictNode | null {
  return state.conflicts[conflictId] || null
}

export function getConflictsByType(state: PlotConflictState, conflictType: ConflictNode['type']): ConflictNode[] {
  return Object.values(state.conflicts).filter(c => c.type === conflictType)
}

export function getActiveConflicts(state: PlotConflictState): ConflictNode[] {
  return state.activeConflicts.map(id => state.conflicts[id]).filter(Boolean)
}

export function getPlotSummary(state: PlotConflictState): {
  totalConflicts: number
  activeConflicts: number
  resolvedConflicts: number
  climaxChapter: number | null
  resolutionPacing: PlotConflictState['resolutionPacing']
  avgTension: number
} {
  const tensions = state.globalTension.filter(t => t > 0)
  const avgTension = tensions.length > 0 ? Math.round(tensions.reduce((s, t) => s + t, 0) / tensions.length) : 0

  return {
    totalConflicts: Object.keys(state.conflicts).length,
    activeConflicts: state.activeConflicts.length,
    resolvedConflicts: state.resolvedConflicts.length,
    climaxChapter: state.climaxChapter,
    resolutionPacing: state.resolutionPacing,
    avgTension
  }
}