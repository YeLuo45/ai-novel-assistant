/**
 * protocol/RouterAndSerializer.test.ts (V2358-V2360) — 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  MessageRouter,
  ROUTING_POLICIES,
  serializeMessage,
  deserializeMessage,
  type RoutingContext,
} from './RouterAndSerializer'
import { createEnvelope, type MessageEnvelope } from './types'

const makeCtx = (candidates: string[], loads?: Map<string, number>): RoutingContext => ({
  candidates,
  loadMap: loads ?? new Map(candidates.map(c => [c, 0])),
  rrIndex: 0,
})

describe('MessageRouter — direct', () => {
  it('delivers to env.to if in candidates', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const d = r.route(env, 'direct', makeCtx(['a', 'b', 'c']))
    expect(d.targets).toEqual(['b'])
  })

  it('falls back to first candidate if env.to not found', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'x', payload: {} })
    const d = r.route(env, 'direct', makeCtx(['a', 'b', 'c']))
    expect(d.targets).toEqual(['a'])
  })
})

describe('MessageRouter — broadcast', () => {
  it('force broadcast to all candidates', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const d = r.route(env, 'broadcast', makeCtx(['a', 'b', 'c']))
    expect(d.targets.sort()).toEqual(['a', 'b', 'c'])
  })

  it('env.to=* triggers broadcast regardless of policy', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: '*', payload: {} })
    const d = r.route(env, 'direct', makeCtx(['a', 'b']))
    expect(d.targets.sort()).toEqual(['a', 'b'])
  })
})

describe('MessageRouter — round-robin', () => {
  it('rotates through candidates', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
    const d1 = r.route(env, 'round-robin', makeCtx(['a', 'b', 'c']))
    const d2 = r.route(env, 'round-robin', makeCtx(['a', 'b', 'c']))
    const d3 = r.route(env, 'round-robin', makeCtx(['a', 'b', 'c']))
    const d4 = r.route(env, 'round-robin', makeCtx(['a', 'b', 'c']))
    expect(d1.targets).toEqual(['a'])
    expect(d2.targets).toEqual(['b'])
    expect(d3.targets).toEqual(['c'])
    expect(d4.targets).toEqual(['a']) // wraps around
  })

  it('resetRoundRobin resets index', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
    r.route(env, 'round-robin', makeCtx(['a', 'b']))
    r.route(env, 'round-robin', makeCtx(['a', 'b']))
    r.resetRoundRobin()
    const d = r.route(env, 'round-robin', makeCtx(['a', 'b']))
    expect(d.targets).toEqual(['a'])
  })
})

describe('MessageRouter — least-busy', () => {
  it('picks candidate with smallest mailbox', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
    const loads = new Map([['a', 5], ['b', 2], ['c', 8]])
    const d = r.route(env, 'least-busy', makeCtx(['a', 'b', 'c'], loads))
    expect(d.targets).toEqual(['b'])
  })

  it('handles empty loadMap', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
    const d = r.route(env, 'least-busy', makeCtx(['a', 'b']))
    expect(d.targets).toEqual(['a']) // falls back to first
  })
})

describe('MessageRouter — random', () => {
  it('picks from candidates', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'x', to: '?', payload: {} })
    const d = r.route(env, 'random', makeCtx(['a', 'b', 'c']))
    expect(['a', 'b', 'c']).toContain(d.targets[0])
  })
})

describe('MessageRouter — empty candidates', () => {
  it('returns empty targets', () => {
    const r = new MessageRouter()
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const d = r.route(env, 'direct', makeCtx([]))
    expect(d.targets).toEqual([])
  })
})

describe('MessageRouter — routeBatch', () => {
  it('processes multiple envelopes', () => {
    const r = new MessageRouter()
    const envs = [
      createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} }),
      createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'c', payload: {} }),
    ]
    const ds = r.routeBatch(envs, 'direct', makeCtx(['b', 'c']))
    expect(ds[0].targets).toEqual(['b'])
    expect(ds[1].targets).toEqual(['c'])
  })
})

describe('MessageRouter — ROUTING_POLICIES', () => {
  it('has 5 policies', () => {
    expect(ROUTING_POLICIES.length).toBe(5)
  })
})

describe('serializeMessage / deserializeMessage', () => {
  it('serialize → deserialize roundtrip', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: { topic: 't', data: 1 } })
    const json = serializeMessage(env)
    const back = deserializeMessage(json)
    expect(back.id).toBe(env.id)
    expect(back.kind).toBe(env.kind)
    expect(back.from).toBe(env.from)
    expect(back.to).toBe(env.to)
  })

  it('pretty print', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const json = serializeMessage(env, { pretty: true })
    expect(json).toContain('\n')
  })

  it('fieldWhitelist filters', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const json = serializeMessage(env, { fieldWhitelist: ['id', 'kind'] })
    const obj = JSON.parse(json)
    expect(obj.id).toBeDefined()
    expect(obj.kind).toBeDefined()
    expect(obj.from).toBeUndefined()
  })

  it('replacer customizes output', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const json = serializeMessage(env, {
      replacer: (k, v) => k === 'from' ? 'REDACTED' : v,
    })
    expect(json).toContain('REDACTED')
  })

  it('stripInternal removes _ fields', () => {
    const env = createEnvelope({ kind: 'NOTIFY', from: 'a', to: 'b', payload: {} })
    const obj = JSON.parse(serializeMessage(env, { stripInternal: true }))
    for (const k of Object.keys(obj)) {
      expect(k.startsWith('_')).toBe(false)
    }
  })

  it('deserializeMessage throws on invalid', () => {
    expect(() => deserializeMessage('not json')).toThrow()
  })

  it('deserializeMessage handles missing fields', () => {
    const back = deserializeMessage('{}')
    expect(back.id).toBe('')
    expect(back.from).toBe('')
  })
})
