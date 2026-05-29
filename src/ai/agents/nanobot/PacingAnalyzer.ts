export type PacingRhythm = 'breathing' | 'accelerating' | 'decelerating' | 'climactic' | 'plateau'

export interface ScenePacingData {
  chapter: number
  wordCount: number
  pacingScore: number  // 0-100
  rhythm: PacingRhythm
  isActionScene: boolean
}

export interface PacingAnalysisState {
  scenes: ScenePacingData[]
  currentChapter: number
  averagePacing: number
  rhythmChanges: number
  pacingScore: number  // overall 0-100
}

export function createEmptyPacingAnalysisState(): PacingAnalysisState {
  return { scenes: [], currentChapter: 0, averagePacing: 0, rhythmChanges: 0, pacingScore: 100 }
}

export function analyzeScenePacing(
  state: PacingAnalysisState,
  chapter: number,
  wordCount: number,
  isActionScene: boolean
): PacingAnalysisState {
  // Calculate pacing score based on word count and action flag
  let pacingScore = 50
  if (wordCount >= 500 && wordCount <= 2000) pacingScore += 20
  else if (wordCount >= 2000 && wordCount <= 4000) pacingScore += 10
  else if (wordCount < 500) pacingScore -= 20
  else if (wordCount > 5000) pacingScore -= 10

  if (isActionScene) pacingScore = Math.min(100, pacingScore + 15)
  pacingScore = Math.max(0, Math.min(100, pacingScore))

  // Determine rhythm
  let rhythm: PacingRhythm = 'plateau'
  if (state.scenes.length >= 2) {
    const prev = state.scenes[state.scenes.length - 1]
    const prevScore = prev.pacingScore
    if (pacingScore > prevScore + 10) rhythm = 'accelerating'
    else if (pacingScore < prevScore - 10) rhythm = 'decelerating'
    else rhythm = 'plateau'
  } else if (wordCount >= 1000 && !isActionScene) {
    rhythm = 'breathing'
  } else if (isActionScene) {
    rhythm = 'climactic'
  }

  const scene: ScenePacingData = {
    chapter,
    wordCount,
    pacingScore,
    rhythm,
    isActionScene,
  }

  const newScenes = [...state.scenes, scene]
  const totalPacing = newScenes.reduce((s, sc) => s + sc.pacingScore, 0)
  const averagePacing = Math.round(totalPacing / newScenes.length)

  // Count rhythm changes
  let rhythmChanges = 0
  for (let i = 1; i < newScenes.length; i++) {
    if (newScenes[i].rhythm !== newScenes[i - 1].rhythm) rhythmChanges++
  }

  return {
    scenes: newScenes,
    currentChapter: chapter,
    averagePacing,
    rhythmChanges,
    pacingScore: averagePacing,
  }
}

export function getPacingAtChapter(state: PacingAnalysisState, chapter: number): ScenePacingData | null {
  return state.scenes.find(s => s.chapter === chapter) || null
}

export function getPacingRhythm(state: PacingAnalysisState): PacingRhythm[] {
  return state.scenes.map(s => s.rhythm)
}

export function formatPacingSummary(state: PacingAnalysisState): string {
  let s = "=== Pacing Analysis Summary ===" + "\n"
  s += "Chapters Analyzed: " + state.scenes.length + "\n"
  s += "Average Pacing: " + state.averagePacing + "\n"
  s += "Rhythm Changes: " + state.rhythmChanges + "\n"
  s += "Overall Pacing Score: " + state.pacingScore + "\n"
  return s
}

export function formatPacingDashboard(state: PacingAnalysisState): string {
  let s = "=== Pacing Dashboard ===" + "\n"
  s += "Chapter: " + state.currentChapter + " | Avg Pacing: " + state.averagePacing + " | Rhythm Changes: " + state.rhythmChanges + "\n"

  if (state.scenes.length > 0) {
    s += "\n--- Recent Chapters ---" + "\n"
    for (const sc of state.scenes.slice(-5)) {
      const actionFlag = sc.isActionScene ? " [ACTION]" : ""
      s += "  Ch" + sc.chapter + " words=" + sc.wordCount + " pacing=" + sc.pacingScore + " [" + sc.rhythm + "]" + actionFlag + "\n"
    }
  }

  return s
}