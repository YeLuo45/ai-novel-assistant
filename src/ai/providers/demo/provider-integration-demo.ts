/**
 * ai/providers/demo/provider-integration-demo.ts (I26)
 * 端到端 demo：完整 LLM provider pipeline
 */

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

export interface DemoResult {
  providersConfigured: number
  modelsAvailable: number
  tokensReserved: number
  costTracked: number
  cacheHitRate: number
  conversationsCount: number
  adapterCount: number
  healthChecked: number
}

export async function runProviderIntegrationDemo(): Promise<DemoResult> {
  // 1. Provider pool + models
  const pool = new ProviderPool()
  pool.register({
    providerId: 'openai', name: 'OpenAI', healthy: true,
    models: [
      { modelId: 'gpt-4', providerId: 'openai', costPer1kTokens: 0.03, maxTokens: 8192, capability: 'powerful', enabled: true },
      { modelId: 'gpt-3.5', providerId: 'openai', costPer1kTokens: 0.002, maxTokens: 4096, capability: 'fast', enabled: true },
    ],
  })
  pool.register({
    providerId: 'anthropic', name: 'Anthropic', healthy: true,
    models: [
      { modelId: 'claude-3-opus', providerId: 'anthropic', costPer1kTokens: 0.015, maxTokens: 200000, capability: 'powerful', enabled: true },
    ],
  })

  // 2. Model selector
  const selector = new ModelSelector()
  pool.list().forEach(p => p.models.forEach(m => selector.register(m)))

  // 3. Token budget + cost tracker
  const budget = new TokenBudget(100000)
  budget.reserve(5000)

  const cost = new CostTracker()
  cost.record({ providerId: 'openai', modelId: 'gpt-4', promptTokens: 1000, completionTokens: 500, costUSD: 0.045 })

  // 4. Rate limiter + cache
  const limiter = new RateLimiter({ maxPerMinute: 60 })
  limiter.record('user-1')

  const cache = new ResponseCache(100)
  cache.set('q1', { answer: 'cached' })
  cache.get('q1')

  // 5. Retry policy
  const retry = new RetryPolicy({ maxRetries: 3 })

  // 6. Circuit breaker + load balancer + fallback
  const cb = new CircuitBreaker({ failureThreshold: 3 })
  const lb = new LoadBalancer('round-robin')
  lb.register('openai')
  lb.register('anthropic')
  const fb = new FallbackProvider()
  fb.setChain(['openai', 'anthropic'])

  // 7. Token counter + formatter
  const tc = new TokenCounter()
  const formatter = new MessageFormatter()
  const tc1 = tc.countExact('hello world')
  const formatted = formatter.toOpenAI([{ role: 'user', content: 'hi' }])

  // 8. Conversation store + usage metrics
  const conv = new ConversationStore()
  conv.add('c1', 'user', 'hi')
  conv.add('c1', 'assistant', 'hello')

  const usage = new UsageMetrics()
  usage.record({ agentId: 'a1', promptTokens: 100, completionTokens: 50, costUSD: 0.01, latencyMs: 100, success: true })

  // 9. Budget alert
  const alert = new BudgetAlert()
  const criticalTriggered = alert.evaluate(0.95)

  // 10. Provider config + registry
  const config = new ProviderConfig()
  config.set({ providerId: 'openai', apiKey: 'sk-xxx', timeout: 30000 })

  const registry = new ProviderRegistry()
  registry.register({ providerId: 'openai', type: 'openai', models: ['gpt-4'], defaultModel: 'gpt-4' })

  // 11. Mock provider + health check + adapter + error mapper
  const mock = new MockProvider({ providerId: 'mock', responses: ['test response'] })
  await mock.call('hi')

  const healthChecker = new HealthCheckProvider()
  await healthChecker.check('openai', async () => {})
  await healthChecker.check('anthropic', async () => { throw new Error('down') })

  const adapterReg = new ProviderAdapterRegistry()
  adapterReg.register({ providerId: 'mock', call: async () => ({ content: 'hi', promptTokens: 5, completionTokens: 2, totalTokens: 7, latencyMs: 10, costUSD: 0 }) })

  const errorMapper = new ErrorMapper()
  const errType = errorMapper.fromHttpStatus(429)

  return {
    providersConfigured: pool.list().length,
    modelsAvailable: selector.list().length,
    tokensReserved: budget.used(),
    costTracked: cost.totalCost(),
    cacheHitRate: cache.hitRate(),
    conversationsCount: conv.list().length,
    adapterCount: adapterReg.list().length,
    healthChecked: healthChecker.all().length,
  }
}