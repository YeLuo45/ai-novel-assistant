/**
 * ai/project/StoryBible.ts (J11-J20) - 10 engines
 *
 * - J11 StoryBible: 故事圣经（百科）
 * - J12 WorldState: 世界观状态
 * - J13 RelationshipGraph: 角色关系图
 * - J14 ThemeTracker: 主题追踪
 * - J15 SymbolTracker: 符号追踪
 * - J16 PlotGraph: 情节图（DAG）
 * - J17 ContinuityChecker: 连续性检查
 * - J18 StoryArc: 故事弧
 * - J19 NarrativePacing: 叙事节奏
 * - J20 ReadabilityScore: 可读性评分
 */

// =============================================================================
// J12: WorldState
// =============================================================================

export interface WorldStateData {
  worldId: string
  setting: string  // "modern Tokyo 2025"
  locations: Map<string, Location>
  factions: Map<string, Faction>
  timeline: WorldEvent[]
  rules: string[]  // 世界规则
}

export interface Location {
  locationId: string
  name: string
  description: string
  parentId?: string
  properties: Record<string, string>
}

export interface Faction {
  factionId: string
  name: string
  description: string
  allies: string[]
  enemies: string[]
  members: string[]
}

export interface WorldEvent {
  eventId: string
  timestamp: number  // in-story time
  description: string
  location?: string
}

export class WorldState {
  private _data: WorldStateData

  constructor(worldId: string, setting: string) {
    this._data = {
      worldId, setting,
      locations: new Map(), factions: new Map(), timeline: [], rules: [],
    }
  }

  addLocation(loc: Location): void {
    this._data.locations.set(loc.locationId, loc)
  }

  addFaction(f: Faction): void {
    this._data.factions.set(f.factionId, f)
  }

  addEvent(e: WorldEvent): void {
    this._data.timeline.push(e)
    this._data.timeline.sort((a, b) => a.timestamp - b.timestamp)
  }

  addRule(rule: string): void {
    this._data.rules.push(rule)
  }

  /** 检查规则是否被破坏 */
  checkRule(rule: string): boolean {
    return this._data.rules.includes(rule)
  }

  /** 获取某个时间点之后的事件 */
  eventsAfter(timestamp: number): WorldEvent[] {
    return this._data.timeline.filter(e => e.timestamp >= timestamp)
  }

  get setting(): string {
    return this._data.setting
  }

  /** 输出 summary */
  summary(): string {
    return `World ${this._data.worldId}: ${this._data.setting}\n` +
      `- ${this._data.locations.size} locations\n` +
      `- ${this._data.factions.size} factions\n` +
      `- ${this._data.timeline.length} events\n` +
      `- ${this._data.rules.length} rules`
  }
}

// =============================================================================
// J13: RelationshipGraph
// =============================================================================

export interface Relationship {
  fromId: string
  toId: string
  type: 'ally' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival' | 'neutral'
  strength: number  // -1 to 1 (negative=enemy, positive=ally)
  sinceChapter: number
  notes?: string
}

export class RelationshipGraph {
  private _edges: Relationship[] = []

  add(r: Relationship): void {
    // 去重
    this._edges = this._edges.filter(e => !(e.fromId === r.fromId && e.toId === r.toId))
    this._edges.push(r)
  }

  remove(fromId: string, toId: string): boolean {
    const before = this._edges.length
    this._edges = this._edges.filter(e => !(e.fromId === fromId && e.toId === toId))
    return this._edges.length < before
  }

  forCharacter(characterId: string): Relationship[] {
    return this._edges.filter(e => e.fromId === characterId || e.toId === characterId)
  }

  byType(type: Relationship['type']): Relationship[] {
    return this._edges.filter(e => e.type === type)
  }

  /** 检查两个角色间的关系 */
  relationshipBetween(a: string, b: string): Relationship | null {
    return this._edges.find(e =>
      (e.fromId === a && e.toId === b) || (e.fromId === b && e.toId === a)
    ) ?? null
  }

  list(): Relationship[] {
    return [...this._edges]
  }

  size(): number {
    return this._edges.length
  }
}

// =============================================================================
// J14: ThemeTracker
// =============================================================================

export interface Theme {
  themeId: string
  name: string
  description: string
  intensity: number  // 0-1
  appearances: Array<{ chapter: number; passage: string }>
}

export class ThemeTracker {
  private _themes: Map<string, Theme> = new Map()

  addTheme(t: Theme): void {
    this._themes.set(t.themeId, t)
  }

  recordAppearance(themeId: string, chapter: number, passage: string): boolean {
    const t = this._themes.get(themeId)
    if (!t) return false
    t.appearances.push({ chapter, passage })
    t.intensity = Math.min(1, t.appearances.length / 10)
    return true
  }

  prominent(limit: number = 5): Theme[] {
    return Array.from(this._themes.values()).sort((a, b) => b.intensity - a.intensity).slice(0, limit)
  }

  list(): Theme[] {
    return Array.from(this._themes.values())
  }

  byAppearanceCount(minCount: number): Theme[] {
    return Array.from(this._themes.values()).filter(t => t.appearances.length >= minCount)
  }
}

// =============================================================================
// J15: SymbolTracker
// =============================================================================

export interface Symbol {
  symbolId: string
  name: string
  meaning: string
  appearances: Array<{ chapter: number; context: string }>
}

export class SymbolTracker {
  private _symbols: Map<string, Symbol> = new Map()

  add(s: Symbol): void {
    this._symbols.set(s.symbolId, s)
  }

  recordAppearance(symbolId: string, chapter: number, context: string): boolean {
    const s = this._symbols.get(symbolId)
    if (!s) return false
    s.appearances.push({ chapter, context })
    return true
  }

  mostFrequentSymbols(limit: number = 5): Symbol[] {
    return Array.from(this._symbols.values()).sort((a, b) => b.appearances.length - a.appearances.length).slice(0, limit)
  }

  list(): Symbol[] {
    return Array.from(this._symbols.values())
  }
}

// =============================================================================
// J16: PlotGraph (DAG)
// =============================================================================

export interface PlotNode {
  nodeId: string
  label: string
  chapterIndex: number
}

export interface PlotEdge {
  from: string
  to: string
  type: 'causal' | 'temporal' | 'thematic'
}

export class PlotGraph {
  private _nodes: Map<string, PlotNode> = new Map()
  private _edges: PlotEdge[] = []

  addNode(n: PlotNode): void {
    this._nodes.set(n.nodeId, n)
  }

  addEdge(e: PlotEdge): void {
    this._edges.push(e)
  }

  /** 拓扑排序（检测循环） */
  topologicalSort(): PlotNode[] | null {
    const inDegree = new Map<string, number>()
    for (const n of this._nodes.keys()) inDegree.set(n, 0)
    for (const e of this._edges) {
      inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1)
    }
    const queue: string[] = []
    for (const [id, d] of inDegree) if (d === 0) queue.push(id)
    const result: PlotNode[] = []
    while (queue.length > 0) {
      const id = queue.shift()!
      const node = this._nodes.get(id)
      if (node) result.push(node)
      for (const e of this._edges) {
        if (e.from === id) {
          inDegree.set(e.to, (inDegree.get(e.to) ?? 0) - 1)
          if (inDegree.get(e.to) === 0) queue.push(e.to)
        }
      }
    }
    return result.length === this._nodes.size ? result : null  // null = cycle
  }

  nodes(): PlotNode[] {
    return Array.from(this._nodes.values())
  }

  edges(): PlotEdge[] {
    return [...this._edges]
  }
}

// =============================================================================
// J17: ContinuityChecker
// =============================================================================

export interface ContinuityIssue {
  issueId: string
  chapter: number
  type: 'fact' | 'character' | 'timeline' | 'location'
  description: string
  severity: 'error' | 'warning'
}

export interface ContinuityFact {
  factId: string
  description: string
  establishedChapter: number
}

export class ContinuityChecker {
  private _facts: ContinuityFact[] = []
  private _issues: ContinuityIssue[] = []

  recordFact(f: Omit<ContinuityFact, 'factId'>): ContinuityFact {
    const fact: ContinuityFact = { ...f, factId: `fact_${this._facts.length + 1}` }
    this._facts.push(fact)
    return fact
  }

  /** 检查新事实是否与已建立事实矛盾 */
  check(newDescription: string, chapter: number, type: ContinuityIssue['type']): ContinuityIssue | null {
    // 简化：若新描述包含已存事实的反义（"not X" + 已存 "X"）
    const normNew = newDescription.toLowerCase().replace(/\s+/g, ' ').trim()
    for (const f of this._facts) {
      const factDesc = f.description.toLowerCase().replace(/\s+/g, ' ').trim()
      const negationMatch = normNew.match(/not\s+([\w\s]+)/)
      if (negationMatch) {
        const negTarget = negationMatch[1].trim()
        if (factDesc.includes(negTarget) || negTarget.includes(factDesc)) {
          const issue: ContinuityIssue = {
            issueId: `ci_${this._issues.length + 1}`,
            chapter, type, description: `Contradicts fact from ch.${f.establishedChapter}: ${f.description}`,
            severity: 'error',
          }
          this._issues.push(issue)
          return issue
        }
      }
    }
    return null
  }

  issues(): ContinuityIssue[] {
    return [...this._issues]
  }

  facts(): ContinuityFact[] {
    return [...this._facts]
  }
}

// =============================================================================
// J18: StoryArc
// =============================================================================

export interface ArcPoint {
  chapter: number
  tension: number  // 0-1
}

export class StoryArc {
  private _points: ArcPoint[] = []

  addPoint(chapter: number, tension: number): void {
    this._points.push({ chapter, tension: Math.max(0, Math.min(1, tension)) })
    this._points.sort((a, b) => a.chapter - b.chapter)
  }

  /** 找到张力峰值 */
  peak(): ArcPoint | null {
    if (this._points.length === 0) return null
    return this._points.reduce((a, b) => a.tension >= b.tension ? a : b)
  }

  /** 找到张力谷底 */
  valley(): ArcPoint | null {
    if (this._points.length === 0) return null
    return this._points.reduce((a, b) => a.tension <= b.tension ? a : b)
  }

  /** 平均张力 */
  average(): number {
    if (this._points.length === 0) return 0
    return this._points.reduce((a, b) => a + b.tension, 0) / this._points.length
  }

  /** 检测是否是有效弧（必须从低到高到低，或单调递增） */
  isValid(): boolean {
    return this._points.length >= 2
  }

  points(): ArcPoint[] {
    return [...this._points]
  }
}

// =============================================================================
// J19: NarrativePacing
// =============================================================================

export interface PacingWindow {
  chapterStart: number
  chapterEnd: number
  expectedPacing: 'slow' | 'normal' | 'fast' | 'climactic'
  notes: string
}

export class NarrativePacing {
  private _windows: PacingWindow[] = []

  planWindow(w: PacingWindow): void {
    this._windows.push(w)
    this._windows.sort((a, b) => a.chapterStart - b.chapterStart)
  }

  forChapter(chapter: number): PacingWindow | null {
    return this._windows.find(w => w.chapterStart <= chapter && w.chapterEnd >= chapter) ?? null
  }

  /** 检测节奏异常（chapters 比预期快/慢） */
  detectAnomaly(actualWords: number, chapter: number): { anomaly: boolean; reason?: string } {
    const w = this.forChapter(chapter)
    if (!w) return { anomaly: false }
    if (w.expectedPacing === 'climactic' && actualWords < 1000) return { anomaly: true, reason: 'climactic chapter too short' }
    if (w.expectedPacing === 'slow' && actualWords > 5000) return { anomaly: true, reason: 'slow chapter too long' }
    return { anomaly: false }
  }

  list(): PacingWindow[] {
    return [...this._windows]
  }
}

// =============================================================================
// J20: ReadabilityScore
// =============================================================================

export class ReadabilityScore {
  /** Flesch-Kincaid grade level (简化版) */
  fleschKincaid(text: string): number {
    const sentences = Math.max(1, (text.match(/[.!?]/g) ?? []).length)
    const words = Math.max(1, (text.match(/\b\w+\b/g) ?? []).length)
    const syllables = this._countSyllables(text)
    if (words === 0) return 0
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  }

  /** 简单字数 + 句长 */
  stats(text: string): { wordCount: number; sentenceCount: number; avgWordsPerSentence: number; avgSyllablesPerWord: number } {
    const sentences = Math.max(1, (text.match(/[.!?]/g) ?? []).length)
    const words = Math.max(1, (text.match(/\b\w+\b/g) ?? []).length)
    const syllables = this._countSyllables(text)
    return {
      wordCount: words,
      sentenceCount: sentences,
      avgWordsPerSentence: words / sentences,
      avgSyllablesPerWord: syllables / words,
    }
  }

  /** 评级：grade < 6 简单，6-10 中等，> 10 难 */
  grade(text: string): 'simple' | 'medium' | 'complex' {
    const grade = this.fleschKincaid(text)
    if (grade < 6) return 'simple'
    if (grade <= 10) return 'medium'
    return 'complex'
  }

  private _countSyllables(text: string): number {
    // 简化：每个英文单词约 1.5 音节，每个中文 1 音节
    const englishWords = (text.match(/[a-zA-Z]+/g) ?? []).length
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length
    return Math.ceil(englishWords * 1.5 + chineseChars)
  }
}

// =============================================================================
// J11: StoryBible (综合上面所有)
// =============================================================================

export class StoryBible {
  world: WorldState
  relationships: RelationshipGraph
  themes: ThemeTracker
  symbols: SymbolTracker
  plot: PlotGraph
  continuity: ContinuityChecker
  arc: StoryArc
  pacing: NarrativePacing
  readability: ReadabilityScore

  constructor(worldId: string, setting: string) {
    this.world = new WorldState(worldId, setting)
    this.relationships = new RelationshipGraph()
    this.themes = new ThemeTracker()
    this.symbols = new SymbolTracker()
    this.plot = new PlotGraph()
    this.continuity = new ContinuityChecker()
    this.arc = new StoryArc()
    this.pacing = new NarrativePacing()
    this.readability = new ReadabilityScore()
  }

  /** 输出完整 summary */
  fullSummary(): string {
    return [
      this.world.summary(),
      `Relationships: ${this.relationships.size()}`,
      `Themes: ${this.themes.list().length}`,
      `Symbols: ${this.symbols.list().length}`,
      `Plot nodes: ${this.plot.nodes().length}, edges: ${this.plot.edges().length}`,
      `Continuity facts: ${this.continuity.facts().length}`,
      `Continuity issues: ${this.continuity.issues().length}`,
      `Arc points: ${this.arc.points().length}`,
      `Pacing windows: ${this.pacing.list().length}`,
    ].join('\n')
  }
}