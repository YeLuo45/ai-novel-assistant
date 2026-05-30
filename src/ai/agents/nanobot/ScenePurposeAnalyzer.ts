/**
 * ScenePurposeAnalyzer — V411
 * Scene purpose validation, filler detection, narrative necessity scoring across chapters.
 * Inspired by: thunderbolt (feedback loops), generic-agent (optimization), ruflo (hierarchical decomposition)
 */

export type ScenePurpose = 'character_development' | 'plot_advancement' | 'world_building' | 'theme_expression' | 'tension_build' | 'resolution' | 'transition' | 'foreshadowing' | 'emotional_anchor' | 'filler'

export interface SceneAnalysis {
  chapterId: string
  purpose: ScenePurpose
  necessity: number  // 0-100 (how necessary)
  wordCount: number
  contributionScore: number  // overall contribution to narrative
  issues: string[]
}

export interface PurposeDistributionReport {
  totalScenes: number
  purposeCounts: Record<ScenePurpose, number>
  avgNecessity: number
  fillerScenes: string[]
  recommendations: string[]
}

export interface ScenePurposeState {
  analyses: SceneAnalysis[]
  report: PurposeDistributionReport | null
  typeAlias: Record<string, unknown>
}

export function createEmptyState(): ScenePurposeState {
  return {
    analyses: [],
    report: null,
    typeAlias: {},
  }
}

function calculateNecessity(purpose: ScenePurpose, wordCount: number, hasDialogue: boolean, hasConflict: boolean): number {
  let base = 50
  switch (purpose) {
    case 'character_development': base = 75; break
    case 'plot_advancement': base = 85; break
    case 'tension_build': base = 80; break
    case 'resolution': base = 90; break
    case 'foreshadowing': base = 70; break
    case 'emotional_anchor': base = 70; break
    case 'world_building': base = 60; break
    case 'theme_expression': base = 65; break
    case 'transition': base = 40; break
    case 'filler': base = 10; break
  }
  if (wordCount < 200) base -= 10
  if (wordCount > 3000) base -= 5
  if (hasDialogue) base += 5
  if (hasConflict) base += 10
  return Math.max(0, Math.min(100, base))
}

export function analyzeScene(
  state: ScenePurposeState,
  chapterId: string,
  purpose: ScenePurpose,
  wordCount: number,
  hasDialogue: boolean = false,
  hasConflict: boolean = false
): ScenePurposeState {
  const necessity = calculateNecessity(purpose, wordCount, hasDialogue, hasConflict)
  const contributionScore = Math.round((necessity * 0.7 + (wordCount > 500 ? 30 : wordCount / 20)) * 100) / 100
  
  const issues: string[] = []
  if (purpose === 'filler' && wordCount > 500) issues.push('Long filler scene - consider cutting')
  if (wordCount < 150 && purpose !== 'transition') issues.push('Very short scene - expand or merge')
  if (wordCount > 2500 && purpose !== 'plot_advancement' && purpose !== 'resolution') {
    issues.push('Very long scene for its purpose - consider trimming')
  }
  if (!hasDialogue && !hasConflict && wordCount > 1000) issues.push('Long scene without dialogue or conflict - add tension')
  
  const analysis: SceneAnalysis = { chapterId, purpose, necessity, wordCount, contributionScore, issues }
  const analyses = [...state.analyses.filter(a => !(a.chapterId === chapterId && a.purpose === purpose)), analysis]
  
  return { ...state, analyses }
}

export function generatePurposeReport(state: ScenePurposeState): PurposeDistributionReport {
  if (state.analyses.length === 0) {
    return { totalScenes: 0, purposeCounts: { character_development: 0, plot_advancement: 0, world_building: 0, theme_expression: 0, tension_build: 0, resolution: 0, transition: 0, foreshadowing: 0, emotional_anchor: 0, filler: 0 }, avgNecessity: 0, fillerScenes: [], recommendations: [] }
  }
  
  const purposeCounts: Record<ScenePurpose, number> = {
    character_development: 0, plot_advancement: 0, world_building: 0, theme_expression: 0,
    tension_build: 0, resolution: 0, transition: 0, foreshadowing: 0, emotional_anchor: 0, filler: 0,
  }
  for (const a of state.analyses) purposeCounts[a.purpose]++
  
  const avgNecessity = Math.round(state.analyses.reduce((s, a) => s + a.necessity, 0) / state.analyses.length)
  const fillerScenes = state.analyses.filter(a => a.purpose === 'filler' || a.necessity < 30).map(a => a.chapterId)
  
  const recommendations: string[] = []
  if (purposeCounts['filler'] > state.analyses.length * 0.2) {
    recommendations.push(`${purposeCounts['filler']} filler scenes - remove or repurpose`)
  }
  if (purposeCounts['plot_advancement'] < state.analyses.length * 0.15) {
    recommendations.push('Too few plot-advancing scenes - add narrative momentum')
  }
  if (avgNecessity < 50) recommendations.push('Overall scene necessity is low - revise weak scenes')
  if (purposeCounts['transition'] > state.analyses.length * 0.3) {
    recommendations.push('Many transition scenes - condense or merge')
  }
  if (fillerScenes.length > 5) recommendations.push(`${fillerScenes.length} scenes need attention - revise or cut`)
  if (avgNecessity > 75) recommendations.push('Strong scene purpose - maintain this quality')
  
  return { totalScenes: state.analyses.length, purposeCounts, avgNecessity, fillerScenes, recommendations }
}

export function getChapterContribution(state: ScenePurposeState, chapterId: string): number {
  const chapterAnalyses = state.analyses.filter(a => a.chapterId === chapterId)
  if (chapterAnalyses.length === 0) return 0
  return Math.round(chapterAnalyses.reduce((s, a) => s + a.contributionScore, 0) / chapterAnalyses.length)
}

export function compareScenePurpose(state: ScenePurposeState, purpose1: ScenePurpose, purpose2: ScenePurpose): {
  moreCommon: ScenePurpose
  countDiff: number
} {
  const counts: Record<ScenePurpose, number> = {
    character_development: 0, plot_advancement: 0, world_building: 0, theme_expression: 0,
    tension_build: 0, resolution: 0, transition: 0, foreshadowing: 0, emotional_anchor: 0, filler: 0,
  }
  for (const a of state.analyses) counts[a.purpose]++
  return { moreCommon: counts[purpose1] > counts[purpose2] ? purpose1 : purpose2, countDiff: Math.abs(counts[purpose1] - counts[purpose2]) }
}
