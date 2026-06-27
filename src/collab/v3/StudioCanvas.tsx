/**
 * collab/v3/StudioCanvas.tsx (H1-H5) - 5 engines
 *
 * - H1 StudioCanvas: 主画布
 * - H2 StudioNode: 单个 agent 节点
 * - H3 StudioEdge: 连接线
 * - H4 StudioToolbar: 顶部工具栏
 * - H5 StudioStatusBar: 底部状态栏
 *
 * 使用 V3 Studio state machine (StudioStore) + preact
 */

import { h } from 'preact'
import { useState, useCallback, useMemo, useEffect } from 'preact/hooks'
import {
  StudioStore, INITIAL_STUDIO_STATE, type StudioState, type StudioAction,
  type StudioAgent, type StudioConnection, type StudioPanel,
  preparePanelData, StudioPanelRegistry, computeMetrics,
} from '../agent-runtime/protocol/StudioState'
import { StudioAdvanced as SA, StudioClipboard, StudioSelection, StudioDragController } from '../agent-runtime/protocol/StudioAdvanced'

// =============================================================================
// H1: StudioCanvas (主画布)
// =============================================================================

export interface StudioCanvasProps {
  store: StudioStore
  onAgentClick?: (agentId: string) => void
  onAgentDoubleClick?: (agentId: string) => void
  onConnectionClick?: (from: string, to: string) => void
  width?: number
  height?: number
}

export function StudioCanvas({ store, onAgentClick, onAgentDoubleClick, onConnectionClick, width = 1200, height = 800 }: StudioCanvasProps) {
  const [state, setState] = useState<StudioState>(store.getState())

  useEffect(() => {
    return store.subscribe(setState)
  }, [store])

  const onCanvasClick = useCallback((e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      store.dispatch({ type: 'agent.select', agentId: null })
    }
  }, [store])

  const onBackgroundDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    const data = e.dataTransfer?.getData('application/json')
    if (!data) return
    try {
      const agentData = JSON.parse(data) as Partial<StudioAgent>
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      store.dispatch({
        type: 'agent.add',
        agent: {
          id: agentData.id ?? `agent-${Date.now()}`,
          soul: agentData.soul ?? { agentId: 'new', archetype: 'assistant', displayName: 'New', tagline: '', principles: [], tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 }, decisionPolicy: { conservative: 0.5, creative: 0.5, reviewThreshold: 0.5, riskTolerance: 0.3 }, version: 1, createdAt: Date.now(), updatedAt: Date.now(), memoryReadScope: 'self', memoryWriteScope: 'self', metadata: {}, capabilities: [] },
          binding: agentData.binding ?? { agentId: 'new', visibleUserFields: [], userAlias: 'new', customInstructions: '', baseContext: {} },
          memoryScope: agentData.memoryScope ?? { agentId: 'new', privateTables: { sensory: '', working: '', episodic: '' }, sharedTables: { teamKB: '', projectKB: '' }, retention: { episodicTTL: 86400000, workingMaxItems: 50 }, accessLog: [] },
          position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
          selected: false,
        },
      })
    } catch { /* ignore */ }
  }, [store])

  return h('div', {
    class: 'studio-canvas',
    style: { width: `${width}px`, height: `${height}px`, position: 'relative', overflow: 'auto', border: '1px solid #ccc', background: state.showGrid ? 'radial-gradient(circle, #f0f0f0 1px, transparent 1px) 0 0 / 20px 20px' : '#fafafa' },
    onClick: onCanvasClick,
    onDrop: onBackgroundDrop as any,
    onDragOver: ((e: DragEvent) => e.preventDefault()) as any,
  },
    state.connections.map(c => h(StudioEdge, {
      key: `${c.from}->${c.to}`,
      connection: c,
      state,
      onClick: () => onConnectionClick?.(c.from, c.to),
    })),
    state.agents.map(a => h(StudioNode, {
      key: a.id,
      agent: a,
      selected: state.selectedAgentId === a.id,
      onClick: () => { store.dispatch({ type: 'agent.select', agentId: a.id }); onAgentClick?.(a.id) },
      onDoubleClick: () => onAgentDoubleClick?.(a.id),
      onMove: (pos) => store.dispatch({ type: 'agent.move', agentId: a.id, position: pos }),
    })),
  )
}

// =============================================================================
// H2: StudioNode (单个 agent 节点)
// =============================================================================

export interface StudioNodeProps {
  agent: StudioAgent
  selected: boolean
  onClick: () => void
  onDoubleClick?: () => void
  onMove?: (pos: { x: number; y: number }) => void
}

export function StudioNode({ agent, selected, onClick, onDoubleClick, onMove }: StudioNodeProps) {
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return
    setDragging(true)
    setDragOffset({ x: e.clientX - agent.position.x, y: e.clientY - agent.position.y })
    e.stopPropagation()
  }, [agent.position])

  useEffect(() => {
    if (!dragging) return
    const onMove2 = (e: MouseEvent) => {
      onMove?.({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove2)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove2)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, dragOffset, onMove])

  return h('div', {
    class: 'studio-node',
    style: {
      position: 'absolute',
      left: `${agent.position.x}px`,
      top: `${agent.position.y}px`,
      width: '120px',
      height: '60px',
      border: `2px solid ${selected ? '#1976d2' : '#666'}`,
      borderRadius: '8px',
      background: '#e3f2fd',
      cursor: dragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      boxShadow: selected ? '0 0 8px rgba(25,118,210,0.5)' : 'none',
    },
    onMouseDown,
    onClick: (e: MouseEvent) => { e.stopPropagation(); onClick() },
    onDblClick: (e: MouseEvent) => { e.stopPropagation(); onDoubleClick?.() },
    draggable: true,
  },
    h('div', { style: { fontWeight: 'bold' } }, agent.soul.persona.displayName),
    h('div', { style: { fontSize: '10px', color: '#666' } }, agent.soul.archetype),
  )
}

// =============================================================================
// H3: StudioEdge (连接线)
// =============================================================================

export interface StudioEdgeProps {
  connection: StudioConnection
  state: StudioState
  onClick?: () => void
}

export function StudioEdge({ connection, state, onClick }: StudioEdgeProps) {
  const from = state.agents.find(a => a.id === connection.from)
  const to = state.agents.find(a => a.id === connection.to)
  if (!from || !to) return null
  const isSelected = state.selectedConnectionId === `${from.id}->${to.id}`
  const x1 = from.position.x + 60
  const y1 = from.position.y + 30
  const x2 = to.position.x + 60
  const y2 = to.position.y + 30
  const color = connection.type === 'message' ? '#666' : connection.type === 'memory' ? '#4caf50' : connection.type === 'delegation' ? '#ff9800' : '#9c27b0'
  return h('svg', {
    style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  },
    h('line', {
      x1, y1, x2, y2,
      stroke: color,
      'stroke-width': isSelected ? 3 : 2,
      'marker-end': 'url(#arrowhead)',
      style: { pointerEvents: 'stroke', cursor: 'pointer' },
      onClick: (e: MouseEvent) => { e.stopPropagation(); onClick?.() },
    }),
    h('defs', {},
      h('marker', {
        id: 'arrowhead', viewBox: '0 -5 10 10', refX: 8, refY: 0, markerWidth: 6, markerHeight: 6, orient: 'auto',
      },
        h('path', { d: 'M0,-5L10,0L0,5', fill: color }),
      ),
    ),
    connection.label ? h('text', {
      x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 5,
      'text-anchor': 'middle', 'font-size': '10', fill: color,
      style: { pointerEvents: 'none' },
    }, connection.label) : null,
  )
}

// =============================================================================
// H4: StudioToolbar (顶部工具栏)
// =============================================================================

export interface StudioToolbarProps {
  store: StudioStore
  onAddAgent?: () => void
  onConnect?: () => void
  onSave?: () => void
  onLoad?: () => void
}

export function StudioToolbar({ store, onAddAgent, onConnect, onSave, onLoad }: StudioToolbarProps) {
  const [state, setState] = useState<StudioState>(store.getState())
  useEffect(() => store.subscribe(setState), [store])
  const m = useMemo(() => computeMetrics(state), [state])
  return h('div', {
    style: {
      display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid #ccc',
      background: '#f5f5f5', alignItems: 'center',
    },
  },
    h('button', { onClick: onAddAgent, style: buttonStyle() }, '➕ Add Agent'),
    h('button', { onClick: onConnect, style: buttonStyle() }, '🔗 Connect'),
    h('button', { onClick: () => store.dispatch({ type: 'history.undo' }), disabled: state.history.length === 0, style: buttonStyle() }, '↶ Undo'),
    h('button', { onClick: () => store.dispatch({ type: 'history.redo' }), disabled: state.redoStack.length === 0, style: buttonStyle() }, '↷ Redo'),
    h('button', { onClick: () => store.dispatch({ type: 'view.toggle-grid' }), style: buttonStyle() }, state.showGrid ? '⊞ Grid' : '⊟ Grid'),
    h('button', { onClick: () => store.dispatch({ type: 'view.toggle-labels' }), style: buttonStyle() }, state.showLabels ? '🏷 Labels' : '⊘ Labels'),
    h('div', { style: { flex: 1 } }),
    h('span', { style: { fontSize: '12px', color: '#666' } }, `Agents: ${m.agentCount} | Connections: ${m.connectionCount} | v${state.version}`),
    h('button', { onClick: onSave, style: buttonStyle() }, '💾 Save'),
    h('button', { onClick: onLoad, style: buttonStyle() }, '📂 Load'),
  )
}

function buttonStyle(): h.JSX.CSSProperties {
  return { padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '13px' }
}

// =============================================================================
// H5: StudioStatusBar (底部状态栏)
// =============================================================================

export interface StudioStatusBarProps {
  store: StudioStore
  message?: string
}

export function StudioStatusBar({ store, message }: StudioStatusBarProps) {
  const [state, setState] = useState<StudioState>(store.getState())
  useEffect(() => store.subscribe(setState), [store])
  const m = useMemo(() => computeMetrics(state), [state])
  return h('div', {
    style: {
      display: 'flex', gap: '16px', padding: '4px 12px', borderTop: '1px solid #ccc',
      background: '#fafafa', fontSize: '11px', color: '#666', alignItems: 'center',
    },
  },
    h('span', null, `Agents: ${m.agentCount}`),
    h('span', null, `Connections: ${m.connectionCount}`),
    h('span', null, `Selected: ${m.selectedCount}`),
    h('span', null, `Changes: ${m.totalChanges}`),
    h('span', null, `History: ${m.historyDepth} | Redo: ${m.redoDepth}`),
    h('span', null, `Zoom: ${(state.zoom * 100).toFixed(0)}%`),
    message ? h('span', { style: { color: '#1976d2', fontWeight: 'bold' } }, message) : null,
  )
}
