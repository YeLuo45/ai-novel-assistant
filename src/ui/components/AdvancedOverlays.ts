/**
 * ui/components/AdvancedOverlays.ts (O1-O15) - 15 engines
 *
 * - O1 VirtualScroller: 虚拟滚动
 * - O2 LazyList: 懒加载列表
 * - O3 InfiniteScroll: 无限滚动
 * - O4 StickyHeader: 粘性表头
 * - O5 AutoSizer: 自适应尺寸
 * - O6 DragDropContext: 拖拽上下文
 * - O7 DropZone: 拖放区
 * - O8 SortableList: 可排序列表
 * - O9 KanbanBoard: 看板
 * - O10 TreeView: 树视图
 * - O11 Modal: 模态框
 * - O12 Drawer: 抽屉
 * - O13 Toast: 提示
 * - O14 Tooltip: 文字提示
 * - O15 Popover: 弹出框
 */

// =============================================================================
// O1: VirtualScroller
// =============================================================================

export interface VirtualItem {
  index: number
  start: number  // 像素 start position
  size: number
}

export class VirtualScroller {
  private _itemSize: number
  private _containerHeight: number
  private _overscan: number
  private _scrollTop: number = 0
  private _totalItems: number = 0

  constructor(itemSize: number, containerHeight: number, overscan: number = 3) {
    this._itemSize = itemSize
    this._containerHeight = containerHeight
    this._overscan = overscan
  }

  setTotalItems(n: number): void {
    this._totalItems = n
  }

  setScrollTop(top: number): void {
    this._scrollTop = top
  }

  /** 计算可见 items */
  visibleRange(): { start: number; end: number } {
    const start = Math.max(0, Math.floor(this._scrollTop / this._itemSize) - this._overscan)
    const end = Math.min(
      this._totalItems,
      Math.ceil((this._scrollTop + this._containerHeight) / this._itemSize) + this._overscan,
    )
    return { start, end }
  }

  /** 总高度（用于 scrollbar） */
  totalHeight(): number {
    return this._totalItems * this._itemSize
  }

  /** offset for given index */
  offsetFor(index: number): number {
    return index * this._itemSize
  }
}

// =============================================================================
// O2: LazyList
// =============================================================================

export class LazyList<T> {
  private _items: T[] = []
  private _loaded: Set<number> = new Set()
  private _threshold: number

  constructor(threshold: number = 5) {
    this._threshold = threshold
  }

  setItems(items: T[]): void {
    this._items = items
  }

  /** 获取 items（自动加载接近的） */
  get(start: number, end: number): T[] {
    for (let i = start; i < end; i++) this._loaded.add(i)
    return this._items.slice(start, end)
  }

  /** 检查是否应预加载 */
  shouldPreload(currentIndex: number): boolean {
    return !this._loaded.has(currentIndex + this._threshold)
  }

  loaded(): number {
    return this._loaded.size
  }
}

// =============================================================================
// O3: InfiniteScroll
// =============================================================================

export class InfiniteScroll {
  private _loaded: number = 0
  private _pageSize: number
  private _hasMore: boolean = true
  private _loading: boolean = false

  constructor(pageSize: number) {
    this._pageSize = pageSize
  }

  /** 触发加载 */
  load(moreAvailable: boolean): { count: number; hasMore: boolean } {
    if (this._loading || !this._hasMore) return { count: 0, hasMore: this._hasMore }
    this._loading = true
    this._loaded += this._pageSize
    this._hasMore = moreAvailable
    this._loading = false
    return { count: this._pageSize, hasMore: this._hasMore }
  }

  get loaded(): number { return this._loaded }
  get hasMore(): boolean { return this._hasMore }
  get loading(): boolean { return this._loading }
  reset(): void { this._loaded = 0; this._hasMore = true; this._loading = false }
}

// =============================================================================
// O4: StickyHeader
// =============================================================================

export class StickyHeader {
  private _threshold: number
  private _isSticky: boolean = false
  private _listeners: Set<(sticky: boolean) => void> = new Set()

  constructor(threshold: number = 0) {
    this._threshold = threshold
  }

  update(scrollY: number): boolean {
    const sticky = scrollY > this._threshold
    if (sticky !== this._isSticky) {
      this._isSticky = sticky
      for (const l of this._listeners) l(sticky)
    }
    return sticky
  }

  isSticky(): boolean { return this._isSticky }
  subscribe(fn: (sticky: boolean) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// O5: AutoSizer
// =============================================================================

export interface Size {
  width: number
  height: number
}

export class AutoSizer {
  private _currentSize: Size = { width: 0, height: 0 }
  private _breakpoints: Map<string, Size> = new Map()

  setBreakpoint(name: string, size: Size): void {
    this._breakpoints.set(name, size)
  }

  update(size: Size): Size {
    this._currentSize = size
    return size
  }

  current(): Size { return this._currentSize }
  breakpointFor(width: number): string {
    let best = 'xs'
    let bestSize = 0
    for (const [name, size] of this._breakpoints) {
      if (width >= size.width && size.width >= bestSize) {
        best = name
        bestSize = size.width
      }
    }
    return best
  }
}

// =============================================================================
// O6: DragDropContext
// =============================================================================

export interface DragItem {
  id: string
  type: string
  data: unknown
}

export class DragDropContext {
  private _dragging: DragItem | null = null
  private _hoverTarget: string | null = null
  private _listeners: Set<(e: { type: 'start' | 'move' | 'end'; item: DragItem | null; target: string | null }) => void> = new Set()

  start(item: DragItem): void {
    this._dragging = item
    this._emit('start', item, null)
  }

  move(target: string): void {
    this._hoverTarget = target
    if (this._dragging) this._emit('move', this._dragging, target)
  }

  end(): DragItem | null {
    const item = this._dragging
    if (item) this._emit('end', null, this._hoverTarget)
    this._dragging = null
    this._hoverTarget = null
    return item
  }

  isDragging(): boolean { return this._dragging !== null }
  getDragging(): DragItem | null { return this._dragging }
  getHoverTarget(): string | null { return this._hoverTarget }

  subscribe(fn: (e: { type: 'start' | 'move' | 'end'; item: DragItem | null; target: string | null }) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  private _emit(type: 'start' | 'move' | 'end', item: DragItem | null, target: string | null): void {
    for (const l of this._listeners) {
      try { l({ type, item, target }) } catch { /* swallow */ }
    }
  }
}

// =============================================================================
// O7: DropZone
// =============================================================================

export class DropZone {
  private _id: string
  private _acceptTypes: Set<string> = new Set()
  private _hoverCount: number = 0

  constructor(id: string, acceptTypes: string[] = []) {
    this._id = id
    this._acceptTypes = new Set(acceptTypes)
  }

  accepts(type: string): boolean {
    return this._acceptTypes.size === 0 || this._acceptTypes.has(type)
  }

  onEnter(): void { this._hoverCount += 1 }
  onLeave(): void { this._hoverCount = Math.max(0, this._hoverCount - 1) }
  isHover(): boolean { return this._hoverCount > 0 }
  id(): string { return this._id }
}

// =============================================================================
// O8: SortableList
// =============================================================================

export class SortableList<T> {
  private _items: T[] = []
  private _getKey: (item: T) => string

  constructor(items: T[], getKey: (item: T) => string) {
    this._items = [...items]
    this._getKey = getKey
  }

  get items(): T[] { return this._items }

  move(fromId: string, toId: string): boolean {
    const fromIdx = this._items.findIndex(i => this._getKey(i) === fromId)
    const toIdx = this._items.findIndex(i => this._getKey(i) === toId)
    if (fromIdx === -1 || toIdx === -1) return false
    const [item] = this._items.splice(fromIdx, 1)
    // 如果 toIdx > fromIdx（向后移），splice 后索引已减 1
    const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx
    this._items.splice(adjustedTo, 0, item)
    return true
  }

  /** 重新排序 */
  reorder(newOrder: string[]): boolean {
    const map = new Map(this._items.map(i => [this._getKey(i), i]))
    const newItems: T[] = []
    for (const key of newOrder) {
      const it = map.get(key)
      if (!it) return false
      newItems.push(it)
    }
    if (newItems.length !== this._items.length) return false
    this._items = newItems
    return true
  }
}

// =============================================================================
// O9: KanbanBoard
// =============================================================================

export interface KanbanColumn<T> {
  columnId: string
  title: string
  items: T[]
}

export class KanbanBoard<T> {
  private _columns: KanbanColumn<T>[] = []
  private _getKey: (item: T) => string

  constructor(columns: KanbanColumn<T>[], getKey: (item: T) => string) {
    this._columns = columns
    this._getKey = getKey
  }

  get columns(): KanbanColumn<T>[] { return this._columns }

  moveItem(itemId: string, fromColId: string, toColId: string, toIndex: number = -1): boolean {
    const from = this._columns.find(c => c.columnId === fromColId)
    const to = this._columns.find(c => c.columnId === toColId)
    if (!from || !to) return false
    const fromIdx = from.items.findIndex(i => this._getKey(i) === itemId)
    if (fromIdx === -1) return false
    const [item] = from.items.splice(fromIdx, 1)
    if (toIndex < 0 || toIndex >= to.items.length) {
      to.items.push(item)
    } else {
      to.items.splice(toIndex, 0, item)
    }
    return true
  }
}

// =============================================================================
// O10: TreeView
// =============================================================================

export interface TreeNode<T> {
  id: string
  data: T
  children: TreeNode<T>[]
}

export class TreeView<T> {
  private _root: TreeNode<T>
  private _expanded: Set<string> = new Set()

  constructor(root: TreeNode<T>) {
    this._root = root
  }

  expand(id: string): void { this._expanded.add(id) }
  collapse(id: string): void { this._expanded.delete(id) }
  isExpanded(id: string): boolean { return this._expanded.has(id) }
  toggle(id: string): boolean {
    if (this._expanded.has(id)) { this._expanded.delete(id); return false }
    this._expanded.add(id); return true
  }

  /** 扁平化可见 nodes */
  flatten(): TreeNode<T>[] {
    const out: TreeNode<T>[] = []
    const walk = (node: TreeNode<T>, depth: number) => {
      out.push(node)
      if (this._expanded.has(node.id)) {
        for (const child of node.children) walk(child, depth + 1)
      }
    }
    walk(this._root, 0)
    return out
  }

  find(id: string): TreeNode<T> | null {
    const walk = (node: TreeNode<T>): TreeNode<T> | null => {
      if (node.id === id) return node
      for (const child of node.children) {
        const r = walk(child)
        if (r) return r
      }
      return null
    }
    return walk(this._root)
  }
}

// =============================================================================
// O11: Modal
// =============================================================================

export class ModalManager {
  private _open: Set<string> = new Set()
  private _listeners: Set<() => void> = new Set()

  open(id: string): void { this._open.add(id); this._emit() }
  close(id: string): void { this._open.delete(id); this._emit() }
  closeAll(): void { this._open.clear(); this._emit() }
  isOpen(id: string): boolean { return this._open.has(id) }
  openIds(): string[] { return Array.from(this._open) }
  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
  private _emit(): void { for (const l of this._listeners) try { l() } catch { /* swallow */ } }
}

// =============================================================================
// O12: Drawer
// =============================================================================

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom'

export class DrawerManager {
  private _open: Set<string> = new Set()
  private _sides: Map<string, DrawerSide> = new Map()

  open(id: string, side: DrawerSide = 'right'): void {
    this._open.add(id)
    this._sides.set(id, side)
  }
  close(id: string): void { this._open.delete(id) }
  closeAll(): void { this._open.clear(); this._sides.clear() }
  isOpen(id: string): boolean { return this._open.has(id) }
  sideOf(id: string): DrawerSide { return this._sides.get(id) ?? 'right' }
  openIds(): string[] { return Array.from(this._open) }
}