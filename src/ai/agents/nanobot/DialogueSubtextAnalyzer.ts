// DialogueSubtextAnalyzer - V264: Subtext & Power Dynamics Analysis
// Inspired by: chatdev (role specialization) + generic-agent (analysis)

export type ScenePurpose = 'character_development' | 'plot_advancement' | 'world_building' | 'emotional_resonance' | 'thematic_exploration' | 'conflict_creation' | 'resolution' | 'transition'

export interface ScenePurposeData {
  sceneId: string
  chapter: number
  purpose: ScenePurpose
  necessityScore: number  // 0-100
  pacingImpact: number  // -10 to +10 (negative=slows, positive=accelerates)
  engagementScore: number  // 0-100
}

export interface ScenePurposeState {
  scenes: ScenePurposeData[]
  currentChapter: number
  averageNecessity: number
  redundantSceneCount: number
}

function createSceneId(): string {
  return 'scene_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

export function createEmptyScenePurposeState(): ScenePurposeState {
  return { scenes: [], currentChapter: 0, averageNecessity: 0, redundantSceneCount: 0 }
}

export function analyzeScene(
  state: ScenePurposeState,
  chapter: number,
  purpose: ScenePurpose,
  pacingImpact: number,
  engagementScore: number
): ScenePurposeState {
  const necessity = Math.round((engagementScore + (pacingImpact > 0 ? pacingImpact * 5 : 0) + 50) / 2)
  const scene: ScenePurposeData = {
    sceneId: createSceneId(),
    chapter,
    purpose,
    necessityScore: necessity,
    pacingImpact,
    engagementScore,
  }
  const newScenes = [...state.scenes, scene]
  const avgNec = Math.round(newScenes.reduce((s, sc) => s + sc.necessityScore, 0) / newScenes.length)
  const redundant = newScenes.filter(sc => sc.necessityScore < 40).length
  return { scenes: newScenes, currentChapter: chapter, averageNecessity: avgNec, redundantSceneCount: redundant }
}

export function getScenesByPurpose(state: ScenePurposeState, purpose: ScenePurpose): ScenePurposeData[] {
  return state.scenes.filter(sc => sc.purpose === purpose)
}

export function getScenesByChapter(state: ScenePurposeState, chapter: number): ScenePurposeData[] {
  return state.scenes.filter(sc => sc.chapter === chapter)
}

export function getRedundantScenes(state: ScenePurposeState): ScenePurposeData[] {
  return state.scenes.filter(sc => sc.necessityScore < 40)
}

export function getHighImpactScenes(state: ScenePurposeState): ScenePurposeData[] {
  return state.scenes.filter(sc => sc.engagementScore >= 80)
}

export function formatScenePurposeSummary(state: ScenePurposeState): string {
  let s = "=== Scene Purpose Analysis ===\n"
  s += "Chapter: " + state.currentChapter + " | Scenes: " + state.scenes.length + "\n"
  s += "Avg Necessity: " + state.averageNecessity + " | Redundant: " + state.redundantSceneCount + "\n"
  return s
}

export function formatScenePurposeDashboard(state: ScenePurposeState): string {
  let s = "=== Scene Purpose Dashboard ===\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Total Scenes: " + state.scenes.length + " | Avg Necessity: " + state.averageNecessity + "\n"
  if (state.scenes.length > 0) {
    s += "\n--- Recent Scenes ---\n"
    for (const sc of state.scenes.slice(-3)) {
      s += "  Ch" + sc.chapter + " [" + sc.purpose + "] necessity=" + sc.necessityScore + "\n"
    }
  }
  return s
}
