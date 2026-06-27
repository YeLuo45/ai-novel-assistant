/**
 * collab/v3/StudioPanels3.tsx (H16-H25) - 10 engines
 *
 * - H16 SectionList: 项目章节列表
 * - H17 Storyboard: 故事板
 * - H18 DocumentPanel: 文档预览
 * - H19 PluginPanel: 插件管理
 * - H20 SettingsPanel: 应用设置
 * - H21 DragDropContext: 拖拽上下文
 * - H22 ContextMenu: 右键菜单
 * - H23 KeyboardShortcuts: 键盘快捷键
 * - H24 ThemeProvider: 主题切换
 * - H25 Animation: 动画 hook
 */

import { h } from 'preact'
import { useState, useEffect, useMemo } from 'preact/hooks'
import {
  StudioSectionList, type StudioSection,
} from '../../ai/agent-runtime/protocol/StudioState'
import {
  DEFAULT_THEME, DARK_THEME, type StudioTheme,
} from '../../ai/agent-runtime/protocol/StudioAdvanced'
import {
  StudioHotkeyManager, type HotkeyBinding,
} from '../../ai/agent-runtime/protocol/StudioAdvanced'

// =============================================================================
// H16: SectionList
// =============================================================================

export interface SectionListProps {
  list: StudioSectionList
  selectedId?: string
  onSelect?: (id: string) => void
}

export function SectionList({ list, selectedId, onSelect }: SectionListProps) {
  const sections = list.list()
  return h('div', { class: 'section-list', style: panelStyle() },
    h('h3', null, 'Sections'),
    sections.length === 0
      ? h('p', { style: { color: '#999' } }, 'No sections yet')
      : h('ul', { style: { listStyle: 'none', padding: 0 } },
          ...sections.map(s => h('li', {
            key: s.id,
            onClick: () => onSelect?.(s.id),
            style: {
              padding: '6px 8px',
              marginBottom: '2px',
              background: s.id === selectedId ? '#e3f2fd' : '#fafafa',
              cursor: 'pointer',
              fontSize: '12px',
              borderRadius: '3px',
            },
          }, `${s.order}. ${s.title}`))
        ),
  )
}

// =============================================================================
// H17: Storyboard
// =============================================================================

export interface StoryboardProps {
  sections: StudioSection[]
}

export function Storyboard({ sections }: StoryboardProps) {
  return h('div', { class: 'storyboard', style: panelStyle() },
    h('h3', null, 'Storyboard'),
    h('div', { style: { display: 'flex', gap: '8px', overflow: 'auto' } },
      ...sections.map(s => h('div', { key: s.id, style: { minWidth: '120px', padding: '8px', background: '#fafafa', borderRadius: '4px', fontSize: '11px' } },
        h('div', { style: { fontWeight: 'bold' } }, s.title),
        h('div', { style: { color: '#666' } }, s.content.slice(0, 30) + '...'),
      ))
    ),
  )
}

// =============================================================================
// H18: DocumentPanel
// =============================================================================

export interface DocumentPanelProps {
  content: string
  onChange?: (text: string) => void
}

export function DocumentPanel({ content, onChange }: DocumentPanelProps) {
  return h('div', { class: 'document-panel', style: { ...panelStyle(), display: 'flex', flexDirection: 'column' } },
    h('h3', null, 'Document'),
    h('textarea', {
      value: content,
      onInput: (e: Event) => onChange?.((e.target as HTMLTextAreaElement).value),
      style: { flex: 1, padding: '8px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '200px' },
    }),
  )
}

// =============================================================================
// H19: PluginPanel
// =============================================================================

export interface PluginEntry {
  id: string
  name: string
  enabled: boolean
}

export interface PluginPanelProps {
  plugins: PluginEntry[]
  onToggle?: (id: string) => void
}

export function PluginPanel({ plugins, onToggle }: PluginPanelProps) {
  return h('div', { class: 'plugin-panel', style: panelStyle() },
    h('h3', null, 'Plugins'),
    h('div', { style: { fontSize: '11px' } }, `${plugins.filter(p => p.enabled).length} of ${plugins.length} enabled`),
    ...plugins.map(p => h('div', { key: p.id, style: { display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #eee' } },
      h('span', null, p.name),
      h('button', {
        onClick: () => onToggle?.(p.id),
        style: { padding: '2px 8px', fontSize: '10px', background: p.enabled ? '#4caf50' : '#ccc', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' },
      }, p.enabled ? 'ON' : 'OFF')
    )),
  )
}

// =============================================================================
// H20: SettingsPanel
// =============================================================================

export interface SettingsPanelProps {
  settings: Record<string, string | number | boolean>
  onChange?: (key: string, value: any) => void
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return h('div', { class: 'settings-panel', style: panelStyle() },
    h('h3', null, 'Settings'),
    ...Object.entries(settings).map(([k, v]) => h('div', { key: k, style: { padding: '4px 0' } },
      h('label', null, k),
      h('input', {
        value: String(v),
        onInput: (e: Event) => onChange?.(k, (e.target as HTMLInputElement).value),
        style: { marginLeft: '8px', padding: '2px 6px', fontSize: '11px' },
      }),
    )),
  )
}

// =============================================================================
// H21: DragDropContext (helper hook)
// =============================================================================

export interface DragState {
  itemId: string
  x: number
  y: number
}

export function useDragDrop(onDrop?: (itemId: string, x: number, y: number) => void): {
  dragging: DragState | null
  startDrag: (itemId: string, e: MouseEvent) => void
} {
  const [dragging, setDragging] = useState<DragState | null>(null)
  const startDrag = (itemId: string, e: MouseEvent) => {
    setDragging({ itemId, x: e.clientX, y: e.clientY })
    e.preventDefault()
  }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setDragging(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
    }
    const onUp = (e: MouseEvent) => {
      if (dragging) onDrop?.(dragging.itemId, e.clientX, e.clientY)
      setDragging(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, onDrop])
  return { dragging, startDrag }
}

// =============================================================================
// H22: ContextMenu
// =============================================================================

export interface ContextMenuProps {
  x: number
  y: number
  items: { label: string; onClick: () => void }[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  return h('div', {
    style: {
      position: 'fixed', left: `${x}px`, top: `${y}px`,
      background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, padding: '4px 0',
      minWidth: '150px',
    },
    onClick: (e: MouseEvent) => e.stopPropagation(),
  },
    ...items.map((item, idx) => h('div', {
      key: idx,
      onClick: () => { item.onClick(); onClose() },
      style: { padding: '6px 12px', fontSize: '12px', cursor: 'pointer' },
      onMouseEnter: (e: MouseEvent) => { (e.currentTarget as HTMLElement).style.background = '#f0f0f0' },
      onMouseLeave: (e: MouseEvent) => { (e.currentTarget as HTMLElement).style.background = '#fff' },
    }, item.label))
  )
}

// =============================================================================
// H23: KeyboardShortcuts
// =============================================================================

export interface KeyboardShortcutsProps {
  manager: StudioHotkeyManager
  onAction?: (action: string) => void
}

export function KeyboardShortcuts({ manager, onAction }: KeyboardShortcutsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mods: string[] = []
      if (e.ctrlKey) mods.push('ctrl')
      if (e.shiftKey) mods.push('shift')
      if (e.altKey) mods.push('alt')
      const binding = manager.find(e.key, mods)
      if (binding) {
        e.preventDefault()
        onAction?.(binding.action)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [manager, onAction])
  return null  // headless
}

// =============================================================================
// H24: ThemeProvider
// =============================================================================

export type ThemeName = 'light' | 'dark'

export interface ThemeContext {
  theme: StudioTheme
  setTheme: (name: ThemeName) => void
}

export function useTheme(): ThemeContext {
  const [name, setName] = useState<ThemeName>('light')
  const theme = useMemo(() => name === 'light' ? DEFAULT_THEME : DARK_THEME, [name])
  useEffect(() => {
    document.documentElement.style.setProperty('--bg', theme.background)
    document.documentElement.style.setProperty('--text', theme.text)
  }, [theme])
  return { theme, setTheme: setName }
}

export interface ThemeSwitcherProps {
  current: ThemeName
  onChange: (name: ThemeName) => void
}

export function ThemeSwitcher({ current, onChange }: ThemeSwitcherProps) {
  return h('div', { class: 'theme-switcher', style: { display: 'flex', gap: '8px', padding: '8px' } },
    h('button', {
      onClick: () => onChange('light'),
      style: { padding: '4px 12px', background: current === 'light' ? '#1976d2' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    }, '☀ Light'),
    h('button', {
      onClick: () => onChange('dark'),
      style: { padding: '4px 12px', background: current === 'dark' ? '#1976d2' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    }, '🌙 Dark'),
  )
}

// =============================================================================
// H25: Animation (helper hook)
// =============================================================================

export interface AnimationState {
  progress: number  // 0-1
}

export function useAnimation(durationMs: number, trigger: unknown): AnimationState {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    setProgress(0)
    const start = Date.now()
    let raf: number
    const tick = () => {
      const elapsed = Date.now() - start
      const p = Math.min(1, elapsed / durationMs)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, trigger])
  return { progress }
}

function panelStyle(): h.JSX.CSSProperties {
  return { padding: '12px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }
}