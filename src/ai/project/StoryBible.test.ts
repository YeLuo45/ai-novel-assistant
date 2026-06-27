/**
 * ai/project/StoryBible.test.ts (J11-J20) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  WorldState, RelationshipGraph, ThemeTracker, SymbolTracker,
  PlotGraph, ContinuityChecker, StoryArc, NarrativePacing,
  ReadabilityScore, StoryBible,
  type Relationship,
} from './StoryBible'

describe('J11: StoryBible', () => {
  it('creates with all 9 subsystems', () => {
    const b = new StoryBible('w1', 'modern Tokyo 2025')
    expect(b.world).toBeDefined()
    expect(b.relationships).toBeDefined()
    expect(b.themes).toBeDefined()
    expect(b.symbols).toBeDefined()
    expect(b.plot).toBeDefined()
    expect(b.continuity).toBeDefined()
    expect(b.arc).toBeDefined()
    expect(b.pacing).toBeDefined()
    expect(b.readability).toBeDefined()
  })

  it('fullSummary', () => {
    const b = new StoryBible('w1', 'X')
    const s = b.fullSummary()
    expect(s).toContain('Relationships')
    expect(s).toContain('Themes')
  })
})

describe('J12: WorldState', () => {
  it('addLocation + summary', () => {
    const w = new WorldState('w1', 'fantasy')
    w.addLocation({ locationId: 'l1', name: 'Castle', description: 'big', properties: { size: 'huge' } })
    const s = w.summary()
    expect(s).toContain('1 locations')
  })

  it('addEvent sorts by timestamp', () => {
    const w = new WorldState('w1', 'X')
    w.addEvent({ eventId: 'e2', timestamp: 200, description: 'b' })
    w.addEvent({ eventId: 'e1', timestamp: 100, description: 'a' })
    expect(w.eventsAfter(0)[0].eventId).toBe('e1')
  })

  it('addRule + checkRule', () => {
    const w = new WorldState('w1', 'X')
    w.addRule('no magic')
    expect(w.checkRule('no magic')).toBe(true)
    expect(w.checkRule('magic allowed')).toBe(false)
  })

  it('addFaction', () => {
    const w = new WorldState('w1', 'X')
    w.addFaction({ factionId: 'f1', name: 'Knights', description: 'd', allies: [], enemies: [], members: [] })
    expect(w.summary()).toContain('1 factions')
  })
})

describe('J13: RelationshipGraph', () => {
  it('add + remove', () => {
    const g = new RelationshipGraph()
    const r: Relationship = { fromId: 'a', toId: 'b', type: 'ally', strength: 0.8, sinceChapter: 1 }
    g.add(r)
    expect(g.size()).toBe(1)
    expect(g.remove('a', 'b')).toBe(true)
  })

  it('forCharacter', () => {
    const g = new RelationshipGraph()
    g.add({ fromId: 'a', toId: 'b', type: 'ally', strength: 0.8, sinceChapter: 1 })
    expect(g.forCharacter('a').length).toBe(1)
  })

  it('relationshipBetween bidirectional', () => {
    const g = new RelationshipGraph()
    g.add({ fromId: 'a', toId: 'b', type: 'enemy', strength: -0.5, sinceChapter: 1 })
    expect(g.relationshipBetween('b', 'a')?.type).toBe('enemy')
  })

  it('byType', () => {
    const g = new RelationshipGraph()
    g.add({ fromId: 'a', toId: 'b', type: 'ally', strength: 0.5, sinceChapter: 1 })
    g.add({ fromId: 'a', toId: 'c', type: 'enemy', strength: -0.5, sinceChapter: 1 })
    expect(g.byType('enemy').length).toBe(1)
  })
})

describe('J14: ThemeTracker', () => {
  it('addTheme + recordAppearance', () => {
    const t = new ThemeTracker()
    t.addTheme({ themeId: 'th1', name: 'Redemption', description: 'd', intensity: 0, appearances: [] })
    t.recordAppearance('th1', 5, 'passage 1')
    t.recordAppearance('th1', 6, 'passage 2')
    expect(t.list()[0].intensity).toBeCloseTo(0.2)
  })

  it('prominent', () => {
    const t = new ThemeTracker()
    t.addTheme({ themeId: 'a', name: 'A', description: '', intensity: 0, appearances: [] })
    t.addTheme({ themeId: 'b', name: 'B', description: '', intensity: 0, appearances: [] })
    for (let i = 0; i < 20; i++) t.recordAppearance('a', i, 'x')
    expect(t.prominent()[0].themeId).toBe('a')
  })
})

describe('J15: SymbolTracker', () => {
  it('add + recordAppearance', () => {
    const s = new SymbolTracker()
    s.add({ symbolId: 's1', name: 'Dove', meaning: 'peace', appearances: [] })
    s.recordAppearance('s1', 1, 'dove flew')
    expect(s.list()[0].appearances.length).toBe(1)
  })

  it('mostFrequentSymbols', () => {
    const s = new SymbolTracker()
    s.add({ symbolId: 'a', name: 'A', meaning: '', appearances: [] })
    s.add({ symbolId: 'b', name: 'B', meaning: '', appearances: [] })
    s.recordAppearance('a', 1, 'x')
    s.recordAppearance('a', 2, 'y')
    expect(s.mostFrequentSymbols()[0].symbolId).toBe('a')
  })
})

describe('J16: PlotGraph', () => {
  it('addNode + addEdge', () => {
    const g = new PlotGraph()
    g.addNode({ nodeId: 'n1', label: 'A', chapterIndex: 1 })
    g.addNode({ nodeId: 'n2', label: 'B', chapterIndex: 2 })
    g.addEdge({ from: 'n1', to: 'n2', type: 'causal' })
    expect(g.nodes().length).toBe(2)
  })

  it('topologicalSort linear', () => {
    const g = new PlotGraph()
    g.addNode({ nodeId: 'n1', label: 'A', chapterIndex: 1 })
    g.addNode({ nodeId: 'n2', label: 'B', chapterIndex: 2 })
    g.addNode({ nodeId: 'n3', label: 'C', chapterIndex: 3 })
    g.addEdge({ from: 'n1', to: 'n2', type: 'causal' })
    g.addEdge({ from: 'n2', to: 'n3', type: 'causal' })
    const sorted = g.topologicalSort()
    expect(sorted?.map(n => n.nodeId)).toEqual(['n1', 'n2', 'n3'])
  })

  it('topologicalSort detects cycle', () => {
    const g = new PlotGraph()
    g.addNode({ nodeId: 'n1', label: 'A', chapterIndex: 1 })
    g.addNode({ nodeId: 'n2', label: 'B', chapterIndex: 2 })
    g.addEdge({ from: 'n1', to: 'n2', type: 'causal' })
    g.addEdge({ from: 'n2', to: 'n1', type: 'causal' })  // cycle
    expect(g.topologicalSort()).toBeNull()
  })
})

describe('J17: ContinuityChecker', () => {
  it('recordFact + facts', () => {
    const c = new ContinuityChecker()
    c.recordFact({ description: 'Alice has blue eyes', establishedChapter: 1 })
    expect(c.facts().length).toBe(1)
  })

  it('check detects contradiction', () => {
    const c = new ContinuityChecker()
    c.recordFact({ description: 'Alice loves Bob', establishedChapter: 1 })
    const issue = c.check('Alice not loves Bob', 5, 'character')
    expect(issue?.severity).toBe('error')
  })
})

describe('J18: StoryArc', () => {
  it('addPoint + peak + valley', () => {
    const a = new StoryArc()
    a.addPoint(1, 0.2)
    a.addPoint(5, 0.9)
    a.addPoint(10, 0.5)
    expect(a.peak()?.tension).toBe(0.9)
    expect(a.valley()?.tension).toBe(0.2)
  })

  it('average', () => {
    const a = new StoryArc()
    a.addPoint(1, 0.4)
    a.addPoint(2, 0.6)
    expect(a.average()).toBeCloseTo(0.5)
  })

  it('isValid requires 2+ points', () => {
    const a = new StoryArc()
    expect(a.isValid()).toBe(false)
    a.addPoint(1, 0.5)
    expect(a.isValid()).toBe(false)
    a.addPoint(2, 0.6)
    expect(a.isValid()).toBe(true)
  })
})

describe('J19: NarrativePacing', () => {
  it('planWindow + forChapter', () => {
    const p = new NarrativePacing()
    p.planWindow({ chapterStart: 1, chapterEnd: 5, expectedPacing: 'slow', notes: 'intro' })
    expect(p.forChapter(3)?.expectedPacing).toBe('slow')
  })

  it('detectAnomaly short climactic', () => {
    const p = new NarrativePacing()
    p.planWindow({ chapterStart: 1, chapterEnd: 1, expectedPacing: 'climactic', notes: '' })
    expect(p.detectAnomaly(500, 1).anomaly).toBe(true)
  })

  it('detectAnomaly long slow', () => {
    const p = new NarrativePacing()
    p.planWindow({ chapterStart: 1, chapterEnd: 1, expectedPacing: 'slow', notes: '' })
    expect(p.detectAnomaly(8000, 1).anomaly).toBe(true)
  })
})

describe('J20: ReadabilityScore', () => {
  it('fleschKincaid returns a number', () => {
    const r = new ReadabilityScore()
    expect(typeof r.fleschKincaid('Hello world. This is a test.')).toBe('number')
  })

  it('stats', () => {
    const r = new ReadabilityScore()
    const s = r.stats('Hello world. How are you?')
    expect(s.wordCount).toBeGreaterThan(0)
    expect(s.sentenceCount).toBe(2)
  })

  it('grade simple text', () => {
    const r = new ReadabilityScore()
    expect(r.grade('Cat sat.')).toBe('simple')
  })

  it('handles Chinese text', () => {
    const r = new ReadabilityScore()
    const score = r.fleschKincaid('今天天气很好。我们去公园吧。')
    expect(score).toBeGreaterThan(0)
  })
})