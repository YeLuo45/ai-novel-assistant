# LLM Provider 集成 (V3) — Direction I

**Version**: 1.0.0
**Engines**: V2566-V2595 (30 engines, 6 batches)
**Tests**: 126 tests, 100% pass
**Coverage**: 95%+

## 目标

Agent 真正能"做事"的前提：把 LLM 调用从直接 callLLM 改造为**统一的 provider 路由层**，支持多 provider 切换、token 预算、成本追踪、限流、缓存、降级、监控。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| I1-I10 | `ProviderPool.ts` | ProviderPool + ModelSelector + TokenBudget + CostTracker + RateLimiter + StreamHandler + ResponseCache + PromptTemplate + SystemMessageBuilder + RetryPolicy |
| I11-I20 | `ProviderAdvanced.ts` | CircuitBreaker + LoadBalancer + FallbackProvider + TokenCounter + MessageFormatter + ConversationStore + UsageMetrics + BudgetAlert + ProviderConfig + ProviderRegistry |
| I21-I25 | `ProviderBridge.ts` | MockProvider + HealthCheckProvider + ProviderAdapter + ResponseParser + ErrorMapper |
| I26 | `demo/provider-integration-demo.ts` | 9 端到端断言 |
| I27 | `__tests__/provider-integration.test.ts` | 7 集成测试 |
| I28 | `PROVIDER_README.md` | 本文档 |
| I29 | 主 README.md 更新 | 验证命令 |
| I30 | 收口 commit + push | |

## 核心 API 示例

### 1. 多 Provider + 模型选择

```ts
import { ProviderPool, ModelSelector } from '@/ai/providers/ProviderPool'

const pool = new ProviderPool()
pool.register({ providerId: 'openai', name: 'OpenAI', healthy: true, models: [...] })
pool.register({ providerId: 'anthropic', name: 'Anthropic', healthy: true, models: [...] })

const selector = new ModelSelector()
pool.list().forEach(p => p.models.forEach(m => selector.register(m)))

const fast = selector.selectByCapability('fast')         // 最快最便宜的
const balanced = selector.selectByCapability('balanced') // 平衡
const powerful = selector.selectByCapability('powerful')  // 最强
```

### 2. Token 预算 + 成本追踪 + 限流

```ts
import { TokenBudget, CostTracker, RateLimiter } from '@/ai/providers/ProviderPool'

const budget = new TokenBudget(100_000)  // 100K tokens
budget.reserve(5000)  // 预留 5K

const cost = new CostTracker()
cost.record({ providerId: 'openai', modelId: 'gpt-4', promptTokens: 1000, completionTokens: 500, costUSD: 0.045 })
console.log(cost.totalCost())  // 0.045

const limiter = new RateLimiter({ maxPerMinute: 60, maxPerDay: 1000 })
if (limiter.canCall('user-1').allowed) {
  limiter.record('user-1')
}
```

### 3. 缓存 + 重试 + 熔断 + 降级

```ts
import { ResponseCache, RetryPolicy, CircuitBreaker, FallbackProvider } from '@/ai/providers'

const cache = new ResponseCache(1000)
const cached = cache.get('q1')
if (!cached) {
  // call LLM
  cache.set('q1', response, 300_000)  // 5min TTL
}

const retry = new RetryPolicy({ maxRetries: 3 })
if (retry.shouldRetry(attempt, errorType)) {
  await sleep(retry.delayFor(attempt))
}

const cb = new CircuitBreaker({ failureThreshold: 5 })
if (cb.allowRequest()) {
  try { await callLLM() } catch { cb.recordFailure() }
}

const fb = new FallbackProvider()
fb.setChain(['openai', 'anthropic'])
const primary = fb.primary()
```

### 4. Mock Provider + 健康检查 + 适配器

```ts
import { MockProvider, HealthCheckProvider, ProviderAdapterRegistry } from '@/ai/providers/ProviderBridge'

const mock = new MockProvider({ providerId: 'mock', responses: ['hello'] })
const r = await mock.call('hi')

const health = new HealthCheckProvider()
const h = await health.check('openai', async () => { await callLLM() })

const adapters = new ProviderAdapterRegistry()
adapters.register({ providerId: 'openai', call: openaiAdapterCall })
```

## 验证命令

```bash
# 跑全部 provider tests（126 passed）
npx vitest run src/ai/providers/

# 跑 demo
npx vitest run src/ai/providers/demo/provider-integration-demo.test.ts

# 跑集成
npx vitest run src/ai/providers/__tests__/provider-integration.test.ts

# 跑特定模块
npx vitest run src/ai/providers/ProviderPool.test.ts
npx vitest run src/ai/providers/ProviderAdvanced.test.ts
npx vitest run src/ai/providers/ProviderBridge.test.ts
```

## 灵感来源

- **OpenRouter** — 多 provider 路由 + 自动 fallback
- **Helicone** — LLM observability + cost tracking
- **LangChain** — Provider adapter pattern
- **Anthropic SDK** — Circuit breaker + retry policy
- **OpenAI cookbook** — Token counting + message formatting

## 累计

| 项 | 数据 |
|----|------|
| 总 engines | 270 (A-G 210 + H 30 + I 30) |
| 总 tests | 1172 (1046 A-H + 126 I) |
| Commits pushed | 19+ |