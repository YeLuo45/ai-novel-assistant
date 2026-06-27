/**
 * ai/project/demo/project-integration-demo.ts (J26)
 */

import {
  ChapterPlanBuilder, ChapterList, OutlineBuilder, PlotThreadManager,
  CharacterArcTracker, PlotHoleDetector, ForeshadowManager, SubplotTracker,
  BeatSheet, SceneComposer,
  StoryBible, ReadabilityScore,
} from '../index'

export interface DemoResult {
  chapterCount: number
  outlineNodes: number
  plotThreads: number
  characterArcs: number
  plotHoles: number
  foreshadows: number
  subplots: number
  beatCount: number
  worldLocations: number
  worldFactions: number
  relationships: number
  themes: number
  symbols: number
  plotNodes: number
  continuityFacts: number
  arcPoints: number
  pacingWindows: number
}

export function runProjectIntegrationDemo(): DemoResult {
  // 1. Chapters + outline
  const chapterList = new ChapterList()
  for (let i = 1; i <= 5; i++) {
    chapterList.add(new ChapterPlanBuilder()
      .id(`ch_${i}`)
      .index(i)
      .title(`Chapter ${i}`)
      .summary(`Summary ${i}`)
      .wordGoal(3000)
      .status(i <= 2 ? 'completed' : 'planned')
      .build())
  }
  const outline = new OutlineBuilder()
  const root = outline.fromChapters(chapterList.list())

  // 2. Plot threads
  const threads = new PlotThreadManager()
  threads.add({ threadId: 'main', type: 'main', title: 'Main Quest', description: '', chaptersInvolved: ['1', '2', '3'], status: 'developing', startChapter: 1, progress: 0.6 })
  threads.add({ threadId: 'sub1', type: 'subplot', title: 'Romance', description: '', chaptersInvolved: ['2', '3'], status: 'developing', startChapter: 2, progress: 0.3 })

  // 3. Character arcs
  const arcs = new CharacterArcTracker()
  arcs.add({ arcId: 'a1', characterId: 'Alice', arcType: 'positive', startingState: 'weak', endingState: 'strong', keyMoments: [{ chapter: 1, moment: 'call to adventure' }], growthScore: 0.7 })

  // 4. Plot holes + foreshadows + subplots
  const holes = new PlotHoleDetector()
  holes.detect('logic gap', 'major', 3, 'logic')

  const foreshadows = new ForeshadowManager()
  foreshadows.plant('mysterious key', 1)

  const subplots = new SubplotTracker()
  subplots.add({ subplotId: 's1', title: 'Side story', chapterIndices: [2, 4], status: 'active' })

  // 5. Beat sheet
  const beats = new BeatSheet()
  beats.applySaveTheCat()

  // 6. Story bible
  const bible = new StoryBible('w1', 'modern Tokyo 2025')
  bible.world.addLocation({ locationId: 'l1', name: 'Tokyo', description: 'capital', properties: {} })
  bible.world.addFaction({ factionId: 'f1', name: 'Knights', description: 'd', allies: [], enemies: [], members: [] })
  bible.relationships.add({ fromId: 'Alice', toId: 'Bob', type: 'romantic', strength: 0.8, sinceChapter: 1 })
  bible.themes.addTheme({ themeId: 'redemption', name: 'Redemption', description: 'arc', intensity: 0.5, appearances: [] })
  bible.symbols.add({ symbolId: 'dove', name: 'Dove', meaning: 'peace', appearances: [] })
  bible.plot.addNode({ nodeId: 'p1', label: 'Inciting incident', chapterIndex: 1 })
  bible.plot.addNode({ nodeId: 'p2', label: 'Climax', chapterIndex: 4 })
  bible.plot.addEdge({ from: 'p1', to: 'p2', type: 'causal' })
  bible.continuity.recordFact({ description: 'Alice is human', establishedChapter: 1 })
  bible.arc.addPoint(1, 0.3)
  bible.arc.addPoint(5, 0.9)
  bible.pacing.planWindow({ chapterStart: 1, chapterEnd: 1, expectedPacing: 'slow', notes: 'intro' })

  return {
    chapterCount: chapterList.count(),
    outlineNodes: root.children.length,
    plotThreads: threads.list().length,
    characterArcs: arcs.list().length,
    plotHoles: holes.list().length,
    foreshadows: foreshadows.list().length,
    subplots: subplots.list().length,
    beatCount: beats.list().length,
    worldLocations: 1,
    worldFactions: 1,
    relationships: bible.relationships.size(),
    themes: bible.themes.list().length,
    symbols: bible.symbols.list().length,
    plotNodes: bible.plot.nodes().length,
    continuityFacts: bible.continuity.facts().length,
    arcPoints: bible.arc.points().length,
    pacingWindows: bible.pacing.list().length,
  }
}