/**
 * ai/providers/__tests__/provider-integration.test.ts (I27)
 */

import { describe, it, expect } from 'vitest'
import {
  ProviderPool, ModelSelector, TokenBudget, CostTracker, RateLimiter,
  ResponseCache, RetryPolicy,
} from '../ProviderPool'
import {
  ProviderConfig, ProviderRegistry, CircuitBreaker, LoadBalancer,
  FallbackProvider, TokenCounter, MessageFormatter, ConversationStore,
  UsageMetrics, BudgetAlert,
} from '../ProviderAdvanced'
import { MockProvider, HealthCheckProvider, ProviderAdapterRegistry, ErrorMapper } from '../ProviderBridge'

describe('Provider integration — end-to-end', () => {
  it('pool + selector + budget + cost + limiter + cache', () => {
    const pool = new ProviderPool()
    pool.register({ providerId: 'p1', name: 'P1', healthy: true, models: [] })
    expect(pool.list().length).toBe(1)

    const budget = new TokenBudget(1000)
    expect(budget.reserve(500).ok).toBe(true)
    expect(budget.remaining()).toBe(500)

    const cost = new CostTracker()
    cost.record({ providerId: 'p1', modelId: 'm1', promptTokens: 100, completionTokens: 50, costUSD: 0.01 })
    expect(cost.totalCost()).toBeCloseTo(0.01)

    const limiter = new RateLimiter({ maxPerMinute: 5 })
    expect(limiter.canCall('u1').allowed).toBe(true)

    const cache = new ResponseCache()
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
  })

  it('retry policy + circuit breaker + load balancer', () => {
    const retry = new RetryPolicy()
    expect(retry.shouldRetry(0, 'rate-limit')).toBe(true)
    expect(retry.shouldRetry(0, 'auth')).toBe(false)

    const cb = new CircuitBreaker({ failureThreshold: 2 })
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.state).toBe('open')

    const lb = new LoadBalancer('round-robin')
    lb.register('a')
    lb.register('b')
    expect(lb.select()).toBe('a')
    expect(lb.select()).toBe('b')
  })

  it('fallback + token counter + formatter + conversation', () => {
    const fb = new FallbackProvider()
    fb.setChain(['a', 'b'])
    expect(fb.nextAfter('a')).toBe('b')

    const tc = new TokenCounter()
    expect(tc.countExact('hello')).toBeGreaterThan(0)

    const f = new MessageFormatter()
    const out = f.toOpenAI([{ role: 'user', content: 'hi' }])
    expect(out[0].role).toBe('user')

    const s = new ConversationStore()
    s.add('c1', 'user', 'x')
    expect(s.messageCount('c1')).toBe(1)
  })

  it('usage metrics + budget alert + config + registry', () => {
    const u = new UsageMetrics()
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: true })
    expect(u.totalCostByAgent('a1')).toBeCloseTo(0.01)

    const a = new BudgetAlert()
    expect(a.evaluate(0.95)).toBe('critical')

    const c = new ProviderConfig()
    c.set({ providerId: 'p1' })
    expect(c.isEnabled('p1')).toBe(true)

    const r = new ProviderRegistry()
    r.register({ providerId: 'p1', type: 'mock', models: [], defaultModel: '' })
    expect(r.count()).toBe(1)
  })

  it('mock provider + health check + adapter + error mapper', async () => {
    const mock = new MockProvider({ providerId: 'm1', responses: ['hi'] })
    const r1 = await mock.call('q')
    expect(r1.content).toBe('hi')

    const hc = new HealthCheckProvider()
    const h = await hc.check('p1', async () => {})
    expect(h.status).toBe('healthy')

    const adapterReg = new ProviderAdapterRegistry()
    adapterReg.register({
      providerId: 'p1', call: async () => ({ content: 'a', promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs: 0, costUSD: 0 }),
    })
    expect(adapterReg.list().length).toBe(1)

    const em = new ErrorMapper()
    expect(em.fromHttpStatus(429)).toBe('rate-limit')
    expect(em.isRetryable('rate-limit')).toBe(true)
  })

  it('response parser handles OpenAI format', () => {
    // simple inline test
    function parseContent(choices: Array<{ message: { content?: string } }>): string {
      return choices[0]?.message.content ?? ''
    }
    expect(parseContent([{ message: { content: 'hello' } }])).toBe('hello')
  })

  it('full pipeline: select → budget → call → record', async () => {
    const selector = new ModelSelector()
    selector.register({ modelId: 'm1', providerId: 'p1', costPer1kTokens: 0.01, maxTokens: 4096, capability: 'fast', enabled: true })

    const budget = new TokenBudget(1000)
    expect(budget.reserve(100).ok).toBe(true)

    const mock = new MockProvider({ providerId: 'p1', responses: ['response'] })
    const r = await mock.call('prompt')
    expect(r.content).toBe('response')

    const usage = new UsageMetrics()
    usage.record({ agentId: 'a1', promptTokens: r.promptTokens, completionTokens: r.completionTokens, costUSD: 0.01, latencyMs: r.latencyMs, success: true })
    expect(usage.totalTokensByAgent('a1')).toBeGreaterThan(0)
  })
})