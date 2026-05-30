/**
 * NarrativeStakesTracker — V433
 * Stakes tracking, tension threshold management, consequence mapping across narrative arc.
 * Inspired by: generic-agent (goal tracking), thunderbolt (feedback loops), ruflo (hierarchical decomposition)
 */

export type StakeLevel = 'personal' | 'relational' | 'communal' | 'worldly' | 'universal'

export interface StakesInstance {
  id: string
  description: string
  stakeLevel: StakeLevel
  chapterRaised: number
  chapterResolved: number | null
  intensity: number  // 0-100 (how high the stakes are)
  consequenceSeverity: number  // 0-100 (how severe if lost)
  raisedBy: string  // character or event
  isActive: boolean
}

export interface StakesReport {
  totalStakes: number
  activeStakes: number
  resolvedStakes: number
  averageIntensity: number
  highestStakes: string[]
  recommendations: string[]
}

export interface NarrativeStakesState {
  stakes: StakesInstance[]
  report: StakesReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): NarrativeStakesState {
  return { stakes: [], report: null, typeAlias: {} }
}

export function raiseStakes(
  state: NarrativeStakesState,
  description: string,
  stakeLevel: StakeLevel,
  chapter: number,
  intensity: number,
  consequenceSeverity: number,
  raisedBy: string
): NarrativeStakesState {
  const id = `stakes_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const instance: StakesInstance = { id, description, stakeLevel, chapterRaised: chapter, chapterResolved: null, intensity: Math.max(0, Math.min(100, intensity)), consequenceSeverity: Math.max(0, Math.min(100, consequenceSeverity)), raisedBy, isActive: true }
  return { ...state, stakes: [...state.stakes, instance] }
}

export function resolveStakes(state: NarrativeStakesState, stakesId: string, chapter: number): NarrativeStakesState {
  const stakes = state.stakes.map(s => s.id === stakesId ? { ...s, chapterResolved: chapter, isActive: false } : s)
  return { ...state, stakes }
}

export function escalateStakes(state: NarrativeStakesState, stakesId: string, intensityBoost: number): NarrativeStakesState {
  const stakes = state.stakes.map(s => {
    if (s.id === stakesId && s.isActive) {
      return { ...s, intensity: Math.min(100, s.intensity + intensityBoost) }
    }
    return s
  })
  return { ...state, stakes }
}

export function generateStakesReport(state: NarrativeStakesState): StakesReport {
  if (state.stakes.length === 0) {
    return { totalStakes: 0, activeStakes: 0, resolvedStakes: 0, averageIntensity: 0, highestStakes: [], recommendations: [] }
  }
  
  const totalStakes = state.stakes.length
  const activeStakes = state.stakes.filter(s => s.isActive).length
  const resolvedStakes = state.stakes.filter(s => !s.isActive).length
  const averageIntensity = Math.round(state.stakes.reduce((s, st) => s + st.intensity, 0) / totalStakes)
  const highestStakes = state.stakes.filter(s => s.intensity > 80).map(s => s.description)
  
  const recommendations: string[] = []
  if (activeStakes > totalStakes * 0.7) {
    recommendations.push(`${activeStakes} active stakes - resolve some before raising more`)
  }
  if (averageIntensity < 40 && totalStakes > 5) {
    recommendations.push('Low average stakes - raise the stakes for more tension')
  }
  if (highestStakes.length < 2 && totalStakes > 8) {
    recommendations.push('Few high-stakes moments - create more critical stakes')
  }
  if (resolvedStakes > activeStakes * 2) {
    recommendations.push('Many resolved stakes - introduce new challenges')
  }
  if (state.stakes.every(s => s.stakeLevel === 'personal')) {
    recommendations.push('All stakes are personal - consider communal or world-level stakes')
  }
  if (averageIntensity > 80) recommendations.push('Very high stakes throughout - maintain this for climax')
  
  return { totalStakes, activeStakes, resolvedStakes, averageIntensity, highestStakes, recommendations }
}

export function getActiveStakes(state: NarrativeStakesState): StakesInstance[] {
  return state.stakes.filter(s => s.isActive)
}

export function getStakesByLevel(state: NarrativeStakesState, level: StakeLevel): StakesInstance[] {
  return state.stakes.filter(s => s.stakeLevel === level)
}

export function compareStakesSeverity(state: NarrativeStakesState, stakesId1: string, stakesId2: string): {
  moreSevere: string
  severity1: number
  severity2: number
} {
  const s1 = state.stakes.find(s => s.id === stakesId1)
  const s2 = state.stakes.find(s => s.id === stakesId2)
  if (!s1 || !s2) return { moreSevere: stakesId1, severity1: 0, severity2: 0 }
  return { moreSevere: s1.consequenceSeverity > s2.consequenceSeverity ? stakesId1 : stakesId2, severity1: s1.consequenceSeverity, severity2: s2.consequenceSeverity }
}
