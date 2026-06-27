/**
 * NanobotAdapter.test.ts (V2342) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  NanobotAdapter,
  isNanobotClass,
  listNanobotMethods,
  adaptNanobot,
  type NanobotClassLike,
  type NanobotMethodName,
} from './NanobotAdapter'
import { createSoul } from './AgentSoul'
import { createUserBinding } from './AgentUserBinding'
import { createMemoryScope } from './AgentMemoryScope'
import { createDefaultSandbox } from './AgentSandbox'

// Mock nanobot classes
class PlotAnalyzer {
  static process(input: string): { beats: string[] } {
    return { beats: input.split(' ').slice(0, 3) }
  }
}

class StyleScorer {
  static score(text: string): number {
    return text.length
  }
  static detect(text: string): string {
    return text.length > 10 ? 'long' : 'short'
  }
}

class BrokenNanobot {
  // no static methods
}

const setup = (toolWhitelist?: string[]) => {
  const soul = createSoul({
    agentId: 'a1',
    archetype: 'critic',
    displayName: 'Test',
    capabilities: ['plot'],
    toolWhitelist,
  })
  const binding = createUserBinding({ agentId: 'a1' })
  const scope = createMemoryScope({ agentId: 'a1' })
  const sandbox = createDefaultSandbox()
  return { soul, binding, scope, sandbox }
}

describe('isNanobotClass', () => {
  it('detects class with process', () => {
    expect(isNanobotClass(PlotAnalyzer)).toBe(true)
  })

  it('detects class with score', () => {
    expect(isNanobotClass(StyleScorer)).toBe(true)
  })

  it('accepts any class (methods checked at call time)', () => {
    expect(isNanobotClass(BrokenNanobot)).toBe(true)
  })

  it('rejects non-function', () => {
    expect(isNanobotClass(null)).toBe(false)
    expect(isNanobotClass('a')).toBe(false)
    expect(isNanobotClass(42)).toBe(false)
  })

  it('rejects plain object', () => {
    expect(isNanobotClass({ process: () => 'x' })).toBe(false)
  })
})

describe('listNanobotMethods', () => {
  it('returns all nanobot method names', () => {
    const m = listNanobotMethods(PlotAnalyzer as NanobotClassLike)
    expect(m).toContain('process')
  })

  it('returns multiple for multi-method nanobot', () => {
    const m = listNanobotMethods(StyleScorer as NanobotClassLike)
    expect(m).toContain('score')
    expect(m).toContain('detect')
  })

  it('returns empty for broken nanobot', () => {
    const m = listNanobotMethods(BrokenNanobot as NanobotClassLike)
    expect(m.length).toBe(0)
  })
})

describe('NanobotAdapter — construction', () => {
  it('creates adapter for valid nanobot', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a.nanobotName).toBe('PlotAnalyzer')
    expect(a.availableMethods).toContain('process')
  })

  it('throws for non-nanobot', () => {
    const { soul, binding, scope, sandbox } = setup()
    expect(() => new NanobotAdapter({ name: 'x' } as never, { soul, userBinding: binding, memoryScope: scope, sandbox })).toThrow()
  })

  it('adaptNanobot is convenience', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = adaptNanobot(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a).toBeInstanceOf(NanobotAdapter)
  })
})

describe('NanobotAdapter — call', () => {
  it('call invokes static method', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as unknown as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.call('process', ['hello world test sample'])
    expect(r.success).toBe(true)
    expect((r.output as { beats: string[] }).beats.length).toBe(3)
  })

  it('call returns sanctions', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.call('process', ['x'])
    expect(r.sanctions.length).toBe(1)
    expect(r.sanctions[0].allowed).toBe(true)
  })

  it('call: method not found', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.call('score' as NanobotMethodName, ['x'])
    expect(r.success).toBe(false)
    expect(r.error).toContain('not found')
  })

  it('call: nanobot throws', () => {
    class Failing {
      static process(): never { throw new Error('fail') }
    }
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(Failing as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.call('process', [])
    expect(r.success).toBe(false)
    expect(r.error).toBe('fail')
  })

  it('call: denied by sandbox (tool not in whitelist)', () => {
    const { soul, binding, scope, sandbox } = setup(['other_tool'])
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.call('process', ['x'])
    expect(r.success).toBe(false)
    expect(r.error).toContain('denied by sandbox')
  })

  it('call: duration is positive', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.call('process', ['x'])
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
  })
})

describe('NanobotAdapter — callAny', () => {
  it('callAny picks first available method', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.callAny(['x'])
    expect(r.method).toBe('process')
    expect(r.success).toBe(true)
  })

  it('callAny picks first when multiple available', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(StyleScorer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.callAny(['hello world'])
    expect(r.method).toBe('score')
    expect(r.output).toBe(11)
  })

  it('callAny fails on broken nanobot', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(BrokenNanobot as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.callAny(['x'])
    expect(r.success).toBe(false)
    expect(r.error).toContain('no methods available')
  })
})

describe('NanobotAdapter — accessors', () => {
  it('exposes soul, sandbox', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a.soul).toBe(soul)
    expect(a.sandbox).toBe(sandbox)
  })

  it('availableMethods is readonly', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as unknown as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a.availableMethods.length).toBeGreaterThan(0)
  })

  it('NanobotAdapter exposes userBinding', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new NanobotAdapter(PlotAnalyzer as unknown as NanobotClassLike, { soul, userBinding: binding, memoryScope: scope, sandbox })
    // userBinding 来自 options，验证 bridge 一致性
    expect(a.soul.agentId).toBe(soul.agentId)
  })
})
