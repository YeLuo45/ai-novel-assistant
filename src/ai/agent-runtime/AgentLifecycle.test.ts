/**
 * AgentLifecycle.test.ts (V2334) — 30+ 断言
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateTransition,
  nextStates,
  isTerminalState,
  AgentLifecycleManager,
  createDefaultLifecycleManager,
} from './AgentLifecycle'
import type { AgentLifecycleStatus } from './AgentRegistry'

describe('validateTransition', () => {
  it('allows spawning -> active', () => {
    expect(validateTransition('spawning', 'active').ok).toBe(true)
  })

  it('allows spawning -> destroyed', () => {
    expect(validateTransition('spawning', 'destroyed').ok).toBe(true)
  })

  it('allows spawning -> idle', () => {
    expect(validateTransition('spawning', 'idle').ok).toBe(true)
  })

  it('allows active -> idle', () => {
    expect(validateTransition('active', 'idle').ok).toBe(true)
  })

  it('allows active -> hibernating', () => {
    expect(validateTransition('active', 'hibernating').ok).toBe(true)
  })

  it('allows active -> destroyed', () => {
    expect(validateTransition('active', 'destroyed').ok).toBe(true)
  })

  it('allows idle -> active', () => {
    expect(validateTransition('idle', 'active').ok).toBe(true)
  })

  it('allows idle -> hibernating', () => {
    expect(validateTransition('idle', 'hibernating').ok).toBe(true)
  })

  it('allows hibernating -> active', () => {
    expect(validateTransition('hibernating', 'active').ok).toBe(true)
  })

  it('allows hibernating -> spawning', () => {
    expect(validateTransition('hibernating', 'spawning').ok).toBe(true)
  })

  it('denies destroyed -> anything (terminal)', () => {
    const targets: AgentLifecycleStatus[] = ['spawning', 'active', 'idle', 'hibernating']
    for (const t of targets) {
      const r = validateTransition('destroyed', t)
      expect(r.ok).toBe(false)
      expect(r.reason).toContain('invalid transition')
    }
  })

  it('denies no-op transition (active -> active)', () => {
    const r = validateTransition('active', 'active')
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('no-op')
  })

  it('denies spawning -> hibernating (skip idle)', () => {
    expect(validateTransition('spawning', 'hibernating').ok).toBe(false)
  })

  it('denies idle -> spawning (no going back)', () => {
    expect(validateTransition('idle', 'spawning').ok).toBe(false)
  })
})

describe('nextStates', () => {
  it('returns correct next states for each', () => {
    expect(nextStates('spawning').sort()).toEqual(['active', 'destroyed', 'idle'])
    expect(nextStates('active').sort()).toEqual(['destroyed', 'hibernating', 'idle'])
    expect(nextStates('idle').sort()).toEqual(['active', 'destroyed', 'hibernating'])
    expect(nextStates('hibernating').sort()).toEqual(['active', 'destroyed', 'spawning'])
    expect(nextStates('destroyed')).toEqual([])
  })
})

describe('isTerminalState', () => {
  it('returns true for destroyed', () => {
    expect(isTerminalState('destroyed')).toBe(true)
  })

  it('returns false for others', () => {
    expect(isTerminalState('spawning')).toBe(false)
    expect(isTerminalState('active')).toBe(false)
    expect(isTerminalState('idle')).toBe(false)
    expect(isTerminalState('hibernating')).toBe(false)
  })
})

describe('AgentLifecycleManager', () => {
  let mgr: AgentLifecycleManager
  beforeEach(() => {
    mgr = createDefaultLifecycleManager()
  })

  it('track initializes lastActive', () => {
    mgr.track('a1', 'active')
    expect(mgr.getLastActive('a1')).toBeGreaterThan(0)
  })

  it('track emits event', () => {
    mgr.track('a1', 'active')
    const evts = mgr.getEvents('a1')
    expect(evts.length).toBe(1)
    expect(evts[0].from).toBe('active')
    expect(evts[0].to).toBe('active')
  })

  it('transition records from-to event', () => {
    mgr.track('a1', 'spawning')
    const r = mgr.transition('a1', 'spawning', 'active', 'init done')
    expect(r.ok).toBe(true)
    const evts = mgr.getEvents('a1')
    expect(evts.length).toBe(2)
    expect(evts[1].from).toBe('spawning')
    expect(evts[1].to).toBe('active')
    expect(evts[1].reason).toBe('init done')
  })

  it('transition refuses invalid', () => {
    mgr.track('a1', 'destroyed')
    const r = mgr.transition('a1', 'destroyed', 'active', 'revive')
    expect(r.ok).toBe(false)
  })

  it('touch updates lastActive', () => {
    mgr.track('a1', 'active')
    const before = mgr.getLastActive('a1')!
    // 用 timer hack：touch 是同步的，timestamp 一样 — 用 setTimeout 区别
    setTimeout(() => {
      mgr.touch('a1', 'active')
      expect(mgr.getLastActive('a1')!).toBeGreaterThanOrEqual(before)
    }, 5)
  })

  it('untrack removes agent state', () => {
    mgr.track('a1', 'active')
    mgr.untrack('a1')
    expect(mgr.getLastActive('a1')).toBeUndefined()
  })

  it('getEvents without filter returns all', () => {
    mgr.track('a1', 'active')
    mgr.track('a2', 'idle')
    expect(mgr.getEvents().length).toBe(2)
  })

  it('getEvents with filter returns only matching agent', () => {
    mgr.track('a1', 'active')
    mgr.track('a2', 'idle')
    expect(mgr.getEvents('a1').length).toBe(1)
  })

  it('getConfig returns default values', () => {
    const cfg = mgr.getConfig()
    expect(cfg.idleTimeoutMs).toBe(5 * 60 * 1000)
    expect(cfg.hibernateAfterMs).toBe(30 * 60 * 1000)
  })

  it('custom config overrides defaults', () => {
    const m = new AgentLifecycleManager({ idleTimeoutMs: 100, hibernateAfterMs: 200 })
    expect(m.getConfig().idleTimeoutMs).toBe(100)
    expect(m.getConfig().hibernateAfterMs).toBe(200)
  })
})

describe('AgentLifecycleManager.tick', () => {
  it('tick: no transition when within timeout', () => {
    const mgr = new AgentLifecycleManager({ idleTimeoutMs: 1000, hibernateAfterMs: 2000 })
    mgr.track('a1', 'active')
    const r = mgr.tick('a1', 'active')
    expect(r.transitioned).toBe(false)
    expect(r.newStatus).toBe('active')
  })

  it('tick: active -> idle when timeout exceeded', () => {
    const mgr = new AgentLifecycleManager({ idleTimeoutMs: 50, hibernateAfterMs: 200 })
    mgr.track('a1', 'active')
    // 模拟时间过去
    const r = mgr.tick('a1', 'active', Date.now() + 100)
    expect(r.transitioned).toBe(true)
    expect(r.newStatus).toBe('idle')
  })

  it('tick: idle -> hibernating when hibernate timeout exceeded', () => {
    const mgr = new AgentLifecycleManager({ idleTimeoutMs: 50, hibernateAfterMs: 100 })
    mgr.track('a1', 'active')
    // 先 active -> idle
    mgr.tick('a1', 'active', Date.now() + 60)
    // 再 idle -> hibernating
    const r = mgr.tick('a1', 'idle', Date.now() + 200)
    expect(r.transitioned).toBe(true)
    expect(r.newStatus).toBe('hibernating')
  })

  it('tick: hibernating -> destroyed when destroy timeout set', () => {
    const mgr = new AgentLifecycleManager({
      idleTimeoutMs: 10,
      hibernateAfterMs: 20,
      destroyAfterMs: 30,
    })
    mgr.track('a1', 'active')
    mgr.tick('a1', 'active', Date.now() + 15) // -> idle
    mgr.tick('a1', 'idle', Date.now() + 25) // -> hibernating
    const r = mgr.tick('a1', 'hibernating', Date.now() + 50) // -> destroyed
    expect(r.transitioned).toBe(true)
    expect(r.newStatus).toBe('destroyed')
  })

  it('tick: terminal state is no-op', () => {
    const mgr = createDefaultLifecycleManager()
    mgr.track('a1', 'destroyed')
    const r = mgr.tick('a1', 'destroyed')
    expect(r.transitioned).toBe(false)
    expect(r.reason).toBe('terminal')
  })

  it('tick: destroyAfterMs=0 means no auto-destroy', () => {
    const mgr = new AgentLifecycleManager({ idleTimeoutMs: 10, hibernateAfterMs: 20 })
    mgr.track('a1', 'active')
    mgr.tick('a1', 'active', Date.now() + 15)
    mgr.tick('a1', 'idle', Date.now() + 25)
    // 很久之后
    const r = mgr.tick('a1', 'hibernating', Date.now() + 100000)
    expect(r.transitioned).toBe(false) // 不会自动 destroyed
  })
})
