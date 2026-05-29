// CharacterArcTrajectoryEngine - V300: Character arc progression tracking with deviation detection
// Inspired by: ruflo (hierarchical decomposition) + chatdev (progression tracking)

export type ArcDirection = 'ascending' | 'descending' | 'stable' | 'spiral' | 'stunted'
export type ArcMilestone = 'origin' | 'inciting_incident' | 'complication' | 'crisis' | 'climax' | 'resolution'

export interface ArcDataPoint {
  chapter: number
  state: string           // emotional/psychological state label
  agencyScore: number     // 0-100, character's agency/control
  growthScore: number     // 0-100, personal growth
  complexityScore: number // 0-100, character depth
  milestone: ArcMilestone | null
}

export interface CharacterArcState {
  characterId: string
  arcPoints: ArcDataPoint[]
  direction: ArcDirection
  intendedArc: string     // planned arc description
  actualArc: string      // observed arc description
  deviationCount: number
  projectedEndpoint: string
}

export interface MultiCharacterArcState {
  characters: { [characterId: string]: CharacterArcState }
  sharedMilestones: Array<{chapter: number; description: string; characters: string[]}>
}

export function createEmptyCharacterArcState(characterId: string): CharacterArcState {
  return {
    characterId,
    arcPoints: [],
    direction: 'stable',
    intendedArc: '',
    actualArc: '',
    deviationCount: 0,
    projectedEndpoint: '',
  }
}

export function createEmptyMultiCharacterArcState(): MultiCharacterArcState {
  return { characters: {}, sharedMilestones: [] }
}

function computeDirection(points: ArcDataPoint[]): ArcDirection {
  if (points.length < 3) return 'stable'
  const growthScores = points.map(p => p.growthScore)
  const first = growthScores[0]
  const last = growthScores[growthScores.length - 1]
  const variance = growthScores.reduce((s, g) => s + Math.abs(g - (first + last) / 2), 0) / growthScores.length
  
  if (variance < 5) return 'stable'
  if (last > first + 20) return 'ascending'
  if (last < first - 20) return 'descending'
  if (variance > 15) return 'spiral'
  return 'stunted'
}

export function addArcPoint(
  state: CharacterArcState,
  chapter: number,
  stateLabel: string,
  agencyScore: number,
  growthScore: number,
  complexityScore: number,
  milestone: ArcMilestone | null = null
): CharacterArcState {
  const point: ArcDataPoint = {
    chapter,
    state: stateLabel,
    agencyScore: Math.min(100, Math.max(0, agencyScore)),
    growthScore: Math.min(100, Math.max(0, growthScore)),
    complexityScore: Math.min(100, Math.max(0, complexityScore)),
    milestone,
  }

  const newPoints = [...state.arcPoints, point]
  const direction = computeDirection(newPoints)

  const growthValues = newPoints.map(p => p.growthScore)
  const intendedEnd = state.intendedArc ? parseInt(state.intendedArc.split('→').pop() || '50') : 50
  const actualEnd = growthValues.length > 0 ? growthValues[growthValues.length - 1] : 50
  const deviationCount = Math.abs(intendedEnd - actualEnd) > 20 ? state.deviationCount + 1 : state.deviationCount

  const projectedEndpoint = newPoints.length >= 2
    ? `Ch${chapter} (agency=${agencyScore}, growth=${growthScore})`
    : ''

  return {
    ...state,
    arcPoints: newPoints,
    direction,
    deviationCount,
    projectedEndpoint,
  }
}

export function setIntendedArc(state: CharacterArcState, arcDescription: string): CharacterArcState {
  return { ...state, intendedArc: arcDescription }
}

export function generateActualArcDescription(state: CharacterArcState): string {
  if (state.arcPoints.length === 0) return 'No arc data'
  const first = state.arcPoints[0].growthScore
  const last = state.arcPoints[state.arcPoints.length - 1].growthScore
  const milestone = state.arcPoints[state.arcPoints.length - 1].milestone || 'progression'
  if (last > first + 20) return `Growth arc: ${first}→${last} (${milestone})`
  if (last < first - 20) return `Decline arc: ${first}→${last} (${milestone})`
  return `Stable arc around ${Math.round((first + last) / 2)} (${milestone})`
}

export function getArcProgress(state: CharacterArcState): number {
  if (state.arcPoints.length < 2) return 0
  const first = state.arcPoints[0].growthScore
  const last = state.arcPoints[state.arcPoints.length - 1].growthScore
  return last - first
}

export function getMilestoneProgress(state: CharacterArcState): ArcMilestone[] {
  return state.arcPoints.filter(p => p.milestone !== null).map(p => p.milestone!)
}

export function formatCharacterArcSummary(state: CharacterArcState): string {
  let s = "=== Character Arc Summary: " + state.characterId + " ===\n"
  s += "Points: " + state.arcPoints.length + " | Direction: " + state.direction + "\n"
  s += "Intended: " + (state.intendedArc || 'Not set') + "\n"
  s += "Deviations: " + state.deviationCount + "\n"
  return s
}

export function formatCharacterArcDashboard(state: CharacterArcState): string {
  let s = "=== Character Arc Dashboard: " + state.characterId + " ===\n"
  s += "Direction: " + state.direction + " | Points: " + state.arcPoints.length + "\n"
  s += "Deviations: " + state.deviationCount + "\n"

  if (state.arcPoints.length > 0) {
    s += "\n--- Arc Trajectory ---\n"
    for (const p of state.arcPoints.slice(-5)) {
      const milestoneFlag = p.milestone ? ` [${p.milestone}]` : ''
      s += "  Ch" + p.chapter + ": " + p.state + " | agency=" + p.agencyScore + " growth=" + p.growthScore + milestoneFlag + "\n"
    }
  }
  return s
}

export function formatMultiCharacterArcSummary(state: MultiCharacterArcState): string {
  const chars = Object.keys(state.characters)
  return "=== Multi-Character Arc Summary ===\nCharacters: " + chars.length + " | Shared Milestones: " + state.sharedMilestones.length + "\n"
}

export function formatMultiCharacterArcDashboard(state: MultiCharacterArcState): string {
  let s = "=== Multi-Character Arc Dashboard ===\n"
  s += "Characters: " + Object.keys(state.characters).length + "\n"
  
  for (const [charId, charState] of Object.entries(state.characters)) {
    s += "\n--- " + charId + " ---\n"
    s += "  Direction: " + charState.direction + " | Points: " + charState.arcPoints.length + "\n"
  }

  if (state.sharedMilestones.length > 0) {
    s += "\n--- Shared Milestones ---\n"
    for (const m of state.sharedMilestones.slice(-3)) {
      s += "  Ch" + m.chapter + ": " + m.description + " (" + m.characters.join(', ') + ")\n"
    }
  }
  return s
}