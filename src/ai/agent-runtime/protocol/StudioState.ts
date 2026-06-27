/**
 * protocol/StudioState.ts (V2476-V2485) - 10 engines
 *
 * - V2476 StudioState: 单一状态对象
 * - V2477 StudioStore: 状态管理 (immer-like without immer)
 * - V2478 StudioAction: 动作定义
 * - V2479 StudioReducer: 纯函数 reducer
 * - V2480 StudioMiddleware: 拦截
 * - V2481 StudioPanel: panel 配置
 * - V2482 StudioPanelRegistry: panel 注册
 * - V2483 StudioPanelRenderer: panel 渲染数据准备
 * - V2484 StudioSection: 章节管理
 * - V2485 StudioSectionList: 章节列表
 */

import type { AgentSoul, AgentMemoryScopeConfig, AgentUserBinding } from '../types'

// =============================================================================
// V2476/V2478: StudioState + Action
// =============================================================================

export interface StudioAgent {
  id: string
  soul: AgentSoul
  binding: AgentUserBinding
  memoryScope: AgentMemoryScopeConfig
  position: { x: number; y: number }
  selected: boolean
}

export interface StudioConnection {
  from: string
  to: string
  type: 'message' | 'memory' | 'delegation' | 'lease'
  label?: string
}

export interface StudioState {
  agents: StudioAgent[]
  connections: StudioConnection[]
  selectedAgentId: string | null
  selectedConnectionId: string | null
  zoom: number
  pan: { x: number; y: number }
  showGrid: boolean
  showLabels: boolean
  history: StudioState[]  // for undo
  redoStack: StudioState[]
  version: number
}

export const INITIAL_STUDIO_STATE: StudioState = {
  agents: [],
  connections: [],
  selectedAgentId: null,
  selectedConnectionId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: true,
  showLabels: true,
  history: [],
  redoStack: [],
  version: 1,
}

export type StudioAction =
  | { type: 'agent.add'; agent: StudioAgent }
  | { type: 'agent.remove'; agentId: string }
  | { type: 'agent.move'; agentId: string; position: { x: number; y: number } }
  | { type: 'agent.select'; agentId: string | null }
  | { type: 'connection.add'; connection: StudioConnection }
  | { type: 'connection.remove'; from: string; to: string }
  | { type: 'connection.select'; connectionKey: string | null }
  | { type: 'view.zoom'; zoom: number }
  | { type: 'view.pan'; pan: { x: number; y: number } }
  | { type: 'view.toggle-grid' }
  | { type: 'view.toggle-labels' }
  | { type: 'history.undo' }
  | { type: 'history.redo' }
  | { type: 'state.replace'; state: StudioState }

// =============================================================================
// V2479: StudioReducer
// =============================================================================

const MAX_HISTORY = 50

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'agent.add': {
      const newHistory = [...state.history, state].slice(-MAX_HISTORY)
      return {
        ...state,
        agents: [...state.agents, action.agent],
        history: newHistory,
        redoStack: [],
        version: state.version + 1,
      }
    }
    case 'agent.remove': {
      const newHistory = [...state.history, state].slice(-MAX_HISTORY)
      return {
        ...state,
        agents: state.agents.filter(a => a.id !== action.agentId),
        connections: state.connections.filter(c => c.from !== action.agentId && c.to !== action.agentId),
        selectedAgentId: state.selectedAgentId === action.agentId ? null : state.selectedAgentId,
        history: newHistory,
        redoStack: [],
        version: state.version + 1,
      }
    }
    case 'agent.move': {
      return {
        ...state,
        agents: state.agents.map(a => a.id === action.agentId ? { ...a, position: action.position } : a),
        version: state.version + 1,
      }
    }
    case 'agent.select': {
      return { ...state, selectedAgentId: action.agentId, selectedConnectionId: null }
    }
    case 'connection.add': {
      const newHistory = [...state.history, state].slice(-MAX_HISTORY)
      return {
        ...state,
        connections: [...state.connections, action.connection],
        history: newHistory,
        redoStack: [],
        version: state.version + 1,
      }
    }
    case 'connection.remove': {
      return {
        ...state,
        connections: state.connections.filter(c => !(c.from === action.from && c.to === action.to)),
        version: state.version + 1,
      }
    }
    case 'connection.select': {
      return { ...state, selectedConnectionId: action.connectionKey, selectedAgentId: null }
    }
    case 'view.zoom': {
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.zoom)) }
    }
    case 'view.pan': {
      return { ...state, pan: action.pan }
    }
    case 'view.toggle-grid': {
      return { ...state, showGrid: !state.showGrid }
    }
    case 'view.toggle-labels': {
      return { ...state, showLabels: !state.showLabels }
    }
    case 'history.undo': {
      if (state.history.length === 0) return state
      const prev = state.history[state.history.length - 1]
      return {
        ...prev,
        history: state.history.slice(0, -1),
        redoStack: [...state.redoStack, state],
      }
    }
    case 'history.redo': {
      if (state.redoStack.length === 0) return state
      const next = state.redoStack[state.redoStack.length - 1]
      return {
        ...next,
        history: [...state.history, state],
        redoStack: state.redoStack.slice(0, -1),
      }
    }
    case 'state.replace': {
      return action.state
    }
  }
}

// =============================================================================
// V2477: StudioStore
// =============================================================================

export type StudioSubscriber = (state: StudioState) => void

export class StudioStore {
  private _state: StudioState
  private _subscribers: StudioSubscriber[] = []

  constructor(initial: StudioState = INITIAL_STUDIO_STATE) {
    this._state = initial
  }

  getState(): StudioState {
    return this._state
  }

  dispatch(action: StudioAction): void {
    this._state = studioReducer(this._state, action)
    for (const sub of this._subscribers) {
      try { sub(this._state) } catch { /* swallow */ }
    }
  }

  subscribe(fn: StudioSubscriber): () => void {
    this._subscribers.push(fn)
    return () => { this._subscribers = this._subscribers.filter(s => s !== fn) }
  }

  /** 替换整个状态（用于 undo/redo 或外部恢复） */
  replace(state: StudioState): void {
    this._state = state
    for (const sub of this._subscribers) {
      try { sub(this._state) } catch { /* swallow */ }
    }
  }
}

// =============================================================================
// V2480: StudioMiddleware
// =============================================================================

export type Middleware = (state: StudioState, action: StudioAction, next: (s: StudioState) => void) => void

export class StudioMiddlewarePipeline {
  private _middlewares: Middleware[] = []

  use(m: Middleware): void {
    this._middlewares.push(m)
  }

  run(state: StudioState, action: StudioAction, reducer: (s: StudioState, a: StudioAction) => StudioState): StudioState {
    let current = state
    const apply = (idx: number, s: StudioState, a: StudioAction): StudioState => {
      if (idx >= this._middlewares.length) {
        return reducer(s, a)
      }
      const m = this._middlewares[idx]
      let next: StudioState = s
      m(s, a, (newS) => {
        next = apply(idx + 1, newS, a)
      })
      return next
    }
    return apply(0, current, action)
  }
}

// =============================================================================
// V2481-V2483: StudioPanel + Registry + Renderer
// =============================================================================

export type StudioPanelType = 'agents' | 'connections' | 'properties' | 'messages' | 'memory' | 'metrics'

export interface StudioPanel {
  id: string
  type: StudioPanelType
  title: string
  position: 'left' | 'right' | 'bottom' | 'floating'
  width?: number
  height?: number
  visible: boolean
}

export class StudioPanelRegistry {
  private _panels: Map<string, StudioPanel> = new Map()

  register(panel: StudioPanel): void {
    this._panels.set(panel.id, panel)
  }

  get(id: string): StudioPanel | undefined {
    return this._panels.get(id)
  }

  visible(): StudioPanel[] {
    return Array.from(this._panels.values()).filter(p => p.visible)
  }

  all(): StudioPanel[] {
    return Array.from(this._panels.values())
  }
}

export interface RenderData {
  type: StudioPanelType
  data: Record<string, unknown>
}

export function preparePanelData(panel: StudioPanel, state: StudioState): RenderData {
  switch (panel.type) {
    case 'agents': return { type: 'agents', data: { agents: state.agents } }
    case 'connections': return { type: 'connections', data: { connections: state.connections } }
    case 'properties': return {
      type: 'properties',
      data: {
        selectedAgent: state.agents.find(a => a.id === state.selectedAgentId) ?? null,
        selectedConnection: state.connections.find(c => `${c.from}->${c.to}` === state.selectedConnectionId) ?? null,
      },
    }
    case 'messages': return { type: 'messages', data: { connectionCount: state.connections.length } }
    case 'memory': return { type: 'memory', data: { agentCount: state.agents.length } }
    case 'metrics': return { type: 'metrics', data: { version: state.version, historySize: state.history.length } }
  }
}

// =============================================================================
// V2484/V2485: StudioSection + List
// =============================================================================

export interface StudioSection {
  id: string
  title: string
  content: string
  order: number
  createdAt: number
}

export class StudioSectionList {
  private _sections: StudioSection[] = []

  add(s: StudioSection): void {
    this._sections.push(s)
  }

  get(id: string): StudioSection | undefined {
    return this._sections.find(s => s.id === id)
  }

  list(): StudioSection[] {
    return [...this._sections].sort((a, b) => a.order - b.order)
  }

  remove(id: string): boolean {
    const before = this._sections.length
    this._sections = this._sections.filter(s => s.id !== id)
    return this._sections.length < before
  }

  count(): number {
    return this._sections.length
  }
}
