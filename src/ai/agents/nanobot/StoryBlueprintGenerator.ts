// StoryBlueprintGenerator - V276: Story blueprint generation based on three-act structure
// Inspired by: ruflo (hierarchical decomposition) + thunderbolt (feedback loops)

export type ActPhase = 'setup' | 'rising' | 'climax' | 'falling' | 'resolution'

export interface BlueprintChapter {
  chapterNumber: number
  act: 1 | 2 | 3
  phase: ActPhase
  targetWordCount: number
  keyEvents: string[]
  pivotPoint: boolean
}

export interface StoryBlueprintState {
  blueprint: BlueprintChapter[]
  totalChapters: number
  targetWordCount: number
  actBreakdown: { act1: number, act2: number, act3: number }
}

export function createEmptyBlueprintState(): StoryBlueprintState {
  return { blueprint: [], totalChapters: 0, targetWordCount: 0, actBreakdown: { act1: 0, act2: 0, act3: 0 } }
}

export function generateBlueprint(
  state: StoryBlueprintState,
  totalChapters: number,
  avgWordsPerChapter: number
): StoryBlueprintState {
  const act1End = Math.floor(totalChapters * 0.25)
  const act2End = Math.floor(totalChapters * 0.75)
  const chapters: BlueprintChapter[] = []
  for (let i = 1; i <= totalChapters; i++) {
    let act: 1 | 2 | 3 = 1
    let phase: ActPhase = 'setup'
    if (i > act1End && i <= act2End) { act = 2; phase = i === act2End ? 'climax' : 'rising' }
    else if (i > act2End) { act = 3; phase = 'resolution' }
    chapters.push({
      chapterNumber: i,
      act,
      phase,
      targetWordCount: avgWordsPerChapter,
      keyEvents: [],
      pivotPoint: i === act1End || i === act2End,
    })
  }
  const act1 = chapters.filter(c => c.act === 1).length
  const act2 = chapters.filter(c => c.act === 2).length
  const act3 = chapters.filter(c => c.act === 3).length
  return {
    blueprint: chapters,
    totalChapters: chapters.length,
    targetWordCount: totalChapters * avgWordsPerChapter,
    actBreakdown: { act1, act2, act3 },
  }
}

export function getChapterByAct(state: StoryBlueprintState, act: 1 | 2 | 3): BlueprintChapter[] {
  return state.blueprint.filter(c => c.act === act)
}

export function getPivotChapters(state: StoryBlueprintState): BlueprintChapter[] {
  return state.blueprint.filter(c => c.pivotPoint)
}

export function getActWordCounts(state: StoryBlueprintState): { act1: number, act2: number, act3: number } {
  if (state.totalChapters === 0) return { act1: 0, act2: 0, act3: 0 }
  const perChapter = state.targetWordCount / state.totalChapters
  return {
    act1: state.actBreakdown.act1 * perChapter,
    act2: state.actBreakdown.act2 * perChapter,
    act3: state.actBreakdown.act3 * perChapter,
  }
}

export function formatBlueprintSummary(state: StoryBlueprintState): string {
  let s = "=== Story Blueprint Summary ===\n"
  s += "Chapters: " + state.totalChapters + " | Words: " + state.targetWordCount + "\n"
  s += "Act breakdown: " + state.actBreakdown.act1 + "/" + state.actBreakdown.act2 + "/" + state.actBreakdown.act3 + "\n"
  return s
}

export function formatBlueprintDashboard(state: StoryBlueprintState): string {
  let s = "=== Story Blueprint Dashboard ===\n"
  s += "Total: " + state.totalChapters + " chapters | Target: " + state.targetWordCount + " words\n"
  for (const act of [1, 2, 3] as const) {
    const chapters = getChapterByAct(state, act)
    if (chapters.length > 0) {
      s += "Act " + act + ": " + chapters.length + " chapters (pivots: " + chapters.filter(c => c.pivotPoint).length + ")\n"
    }
  }
  return s
}
