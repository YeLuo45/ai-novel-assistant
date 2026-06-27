/**
 * ai/providers/ProviderAdvanced.test.ts (I11-I20) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  CircuitBreaker, LoadBalancer, FallbackProvider, TokenCounter,
  MessageFormatter, ConversationStore, UsageMetrics, BudgetAlert,
  ProviderConfig, ProviderRegistry,
} from './ProviderAdvanced'

describe('I11: CircuitBreaker', () => {
  it('starts closed', () => {
    const cb = new CircuitBreaker()
    expect(cb.state).toBe('closed')
    expect(cb.allowRequest()).toBe(true)
  })

  it('opens after threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.state).toBe('closed')
    cb.recordFailure()
    expect(cb.state).toBe('open')
    expect(cb.allowRequest()).toBe(false)
  })

  it('success resets count', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3 })
    cb.recordFailure()
    cb.recordFailure()
    cb.recordSuccess()
    expect(cb.failureCount).toBe(0)
  })

  it('reset', () => {
    const cb = new CircuitBreaker()
    cb.recordFailure()
    cb.reset()
    expect(cb.failureCount).toBe(0)
  })
})

describe('I12: LoadBalancer', () => {
  it('round-robin', () => {
    const lb = new LoadBalancer('round-robin')
    lb.register('a')
    lb.register('b')
    expect(lb.select()).toBe('a')
    expect(lb.select()).toBe('b')
    expect(lb.select()).toBe('a')
  })

  it('least-busy', () => {
    const lb = new LoadBalancer('least-busy')
    lb.register('a')
    lb.register('b')
    lb.markInFlight('a')
    lb.markInFlight('a')
    expect(lb.select()).toBe('b')
  })

  it('in-flight tracking', () => {
    const lb = new LoadBalancer()
    lb.register('a')
    lb.markInFlight('a')
    lb.markInFlight('a')
    lb.markDone('a')
    expect(lb.providers()[0].inFlight).toBe(1)
  })

  it('select empty returns null', () => {
    expect(new LoadBalancer().select()).toBeNull()
  })
})

describe('I13: FallbackProvider', () => {
  it('primary', () => {
    const f = new FallbackProvider()
    f.setChain(['a', 'b', 'c'])
    expect(f.primary()).toBe('a')
  })

  it('nextAfter', () => {
    const f = new FallbackProvider()
    f.setChain(['a', 'b', 'c'])
    expect(f.nextAfter('a')).toBe('b')
    expect(f.nextAfter('c')).toBeNull()
  })

  it('successRate', () => {
    const f = new FallbackProvider()
    f.recordAttempt({ providerId: 'a', succeeded: true })
    f.recordAttempt({ providerId: 'b', succeeded: false, error: 'timeout' })
    expect(f.successRate()).toBe(0.5)
  })

  it('chain getter', () => {
    const f = new FallbackProvider()
    f.setChain(['x', 'y'])
    expect(f.chain).toEqual(['x', 'y'])
  })
})

describe('I14: TokenCounter', () => {
  const tc = new TokenCounter()

  it('estimate basic', () => {
    expect(tc.estimate('hello world')).toBe(3)  // 11 chars / 4 = 2.75 → 3
  })

  it('countExact handles Chinese', () => {
    const n = tc.countExact('你好世界')
    expect(n).toBeGreaterThan(0)
  })

  it('countExact handles English', () => {
    expect(tc.countExact('hello world')).toBeGreaterThan(0)
  })

  it('estimateMessages', () => {
    const total = tc.estimateMessages([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ])
    expect(total).toBeGreaterThan(0)
  })
})

describe('I15: MessageFormatter', () => {
  it('toOpenAI', () => {
    const f = new MessageFormatter()
    const out = f.toOpenAI([
      { role: 'user', content: 'hi' },
    ])
    expect(out[0].role).toBe('user')
  })

  it('toAnthropic separates system', () => {
    const f = new MessageFormatter()
    const out = f.toAnthropic([
      { role: 'system', content: 'be helpful' },
      { role: 'user', content: 'hi' },
    ])
    expect(out.system).toBe('be helpful')
    expect(out.messages.length).toBe(1)
  })

  it('merge same role', () => {
    const f = new MessageFormatter()
    const merged = f.merge([
      { role: 'user', content: 'a' },
      { role: 'user', content: 'b' },
    ])
    expect(merged.length).toBe(1)
    expect(merged[0].content).toContain('a')
    expect(merged[0].content).toContain('b')
  })

  it('no merge different roles', () => {
    const f = new MessageFormatter()
    const merged = f.merge([
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
    ])
    expect(merged.length).toBe(2)
  })
})

describe('I16: ConversationStore', () => {
  it('add + get', () => {
    const s = new ConversationStore()
    s.add('c1', 'user', 'hi')
    s.add('c1', 'assistant', 'hello')
    expect(s.get('c1').length).toBe(2)
  })

  it('clear', () => {
    const s = new ConversationStore()
    s.add('c1', 'user', 'x')
    expect(s.clear('c1')).toBe(true)
    expect(s.get('c1').length).toBe(0)
  })

  it('list', () => {
    const s = new ConversationStore()
    s.add('c1', 'user', 'x')
    s.add('c2', 'user', 'y')
    expect(s.list()).toEqual(['c1', 'c2'])
  })

  it('messageCount', () => {
    const s = new ConversationStore()
    s.add('c1', 'user', 'a')
    s.add('c1', 'user', 'b')
    expect(s.messageCount('c1')).toBe(2)
  })
})

describe('I17: UsageMetrics', () => {
  it('byAgent', () => {
    const u = new UsageMetrics()
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: true })
    u.record({ agentId: 'a2', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: true })
    expect(u.byAgent('a1').length).toBe(1)
  })

  it('totalCostByAgent', () => {
    const u = new UsageMetrics()
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.05, latencyMs: 100, success: true })
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.10, latencyMs: 100, success: true })
    expect(u.totalCostByAgent('a1')).toBeCloseTo(0.15)
  })

  it('successRateByAgent', () => {
    const u = new UsageMetrics()
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: true })
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: false })
    expect(u.successRateByAgent('a1')).toBe(0.5)
  })

  it('averageLatencyByAgent', () => {
    const u = new UsageMetrics()
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: true })
    u.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 200, success: true })
    expect(u.averageLatencyByAgent('a1')).toBe(150)
  })
})

describe('I18: BudgetAlert', () => {
  it('warning triggers at 70%', () => {
    const a = new BudgetAlert({ warningThreshold: 0.7, criticalThreshold: 0.95 })
    expect(a.evaluate(0.7)).toBe('warning')
  })

  it('critical triggers at 95%', () => {
    const a = new BudgetAlert({ warningThreshold: 0.7, criticalThreshold: 0.95 })
    expect(a.evaluate(0.95)).toBe('critical')
  })

  it('no alert below threshold', () => {
    const a = new BudgetAlert()
    expect(a.evaluate(0.5)).toBeNull()
  })

  it('cooldown blocks repeat', () => {
    const a = new BudgetAlert({ warningThreshold: 0.7, cooldownMs: 60_000 })
    expect(a.evaluate(0.7)).toBe('warning')
    expect(a.evaluate(0.7)).toBeNull()  // cooldown
  })

  it('clear resets', () => {
    const a = new BudgetAlert()
    a.evaluate(0.95)
    a.clear()
    expect(a.alerts().length).toBe(0)
  })
})

describe('I19: ProviderConfig', () => {
  it('set + get', () => {
    const c = new ProviderConfig()
    c.set({ providerId: 'p1', apiKey: 'sk-xxx', timeout: 30_000 })
    expect(c.get('p1')?.apiKey).toBe('sk-xxx')
  })

  it('isEnabled defaults to true after set', () => {
    const c = new ProviderConfig()
    c.set({ providerId: 'p1' })
    expect(c.isEnabled('p1')).toBe(true)
  })

  it('isEnabled false if explicit', () => {
    const c = new ProviderConfig()
    c.set({ providerId: 'p1', enabled: false })
    expect(c.isEnabled('p1')).toBe(false)
  })

  it('merge overrides', () => {
    const c = new ProviderConfig()
    c.set({ providerId: 'p1', timeout: 30_000 })
    c.merge({ p1: { timeout: 60_000 } })
    expect(c.get('p1')?.timeout).toBe(60_000)
  })

  it('remove', () => {
    const c = new ProviderConfig()
    c.set({ providerId: 'p1' })
    expect(c.remove('p1')).toBe(true)
    expect(c.get('p1')).toBeUndefined()
  })
})

describe('I20: ProviderRegistry', () => {
  it('register + get', () => {
    const r = new ProviderRegistry()
    r.register({ providerId: 'openai', type: 'openai', models: ['gpt-4'], defaultModel: 'gpt-4' })
    expect(r.get('openai')?.type).toBe('openai')
  })

  it('byType', () => {
    const r = new ProviderRegistry()
    r.register({ providerId: 'openai', type: 'openai', models: ['gpt-4'], defaultModel: 'gpt-4' })
    r.register({ providerId: 'mock', type: 'mock', models: ['mock-1'], defaultModel: 'mock-1' })
    expect(r.byType('mock').length).toBe(1)
  })

  it('hasModel', () => {
    const r = new ProviderRegistry()
    r.register({ providerId: 'openai', type: 'openai', models: ['gpt-4', 'gpt-3.5'], defaultModel: 'gpt-4' })
    expect(r.hasModel('openai', 'gpt-4')).toBe(true)
    expect(r.hasModel('openai', 'gpt-5')).toBe(false)
  })

  it('unregister', () => {
    const r = new ProviderRegistry()
    r.register({ providerId: 'p1', type: 'mock', models: [], defaultModel: '' })
    expect(r.unregister('p1')).toBe(true)
  })
})