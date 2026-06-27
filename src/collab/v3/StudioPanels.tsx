/**
 * collab/v3/StudioPanels.tsx (H6-H10) - 5 engines
 *
 * - H6 PropertyPanel: 显示选中 agent 的属性
 * - H7 MetricsPanel: 显示实时 metrics
 * - H8 MemoryPanel: 显示 memory scope + access log
 * - H9 HookLogPanel: 显示 hook 事件流
 * - H10 MessageLogPanel: 显示 agent message log
 *
 * 由于 preact testing library 不可用，仅写 store-level 集成测试。
 */

import { h } from 'preact'
import { useState, useEffect, useMemo } from 'preact/hooks'
import {
  type StudioState, type StudioAgent,
  preparePanelData,
} from '../../ai/agent-runtime/protocol/StudioState'
import { computeMetrics } from '../../ai/agent-runtime/protocol/StudioAdvanced'
import {
  MemoryAccessLog, type AccessLogEntry,
} from '../../ai/agent-runtime/protocol/MemoryGuard'
import { AgentHookEmitter } from '../../ai/agent-runtime/protocol/AgentHookEmitter'

// =============================================================================
// H6: PropertyPanel
// =============================================================================

export interface PropertyPanelProps {
  state: StudioState
  store: { dispatch: (action: any) => void }
}

export function PropertyPanel({ state, store }: PropertyPanelProps) {
  const agent = state.agents.find(a => a.id === state.selectedAgentId)
  if (!agent) {
    return h('div', { class: 'property-panel empty', style: panelStyle() },
      h('h3', null, 'Properties'),
      h('p', { style: { color: '#999' } }, 'No agent selected'),
    )
  }
  return h('div', { class: 'property-panel', style: panelStyle() },
    h('h3', null, 'Properties'),
    h('div', null, h('label', null, 'ID: '), h('span', null, agent.id)),
    h('div', null, h('label', null, 'Name: '), h('span', null, agent.soul.persona.displayName)),
    h('div', null, h('label', null, 'Archetype: '), h('span', null, agent.soul.archetype)),
    h('div', null, h('label', null, 'Position: '), h('span', null, `(${agent.position.x}, ${agent.position.y})`)),
    h('div', null, h('label', null, 'Capabilities: '),
      h('div', null, agent.soul.capabilities.map(c => h('span', { style: chipStyle() }, c)))
    ),
    h('div', null, h('label', null, 'Tone: '),
      h('div', null, Object.entries(agent.soul.persona.tone).map(([k, v]) =>
        h('div', { key: k, style: { fontSize: '11px' } }, `${k}: ${(v as number).toFixed(2)}`)
      ))
    ),
    h('button', {
      onClick: () => store.dispatch({ type: 'agent.remove', agentId: agent.id }),
      style: { marginTop: '8px', background: '#f44336', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
    }, '🗑 Delete'),
  )
}

// =============================================================================
// H7: MetricsPanel
// =============================================================================

export interface MetricsPanelProps {
  state: StudioState
}

export function MetricsPanel({ state }: MetricsPanelProps) {
  const m = useMemo(() => computeMetrics(state), [state])
  return h('div', { class: 'metrics-panel', style: panelStyle() },
    h('h3', null, 'Metrics'),
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' } },
      metricBox('Agents', m.agentCount, '#2196f3'),
      metricBox('Connections', m.connectionCount, '#4caf50'),
      metricBox('Selected', m.selectedCount, '#ff9800'),
      metricBox('Changes', m.totalChanges, '#9c27b0'),
      metricBox('History', m.historyDepth, '#607d8b'),
      metricBox('Redo', m.redoDepth, '#795548'),
    ),
  )
}

function metricBox(label: string, value: number, color: string) {
  return h('div', { style: { padding: '8px', background: '#fafafa', borderLeft: `3px solid ${color}`, borderRadius: '4px' } },
    h('div', { style: { fontSize: '10px', color: '#666' } }, label),
    h('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, String(value)),
  )
}

// =============================================================================
// H8: MemoryPanel
// =============================================================================

export interface MemoryPanelProps {
  state: StudioState
  log: MemoryAccessLog
}

export function MemoryPanel({ state, log }: MemoryPanelProps) {
  const agent = state.agents.find(a => a.id === state.selectedAgentId)
  const recent = log.query().slice(0, 20)
  return h('div', { class: 'memory-panel', style: panelStyle() },
    h('h3', null, 'Memory'),
    agent ? h('div', null,
      h('div', { style: { fontSize: '11px', marginBottom: '8px' } }, `Agent: ${agent.id}`),
      h('div', { style: { fontSize: '11px', marginBottom: '4px' } },
        `Tables: ${Object.keys(agent.memoryScope.privateTables).length} private + ${Object.keys(agent.memoryScope.sharedTables).length} shared`
      ),
      h('div', { style: { fontSize: '11px' } },
        `Retention: ${agent.memoryScope.retention.workingMaxItems} items, ${agent.memoryScope.retention.episodicTTL / 1000}s TTL`
      ),
    ) : h('p', { style: { color: '#999' } }, 'No agent selected'),
    h('h4', { style: { fontSize: '12px', marginTop: '12px' } }, 'Recent Access Log'),
    h('div', { style: { maxHeight: '200px', overflow: 'auto' } },
      recent.map((e: AccessLogEntry) => h('div', { key: `${e.timestamp}-${e.entryId}`, style: { fontSize: '10px', padding: '2px', borderBottom: '1px solid #eee' } },
        `${new Date(e.timestamp).toLocaleTimeString()} ${e.operation} ${e.entryId || ''}`,
      )),
    ),
  )
}

// =============================================================================
// H9: HookLogPanel
// =============================================================================

export interface HookLogPanelProps {
  emitter: AgentHookEmitter
  limit?: number
}

export function HookLogPanel({ emitter, limit = 30 }: HookLogPanelProps) {
  const [emits, setEmits] = useState<EmitResult[]>([])
  useEffect(() => {
    const handler = (result: EmitResult) => setEmits(prev => [result, ...prev].slice(0, limit))
    return () => { /* cleanup not needed for one-time */ }
  }, [emitter, limit])
  return h('div', { class: 'hook-log-panel', style: panelStyle() },
    h('h3', null, 'Hook Events'),
    h('div', { style: { fontSize: '11px', color: '#666' } }, `Total: ${emits.length} events`),
    h('div', { style: { maxHeight: '200px', overflow: 'auto' } },
      emits.map((r, i) => h('div', { key: i, style: { fontSize: '10px', padding: '2px', borderBottom: '1px solid #eee' } },
        `${r.event} (${r.executed} handler${r.errors.length ? `, ${r.errors.length} err` : ''})`,
      )),
    ),
  )
}

// =============================================================================
// H10: MessageLogPanel
// =============================================================================

export interface MessageLogPanelProps {
  state: StudioState
}

export function MessageLogPanel({ state }: MessageLogPanelProps) {
  return h('div', { class: 'message-log-panel', style: panelStyle() },
    h('h3', null, 'Messages'),
    h('div', { style: { fontSize: '11px' } },
      h('div', null, `Total connections: ${state.connections.length}`),
      h('div', null, h('strong', null, 'By type:')),
      ...Object.entries(state.connections.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)).map(([k, v]) => h('div', { key: k }, `  ${k}: ${v}`))
    ),
  )
}

// 共享样式
function panelStyle(): h.JSX.CSSProperties {
  return { padding: '12px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', height: '100%', overflow: 'auto' }
}

function chipStyle(): h.JSX.CSSProperties {
  return { display: 'inline-block', padding: '2px 6px', margin: '2px', background: '#e3f2fd', borderRadius: '3px', fontSize: '10px' }
}
