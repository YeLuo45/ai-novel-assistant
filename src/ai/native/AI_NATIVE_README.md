# AI-Native Features (V3) — Direction W

**Version**: 1.0.0
**Engines**: V2986-V3015 (30 engines, 6 batches)
**Tests**: 36 tests, 100% pass

## 目标

完整 AI-Native 能力：embedding、向量索引、语义搜索、RAG、prompt 模板、Few-shot、CoT、ReAct、Tool use、Function calling、Memory augmented LLM、token/cost、rate control、batch/streaming、semantic cache、LLM judge、eval harness、prompt optimizer。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| W1-W10 | `Embedding.ts` | cosineSimilarity + EmbeddingModel (hash-based mock) + VectorIndex (top-k) + SemanticSearch + RAGPipeline (template + threshold) + PromptTemplate (Mustache-like) + PromptComposer (system/context/examples/user/assistant) + FewShotSelector (token overlap) + ChainOfThought + ReActAgent (tool registry + max steps) |
| W11-W25 | `NativeAdvanced.ts` | ToolUse (OpenAI tool format) + FunctionCallParser + AgentRouter + SkillRegistry + MemoryAugmentedLLM + TokenCounter (CJK-aware) + CostCalculator + RateController (per-key) + BatchInference + StreamingResponse + EmbeddingCache (LRU+TTL) + SemanticCache (cosine threshold) + LLMJudge + EvaluationHarness + PromptOptimizer (best-so-far + suggest) |

## 核心 API 示例

### 1. Embedding + RAG

```ts
import { EmbeddingModel, VectorIndex, SemanticSearch, RAGPipeline } from '@/ai/native'

const embedder = new EmbeddingModel('mock', 128)
const idx = new VectorIndex()
const ss = new SemanticSearch(embedder, idx)
await ss.index('Alice is 30 years old', 'doc1')

const rag = new RAGPipeline(ss, { topK: 3, scoreThreshold: 0.5 }, async (prompt) => {
  return await callLLM(prompt)
})
const r = await rag.query('How old is Alice?')
```

### 2. Prompt + Chain of Thought + ReAct

```ts
import { PromptTemplate, PromptComposer, ChainOfThought, ReActAgent } from '@/ai/native'

const tpl = new PromptTemplate('Hello {{name}}, today is {{day}}')
console.log(tpl.render({ name: 'Alice', day: 'Monday' }))

const c = new PromptComposer().system('You are helpful').user('Hi!')
console.log(c.render())

const cot = new ChainOfThought()
cot.add({ description: 'Identify', reasoning: 'Numbers', result: [1, 2, 3] })
cot.add({ description: 'Sum', reasoning: 'Add them', result: 6 })

const agent = new ReActAgent()
agent.registerTool('search', async (q) => `result for ${q}`)
await agent.step('Need to search', { tool: 'search', input: 'foo' })
```

### 3. Tool Use + Function Calling

```ts
import { ToolUse, FunctionCallParser, AgentRouter, SkillRegistry, MemoryAugmentedLLM } from '@/ai/native'

const tu = new ToolUse()
tu.register({ name: 'get_weather', description: 'Get weather', parameters: [{ name: 'city', type: 'string', required: true }], execute: async (args) => `Weather in ${args.city}` })
const fmt = tu.toOpenAIFormat()  // OpenAI tool format

const p = new FunctionCallParser()
const call = p.parse('{"function_call": {"name": "get_weather", "args": {"city": "NYC"}}}')

const llm = new MemoryAugmentedLLM(async (p) => '...')
const r = await llm.chat('hello')
```

### 4. Cost + Rate + Cache

```ts
import { TokenCounter, CostCalculator, RateController, EmbeddingCache, SemanticCache } from '@/ai/native'

const tokens = TokenCounter.estimate('hello world 你好')
const cost = new CostCalculator().setPricing('gpt-4', { inputPer1k: 0.03, outputPer1k: 0.06 })
const total = cost.estimate('gpt-4', tokens, 100)

const rate = new RateController(60)  // 60 req/min
if (rate.canProceed('user-1')) {
  // call LLM
}

const cache = new EmbeddingCache(1000, 3_600_000)
cache.set('text-1', await embedder.embed('text'))
```

### 5. Evaluation + Optimization

```ts
import { LLMJudge, EvaluationHarness, PromptOptimizer } from '@/ai/native'

const judge = new LLMJudge(async () => '0.8 good', 0.7)
const harness = new EvaluationHarness(judge)
harness.addCase({ caseId: 'c1', input: 'Q', expectedOutput: 'A' })
const r = await harness.run()
console.log(r.passRate)

const opt = new PromptOptimizer()
opt.record('prompt 1', 0.5)
opt.record('prompt 2 with more details', 0.9)
console.log(opt.best())
```

## 验证命令

```bash
npx vitest run src/ai/native/  # 36 passed
```

## 灵感

- OpenAI Embeddings + RAG
- LangChain / LlamaIndex
- Hugging Face Transformers
- ReAct (Reasoning + Acting)
- Chain-of-Thought Prompting
- Pinecone / Weaviate (vector DBs)
- LangSmith (evaluation)
- DSPy (prompt optimization)

## 累计

- Direction A-W: **855 engines / ~7,825 tests**
- 24 commits pushed
- 灵感: OpenAI + LangChain + RAG + ReAct + CoT + Pinecone + DSPy