export interface Scene {
  sceneId: string
  chapter: number
  location: string
  timeOfDay: string
  characters: string[]
  mood: string
}

export interface TransitionAnalysis {
  fromScene: Scene
  toScene: Scene
  smoothnessScore: number  // 0-100
  issues: string[]
  bridgeSuggestions: string[]
}

export interface SceneTransitionState {
  scenes: Scene[]
  analyses: TransitionAnalysis[]
  currentChapter: number
  averageSmoothness: number
}

function createSceneId(): string {
  return 'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
}

function analyzeTransition(fromScene: Scene, toScene: Scene): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 70  // base score

  // Location change scoring
  if (fromScene.location !== toScene.location) {
    score -= 15
    issues.push('Location change from ' + fromScene.location + ' to ' + toScene.location)
    suggestions.push('Add a brief transitional description')
  } else {
    score += 10
  }

  // Time of day scoring
  if (fromScene.timeOfDay !== toScene.timeOfDay) {
    const transitions: Record<string, string[]> = {
      'morning': ['afternoon', 'evening'],
      'afternoon': ['evening', 'night'],
      'evening': ['night', 'morning'],
      'night': ['morning', 'afternoon'],
    }
    const valid = transitions[fromScene.timeOfDay]?.includes(toScene.timeOfDay)
    if (valid) {
      score += 5
    } else {
      score -= 10
      issues.push('Abrupt time shift from ' + fromScene.timeOfDay + ' to ' + toScene.timeOfDay)
      suggestions.push('Consider a gradual time progression')
    }
  }

  // Character overlap scoring
  const overlap = fromScene.characters.filter(c => toScene.characters.includes(c))
  if (overlap.length === 0) {
    score -= 20
    issues.push('No shared characters between scenes')
    suggestions.push('At least one character should carry continuity')
  } else {
    score += 5 * Math.min(overlap.length, 3)
  }

  // Mood continuity
  if (fromScene.mood === toScene.mood) {
    score += 5
  } else {
    score -= 10
    issues.push('Mood shift from ' + fromScene.mood + ' to ' + toScene.mood)
    suggestions.push('Use transitional emotional cues')
  }

  score = Math.max(0, Math.min(100, score))
  return { score, issues, suggestions }
}

export function createEmptySceneTransitionState(): SceneTransitionState {
  return { scenes: [], analyses: [], currentChapter: 0, averageSmoothness: 0 }
}

export function addScene(state: SceneTransitionState, chapter: number, location: string, timeOfDay: string, characters: string[], mood: string): SceneTransitionState {
  const scene: Scene = { sceneId: createSceneId(), chapter, location, timeOfDay, characters, mood }
  const newScenes = [...state.scenes, scene]

  // Analyze transition with previous scene
  if (newScenes.length >= 2) {
    const fromScene = newScenes[newScenes.length - 2]
    const toScene = newScenes[newScenes.length - 1]
    const { score, issues, suggestions } = analyzeTransition(fromScene, toScene)
    const analysis: TransitionAnalysis = { fromScene, toScene, smoothnessScore: score, issues, bridgeSuggestions: suggestions }
    const newAnalyses = [...state.analyses, analysis]
    const avg = Math.round(newAnalyses.reduce((sum, a) => sum + a.smoothnessScore, 0) / newAnalyses.length)
    return { ...state, scenes: newScenes, analyses: newAnalyses, currentChapter: Math.max(state.currentChapter, chapter), averageSmoothness: avg }
  }

  return { ...state, scenes: newScenes, currentChapter: Math.max(state.currentChapter, chapter) }
}

export function getScene(state: SceneTransitionState, sceneId: string): Scene | null {
  return state.scenes.find(s => s.sceneId === sceneId) || null
}

export function getTransitionAnalysis(state: SceneTransitionState, fromSceneId: string, toSceneId: string): TransitionAnalysis | null {
  return state.analyses.find(a => a.fromScene.sceneId === fromSceneId && a.toScene.sceneId === toSceneId) || null
}

export function getAverageSmoothness(state: SceneTransitionState): number {
  return state.averageSmoothness
}

export function formatTransitionSummary(state: SceneTransitionState): string {
  let s = "=== Scene Transition Summary ===" + "\n"
  s += "Total Scenes: " + state.scenes.length + "\n"
  s += "Transitions Analyzed: " + state.analyses.length + "\n"
  s += "Average Smoothness: " + state.averageSmoothness + "\n"
  return s
}

export function formatTransitionDashboard(state: SceneTransitionState): string {
  let s = "=== Scene Transition Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + "\n"
  s += "Scenes: " + state.scenes.length + " | Avg Smoothness: " + state.averageSmoothness + "\n"

  if (state.analyses.length > 0) {
    s += "\n--- Recent Transitions ---" + "\n"
    const recent = state.analyses.slice(-3)
    for (const a of recent) {
      s += "  Ch " + a.fromScene.chapter + " -> Ch " + a.toScene.chapter + " score=" + a.smoothnessScore + "\n"
    }
  }

  const issues = state.analyses.filter(a => a.smoothnessScore < 50)
  if (issues.length > 0) {
    s += "\n--- Problematic Transitions ---" + "\n"
    for (const a of issues.slice(0, 3)) {
      s += "  " + a.issues.join(', ') + "\n"
    }
  }

  return s
}
