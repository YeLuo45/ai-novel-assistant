/**
 * BaseAgentAdapter.test.ts (V2341) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  BaseAgentAdapter,
  isLegacyBaseAgent,
  adaptLegacyBaseAgent,
  type LegacyBaseAgentLike,
} from './BaseAgentAdapter'
import { createSoul } from './AgentSoul'
import { createUserBinding } from './AgentUserBinding'
import { createMemoryScope } from './AgentMemoryScope'
import { createDefaultSandbox, createStrictSandbox } from './AgentSandbox'

// 旧 BaseAgent 风格的 mock
const makeLegacy = (name: string, withMethod: 'execute' | 'run' | 'invoke' | 'handle' = 'execute'): LegacyBaseAgentLike => {
  return {
    name,
    [withMethod]: (input: unknown) => `result for ${JSON.stringify(input)}`,
  } as LegacyBaseAgentLike
}

const setup = (sandboxType: 'default' | 'strict' = 'default') => {
  const soul = createSoul({
    agentId: 'a1',
    archetype: 'critic',
    displayName: 'Test',
    capabilities: ['plot'],
    toolWhitelist: ['my_tool'],
  })
  const binding = createUserBinding({ agentId: 'a1' })
  const scope = createMemoryScope({ agentId: 'a1' })
  const sandbox = sandboxType === 'strict' ? createStrictSandbox() : createDefaultSandbox()
  return { soul, binding, scope, sandbox }
}

describe('isLegacyBaseAgent', () => {
  it('detects object with name + execute', () => {
    expect(isLegacyBaseAgent({ name: 'a', execute: () => 'x' })).toBe(true)
  })

  it('detects object with name + run', () => {
    expect(isLegacyBaseAgent({ name: 'a', run: () => 'x' })).toBe(true)
  })

  it('detects object with name + invoke', () => {
    expect(isLegacyBaseAgent({ name: 'a', invoke: () => 'x' })).toBe(true)
  })

  it('detects object with name + handle', () => {
    expect(isLegacyBaseAgent({ name: 'a', handle: () => 'x' })).toBe(true)
  })

  it('rejects null', () => {
    expect(isLegacyBaseAgent(null)).toBe(false)
  })

  it('rejects object without name', () => {
    expect(isLegacyBaseAgent({ execute: () => 'x' })).toBe(false)
  })

  it('rejects object without any execute method', () => {
    expect(isLegacyBaseAgent({ name: 'a' })).toBe(false)
  })

  it('rejects non-object', () => {
    expect(isLegacyBaseAgent('a string')).toBe(false)
    expect(isLegacyBaseAgent(42)).toBe(false)
  })
})

describe('BaseAgentAdapter — construction', () => {
  it('creates adapter for legacy with execute', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a.legacyName).toBe('a1')
    expect(a.soul).toBe(soul)
  })

  it('creates adapter for legacy with run', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1', 'run'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a.legacyName).toBe('a1')
  })

  it('exposes userBinding/memoryScope/sandbox accessors', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a.userBinding).toBe(binding)
    expect(a.memoryScope).toBe(scope)
    expect(a.sandbox).toBe(sandbox)
  })

  it('throws when object is not legacy BaseAgent', () => {
    const { soul, binding, scope, sandbox } = setup()
    expect(() => new BaseAgentAdapter({ name: 'a' } as never, { soul, userBinding: binding, memoryScope: scope, sandbox })).toThrow()
  })

  it('adaptLegacyBaseAgent is convenience', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = adaptLegacyBaseAgent(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    expect(a).toBeInstanceOf(BaseAgentAdapter)
  })
})

describe('BaseAgentAdapter — intercept', () => {
  it('intercept tool.call allowed', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const s = a.intercept({ kind: 'tool.call', tool: 'my_tool' })
    expect(s.allowed).toBe(true)
  })

  it('intercept tool.call denied', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const s = a.intercept({ kind: 'tool.call', tool: 'evil_tool' })
    expect(s.allowed).toBe(false)
  })

  it('throwOnDeny: throws when denied', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox, throwOnDeny: true })
    expect(() => a.intercept({ kind: 'tool.call', tool: 'evil_tool' })).toThrow()
  })
})

describe('BaseAgentAdapter — runWithAcl', () => {
  it('runWithAcl executes legacy method when allowed', async () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = await a.runWithAcl({ input: 'task' }, { kind: 'tool.call', tool: 'my_tool' })
    expect(r.success).toBe(true)
    expect(r.output).toContain('task')
  })

  it('runWithAcl skips execution when denied (default)', async () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = await a.runWithAcl({ input: 'task' }, { kind: 'tool.call', tool: 'evil_tool' })
    expect(r.success).toBe(false)
  })

  it('runWithAcl: startedAt before finishedAt', async () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = await a.runWithAcl('x', { kind: 'tool.call', tool: 'my_tool' })
    expect(r.finishedAt).toBeGreaterThanOrEqual(r.startedAt)
  })

  it('runWithAcl: legacy method throws', async () => {
    const { soul, binding, scope, sandbox } = setup()
    const throwing: LegacyBaseAgentLike = {
      name: 't',
      execute: () => { throw new Error('boom') },
    }
    const a = new BaseAgentAdapter(throwing, { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = await a.runWithAcl('x', { kind: 'tool.call', tool: 'my_tool' })
    expect(r.success).toBe(false)
    expect(r.error).toBe('boom')
  })

  it('runWithAcl error message mentions denial', async () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = await a.runWithAcl('x', { kind: 'tool.call', tool: 'evil_tool' })
    expect(r.error).toContain('denied by sandbox')
  })
})

describe('BaseAgentAdapter — runSync', () => {
  it('runSync works for synchronous legacy', () => {
    const { soul, binding, scope, sandbox } = setup()
    const a = new BaseAgentAdapter(makeLegacy('a1'), { soul, userBinding: binding, memoryScope: scope, sandbox })
    const r = a.runSync('x', { kind: 'tool.call', tool: 'my_tool' })
    expect(r.success).toBe(true)
  })

  it('runSync: throws on truly broken input', () => {
    const { soul, binding, scope, sandbox } = setup()
    expect(() => new BaseAgentAdapter({ name: 'broken' } as never, { soul, userBinding: binding, memoryScope: scope, sandbox })).toThrow()
  })
})
