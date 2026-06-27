/**
 * ai/providers/ProviderBridge.test.ts (I21-I25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  MockProvider, HealthCheckProvider,
  ProviderAdapterRegistry, ResponseParser, ErrorMapper,
  type LLMRequest, type LLMResponse,
} from './ProviderBridge'

describe('I21: MockProvider', () => {
  it('call returns mock response', async () => {
    const m = new MockProvider({ providerId: 'mock-1', responses: ['hello', 'world'] })
    const r1 = await m.call('hi')
    expect(r1.content).toBe('hello')
    const r2 = await m.call('hi')
    expect(r2.content).toBe('world')
  })

  it('callCount increments', async () => {
    const m = new MockProvider({ providerId: 'mock' })
    await m.call('x')
    await m.call('y')
    expect(m.callCount).toBe(2)
  })

  it('reset', async () => {
    const m = new MockProvider({ providerId: 'mock' })
    await m.call('x')
    m.reset()
    expect(m.callCount).toBe(0)
  })

  it('failRate causes occasional throws', async () => {
    const m = new MockProvider({ providerId: 'mock', failRate: 1.0 })
    await expect(m.call('x')).rejects.toThrow()
  })
})

describe('I22: HealthCheckProvider', () => {
  it('check healthy', async () => {
    const h = new HealthCheckProvider()
    const r = await h.check('p1', async () => {})
    expect(r.status).toBe('healthy')
  })

  it('check unhealthy after 3 failures', async () => {
    const h = new HealthCheckProvider()
    await h.check('p1', async () => { throw new Error('fail') })
    await h.check('p1', async () => { throw new Error('fail') })
    const r = await h.check('p1', async () => { throw new Error('fail') })
    expect(r.status).toBe('unhealthy')
    expect(r.consecutiveFailures).toBe(3)
  })

  it('success resets consecutive failures', async () => {
    const h = new HealthCheckProvider()
    await h.check('p1', async () => { throw new Error('fail') })
    await h.check('p1', async () => { throw new Error('fail') })
    const r = await h.check('p1', async () => {})
    expect(r.consecutiveFailures).toBe(0)
  })

  it('healthRate', async () => {
    const h = new HealthCheckProvider()
    await h.check('p1', async () => {})
    await h.check('p2', async () => { throw new Error('x') })
    expect(h.healthRate()).toBe(0.5)
  })
})

describe('I23: ProviderAdapterRegistry', () => {
  it('register + get', () => {
    const r = new ProviderAdapterRegistry()
    r.register({ providerId: 'p1', call: async () => ({ content: '', promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs: 0, costUSD: 0 }) })
    expect(r.get('p1')).toBeDefined()
  })

  it('callAny falls back to next on failure', async () => {
    const r = new ProviderAdapterRegistry()
    r.register({ providerId: 'p1', call: async () => { throw new Error('fail') } })
    r.register({ providerId: 'p2', call: async () => ({ content: 'hello', promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs: 0, costUSD: 0 }) })
    const result = await r.callAny(['p1', 'p2'], { model: 'm1', messages: [] })
    expect(result?.providerId).toBe('p2')
    expect(result?.response.content).toBe('hello')
  })

  it('callAny returns null when all fail', async () => {
    const r = new ProviderAdapterRegistry()
    r.register({ providerId: 'p1', call: async () => { throw new Error('fail') } })
    const result = await r.callAny(['p1'], { model: 'm', messages: [] })
    expect(result).toBeNull()
  })

  it('list returns all', () => {
    const r = new ProviderAdapterRegistry()
    r.register({ providerId: 'a', call: async () => ({} as LLMResponse) })
    r.register({ providerId: 'b', call: async () => ({} as LLMResponse) })
    expect(r.list().length).toBe(2)
  })
})

describe('I24: ResponseParser', () => {
  it('parseOpenAI extracts content', () => {
    const p = new ResponseParser()
    const r = p.parseOpenAI({
      choices: [{
        message: { content: 'hello' },
        finish_reason: 'stop',
      }],
    })
    expect(r.content).toBe('hello')
    expect(r.finishReason).toBe('stop')
  })

  it('parseOpenAI extracts tool calls', () => {
    const p = new ResponseParser()
    const r = p.parseOpenAI({
      choices: [{
        message: {
          content: '',
          tool_calls: [{
            function: { name: 'search', arguments: '{"q":"test"}' },
          }],
        },
        finish_reason: 'tool',
      }],
    })
    expect(r.toolCalls.length).toBe(1)
    expect(r.toolCalls[0].name).toBe('search')
    expect(r.toolCalls[0].arguments.q).toBe('test')
  })

  it('parseOpenAI handles invalid JSON args', () => {
    const p = new ResponseParser()
    const r = p.parseOpenAI({
      choices: [{
        message: {
          content: '',
          tool_calls: [{ function: { name: 'fn', arguments: 'invalid json' } }],
        },
      }],
    })
    expect(r.toolCalls[0].arguments).toEqual({})
  })

  it('parseOpenAI empty choices returns error', () => {
    const p = new ResponseParser()
    expect(p.parseOpenAI({ choices: [] }).finishReason).toBe('error')
  })

  it('extractJson finds embedded JSON', () => {
    const p = new ResponseParser()
    const result = p.extractJson('prefix {"foo": "bar"} suffix')
    expect(result?.foo).toBe('bar')
  })

  it('extractJson returns null when no JSON', () => {
    expect(new ResponseParser().extractJson('no json here')).toBeNull()
  })

  it('extractCodeBlocks parses code blocks', () => {
    const p = new ResponseParser()
    const blocks = p.extractCodeBlocks('```typescript\nconst x = 1\n```')
    expect(blocks.length).toBe(1)
    expect(blocks[0].lang).toBe('typescript')
  })
})

describe('I25: ErrorMapper', () => {
  const em = new ErrorMapper()

  it('fromHttpStatus 429 → rate-limit', () => {
    expect(em.fromHttpStatus(429)).toBe('rate-limit')
  })

  it('fromHttpStatus 401 → auth', () => {
    expect(em.fromHttpStatus(401)).toBe('auth')
  })

  it('fromHttpStatus 500 → 5xx', () => {
    expect(em.fromHttpStatus(500)).toBe('5xx')
  })

  it('fromHttpStatus 400 → invalid-request', () => {
    expect(em.fromHttpStatus(400)).toBe('invalid-request')
  })

  it('fromHttpStatus 413 → context-too-long', () => {
    expect(em.fromHttpStatus(413)).toBe('context-too-long')
  })

  it('fromHttpStatus 200 → unknown', () => {
    expect(em.fromHttpStatus(200)).toBe('unknown')
  })

  it('fromMessage classifies by keyword', () => {
    expect(em.fromMessage('rate limit exceeded')).toBe('rate-limit')
    expect(em.fromMessage('connection timed out')).toBe('timeout')
    expect(em.fromMessage('unauthorized access')).toBe('auth')
  })

  it('isRetryable', () => {
    expect(em.isRetryable('rate-limit')).toBe(true)
    expect(em.isRetryable('auth')).toBe(false)
  })

  it('userFriendly Chinese', () => {
    const msg = em.userFriendly('rate-limit', 'openai')
    expect(msg).toContain('openai')
    expect(msg).toContain('速率')
  })
})