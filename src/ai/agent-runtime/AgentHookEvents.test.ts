/**
 * AgentHookEvents.test.ts (V2346) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  ALL_AGENT_HOOK_EVENTS,
  makePayload,
  isAgentEvent,
  isSandboxEvent,
  isRuntimeEvent,
  isMemoryEvent,
  type AgentHookEvent,
} from './AgentHookEvents'

describe('AgentHookEvents — constants', () => {
  it('ALL_AGENT_HOOK_EVENTS has 17 entries', () => {
    expect(ALL_AGENT_HOOK_EVENTS.length).toBe(17)
  })

  it('all events are unique', () => {
    const set = new Set(ALL_AGENT_HOOK_EVENTS)
    expect(set.size).toBe(17)
  })

  it('events have expected prefix patterns', () => {
    expect(ALL_AGENT_HOOK_EVENTS.filter(e => e.startsWith('agent.')).length).toBe(13)
    expect(ALL_AGENT_HOOK_EVENTS.filter(e => e.startsWith('sandbox.')).length).toBe(2)
    expect(ALL_AGENT_HOOK_EVENTS.filter(e => e.startsWith('runtime.')).length).toBe(2)
  })
})

describe('AgentHookEvents — makePayload', () => {
  it('attaches agentId and timestamp', () => {
    const p = makePayload('agent.spawn.before', 'a1')
    expect(p.agentId).toBe('a1')
    expect(p.timestamp).toBeGreaterThan(0)
  })

  it('preserves extra fields', () => {
    const p = makePayload('agent.execute.after', 'a1', {
      output: 'hello',
      durationMs: 100,
    } as never)
    expect((p as { output: string }).output).toBe('hello')
    expect((p as { durationMs: number }).durationMs).toBe(100)
  })

  it('works for runtime events without agentId', () => {
    const p = makePayload('runtime.tick.after', 'sys', {
      totalAgents: 5,
      transitioned: 1,
    } as never)
    expect((p as { totalAgents: number }).totalAgents).toBe(5)
  })
})

describe('AgentHookEvents — classifiers', () => {
  it('isAgentEvent matches agent.*', () => {
    expect(isAgentEvent('agent.spawn.before' as AgentHookEvent)).toBe(true)
    expect(isAgentEvent('agent.execute.error' as AgentHookEvent)).toBe(true)
    expect(isAgentEvent('sandbox.allowed' as AgentHookEvent)).toBe(false)
  })

  it('isSandboxEvent matches sandbox.*', () => {
    expect(isSandboxEvent('sandbox.allowed' as AgentHookEvent)).toBe(true)
    expect(isSandboxEvent('sandbox.denied' as AgentHookEvent)).toBe(true)
    expect(isSandboxEvent('agent.execute.before' as AgentHookEvent)).toBe(false)
  })

  it('isRuntimeEvent matches runtime.*', () => {
    expect(isRuntimeEvent('runtime.tick.before' as AgentHookEvent)).toBe(true)
    expect(isRuntimeEvent('runtime.tick.after' as AgentHookEvent)).toBe(true)
    expect(isRuntimeEvent('agent.spawn.before' as AgentHookEvent)).toBe(false)
  })

  it('isMemoryEvent matches agent.memory.*', () => {
    expect(isMemoryEvent('agent.memory.read' as AgentHookEvent)).toBe(true)
    expect(isMemoryEvent('agent.memory.write' as AgentHookEvent)).toBe(true)
    expect(isMemoryEvent('agent.execute.before' as AgentHookEvent)).toBe(false)
  })
})

describe('AgentHookEvents — exhaustiveness', () => {
  it('every event has a payload type mapping', () => {
    for (const e of ALL_AGENT_HOOK_EVENTS) {
      const p = makePayload(e, 'a1')
      expect(p).toBeDefined()
      expect((p as { agentId?: string }).agentId).toBe('a1')
    }
  })
})
