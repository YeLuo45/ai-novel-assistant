/**
 * ai/project/ChapterPlan.test.ts (J1-J10) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  ChapterPlanBuilder, ChapterList, OutlineBuilder,
  PlotThreadManager, CharacterArcTracker, PlotHoleDetector,
  ForeshadowManager, SubplotTracker, BeatSheet, SAVE_THE_CAT_BEATS, SceneComposer,
  type ChapterPlan, type Scene,
} from './ChapterPlan'

const makeChapter = (i: number, status: ChapterPlan['status'] = 'planned'): ChapterPlan =>
  new ChapterPlanBuilder()
    .id(`ch_${i}`)
    .index(i)
    .title(`Chapter ${i}`)
    .summary(`Summary ${i}`)
    .wordGoal(3000)
    .scenes([])
    .status(status)
    .build()

const makeScene = (id: string, wordCount: number = 500): Scene => ({
  sceneId: id,
  title: `Scene ${id}`,
  purpose: 'advance plot',
  pov: 'pov-1',
  location: 'loc-1',
  characters: ['c-1'],
  conflict: 'inner-struggle',
  wordCount,
})

describe('J1: ChapterPlanBuilder', () => {
  it('builds with defaults', () => {
    const c = new ChapterPlanBuilder().id('ch1').build()
    expect(c.chapterId).toBe('ch1')
    expect(c.title).toBe('Untitled')
    expect(c.status).toBe('planned')
  })

  it('chains methods', () => {
    const c = new ChapterPlanBuilder()
      .id('ch1')
      .index(1)
      .title('A')
      .wordGoal(5000)
      .status('completed')
      .build()
    expect(c.wordGoal).toBe(5000)
    expect(c.status).toBe('completed')
  })

  it('preserves scenes', () => {
    const scenes = [makeScene('s1', 100), makeScene('s2', 200)]
    const c = new ChapterPlanBuilder().id('ch1').scenes(scenes).build()
    expect(c.scenes.length).toBe(2)
  })
})

describe('J2: ChapterList', () => {
  it('add + sorted by index', () => {
    const l = new ChapterList()
    l.add(makeChapter(2))
    l.add(makeChapter(1))
    expect(l.list()[0].index).toBe(1)
  })

  it('byStatus', () => {
    const l = new ChapterList()
    l.add(makeChapter(1, 'completed'))
    l.add(makeChapter(2, 'planned'))
    expect(l.byStatus('completed').length).toBe(1)
  })

  it('totalWordGoal + progress', () => {
    const l = new ChapterList()
    l.add(new ChapterPlanBuilder().id('a').wordGoal(1000).scenes([makeScene('s1', 500)]).build())
    expect(l.totalWordGoal()).toBe(1000)
    expect(l.totalWordWritten()).toBe(500)
    expect(l.progress()).toBe(0.5)
  })

  it('remove', () => {
    const l = new ChapterList()
    l.add(makeChapter(1))
    expect(l.remove('ch_1')).toBe(true)
  })
})

describe('J3: OutlineBuilder', () => {
  it('buildStructure', () => {
    const o = new OutlineBuilder()
    const nodes = o.buildStructure(['Intro', 'Body', 'End'])
    expect(nodes.length).toBe(3)
  })

  it('fromChapters', () => {
    const o = new OutlineBuilder()
    const chapters = [
      new ChapterPlanBuilder().id('c1').index(1).title('A').scenes([makeScene('s1')]).build(),
      new ChapterPlanBuilder().id('c2').index(2).title('B').scenes([makeScene('s2')]).build(),
    ]
    const root = o.fromChapters(chapters)
    expect(root.children.length).toBe(2)
  })

  it('toText', () => {
    const o = new OutlineBuilder()
    const text = o.toText({ nodeId: 'r', title: 'Story', children: [{ nodeId: 'c', title: 'Ch1', children: [] }] })
    expect(text).toContain('Story')
    expect(text).toContain('Ch1')
  })
})

describe('J4: PlotThreadManager', () => {
  it('add + byType', () => {
    const m = new PlotThreadManager()
    m.add({ threadId: 't1', type: 'main', title: 'Main', description: '', chaptersInvolved: ['1'], status: 'developing', startChapter: 1, progress: 0.5 })
    m.add({ threadId: 't2', type: 'subplot', title: 'Sub', description: '', chaptersInvolved: ['1'], status: 'developing', startChapter: 1, progress: 0.3 })
    expect(m.byType('main').length).toBe(1)
  })

  it('updateProgress', () => {
    const m = new PlotThreadManager()
    m.add({ threadId: 't1', type: 'main', title: '', description: '', chaptersInvolved: [], status: 'introduced', startChapter: 1, progress: 0 })
    m.updateProgress('t1', 1)
    expect(m.get('t1')?.status).toBe('resolved')
  })

  it('threadsInChapter', () => {
    const m = new PlotThreadManager()
    m.add({ threadId: 't1', type: 'main', title: '', description: '', chaptersInvolved: ['3'], status: 'developing', startChapter: 1, progress: 0.5 })
    expect(m.threadsInChapter(3).length).toBe(1)
  })
})

describe('J5: CharacterArcTracker', () => {
  it('add + forCharacter', () => {
    const t = new CharacterArcTracker()
    t.add({ arcId: 'a1', characterId: 'c1', arcType: 'positive', startingState: 'weak', endingState: 'strong', keyMoments: [], growthScore: 0.8 })
    expect(t.forCharacter('c1')?.arcType).toBe('positive')
  })

  it('addMoment', () => {
    const t = new CharacterArcTracker()
    t.add({ arcId: 'a1', characterId: 'c1', arcType: 'positive', startingState: '', endingState: '', keyMoments: [], growthScore: 0 })
    t.addMoment('a1', 5, 'turning point')
    expect(t.forCharacter('c1')?.keyMoments.length).toBe(1)
  })
})

describe('J6: PlotHoleDetector', () => {
  it('detect + criticalCount', () => {
    const d = new PlotHoleDetector()
    d.detect('major inconsistency', 'critical', 5, 'logic')
    d.detect('minor', 'minor', 6, 'character')
    expect(d.criticalCount()).toBe(1)
  })

  it('bySeverity', () => {
    const d = new PlotHoleDetector()
    d.detect('x', 'major', 1, 'logic')
    expect(d.bySeverity('major').length).toBe(1)
  })

  it('resolve', () => {
    const d = new PlotHoleDetector()
    const h = d.detect('x', 'major', 1, 'logic')
    expect(d.resolve(h.holeId)).toBe(true)
    expect(d.list().length).toBe(0)
  })
})

describe('J7: ForeshadowManager', () => {
  it('plant + payoff', () => {
    const m = new ForeshadowManager()
    const f = m.plant('mysterious key', 1)
    m.payoff(f.foreshadowId, 20)
    expect(m.list()[0].status).toBe('payoff')
  })

  it('detectForgotten', () => {
    const m = new ForeshadowManager()
    m.plant('old', 1)
    expect(m.detectForgotten(20).length).toBe(1)
  })

  it('markForgotten', () => {
    const m = new ForeshadowManager()
    const f = m.plant('x', 1)
    m.markForgotten(f.foreshadowId)
    expect(m.list()[0].status).toBe('forgotten')
  })
})

describe('J8: SubplotTracker', () => {
  it('activeAt', () => {
    const t = new SubplotTracker()
    t.add({ subplotId: 's1', title: 'Sub', chapterIndices: [3, 5, 7], status: 'active' })
    expect(t.activeAt(5).length).toBe(1)
  })

  it('pause + resume + complete', () => {
    const t = new SubplotTracker()
    t.add({ subplotId: 's1', title: '', chapterIndices: [1], status: 'active' })
    t.pause('s1')
    expect(t.list()[0].status).toBe('paused')
    t.resume('s1')
    expect(t.list()[0].status).toBe('active')
    t.complete('s1')
    expect(t.list()[0].status).toBe('completed')
  })
})

describe('J9: BeatSheet', () => {
  it('applySaveTheCat creates 15 beats', () => {
    const b = new BeatSheet()
    const beats = b.applySaveTheCat()
    expect(beats.length).toBe(15)
  })

  it('SAVE_THE_CAT_BEATS has 15 names', () => {
    expect(SAVE_THE_CAT_BEATS.length).toBe(15)
  })

  it('beatsAt finds nearby beat', () => {
    const b = new BeatSheet()
    b.applySaveTheCat()
    const found = b.beatsAt(0.5)
    expect(found.length).toBeGreaterThan(0)
  })
})

describe('J10: SceneComposer', () => {
  it('compose from template', () => {
    const c = new SceneComposer()
    const r = c.compose(makeScene('s1'), { opener: 'Cold open.', closer: 'The end.' })
    expect(r.sceneId).toBe('s1')
    expect(r.conflictIntensity).toBeGreaterThan(0)
  })

  it('composeChapter aggregates', () => {
    const c = new SceneComposer()
    const r = c.composeChapter([makeScene('s1', 100), makeScene('s2', 200)])
    expect(r.totalWords).toBe(300)
    expect(r.sceneCount).toBe(2)
  })

  it('composeChapter empty', () => {
    const c = new SceneComposer()
    expect(c.composeChapter([]).sceneCount).toBe(0)
  })
})