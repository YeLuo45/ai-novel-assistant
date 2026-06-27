/**
 * collab/v3/StudioPanels2.tsx (H11-H15) - 5 engines
 *
 * - H11 SoulStudioEditor: soul 模板编辑器
 * - H12 MarketPanel: Soul 模板市场
 * - H13 ExperimentPanel: A/B 测试配置
 * - H14 HealthDashboard: 健康监控
 * - H15 AlertCenter: 告警中心
 */

import { h } from 'preact'
import { useState, useMemo } from 'preact/hooks'
import {
  SoulMarketplace, SoulTemplateRegistry, SoulRating,
  type SoulListing, type SoulTemplate,
} from '../../ai/agent-runtime/protocol/SoulMarketplace'
import { SoulStudio, buildPreview, validateForStudio } from '../../ai/agent-runtime/protocol/SoulStudio'
import {
  ExperimentRunner, validateExperiment, zTestProportions,
  type Experiment, type Variant,
} from '../../ai/agent-runtime/protocol/ABTesting'
import {
  HealthCheckRunner, AlertManager, type HealthCheckResult, type Alert,
} from '../../ai/agent-runtime/protocol/AdaptationAndHealth'

// =============================================================================
// H11: SoulStudioEditor
// =============================================================================

export interface SoulStudioEditorProps {
  template: SoulTemplate
  onChange?: (t: SoulTemplate) => void
}

export function SoulStudioEditor({ template, onChange }: SoulStudioEditorProps) {
  const [draft, setDraft] = useState<SoulTemplate>(template)
  const preview = useMemo(() => buildPreview(draft), [draft])
  const issues = useMemo(() => validateForStudio(draft), [draft])
  return h('div', { class: 'soul-studio-editor', style: { padding: '12px', fontSize: '12px' } },
    h('h3', null, 'Soul Studio Editor'),
    h('div', null, h('label', null, 'Display Name: '),
      h('input', {
        type: 'text', value: draft.displayName,
        onInput: (e: Event) => {
          const newT = { ...draft, displayName: (e.target as HTMLInputElement).value }
          setDraft(newT); onChange?.(newT)
        },
        style: inputStyle(),
      })),
    h('div', null, h('label', null, 'Archetype: '),
      h('select', {
        value: draft.archetype,
        onChange: (e: Event) => {
          const newT = { ...draft, archetype: (e.target as HTMLSelectElement).value as any }
          setDraft(newT); onChange?.(newT)
        },
        style: inputStyle(),
      },
        ...['instructor', 'assistant', 'critic', 'reviewer', 'executor', 'specialist'].map(a =>
          h('option', { key: a, value: a }, a))
      )),
    h('div', null, h('label', null, 'Description: '),
      h('input', {
        type: 'text', value: draft.description,
        onInput: (e: Event) => {
          const newT = { ...draft, description: (e.target as HTMLInputElement).value }
          setDraft(newT); onChange?.(newT)
        },
        style: inputStyle(),
      })),
    h('h4', { style: { fontSize: '12px', marginTop: '12px' } }, 'Capabilities'),
    h('div', null,
      ...preview.capabilities.map(c => h('span', { key: c, style: chipStyle() }, c))
    ),
    h('h4', { style: { fontSize: '12px', marginTop: '12px' } }, 'Tone'),
    h('div', null,
      ...Object.entries(preview.toneSnapshot).map(([k, v]) =>
        h('div', { key: k, style: { fontSize: '11px' } }, `${k}: ${(v as number).toFixed(2)}`)
      )
    ),
    h('h4', { style: { fontSize: '12px', marginTop: '12px' } }, 'Issues'),
    issues.length === 0
      ? h('p', { style: { color: '#4caf50', fontSize: '11px' } }, '✓ No issues')
      : h('ul', { style: { fontSize: '11px', color: '#f44336' } },
          ...issues.map((i, idx) => h('li', { key: idx }, `[${i.severity}] ${i.field}: ${i.message}`))
        ),
  )
}

// =============================================================================
// H12: MarketPanel
// =============================================================================

export interface MarketPanelProps {
  marketplace: SoulMarketplace
}

export function MarketPanel({ marketplace }: MarketPanelProps) {
  const [query, setQuery] = useState('')
  const listings = useMemo(() => {
    return query ? marketplace.search(query) : marketplace.list()
  }, [marketplace, query])
  return h('div', { class: 'market-panel', style: panelStyle() },
    h('h3', null, 'Soul Marketplace'),
    h('input', {
      type: 'text', placeholder: 'Search templates...', value: query,
      onInput: (e: Event) => setQuery((e.target as HTMLInputElement).value),
      style: { ...inputStyle(), width: '100%', marginBottom: '8px' },
    }),
    h('div', { style: { fontSize: '11px' } }, `Showing ${listings.length} of ${marketplace.list().length}`),
    h('div', { style: { maxHeight: '300px', overflow: 'auto' } },
      ...listings.map((l: SoulListing) => h('div', { key: l.template.templateId, style: listingStyle() },
        h('div', { style: { fontWeight: 'bold' } }, l.template.displayName),
        h('div', { style: { fontSize: '10px', color: '#666' } }, l.description),
        h('div', { style: { fontSize: '10px' } }, `★ ${l.rating.toFixed(1)} | ↓ ${l.downloads} | ${l.tags.join(', ')}`),
      )),
    ),
  )
}

// =============================================================================
// H13: ExperimentPanel
// =============================================================================

export interface ExperimentPanelProps {
  runner: ExperimentRunner
}

export function ExperimentPanel({ runner }: ExperimentPanelProps) {
  const results = runner.results()
  return h('div', { class: 'experiment-panel', style: panelStyle() },
    h('h3', null, 'A/B Experiments'),
    h('div', { style: { fontSize: '11px' } }, `Assignments: ${runner.assignmentCount()}`),
    h('h4', { style: { fontSize: '12px' } }, 'Results'),
    ...results.map(r => h('div', { key: r.variantId, style: { padding: '4px', marginBottom: '4px', background: '#fafafa', borderRadius: '3px' } },
      h('div', { style: { fontWeight: 'bold' } }, r.variantId),
      h('div', { style: { fontSize: '10px' } }, `Exposures: ${r.exposures} | Conversions: ${r.conversions} | Rate: ${(r.conversionRate * 100).toFixed(1)}%`),
    )),
  )
}

// =============================================================================
// H14: HealthDashboard
// =============================================================================

export interface HealthDashboardProps {
  runner: HealthCheckRunner
  results: HealthCheckResult[]
}

export function HealthDashboard({ runner, results }: HealthDashboardProps) {
  const overall = runner.overall(results)
  const color = overall === 'healthy' ? '#4caf50' : overall === 'degraded' ? '#ff9800' : '#f44336'
  return h('div', { class: 'health-dashboard', style: panelStyle() },
    h('h3', null, 'Health'),
    h('div', { style: { padding: '12px', background: color, color: '#fff', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' } },
      overall.toUpperCase()
    ),
    h('h4', { style: { fontSize: '12px', marginTop: '12px' } }, 'Checks'),
    ...results.map(r => h('div', { key: r.name, style: { fontSize: '11px', padding: '4px', borderBottom: '1px solid #eee' } },
      h('span', { style: { color: r.status === 'healthy' ? '#4caf50' : r.status === 'degraded' ? '#ff9800' : '#f44336' } }, '● '),
      r.name,
      r.message ? ` - ${r.message}` : ''
    )),
  )
}

// =============================================================================
// H15: AlertCenter
// =============================================================================

export interface AlertCenterProps {
  manager: AlertManager
}

export function AlertCenter({ manager }: AlertCenterProps) {
  const active = manager.active()
  const history = manager.history()
  return h('div', { class: 'alert-center', style: panelStyle() },
    h('h3', null, 'Alerts'),
    h('div', { style: { fontSize: '11px', marginBottom: '8px' } }, `Active: ${active.length} | History: ${history.length}`),
    h('h4', { style: { fontSize: '12px' } }, 'Active'),
    active.length === 0
      ? h('p', { style: { color: '#999', fontSize: '11px' } }, 'No active alerts')
      : h('ul', { style: { fontSize: '11px' } },
          ...active.map((a: Alert) => h('li', { key: a.ruleId, style: { color: a.severity === 'critical' ? '#f44336' : a.severity === 'warning' ? '#ff9800' : '#2196f3' } },
            `[${a.severity}] ${a.message}`))
        ),
  )
}

function panelStyle(): h.JSX.CSSProperties {
  return { padding: '12px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', height: '100%', overflow: 'auto' }
}
function inputStyle(): h.JSX.CSSProperties {
  return { padding: '4px 8px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '12px', marginLeft: '4px' }
}
function chipStyle(): h.JSX.CSSProperties {
  return { display: 'inline-block', padding: '2px 6px', margin: '2px', background: '#e3f2fd', borderRadius: '3px', fontSize: '10px' }
}
function listingStyle(): h.JSX.CSSProperties {
  return { padding: '8px', marginBottom: '6px', background: '#fafafa', borderRadius: '4px', border: '1px solid #eee' }
}