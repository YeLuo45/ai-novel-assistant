/**
 * ai/project/__tests__/project-integration.test.ts (J27)
 */

import { describe, it, expect } from 'vitest'
import {
  ChapterPlanBuilder, ChapterList, OutlineBuilder, PlotThreadManager,
  CharacterArcTracker, PlotHoleDetector, ForeshadowManager, SubplotTracker,
  BeatSheet, SceneComposer, WorldState, RelationshipGraph, ThemeTracker,
  SymbolTracker, PlotGraph, ContinuityChecker, StoryArc, NarrativePacing,
  ReadabilityScore, StoryBible,
} from '../index'

describe('Project — end-to-end', () => {
  it('chapters + outline + threads lifecycle', () => {
    const list = new ChapterList()
    list.add(new ChapterPlanBuilder().id('c1').index(1).title('A').build())
    const outline = new OutlineBuilder()
    const root = outline.fromChapters(list.list())
    expect(root.children.length).toBe(1)

    const threads = new PlotThreadManager()
    threads.add({ threadId: 't1', type: 'main', title: '', description: '', chaptersInvolved: [], status: 'developing', startChapter: 1, progress: 0.5 })
    expect(threads.list().length).toBe(1)
  })

  it('holes + foreshadows + subplots', () => {
    const holes = new PlotHoleDetector()
    const h = holes.detect('gap', 'critical', 1, 'logic')
    expect(h.holeId).toBeTruthy()

    const f = new ForeshadowManager()
    const fs = f.plant('hint', 1)
    f.payoff(fs.foreshadowId, 10)
    expect(f.list()[0].status).toBe('payoff')

    const s = new SubplotTracker()
    s.add({ subplotId: 'sp1', title: '', chapterIndices: [1], status: 'active' })
    s.complete('sp1')
    expect(s.list()[0].status).toBe('completed')
  })

  it('beat sheet + scene composer', () => {
    const b = new BeatSheet()
    expect(b.applySaveTheCat().length).toBe(15)
    const c = new SceneComposer()
    const r = c.compose({ sceneId: 's1', title: 'A', purpose: '', pov: 'p1', location: 'l1', characters: [], conflict: '', wordCount: 0 }, { opener: 'a', closer: 'b' })
    expect(r.sceneId).toBe('s1')
  })

  it('story bible subsystems', () => {
    const b = new StoryBible('w1', 'X')
    b.world.addRule('no magic')
    b.relationships.add({ fromId: 'a', toId: 'b', type: 'ally', strength: 0.5, sinceChapter: 1 })
    b.themes.addTheme({ themeId: 't1', name: 'T', description: '', intensity: 0, appearances: [] })
    b.symbols.add({ symbolId: 's1', name: 'S', meaning: '', appearances: [] })
    b.plot.addNode({ nodeId: 'n1', label: 'A', chapterIndex: 1 })
    b.continuity.recordFact({ description: 'fact1', establishedChapter: 1 })
    b.arc.addPoint(1, 0.5)
    b.pacing.planWindow({ chapterStart: 1, chapterEnd: 1, expectedPacing: 'slow', notes: '' })

    const summary = b.fullSummary()
    expect(summary).toContain('World')
    expect(summary).toContain('Themes')
  })

  it('plot graph topological sort', () => {
    const g = new PlotGraph()
    g.addNode({ nodeId: 'a', label: 'A', chapterIndex: 1 })
    g.addNode({ nodeId: 'b', label: 'B', chapterIndex: 2 })
    g.addEdge({ from: 'a', to: 'b', type: 'causal' })
    expect(g.topologicalSort()?.length).toBe(2)
  })

  it('readability on Chinese text', () => {
    const r = new ReadabilityScore()
    const score = r.fleschKincaid('今天是个好日子。我们去公园散步。')
    expect(score).toBeGreaterThan(0)
  })

  it('character arc + subplot integration', () => {
    const arcs = new CharacterArcTracker()
    arcs.add({ arcId: 'a1', characterId: 'Alice', arcType: 'positive', startingState: '', endingState: '', keyMoments: [], growthScore: 0 })
    arcs.addMoment('a1', 3, 'turning point')
    expect(arcs.forCharacter('Alice')?.keyMoments.length).toBe(1)

    const subplots = new SubplotTracker()
    subplots.add({ subplotId: 's1', title: '', chapterIndices: [3], status: 'active' })
    expect(subplots.activeAt(3).length).toBe(1)
  })
})