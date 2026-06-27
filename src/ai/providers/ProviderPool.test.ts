/**
 * ai/providers/ProviderPool.test.ts (I1-I10) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  CostTracker, RateLimiter, TokenBudget,
  PromptTemplateRegistry, SystemMessageBuilder, StreamHandler,
  ResponseCache, ModelSelector, RetryPolicy, ProviderPool,
  DEFAULT_RETRY_CONFIG,
} from './ProviderPool'

describe('I1: ProviderPool', () => {
  it('register + get', () => {
    const p = new ProviderPool()
    p.register({ providerId: 'p1', name: 'OpenAI', models: [], healthy: true })
    expect(p.get('p1')?.name).toBe('OpenAI')
  })

  it('list + healthy', () => {
    const p = new ProviderPool()
    p.register({ providerId: 'p1', name: 'A', models: [], healthy: true })
    p.register({ providerId: 'p2', name: 'B', models: [], healthy: false })
    expect(p.list().length).toBe(2)
    expect(p.healthy().length).toBe(1)
  })

  it('markHealthy', () => {
    const p = new ProviderPool()
    p.register({ providerId: 'p1', name: 'A', models: [], healthy: true })
    expect(p.markHealthy('p1', false)).toBe(true)
    expect(p.get('p1')?.healthy).toBe(false)
  })

  it('mark unknown returns false', () => {
    expect(new ProviderPool().markHealthy('x', true)).toBe(false)
  })
})

describe('I2: ModelSelector', () => {
  it('selectByCapability', () => {
    const s = new ModelSelector()
    s.register({ modelId: 'm1', providerId: 'p1', costPer1kTokens: 0.01, maxTokens: 4096, capability: 'fast', enabled: true })
    s.register({ modelId: 'm2', providerId: 'p1', costPer1kTokens: 0.1, maxTokens: 32000, capability: 'powerful', enabled: true })
    expect(s.selectByCapability('fast')?.modelId).toBe('m1')
  })

  it('selectCheapest', () => {
    const s = new ModelSelector()
    s.register({ modelId: 'cheap', providerId: 'p1', costPer1kTokens: 0.001, maxTokens: 4096, capability: 'fast', enabled: true })
    s.register({ modelId: 'expensive', providerId: 'p1', costPer1kTokens: 1.0, maxTokens: 32000, capability: 'powerful', enabled: true })
    expect(s.selectCheapest()?.modelId).toBe('cheap')
  })

  it('selectByMaxTokens returns cheapest fit', () => {
    const s = new ModelSelector()
    s.register({ modelId: 'small', providerId: 'p1', costPer1kTokens: 0.001, maxTokens: 1000, capability: 'fast', enabled: true })
    s.register({ modelId: 'large', providerId: 'p1', costPer1kTokens: 0.01, maxTokens: 100000, capability: 'powerful', enabled: true })
    expect(s.selectByMaxTokens(50000)?.modelId).toBe('large')
  })

  it('disabled model is filtered', () => {
    const s = new ModelSelector()
    s.register({ modelId: 'm1', providerId: 'p1', costPer1kTokens: 0.01, maxTokens: 4096, capability: 'fast', enabled: false })
    expect(s.selectByCapability('fast')).toBeNull()
  })
})

describe('I3: TokenBudget', () => {
  it('reserve within budget', () => {
    const b = new TokenBudget(1000)
    expect(b.reserve(500).ok).toBe(true)
    expect(b.remaining()).toBe(500)
  })

  it('reserve over budget returns false', () => {
    const b = new TokenBudget(100)
    b.reserve(80)
    expect(b.reserve(30).ok).toBe(false)
  })

  it('release', () => {
    const b = new TokenBudget(1000)
    b.reserve(500)
    b.release(200)
    expect(b.used()).toBe(300)
  })

  it('release cannot go below 0', () => {
    const b = new TokenBudget(1000)
    b.reserve(100)
    b.release(500)
    expect(b.used()).toBe(0)
  })

  it('reset', () => {
    const b = new TokenBudget(1000)
    b.reserve(500)
    b.reset()
    expect(b.used()).toBe(0)
  })
})

describe('I4: CostTracker', () => {
  it('record + totalCost', () => {
    const c = new CostTracker()
    c.record({ providerId: 'p1', modelId: 'm1', promptTokens: 100, completionTokens: 50, costUSD: 0.01 })
    c.record({ providerId: 'p1', modelId: 'm1', promptTokens: 200, completionTokens: 100, costUSD: 0.02 })
    expect(c.totalCost()).toBeCloseTo(0.03)
    expect(c.totalTokens()).toBe(450)
  })

  it('byProvider + byModel', () => {
    const c = new CostTracker()
    c.record({ providerId: 'p1', modelId: 'm1', promptTokens: 100, completionTokens: 50, costUSD: 0.01 })
    c.record({ providerId: 'p2', modelId: 'm2', promptTokens: 100, completionTokens: 50, costUSD: 0.05 })
    expect(c.byProvider().get('p1')).toBe(0.01)
    expect(c.byModel().get('m2')).toBe(0.05)
  })

  it('reset', () => {
    const c = new CostTracker()
    c.record({ providerId: 'p1', modelId: 'm1', promptTokens: 100, completionTokens: 50, costUSD: 0.01 })
    c.reset()
    expect(c.totalCost()).toBe(0)
  })
})

describe('I5: RateLimiter', () => {
  it('allows within limit', () => {
    const r = new RateLimiter({ maxPerMinute: 5 })
    expect(r.canCall('user-1').allowed).toBe(true)
  })

  it('blocks when exceeding', () => {
    const r = new RateLimiter({ maxPerMinute: 2 })
    r.record('user-1')
    r.record('user-1')
    expect(r.canCall('user-1').allowed).toBe(false)
  })

  it('usage tracks per-key', () => {
    const r = new RateLimiter({ maxPerMinute: 10 })
    r.record('u1')
    r.record('u1')
    r.record('u2')
    expect(r.getUsage('u1').perMinute).toBe(2)
    expect(r.getUsage('u2').perMinute).toBe(1)
  })

  it('reset per key', () => {
    const r = new RateLimiter({ maxPerMinute: 5 })
    r.record('u1')
    r.reset('u1')
    expect(r.getUsage('u1').perMinute).toBe(0)
  })
})

describe('I6: StreamHandler', () => {
  it('feed accumulates', () => {
    const s = new StreamHandler()
    s.feed('hello ', 0)
    s.feed('world', 1, true)
    expect(s.fullText()).toBe('hello world')
  })

  it('chunks ordered', () => {
    const s = new StreamHandler()
    s.feed('a', 0)
    s.feed('b', 1)
    expect(s.chunks()[0].index).toBe(0)
  })

  it('reset', () => {
    const s = new StreamHandler()
    s.feed('abc', 0)
    s.reset()
    expect(s.fullText()).toBe('')
  })
})

describe('I7: ResponseCache', () => {
  it('get + set', () => {
    const c = new ResponseCache()
    c.set('k1', { data: 'hello' })
    expect(c.get<{ data: string }>('k1')?.data).toBe('hello')
  })

  it('miss returns null', () => {
    const c = new ResponseCache()
    expect(c.get('missing')).toBeNull()
  })

  it('TTL expires', () => {
    const c = new ResponseCache()
    c.set('k1', 'v', 1)  // 1ms TTL
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(c.get('k1')).toBeNull()
        resolve()
      }, 10)
    })
  })

  it('hitRate', () => {
    const c = new ResponseCache()
    c.set('k1', 'v')
    c.get('k1')  // hit
    c.get('missing')  // miss
    expect(c.hitRate()).toBe(0.5)
  })

  it('delete + clear', () => {
    const c = new ResponseCache()
    c.set('k1', 'v')
    expect(c.delete('k1')).toBe(true)
    expect(c.delete('missing')).toBe(false)
  })

  it('size + has', () => {
    const c = new ResponseCache()
    c.set('k1', 'v')
    expect(c.size()).toBe(1)
    expect(c.has('k1')).toBe(true)
    expect(c.has('missing')).toBe(false)
  })
})

describe('I8: PromptTemplateRegistry', () => {
  it('register + render', () => {
    const r = new PromptTemplateRegistry()
    r.register({ templateId: 't1', name: 'Greet', content: 'Hello, {{name}}!', variables: ['name'] })
    expect(r.render('t1', { name: 'World' })).toBe('Hello, World!')
  })

  it('render missing returns null', () => {
    expect(new PromptTemplateRegistry().render('x', {})).toBeNull()
  })

  it('count + remove', () => {
    const r = new PromptTemplateRegistry()
    r.register({ templateId: 't1', name: 'A', content: 'x', variables: [] })
    expect(r.count()).toBe(1)
    expect(r.remove('t1')).toBe(true)
  })
})

describe('I9: SystemMessageBuilder', () => {
  const ctx = {
    agentName: 'a1',
    archetype: 'critic',
    personaDisplayName: 'Critic',
    principles: ['p1', 'p2'],
    tone: { formality: 0.5, warmth: 0.5, intensity: 0.5, humor: 0.5, directness: 0.5 },
    capabilities: ['plot', 'style'],
  }

  it('build standard message', () => {
    const b = new SystemMessageBuilder()
    const msg = b.build(ctx)
    expect(msg).toContain('Critic')
    expect(msg).toContain('critic')
    expect(msg).toContain('plot')
  })

  it('buildMinimal', () => {
    const b = new SystemMessageBuilder()
    const msg = b.buildMinimal(ctx)
    expect(msg).toContain('Critic')
  })
})

describe('I10: RetryPolicy', () => {
  it('default config', () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3)
  })

  it('delayFor exponential', () => {
    const r = new RetryPolicy({ initialDelayMs: 100, backoffMultiplier: 2 })
    expect(r.delayFor(0)).toBe(100)
    expect(r.delayFor(1)).toBe(200)
    expect(r.delayFor(2)).toBe(400)
  })

  it('delayFor caps at maxDelayMs', () => {
    const r = new RetryPolicy({ initialDelayMs: 100, backoffMultiplier: 10, maxDelayMs: 1000 })
    expect(r.delayFor(5)).toBe(1000)
  })

  it('shouldRetry allows retryable errors', () => {
    const r = new RetryPolicy()
    expect(r.shouldRetry(0, 'rate-limit')).toBe(true)
  })

  it('shouldRetry blocks non-retryable', () => {
    const r = new RetryPolicy()
    expect(r.shouldRetry(0, 'invalid-input')).toBe(false)
  })

  it('shouldRetry blocks after maxRetries', () => {
    const r = new RetryPolicy({ maxRetries: 3 })
    expect(r.shouldRetry(3, 'rate-limit')).toBe(false)
  })
})