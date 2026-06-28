/**
 * ui/components/AdvancedOverlays2.ts (O11-O15 收尾)
 */

import { ModalManager, DrawerManager } from './AdvancedOverlays'

// =============================================================================
// O13: Toast
// =============================================================================

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  type: ToastType
  message: string
  durationMs: number
  createdAt: number
}

export class ToastManager {
  private _toasts: Toast[] = []
  private _nextId: number = 0
  private _defaultDuration: number
  private _listeners: Set<() => void> = new Set()

  constructor(defaultDuration: number = 3000) {
    this._defaultDuration = defaultDuration
  }

  show(type: ToastType, message: string, durationMs?: number): Toast {
    const t: Toast = {
      id: `toast_${++this._nextId}`,
      type, message,
      durationMs: durationMs ?? this._defaultDuration,
      createdAt: Date.now(),
    }
    this._toasts.push(t)
    this._emit()
    return t
  }

  info(message: string): Toast { return this.show('info', message) }
  success(message: string): Toast { return this.show('success', message) }
  warning(message: string): Toast { return this.show('warning', message) }
  error(message: string): Toast { return this.show('error', message) }

  dismiss(id: string): boolean {
    const before = this._toasts.length
    this._toasts = this._toasts.filter(t => t.id !== id)
    if (this._toasts.length < before) { this._emit(); return true }
    return false
  }

  /** 清除过期的 toasts */
  prune(): number {
    const now = Date.now()
    let count = 0
    this._toasts = this._toasts.filter(t => {
      if (now - t.createdAt > t.durationMs) { count += 1; return false }
      return true
    })
    if (count > 0) this._emit()
    return count
  }

  list(): Toast[] { return [...this._toasts] }
  subscribe(fn: () => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
  private _emit(): void { for (const l of this._listeners) try { l() } catch { /* swallow */ } }
}

// =============================================================================
// O14: Tooltip
// =============================================================================

export interface Tooltip {
  id: string
  target: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
  delayMs: number
  visible: boolean
}

export class TooltipManager {
  private _tooltips: Map<string, Tooltip> = new Map()
  private _pendingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

  show(id: string, target: string, content: string, position: Tooltip['position'] = 'top', delayMs: number = 200): void {
    // 取消已有 pending
    const existing = this._pendingTimeouts.get(id)
    if (existing) clearTimeout(existing)

    const timeout = setTimeout(() => {
      this._tooltips.set(id, { id, target, content, position, delayMs, visible: true })
      this._pendingTimeouts.delete(id)
    }, delayMs)
    this._pendingTimeouts.set(id, timeout)
  }

  hide(id: string): void {
    const existing = this._pendingTimeouts.get(id)
    if (existing) { clearTimeout(existing); this._pendingTimeouts.delete(id) }
    this._tooltips.delete(id)
  }

  get(id: string): Tooltip | undefined { return this._tooltips.get(id) }
  visible(): Tooltip[] { return Array.from(this._tooltips.values()).filter(t => t.visible) }
  hideAll(): void {
    for (const t of this._pendingTimeouts.values()) clearTimeout(t)
    this._pendingTimeouts.clear()
    this._tooltips.clear()
  }
}

// =============================================================================
// O15: Popover
// =============================================================================

export interface PopoverState {
  id: string
  anchor: string
  content: unknown
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  open: boolean
  closeOnOutsideClick: boolean
}

export class PopoverManager {
  private _popovers: Map<string, PopoverState> = new Map()
  private _stack: string[] = []

  open(id: string, anchor: string, content: unknown, placement: PopoverState['placement'] = 'auto', closeOnOutsideClick: boolean = true): void {
    this._popovers.set(id, { id, anchor, content, placement, open: true, closeOnOutsideClick })
    this._stack.push(id)
  }

  close(id: string): void {
    const p = this._popovers.get(id)
    if (p) p.open = false
    this._stack = this._stack.filter(s => s !== id)
  }

  closeTop(): string | null {
    const top = this._stack.pop()
    if (top) this.close(top)
    return top
  }

  closeAll(): void {
    for (const p of this._popovers.values()) p.open = false
    this._stack = []
  }

  isOpen(id: string): boolean { return this._popovers.get(id)?.open ?? false }
  top(): PopoverState | null {
    const id = this._stack[this._stack.length - 1]
    return id ? this._popovers.get(id) ?? null : null
  }
  get(id: string): PopoverState | undefined { return this._popovers.get(id) }
}

// Re-export Modal + Drawer
export { ModalManager, DrawerManager }