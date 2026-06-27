/**
 * ai/project/ChapterPlan.ts (J1-J10) - 10 engines
 *
 * - J1 ChapterPlan: 单章计划
 * - J2 ChapterList: 多章管理
 * - J3 OutlineBuilder: 大纲构建
 * - J4 PlotThread: 主线/支线
 * - J5 CharacterArc: 角色弧
 * - J6 PlotHole: 剧情漏洞检测
 * - J7 Foreshadow: 伏笔管理
 * - J8 SubplotTracker: 支线追踪
 * - J9 BeatSheet: 节拍表
 * - J10 SceneComposer: 场景合成
 */

// =============================================================================
// J1: ChapterPlan
// =============================================================================

export type ChapterStatus = 'planned' | 'drafting' | 'reviewing' | 'completed' | 'published'

export interface ChapterPlan {
  chapterId: string
  index: number
  title: string
  summary: string
  wordGoal: number
  scenes: Scene[]
  status: ChapterStatus
  plotThreadIds: string[]
  foreshadowIds: string[]
  characterIds: string[]
  createdAt: number
  updatedAt: number
}

export interface Scene {
  sceneId: string
  title: string
  purpose: string
  pov: string  // character ID
  location: string
  characters: string[]
  conflict: string
  wordCount: number
}

export class ChapterPlanBuilder {
  private _plan: Partial<ChapterPlan> = {}

  id(id: string): this { this._plan.chapterId = id; return this }
  index(i: number): this { this._plan.index = i; return this }
  title(t: string): this { this._plan.title = t; return this }
  summary(s: string): this { this._plan.summary = s; return this }
  wordGoal(n: number): this { this._plan.wordGoal = n; return this }
  scenes(scenes: Scene[]): this { this._plan.scenes = scenes; return this }
  status(s: ChapterStatus): this { this._plan.status = s; return this }
  threads(ids: string[]): this { this._plan.plotThreadIds = ids; return this }
  foreshadows(ids: string[]): this { this._plan.foreshadowIds = ids; return this }
  characters(ids: string[]): this { this._plan.characterIds = ids; return this }

  build(): ChapterPlan {
    return {
      chapterId: this._plan.chapterId ?? 'ch_0',
      index: this._plan.index ?? 0,
      title: this._plan.title ?? 'Untitled',
      summary: this._plan.summary ?? '',
      wordGoal: this._plan.wordGoal ?? 3000,
      scenes: this._plan.scenes ?? [],
      status: this._plan.status ?? 'planned',
      plotThreadIds: this._plan.plotThreadIds ?? [],
      foreshadowIds: this._plan.foreshadowIds ?? [],
      characterIds: this._plan.characterIds ?? [],
      createdAt: this._plan.createdAt ?? Date.now(),
      updatedAt: this._plan.updatedAt ?? Date.now(),
    }
  }
}

// =============================================================================
// J2: ChapterList
// =============================================================================

export class ChapterList {
  private _chapters: ChapterPlan[] = []

  add(c: ChapterPlan): void {
    this._chapters.push(c)
    this._chapters.sort((a, b) => a.index - b.index)
  }

  remove(chapterId: string): boolean {
    const before = this._chapters.length
    this._chapters = this._chapters.filter(c => c.chapterId !== chapterId)
    return this._chapters.length < before
  }

  get(chapterId: string): ChapterPlan | undefined {
    return this._chapters.find(c => c.chapterId === chapterId)
  }

  byStatus(status: ChapterStatus): ChapterPlan[] {
    return this._chapters.filter(c => c.status === status)
  }

  list(): ChapterPlan[] {
    return [...this._chapters]
  }

  count(): number {
    return this._chapters.length
  }

  /** 总字数目标 */
  totalWordGoal(): number {
    return this._chapters.reduce((a, c) => a + c.wordGoal, 0)
  }

  /** 已完成字数 */
  totalWordWritten(): number {
    return this._chapters.reduce((a, c) => a + c.scenes.reduce((s, sc) => s + sc.wordCount, 0), 0)
  }

  /** 进度 */
  progress(): number {
    const goal = this.totalWordGoal()
    if (goal === 0) return 0
    return this.totalWordWritten() / goal
  }
}

// =============================================================================
// J3: OutlineBuilder
// =============================================================================

export interface OutlineNode {
  nodeId: string
  title: string
  children: OutlineNode[]
  chapterId?: string
}

export class OutlineBuilder {
  private _root: OutlineNode = { nodeId: 'root', title: 'Outline', children: [] }

  buildStructure(titles: string[]): OutlineNode[] {
    return titles.map((t, i) => ({
      nodeId: `node_${i}`,
      title: t,
      children: [],
      chapterId: `ch_${i}`,
    }))
  }

  /** 从 chapters 自动构建 outline */
  fromChapters(chapters: ChapterPlan[]): OutlineNode {
    const root: OutlineNode = { nodeId: 'root', title: 'Story Outline', children: [] }
    for (const c of chapters) {
      root.children.push({
        nodeId: c.chapterId,
        title: `Ch.${c.index}: ${c.title}`,
        children: c.scenes.map((s, i) => ({
          nodeId: `${c.chapterId}_scene_${i}`,
          title: s.title,
          children: [],
        })),
        chapterId: c.chapterId,
      })
    }
    return root
  }

  /** 序列化 outline 为文本 */
  toText(node: OutlineNode, indent: number = 0): string {
    const prefix = '  '.repeat(indent)
    let out = `${prefix}- ${node.title}\n`
    for (const child of node.children) {
      out += this.toText(child, indent + 1)
    }
    return out
  }
}

// =============================================================================
// J4: PlotThread
// =============================================================================

export type PlotThreadType = 'main' | 'subplot' | 'background' | 'mystery'

export interface PlotThread {
  threadId: string
  type: PlotThreadType
  title: string
  description: string
  chaptersInvolved: string[]
  status: 'introduced' | 'developing' | 'climaxed' | 'resolved' | 'abandoned'
  startChapter: number
  endChapter?: number
  progress: number  // 0-1
}

export class PlotThreadManager {
  private _threads: Map<string, PlotThread> = new Map()

  add(t: PlotThread): void {
    this._threads.set(t.threadId, t)
  }

  remove(threadId: string): boolean {
    return this._threads.delete(threadId)
  }

  get(threadId: string): PlotThread | undefined {
    return this._threads.get(threadId)
  }

  byType(type: PlotThreadType): PlotThread[] {
    return Array.from(this._threads.values()).filter(t => t.type === type)
  }

  list(): PlotThread[] {
    return Array.from(this._threads.values())
  }

  /** 更新进度 */
  updateProgress(threadId: string, progress: number): boolean {
    const t = this._threads.get(threadId)
    if (!t) return false
    t.progress = Math.max(0, Math.min(1, progress))
    if (progress >= 1) t.status = 'resolved'
    else if (progress > 0.7) t.status = 'climaxed'
    else if (progress > 0.1) t.status = 'developing'
    return true
  }

  /** 涉及某章的 threads */
  threadsInChapter(chapterIndex: number): PlotThread[] {
    return Array.from(this._threads.values()).filter(t =>
      t.chaptersInvolved.includes(String(chapterIndex)) ||
      t.startChapter <= chapterIndex && (!t.endChapter || t.endChapter >= chapterIndex)
    )
  }
}

// =============================================================================
// J5: CharacterArc
// =============================================================================

export interface CharacterArc {
  arcId: string
  characterId: string
  arcType: 'positive' | 'negative' | 'flat' | 'transformation'
  startingState: string
  endingState: string
  keyMoments: Array<{ chapter: number; moment: string }>
  growthScore: number  // -1 to 1
}

export class CharacterArcTracker {
  private _arcs: Map<string, CharacterArc> = new Map()

  add(arc: CharacterArc): void {
    this._arcs.set(arc.arcId, arc)
  }

  forCharacter(characterId: string): CharacterArc | undefined {
    return Array.from(this._arcs.values()).find(a => a.characterId === characterId)
  }

  /** 推进 arc */
  addMoment(arcId: string, chapter: number, moment: string): boolean {
    const a = this._arcs.get(arcId)
    if (!a) return false
    a.keyMoments.push({ chapter, moment })
    a.keyMoments.sort((x, y) => x.chapter - y.chapter)
    return true
  }

  list(): CharacterArc[] {
    return Array.from(this._arcs.values())
  }
}

// =============================================================================
// J6: PlotHole
// =============================================================================

export interface PlotHole {
  holeId: string
  description: string
  severity: 'critical' | 'major' | 'minor'
  chapter: number
  category: 'logic' | 'continuity' | 'character' | 'timeline'
  detectedAt: number
}

export class PlotHoleDetector {
  private _holes: PlotHole[] = []

  detect(description: string, severity: PlotHole['severity'], chapter: number, category: PlotHole['category']): PlotHole {
    const h: PlotHole = {
      holeId: `hole_${this._holes.length + 1}`,
      description, severity, chapter, category,
      detectedAt: Date.now(),
    }
    this._holes.push(h)
    return h
  }

  list(): PlotHole[] {
    return [...this._holes]
  }

  bySeverity(severity: PlotHole['severity']): PlotHole[] {
    return this._holes.filter(h => h.severity === severity)
  }

  criticalCount(): number {
    return this.bySeverity('critical').length
  }

  resolve(holeId: string): boolean {
    const idx = this._holes.findIndex(h => h.holeId === holeId)
    if (idx === -1) return false
    this._holes.splice(idx, 1)
    return true
  }
}

// =============================================================================
// J7: Foreshadow
// =============================================================================

export type ForeshadowStatus = 'planted' | 'developing' | 'payoff' | 'forgotten'

export interface Foreshadow {
  foreshadowId: string
  description: string
  plantedChapter: number
  payoffChapter?: number
  status: ForeshadowStatus
  importance: 'critical' | 'major' | 'minor'
}

export class ForeshadowManager {
  private _foreshadows: Map<string, Foreshadow> = new Map()

  plant(description: string, plantedChapter: number, importance: Foreshadow['importance'] = 'major'): Foreshadow {
    const f: Foreshadow = {
      foreshadowId: `fs_${this._foreshadows.size + 1}`,
      description, plantedChapter, status: 'planted', importance,
    }
    this._foreshadows.set(f.foreshadowId, f)
    return f
  }

  payoff(foreshadowId: string, chapter: number): boolean {
    const f = this._foreshadows.get(foreshadowId)
    if (!f) return false
    f.payoffChapter = chapter
    f.status = 'payoff'
    return true
  }

  /** 检测遗忘的伏笔（planted > 10 章未 payoff） */
  detectForgotten(currentChapter: number, maxAge: number = 10): Foreshadow[] {
    return Array.from(this._foreshadows.values()).filter(f =>
      f.status !== 'payoff' && f.status !== 'forgotten' && currentChapter - f.plantedChapter > maxAge
    )
  }

  markForgotten(foreshadowId: string): boolean {
    const f = this._foreshadows.get(foreshadowId)
    if (!f) return false
    f.status = 'forgotten'
    return true
  }

  list(): Foreshadow[] {
    return Array.from(this._foreshadows.values())
  }
}

// =============================================================================
// J8: SubplotTracker
// =============================================================================

export interface Subplot {
  subplotId: string
  title: string
  chapterIndices: number[]
  status: 'active' | 'paused' | 'completed'
}

export class SubplotTracker {
  private _subplots: Map<string, Subplot> = new Map()

  add(s: Subplot): void {
    this._subplots.set(s.subplotId, s)
  }

  activeAt(chapter: number): Subplot[] {
    return Array.from(this._subplots.values()).filter(s =>
      s.chapterIndices.includes(chapter) && s.status !== 'completed'
    )
  }

  pause(subplotId: string): boolean {
    const s = this._subplots.get(subplotId)
    if (!s) return false
    s.status = 'paused'
    return true
  }

  resume(subplotId: string): boolean {
    const s = this._subplots.get(subplotId)
    if (!s) return false
    if (s.status === 'paused') s.status = 'active'
    return true
  }

  complete(subplotId: string): boolean {
    const s = this._subplots.get(subplotId)
    if (!s) return false
    s.status = 'completed'
    return true
  }

  list(): Subplot[] {
    return Array.from(this._subplots.values())
  }
}

// =============================================================================
// J9: BeatSheet
// =============================================================================

export interface Beat {
  beatId: string
  name: string
  position: number  // 0-1 (story progress)
  chapterIndex?: number
  description: string
  required: boolean
}

export const SAVE_THE_CAT_BEATS: string[] = [
  'Opening Image', 'Theme Stated', 'Setup', 'Catalyst', 'Debate',
  'Break into Two', 'B Story', 'Fun and Games', 'Midpoint',
  'Bad Guys Close In', 'All Is Lost', 'Dark Night of the Soul',
  'Break into Three', 'Finale', 'Final Image',
]

export class BeatSheet {
  private _beats: Beat[] = []

  addBeat(b: Omit<Beat, 'beatId'>): Beat {
    const beat: Beat = { ...b, beatId: `beat_${this._beats.length + 1}` }
    this._beats.push(beat)
    this._beats.sort((a, b) => a.position - b.position)
    return beat
  }

  /** 应用 Save the Cat 节拍 */
  applySaveTheCat(): Beat[] {
    const positions = [0.0, 0.05, 0.10, 0.12, 0.20, 0.25, 0.40, 0.50, 0.55, 0.75, 0.80, 0.82, 0.85, 0.95, 1.0]
    const beats: Beat[] = []
    for (let i = 0; i < SAVE_THE_CAT_BEATS.length; i++) {
      beats.push(this.addBeat({
        name: SAVE_THE_CAT_BEATS[i],
        position: positions[i] ?? i / SAVE_THE_CAT_BEATS.length,
        description: `Story beat: ${SAVE_THE_CAT_BEATS[i]}`,
        required: true,
      }))
    }
    return beats
  }

  beatsAt(position: number): Beat[] {
    return this._beats.filter(b => Math.abs(b.position - position) < 0.05)
  }

  list(): Beat[] {
    return [...this._beats]
  }
}

// =============================================================================
// J10: SceneComposer
// =============================================================================

export interface ComposedScene {
  sceneId: string
  scene: Scene
  wordCount: number
  conflictIntensity: number  // 0-1
}

export class SceneComposer {
  /** 从 scene 模板组合 */
  compose(scene: Scene, template: { opener: string; closer: string }): ComposedScene {
    const text = `${template.opener}\n\n${scene.purpose}\n\n${template.closer}`
    return {
      sceneId: scene.sceneId,
      scene,
      wordCount: Math.ceil(text.length / 5),
      conflictIntensity: scene.conflict.length > 0 ? 0.7 : 0.3,
    }
  }

  /** 从多个 scene 合成连贯章节 */
  composeChapter(scenes: Scene[]): { totalWords: number; avgIntensity: number; sceneCount: number } {
    if (scenes.length === 0) return { totalWords: 0, avgIntensity: 0, sceneCount: 0 }
    const totalWords = scenes.reduce((a, s) => a + s.wordCount, 0)
    const intensities = scenes.map(s => s.conflict.length > 0 ? 0.7 : 0.3)
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length
    return { totalWords, avgIntensity, sceneCount: scenes.length }
  }
}