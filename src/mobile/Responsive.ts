/**
 * mobile/Responsive.ts (P1-P10) - 10 engines
 *
 * - P1 BreakpointSystem: 断点系统
 * - P2 ResponsiveContainer: 响应式容器
 * - P3 MediaQuery: 媒体查询
 * - P4 ContainerQueries: 容器查询
 * - P5 FlexibleGrid: 弹性网格
 * - P6 TouchGesture: 触摸手势
 * - P7 SwipeNavigation: 滑动导航
 * - P8 PullToRefresh: 下拉刷新
 * - P9 BottomSheet: 底部抽屉
 * - P10 SafeArea: 安全区域
 */

// =============================================================================
// P1: BreakpointSystem
// =============================================================================

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface BreakpointRange {
  min: number
  max?: number
}

export const DEFAULT_BREAKPOINTS: Record<BreakpointName, BreakpointRange> = {
  xs: { min: 0, max: 479 },
  sm: { min: 480, max: 767 },
  md: { min: 768, max: 1023 },
  lg: { min: 1024, max: 1439 },
  xl: { min: 1440, max: 1919 },
  '2xl': { min: 1920 },
}

export class BreakpointSystem {
  private _breakpoints: Map<BreakpointName, BreakpointRange>
  private _current: BreakpointName = 'xs'
  private _listeners: Set<(bp: BreakpointName) => void> = new Set()

  constructor(breakpoints: Record<BreakpointName, BreakpointRange> = DEFAULT_BREAKPOINTS) {
    this._breakpoints = new Map(Object.entries(breakpoints))
  }

  /** 检测给定 width 的断点 */
  detect(width: number): BreakpointName {
    let result: BreakpointName = 'xs'
    for (const [name, range] of this._breakpoints) {
      if (width >= range.min && (range.max === undefined || width <= range.max)) {
        result = name as BreakpointName
        break
      }
    }
    if (result !== this._current) {
      this._current = result
      for (const l of this._listeners) l(result)
    }
    return result
  }

  current(): BreakpointName {
    return this._current
  }

  minWidth(bp: BreakpointName): number {
    return this._breakpoints.get(bp)?.min ?? 0
  }

  isUp(bp: BreakpointName, width: number): boolean {
    return width >= this.minWidth(bp)
  }

  isDown(bp: BreakpointName, width: number): boolean {
    const range = this._breakpoints.get(bp)
    if (!range) return false
    return width < (range.max ?? Infinity)
  }

  subscribe(fn: (bp: BreakpointName) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P2: ResponsiveContainer
// =============================================================================

export interface ContainerSize {
  width: number
  height: number
}

export class ResponsiveContainer {
  private _size: ContainerSize = { width: 0, height: 0 }
  private _maxWidth: number
  private _padding: number
  private _listeners: Set<(size: ContainerSize) => void> = new Set()

  constructor(maxWidth: number = 1200, padding: number = 16) {
    this._maxWidth = maxWidth
    this._padding = padding
  }

  update(width: number, height: number): ContainerSize {
    this._size = { width, height }
    for (const l of this._listeners) l(this._size)
    return this._size
  }

  /** 计算 content width (减去 padding) */
  contentWidth(): number {
    return Math.max(0, this._size.width - this._padding * 2)
  }

  /** 计算 max content width (受 maxWidth 限制) */
  maxContentWidth(): number {
    return Math.min(this.contentWidth(), this._maxWidth)
  }

  current(): ContainerSize {
    return this._size
  }

  isMobile(): boolean {
    return this._size.width < 768
  }

  isTablet(): boolean {
    return this._size.width >= 768 && this._size.width < 1024
  }

  isDesktop(): boolean {
    return this._size.width >= 1024
  }

  subscribe(fn: (size: ContainerSize) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P3: MediaQuery
// =============================================================================

export type MediaFeature = 'prefers-dark' | 'prefers-reduced-motion' | 'prefers-contrast' | 'hover' | 'pointer-coarse'

export class MediaQuery {
  private _queries: Map<MediaFeature, boolean> = new Map()
  private _listeners: Set<(feature: MediaFeature, value: boolean) => void> = new Set()

  set(feature: MediaFeature, value: boolean): void {
    const old = this._queries.get(feature)
    this._queries.set(feature, value)
    if (old !== value) {
      for (const l of this._listeners) l(feature, value)
    }
  }

  get(feature: MediaFeature): boolean {
    return this._queries.get(feature) ?? false
  }

  matches(query: string): boolean {
    // 简化：解析 "feature:value" 形式
    const m = query.match(/^([a-z-]+)(?::([a-z-]+))?$/)
    if (!m) return false
    const feature = m[1] as MediaFeature
    if (m[2]) {
      const val = m[2] === 'true'
      return this.get(feature) === val
    }
    return this.get(feature)
  }

  subscribe(fn: (feature: MediaFeature, value: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P4: ContainerQueries
// =============================================================================

export class ContainerQuery {
  private _size: ContainerSize = { width: 0, height: 0 }
  private _queries: Map<string, () => boolean> = new Map()

  setSize(width: number, height: number): void {
    this._size = { width, height }
  }

  /** 注册一个 named query */
  defineQuery(name: string, predicate: (size: ContainerSize) => boolean): void {
    this._queries.set(name, () => predicate(this._size))
  }

  /** 检查 named query */
  check(name: string): boolean {
    return this._queries.get(name)?.() ?? false
  }

  size(): ContainerSize {
    return this._size
  }
}

// =============================================================================
// P5: FlexibleGrid
// =============================================================================

export interface GridItem {
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
}

export class FlexibleGrid {
  private _columns: number
  private _gap: number
  private _containerWidth: number

  constructor(columns: number = 12, gap: number = 16, containerWidth: number = 1200) {
    this._columns = columns
    this._gap = gap
    this._containerWidth = containerWidth
  }

  setContainerWidth(width: number): void {
    this._containerWidth = width
  }

  /** 计算单列宽度 */
  columnWidth(): number {
    const totalGap = this._gap * (this._columns - 1)
    return (this._containerWidth - totalGap) / this._columns
  }

  /** 计算跨 N 列的宽度 */
  spanWidth(span: number): number {
    const colW = this.columnWidth()
    return colW * span + this._gap * (span - 1)
  }

  /** 计算 column start px 位置 */
  colStart(col: number): number {
    return (col - 1) * (this.columnWidth() + this._gap)
  }

  /** 调整 columns 数（响应式） */
  setColumns(n: number): void {
    this._columns = n
  }

  columns(): number {
    return this._columns
  }
}

// =============================================================================
// P6: TouchGesture
// =============================================================================

export type GestureType = 'tap' | 'double-tap' | 'long-press' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch' | 'rotate'

export interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export class TouchGestureDetector {
  private _threshold: number
  private _longPressMs: number
  private _listeners: Set<(g: GestureType, info: { start: TouchPoint; end?: TouchPoint; delta?: { x: number; y: number } }) => void> = new Set()

  constructor(threshold: number = 30, longPressMs: number = 500) {
    this._threshold = threshold
    this._longPressMs = longPressMs
  }

  /** 分析手势序列 */
  analyze(points: TouchPoint[]): GestureType | null {
    if (points.length === 0) return null
    if (points.length === 1) {
      const p = points[0]!
      if (Date.now() - p.timestamp > this._longPressMs) return 'long-press'
      return 'tap'
    }
    const start = points[0]!
    const end = points[points.length - 1]!
    const dx = end.x - start.x
    const dy = end.y - start.y
    if (Math.abs(dx) > this._threshold || Math.abs(dy) > this._threshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'swipe-right' : 'swipe-left'
      }
      return dy > 0 ? 'swipe-down' : 'swipe-up'
    }
    return 'tap'  // 没明显移动 = tap
  }

  onGesture(fn: (g: GestureType, info: any) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P7: SwipeNavigation
// =============================================================================

export interface SwipeRoute {
  routeId: string
  title: string
  component: string  // component name
}

export class SwipeNavigation {
  private _routes: SwipeRoute[] = []
  private _currentIndex: number = 0

  setRoutes(routes: SwipeRoute[]): void {
    this._routes = routes
  }

  next(): SwipeRoute | null {
    if (this._currentIndex >= this._routes.length - 1) return null
    this._currentIndex += 1
    return this._routes[this._currentIndex] ?? null
  }

  prev(): SwipeRoute | null {
    if (this._currentIndex <= 0) return null
    this._currentIndex -= 1
    return this._routes[this._currentIndex] ?? null
  }

  goTo(index: number): boolean {
    if (index < 0 || index >= this._routes.length) return false
    this._currentIndex = index
    return true
  }

  current(): SwipeRoute | null {
    return this._routes[this._currentIndex] ?? null
  }

  hasNext(): boolean { return this._currentIndex < this._routes.length - 1 }
  hasPrev(): boolean { return this._currentIndex > 0 }
  currentIndex(): number { return this._currentIndex }
  length(): number { return this._routes.length }
}

// =============================================================================
// P8: PullToRefresh
// =============================================================================

export class PullToRefresh {
  private _pulling: boolean = false
  private _pullDistance: number = 0
  private _refreshing: boolean = false
  private _threshold: number
  private _onRefresh: () => Promise<void> | void

  constructor(threshold: number = 80, onRefresh: () => Promise<void> | void = () => {}) {
    this._threshold = threshold
    this._onRefresh = onRefresh
  }

  startPull(): void { this._pulling = true; this._pullDistance = 0 }
  updatePull(distance: number): number {
    if (!this._pulling) return 0
    this._pullDistance = distance
    return distance
  }
  isOverThreshold(): boolean { return this._pullDistance >= this._threshold }
  isRefreshing(): boolean { return this._refreshing }

  async triggerRefresh(): Promise<void> {
    this._refreshing = true
    try {
      await this._onRefresh()
    } finally {
      this._refreshing = false
      this._pulling = false
      this._pullDistance = 0
    }
  }

  cancel(): void {
    this._pulling = false
    this._pullDistance = 0
  }
}

// =============================================================================
// P9: BottomSheet
// =============================================================================

export type BottomSheetState = 'closed' | 'peek' | 'half' | 'full'

export class BottomSheet {
  private _state: BottomSheetState = 'closed'
  private _listeners: Set<(state: BottomSheetState) => void> = new Set()

  setState(state: BottomSheetState): void {
    this._state = state
    for (const l of this._listeners) l(state)
  }

  open(): void { this.setState('peek') }
  expand(): void { this.setState('full') }
  collapse(): void { this.setState('peek') }
  close(): void { this.setState('closed') }

  state(): BottomSheetState { return this._state }
  isOpen(): boolean { return this._state !== 'closed' }

  subscribe(fn: (state: BottomSheetState) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// P10: SafeArea
// =============================================================================

export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export class SafeArea {
  private _insets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 }
  private _listeners: Set<(insets: SafeAreaInsets) => void> = new Set()

  setInsets(insets: SafeAreaInsets): void {
    this._insets = insets
    for (const l of this._listeners) l(insets)
  }

  setPlatformDefaults(platform: 'ios' | 'android' | 'web'): void {
    if (platform === 'ios') {
      this._insets = { top: 44, right: 0, bottom: 34, left: 0 }  // notch + home indicator
    } else if (platform === 'android') {
      this._insets = { top: 24, right: 0, bottom: 0, left: 0 }
    } else {
      this._insets = { top: 0, right: 0, bottom: 0, left: 0 }
    }
  }

  insets(): SafeAreaInsets { return { ...this._insets } }
  top(): number { return this._insets.top }
  bottom(): number { return this._insets.bottom }
  left(): number { return this._insets.left }
  right(): number { return this._insets.right }

  subscribe(fn: (insets: SafeAreaInsets) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}