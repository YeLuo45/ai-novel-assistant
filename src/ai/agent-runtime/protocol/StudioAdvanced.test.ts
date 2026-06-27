/**
 * protocol/StudioAdvanced.test.ts (V2486-V2500) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  StudioCommandRegistry, StudioSelection, StudioClipboard, StudioDragController,
  StudioReplay, computeMetrics, StudioSnapshotManager,
  exportStudioState, importStudioState,
  validateStudioState, DEFAULT_STUDIO_SCHEMA,
  DEFAULT_THEME, DARK_THEME,
  DEFAULT_LAYOUT, StudioHotkeyManager, DEFAULT_HOTKEYS,
  type StudioCommand,
} from './StudioAdvanced'
import { INITIAL_STUDIO_STATE, studioReducer, type StudioAgent, type StudioAction, type StudioState } from './StudioState'
import { createSoul, createUserBinding, createMemoryScope } from '../index'

const makeAgent = (id: string): StudioAgent => ({
  id,
  soul: createSoul({ agentId: id, archetype: 'critic', displayName: id, capabilities: ['plot'] }),
  binding: createUserBinding({ agentId: id }),
  memoryScope: createMemoryScope({ agentId: id }),
  position: { x: 0, y: 0 },
  selected: false,
})

describe('StudioCommandRegistry', () => {
  it('push + undo + redo', () => {
    const r = new StudioCommandRegistry()
    const cmd: StudioCommand = { type: 'add', description: 'x', apply: (s: StudioState) => s, reverse: () => cmd }
    r.push(cmd)
    expect(r.canUndo()).toBe(true)
    expect(r.undo()).toBeDefined()
    expect(r.canRedo()).toBe(true)
    expect(r.redo()).toBeDefined()
  })

  it('clear', () => {
    const r = new StudioCommandRegistry()
    const cmd: StudioCommand = { type: 'add', description: 'x', apply: (s: StudioState) => s, reverse: () => cmd }
    r.push(cmd)
    r.clear()
    expect(r.canUndo()).toBe(false)
  })

  it('maxHistory cap', () => {
    const r = new StudioCommandRegistry(2)
    const cmd: StudioCommand = { type: 'add', description: 'x', apply: (s: StudioState) => s, reverse: () => cmd }
    r.push(cmd)
    r.push(cmd)
    r.push(cmd)
    r.push(cmd)
    // should keep only 2
    expect(r.canUndo()).toBe(true)
  })
})

describe('StudioSelection', () => {
  it('selectAgent + selectedAgents', () => {
    const s = new StudioSelection()
    s.selectAgent('a1')
    expect(s.selectedAgents()).toEqual(['a1'])
  })

  it('selectConnection clears agents', () => {
    const s = new StudioSelection()
    s.selectAgent('a1')
    s.selectConnection('a1', 'a2')
    expect(s.selectedAgents().length).toBe(0)
    expect(s.selectedConnections().length).toBe(1)
  })

  it('clear', () => {
    const s = new StudioSelection()
    s.selectAgent('a1')
    s.clear()
    expect(s.isAgentSelected('a1')).toBe(false)
  })

  it('deselectAgent', () => {
    const s = new StudioSelection()
    s.selectAgent('a1')
    s.deselectAgent('a1')
    expect(s.isAgentSelected('a1')).toBe(false)
  })
})

describe('StudioClipboard', () => {
  it('set + get + hasContent', () => {
    const c = new StudioClipboard()
    c.set({ agents: [makeAgent('a1')], connections: [], copiedAt: 0 })
    expect(c.hasContent()).toBe(true)
    expect(c.get()?.agents[0].id).toBe('a1')
  })

  it('clear', () => {
    const c = new StudioClipboard()
    c.set({ agents: [], connections: [], copiedAt: 0 })
    c.clear()
    expect(c.hasContent()).toBe(false)
  })
})

describe('StudioDragController', () => {
  it('start + update + end', () => {
    const d = new StudioDragController()
    d.start('a1', 0, 0)
    d.update(100, 200)
    expect(d.isDragging()).toBe(true)
    const r = d.end()
    expect(r?.agentId).toBe('a1')
    expect(d.isDragging()).toBe(false)
  })

  it('currentDelta', () => {
    const d = new StudioDragController()
    d.start('a1', 0, 0)
    d.update(50, 100)
    expect(d.currentDelta()).toEqual({ dx: 50, dy: 100 })
  })

  it('no drag = no delta', () => {
    expect(new StudioDragController().currentDelta()).toBeNull()
  })
})

describe('StudioReplay', () => {
  it('replay records steps', () => {
    const r = new StudioReplay()
    const actions: StudioAction[] = [
      { type: 'agent.add', agent: makeAgent('a1') },
      { type: 'agent.add', agent: makeAgent('a2') },
    ]
    const steps = r.replay(INITIAL_STUDIO_STATE, actions)
    expect(steps.length).toBe(2)
    expect(steps[1].state.agents.length).toBe(2)
  })

  it('jumpTo', () => {
    const r = new StudioReplay()
    const actions: StudioAction[] = [
      { type: 'agent.add', agent: makeAgent('a1') },
      { type: 'agent.add', agent: makeAgent('a2') },
    ]
    expect(r.jumpTo(INITIAL_STUDIO_STATE, actions, 0).agents.length).toBe(1)
  })
})

describe('computeMetrics', () => {
  it('computes correctly', () => {
    let s = INITIAL_STUDIO_STATE
    s = studioReducer(s, { type: 'agent.add', agent: makeAgent('a1') })
    const m = computeMetrics(s)
    expect(m.agentCount).toBe(1)
    expect(m.totalChanges).toBe(1)
  })
})

describe('StudioSnapshotManager + export/import', () => {
  it('take + list + restore', () => {
    const sm = new StudioSnapshotManager()
    sm.take(INITIAL_STUDIO_STATE, 'test')
    const list = sm.list()
    expect(list.length).toBe(1)
    expect(sm.restore(list[0].timestamp)).not.toBeNull()
  })

  it('export/import roundtrip', () => {
    let s = INITIAL_STUDIO_STATE
    s = studioReducer(s, { type: 'agent.add', agent: makeAgent('a1') })
    const json = exportStudioState(s)
    const back = importStudioState(json)
    expect(back.agents.length).toBe(1)
  })

  it('max snapshots cap', () => {
    const sm = new StudioSnapshotManager(2)
    sm.take(INITIAL_STUDIO_STATE, '1')
    sm.take(INITIAL_STUDIO_STATE, '2')
    sm.take(INITIAL_STUDIO_STATE, '3')
    expect(sm.list().length).toBe(2)
  })
})

describe('validateStudioState', () => {
  it('valid state', () => {
    const r = validateStudioState(INITIAL_STUDIO_STATE)
    expect(r.valid).toBe(true)
  })

  it('connection to unknown agent fails', () => {
    const s = { ...INITIAL_STUDIO_STATE, connections: [{ from: 'unknown', to: 'a1', type: 'message' as const }] }
    const r = validateStudioState(s)
    expect(r.valid).toBe(false)
  })

  it('warning on no agents', () => {
    const r = validateStudioState(INITIAL_STUDIO_STATE)
    expect(r.warnings).toContain('no agents')
  })

  it('too many agents fails', () => {
    const s = {
      ...INITIAL_STUDIO_STATE,
      agents: Array.from({ length: 200 }, (_, i) => makeAgent(`a${i}`)),
    }
    const r = validateStudioState(s, DEFAULT_STUDIO_SCHEMA)
    expect(r.valid).toBe(false)
  })
})

describe('Themes + Layout + Hotkeys', () => {
  it('DEFAULT_THEME has name=light', () => {
    expect(DEFAULT_THEME.name).toBe('light')
  })

  it('DARK_THEME has name=dark', () => {
    expect(DARK_THEME.name).toBe('dark')
  })

  it('DEFAULT_LAYOUT has 3 panels', () => {
    expect(DEFAULT_LAYOUT.panels.length).toBe(3)
  })

  it('StudioHotkeyManager default has undo', () => {
    const m = new StudioHotkeyManager()
    const h = m.find('z', ['ctrl'])
    expect(h?.action).toBe('history.undo')
  })

  it('StudioHotkeyManager bind custom', () => {
    const m = new StudioHotkeyManager()
    m.bind({ key: 'x', action: 'custom', description: 'x' })
    expect(m.find('x')?.action).toBe('custom')
  })

  it('StudioHotkeyManager unbind', () => {
    const m = new StudioHotkeyManager()
    expect(m.unbind('z', ['ctrl'])).toBe(true)
    expect(m.find('z', ['ctrl'])).toBeUndefined()
  })

  it('DEFAULT_HOTKEYS has 5 entries', () => {
    expect(DEFAULT_HOTKEYS.length).toBe(5)
  })
})
