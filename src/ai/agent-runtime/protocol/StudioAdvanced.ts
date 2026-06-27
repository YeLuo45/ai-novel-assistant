/**
 * protocol/StudioAdvanced.ts (V2486-V2495) - 10 engines
 *
 * - V2486 StudioCommand: 命令模式 (undo/redo)
// - V2487 StudioCommandRegistry: 命令注册
// - V2488 StudioSelection: 选择管理
// - V2489 StudioClipboard: 剪贴板
// - V2490 StudioDragController: 拖拽
// - V2491 StudioReplay: 操作重放
// - V2492 StudioMetrics: 实时指标
// - V2493 StudioSnapshot: 快照
// - V2494 StudioExporter: 导出 JSON
// - V2495 StudioImporter: 导入 JSON
// - V2496 StudioValidator: 验证
// - V2497 StudioSchema: schema 定义
// - V2498 StudioTheme: 主题
// - V2499 StudioLayout: 布局
// - V2500 StudioHotkey: 快捷键
 */

import type { StudioState, StudioAction, StudioAgent, StudioConnection } from './StudioState'
import { INITIAL_STUDIO_STATE, studioReducer } from './StudioState'

// =============================================================================
// V2486/V2487: StudioCommand + Registry
// =============================================================================

export type StudioCommandType = 'add' | 'remove' | 'move' | 'connect' | 'batch'

export interface StudioCommand {
  type: StudioCommandType
  description: string
  /** apply 返回新状态 */
  apply: (state: StudioState) => StudioState
  /** reverse action（用于 undo） */
  reverse: () => StudioCommand
}

export class StudioCommandRegistry {
  private _undoStack: StudioCommand[] = []
  private _redoStack: StudioCommand[] = []
  private _maxHistory: number

  constructor(maxHistory: number = 100) {
    this._maxHistory = maxHistory
  }

  push(cmd: StudioCommand): void {
    this._undoStack.push(cmd)
    if (this._undoStack.length > this._maxHistory) this._undoStack.shift()
    this._redoStack = []
  }

  undo(): StudioCommand | undefined {
    const cmd = this._undoStack.pop()
    if (cmd) this._redoStack.push(cmd)
    return cmd
  }

  redo(): StudioCommand | undefined {
    const cmd = this._redoStack.pop()
    if (cmd) this._undoStack.push(cmd)
    return cmd
  }

  canUndo(): boolean {
    return this._undoStack.length > 0
  }

  canRedo(): boolean {
    return this._redoStack.length > 0
  }

  clear(): void {
    this._undoStack = []
    this._redoStack = []
  }
}

// =============================================================================
// V2488: StudioSelection
// =============================================================================

export class StudioSelection {
  private _agentIds: Set<string> = new Set()
  private _connectionKeys: Set<string> = new Set()

  selectAgent(id: string): void {
    this._agentIds.add(id)
    this._connectionKeys.clear()
  }

  selectConnection(from: string, to: string): void {
    this._connectionKeys.add(`${from}->${to}`)
    this._agentIds.clear()
  }

  deselectAgent(id: string): void {
    this._agentIds.delete(id)
  }

  selectedAgents(): string[] {
    return Array.from(this._agentIds)
  }

  selectedConnections(): string[] {
    return Array.from(this._connectionKeys)
  }

  clear(): void {
    this._agentIds.clear()
    this._connectionKeys.clear()
  }

  isAgentSelected(id: string): boolean {
    return this._agentIds.has(id)
  }
}

// =============================================================================
// V2489: StudioClipboard
// =============================================================================

export interface ClipboardContent {
  agents: StudioAgent[]
  connections: StudioConnection[]
  copiedAt: number
}

export class StudioClipboard {
  private _content: ClipboardContent | null = null

  set(content: ClipboardContent): void {
    this._content = { ...content, copiedAt: Date.now() }
  }

  get(): ClipboardContent | null {
    return this._content
  }

  hasContent(): boolean {
    return this._content !== null
  }

  clear(): void {
    this._content = null
  }
}

// =============================================================================
// V2490: StudioDragController
// =============================================================================

export interface DragState {
  agentId: string
  startX: number
  startY: number
  currentX: number
  currentY: number
}

export class StudioDragController {
  private _drag: DragState | null = null

  start(agentId: string, x: number, y: number): void {
    this._drag = { agentId, startX: x, startY: y, currentX: x, currentY: y }
  }

  update(x: number, y: number): void {
    if (this._drag) {
      this._drag.currentX = x
      this._drag.currentY = y
    }
  }

  end(): DragState | null {
    const r = this._drag
    this._drag = null
    return r
  }

  isDragging(): boolean {
    return this._drag !== null
  }

  currentDelta(): { dx: number; dy: number } | null {
    if (!this._drag) return null
    return { dx: this._drag.currentX - this._drag.startX, dy: this._drag.currentY - this._drag.startY }
  }
}

// =============================================================================
// V2491: StudioReplay
// =============================================================================

export interface ReplayStep {
  index: number
  state: StudioState
  action: StudioAction
  timestamp: number
}

export class StudioReplay {
  /** 模拟执行一串 actions，记录每步状态 */
  replay(initial: StudioState, actions: StudioAction[]): ReplayStep[] {
    const steps: ReplayStep[] = []
    let current = initial
    for (let i = 0; i < actions.length; i++) {
      const next = studioReducer(current, actions[i])
      steps.push({ index: i, state: next, action: actions[i], timestamp: Date.now() })
      current = next
    }
    return steps
  }

  /** 跳到某 step */
  jumpTo(initial: StudioState, actions: StudioAction[], stepIndex: number): StudioState {
    let current = initial
    for (let i = 0; i <= stepIndex && i < actions.length; i++) {
      current = studioReducer(current, actions[i])
    }
    return current
  }
}

// =============================================================================
// V2492: StudioMetrics
// =============================================================================

export interface StudioMetrics {
  agentCount: number
  connectionCount: number
  selectedCount: number
  totalChanges: number
  historyDepth: number
  redoDepth: number
  averageConnectionsPerAgent: number
}

export function computeMetrics(state: StudioState): StudioMetrics {
  const selected = (state.selectedAgentId ? 1 : 0) + (state.selectedConnectionId ? 1 : 0)
  return {
    agentCount: state.agents.length,
    connectionCount: state.connections.length,
    selectedCount: selected,
    totalChanges: state.version - 1,
    historyDepth: state.history.length,
    redoDepth: state.redoStack.length,
    averageConnectionsPerAgent: state.agents.length > 0 ? state.connections.length / state.agents.length : 0,
  }
}

// =============================================================================
// V2493/V2494/V2495: Studio Snapshot + Exporter + Importer
// =============================================================================

export interface StudioSnapshot {
  timestamp: number
  state: StudioState
  label?: string
}

export class StudioSnapshotManager {
  private _snapshots: StudioSnapshot[] = []
  private _maxSnapshots: number

  constructor(maxSnapshots: number = 20) {
    this._maxSnapshots = maxSnapshots
  }

  take(state: StudioState, label?: string): StudioSnapshot {
    const snap: StudioSnapshot = { timestamp: Date.now(), state: { ...state, history: [], redoStack: [] }, label }
    this._snapshots.push(snap)
    if (this._snapshots.length > this._maxSnapshots) this._snapshots.shift()
    return snap
  }

  list(): StudioSnapshot[] {
    return [...this._snapshots]
  }

  restore(timestamp: number): StudioState | null {
    const s = this._snapshots.find(x => x.timestamp === timestamp)
    return s ? s.state : null
  }
}

export function exportStudioState(state: StudioState): string {
  return JSON.stringify({ state, exportedAt: Date.now(), version: '1.0.0' }, null, 2)
}

export function importStudioState(json: string): StudioState {
  const obj = JSON.parse(json)
  if (!obj.state) throw new Error('invalid studio state JSON')
  return obj.state
}

// =============================================================================
// V2496/V2497: StudioValidator + Schema
// =============================================================================

export interface StudioValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface StudioSchema {
  required: Array<keyof StudioState>
  maxAgents: number
  maxConnections: number
}

export const DEFAULT_STUDIO_SCHEMA: StudioSchema = {
  required: ['agents', 'connections', 'version'],
  maxAgents: 100,
  maxConnections: 500,
}

export function validateStudioState(
  state: StudioState,
  schema: StudioSchema = DEFAULT_STUDIO_SCHEMA,
): StudioValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  for (const f of schema.required) {
    if (!(f in state)) errors.push(`missing required field: ${f}`)
  }
  if (state.agents.length > schema.maxAgents) {
    errors.push(`too many agents: ${state.agents.length} > ${schema.maxAgents}`)
  }
  if (state.connections.length > schema.maxConnections) {
    errors.push(`too many connections: ${state.connections.length} > ${schema.maxConnections}`)
  }
  // 检查 connection 引用的 agent 是否存在
  const agentIds = new Set(state.agents.map(a => a.id))
  for (const c of state.connections) {
    if (!agentIds.has(c.from)) errors.push(`connection from unknown agent: ${c.from}`)
    if (!agentIds.has(c.to)) errors.push(`connection to unknown agent: ${c.to}`)
  }
  if (state.agents.length === 0) warnings.push('no agents')
  return { valid: errors.length === 0, errors, warnings }
}

// =============================================================================
// V2498: StudioTheme
// =============================================================================

export interface StudioTheme {
  name: string
  background: string
  grid: string
  agentFill: string
  agentBorder: string
  connection: string
  text: string
}

export const DEFAULT_THEME: StudioTheme = {
  name: 'light',
  background: '#ffffff',
  grid: '#f0f0f0',
  agentFill: '#e3f2fd',
  agentBorder: '#1976d2',
  connection: '#666666',
  text: '#212121',
}

export const DARK_THEME: StudioTheme = {
  name: 'dark',
  background: '#1e1e1e',
  grid: '#2a2a2a',
  agentFill: '#0d47a1',
  agentBorder: '#64b5f6',
  connection: '#9e9e9e',
  text: '#ffffff',
}

// =============================================================================
// V2499: StudioLayout
// =============================================================================

export interface StudioLayout {
  name: string
  panels: { id: string; position: 'left' | 'right' | 'bottom' | 'floating'; size: number }[]
}

export const DEFAULT_LAYOUT: StudioLayout = {
  name: 'default',
  panels: [
    { id: 'agents', position: 'left', size: 250 },
    { id: 'properties', position: 'right', size: 300 },
    { id: 'messages', position: 'bottom', size: 200 },
  ],
}

// =============================================================================
// V2500: StudioHotkey
// =============================================================================

export interface HotkeyBinding {
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  action: string
  description: string
}

export const DEFAULT_HOTKEYS: HotkeyBinding[] = [
  { key: 'z', modifiers: ['ctrl'], action: 'history.undo', description: 'Undo' },
  { key: 'y', modifiers: ['ctrl'], action: 'history.redo', description: 'Redo' },
  { key: 's', modifiers: ['ctrl'], action: 'state.save', description: 'Save' },
  { key: 'Delete', action: 'agent.remove-selected', description: 'Delete selected' },
  { key: 'a', modifiers: ['ctrl'], action: 'agent.select-all', description: 'Select all' },
]

export class StudioHotkeyManager {
  private _bindings: HotkeyBinding[] = [...DEFAULT_HOTKEYS]

  bind(binding: HotkeyBinding): void {
    this._bindings.push(binding)
  }

  unbind(key: string, modifiers?: string[]): boolean {
    const before = this._bindings.length
    this._bindings = this._bindings.filter(b => b.key !== key || JSON.stringify(b.modifiers) !== JSON.stringify(modifiers))
    return this._bindings.length < before
  }

  find(key: string, modifiers?: string[]): HotkeyBinding | undefined {
    return this._bindings.find(b => b.key === key && JSON.stringify(b.modifiers ?? []) === JSON.stringify(modifiers ?? []))
  }

  list(): HotkeyBinding[] {
    return [...this._bindings]
  }
}
