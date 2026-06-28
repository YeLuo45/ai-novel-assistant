/**
 * ai/native/NativeAdvanced.ts (W11-W25) - 15 engines
 *
 * - W11 ToolUse
 * - W12 FunctionCalling
 * - W13 AgentRouter
 * - W14 SkillRegistry
 * - W15 MemoryAugmentedLLM
 * - W16 TokenCounter
 * - W17 CostCalculator
 * - W18 RateController
 * - W19 BatchInference
 * - W20 StreamingResponse
 * - W21 EmbeddingCache
 * - W22 SemanticCache
 * - W23 LLMJudge
 * - W24 EvaluationHarness
 * - W25 PromptOptimizer
 */

// =============================================================================
// W11: ToolUse
// =============================================================================

export interface Tool {
  name: string
  description: string
  parameters: Array<{ name: string; type: string; required: boolean; description?: string }>
  execute: (args: Record<string, unknown>) => Promise<unknown>
}

export class ToolUse {
  private _tools: Map<string, Tool> = new Map()

  register(tool: Tool): void { this._tools.set(tool.name, tool) }

  get(name: string): Tool | undefined { return this._tools.get(name) }

  async call(name: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this._tools.get(name)
    if (!tool) throw new Error(`Tool ${name} not found`)
    return tool.execute(args)
  }

  /** 序列化为 OpenAI tool format */
  toOpenAIFormat(): Array<{ type: 'function'; function: { name: string; description: string; parameters: object } }> {
    return Array.from(this._tools.values()).map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(t.parameters.map(p => [p.name, { type: p.type, description: p.description ?? '' }])),
          required: t.parameters.filter(p => p.required).map(p => p.name),
        },
      },
    }))
  }
}

// =============================================================================
// W12: FunctionCalling
// =============================================================================

export interface FunctionCall {
  name: string
  args: Record<string, unknown>
}

export class FunctionCallParser {
  /** 解析 LLM 输出中的 function call (JSON 格式) */
  parse(content: string): FunctionCall | null {
    // 尝试提取 JSON 对象
    const match = content.match(/\{[\s\S]*"function_call"[\s\S]*\}/)
    if (match) {
      try {
        const obj = JSON.parse(match[0]!)
        if (obj.function_call?.name) {
          return { name: obj.function_call.name, args: obj.function_call.args ?? {} }
        }
      } catch { /* ignore */ }
    }
    // 简单模式: function_name({...})
    const fnMatch = content.match(/(\w+)\((\{[^}]*\})\)/)
    if (fnMatch) {
      try { return { name: fnMatch[1]!, args: JSON.parse(fnMatch[2]!) } } catch { /* ignore */ }
    }
    return null
  }
}

// =============================================================================
// W13: AgentRouter
// =============================================================================

export class AgentRouter {
  private _routes: Map<string, (input: any) => Promise<any>> = new Map()

  addRoute(pattern: string, handler: (input: any) => Promise<any>): void {
    this._routes.set(pattern, handler)
  }

  async route(query: string, input: any): Promise<{ route: string; result: any }> {
    for (const [pattern, handler] of this._routes) {
      if (query.toLowerCase().includes(pattern.toLowerCase())) {
        return { route: pattern, result: await handler(input) }
      }
    }
    return { route: 'default', result: null }
  }

  list(): string[] { return Array.from(this._routes.keys()) }
}

// =============================================================================
// W14: SkillRegistry
// =============================================================================

export interface Skill {
  skillId: string
  name: string
  description: string
  tags: string[]
  execute: (...args: any[]) => Promise<unknown>
}

export class SkillRegistry {
  private _skills: Map<string, Skill> = new Map()

  register(skill: Skill): void { this._skills.set(skill.skillId, skill) }

  byTag(tag: string): Skill[] {
    return Array.from(this._skills.values()).filter(s => s.tags.includes(tag))
  }

  get(id: string): Skill | undefined { return this._skills.get(id) }
  list(): Skill[] { return Array.from(this._skills.values()) }

  async invoke(id: string, ...args: any[]): Promise<unknown> {
    const s = this._skills.get(id)
    if (!s) throw new Error(`Skill ${id} not found`)
    return s.execute(...args)
  }
}

// =============================================================================
// W15: MemoryAugmentedLLM
// =============================================================================

export class MemoryAugmentedLLM {
  private _memories: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = []
  private _gen: (prompt: string) => Promise<string>

  constructor(gen: (prompt: string) => Promise<string>) {
    this._gen = gen
  }

  remember(role: 'user' | 'assistant', content: string): void {
    this._memories.push({ role, content, timestamp: Date.now() })
  }

  /** Build prompt with memory context */
  private _buildPrompt(query: string, topK: number): string {
    const recent = this._memories.slice(-topK)
    const context = recent.map(m => `${m.role}: ${m.content}`).join('\n')
    return `Context:\n${context}\n\nUser: ${query}\nAssistant:`
  }

  async chat(query: string, topK: number = 5): Promise<string> {
    const prompt = this._buildPrompt(query, topK)
    const response = await this._gen(prompt)
    this.remember('user', query)
    this.remember('assistant', response)
    return response
  }

  memorySize(): number { return this._memories.length }
  clear(): void { this._memories = [] }
}

// =============================================================================
// W16: TokenCounter
// =============================================================================

export class TokenCounter {
  /** 简单估算: 1 token ≈ 4 chars (English) / 1.5 chars (Chinese) */
  static estimate(text: string): number {
    if (!text) return 0
    let chineseCount = 0
    let otherCount = 0
    for (const ch of text) {
      // CJK 字符
      if (/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(ch)) chineseCount += 1
      else otherCount += 1
    }
    return Math.ceil(chineseCount / 1.5) + Math.ceil(otherCount / 4)
  }

  /** 更精确: 按 GPT tokenizer 风格 */
  static estimateByWords(text: string): number {
    if (!text) return 0
    const words = text.split(/\s+/).filter(w => w.length > 0)
    return Math.ceil(words.length * 1.3)
  }
}

// =============================================================================
// W17: CostCalculator
// =============================================================================

export interface ModelPricing {
  inputPer1k: number   // USD per 1k input tokens
  outputPer1k: number  // USD per 1k output tokens
}

export class CostCalculator {
  private _pricing: Map<string, ModelPricing> = new Map()

  setPricing(model: string, pricing: ModelPricing): void {
    this._pricing.set(model, pricing)
  }

  estimate(model: string, inputTokens: number, outputTokens: number): number {
    const p = this._pricing.get(model)
    if (!p) return 0
    return (inputTokens / 1000) * p.inputPer1k + (outputTokens / 1000) * p.outputPer1k
  }
}

// =============================================================================
// W18: RateController
// =============================================================================

export class RateController {
  private _requests: Map<string, number[]> = new Map()
  private _maxPerMinute: number

  constructor(maxPerMinute: number) {
    this._maxPerMinute = maxPerMinute
  }

  canProceed(key: string = 'global'): boolean {
    const now = Date.now()
    const cutoff = now - 60_000
    const requests = (this._requests.get(key) ?? []).filter(t => t > cutoff)
    if (requests.length >= this._maxPerMinute) return false
    requests.push(now)
    this._requests.set(key, requests)
    return true
  }

  remaining(key: string = 'global'): number {
    const now = Date.now()
    const cutoff = now - 60_000
    const requests = (this._requests.get(key) ?? []).filter(t => t > cutoff)
    return Math.max(0, this._maxPerMinute - requests.length)
  }
}

// =============================================================================
// W19: BatchInference
// =============================================================================

export class BatchInference<TInput, TOutput> {
  private _batch: TInput[] = []
  private _batchSize: number
  private _flushMs: number
  private _processor: (batch: TInput[]) => Promise<TOutput[]>

  constructor(processor: (batch: TInput[]) => Promise<TOutput[]>, batchSize: number = 10, flushMs: number = 100) {
    this._processor = processor
    this._batchSize = batchSize
    this._flushMs = flushMs
  }

  async submit(input: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      this._batch.push(input)
      this._pendingResolves.push({ resolve, reject, input })
      if (this._batch.length >= this._batchSize) {
        this._flush().catch(() => {})
      } else {
        this._maybeStartTimer()
      }
    })
  }
  private _pendingResolves: Array<{ resolve: (v: TOutput) => void; reject: (e: Error) => void; input: TInput }> = []
  private _timer: ReturnType<typeof setTimeout> | null = null

  private _maybeStartTimer(): void {
    if (this._timer) return
    this._timer = setTimeout(() => { this._flush().catch(() => {}) }, this._flushMs)
  }

  private async _flush(): Promise<void> {
    if (this._batch.length === 0) return
    const batch = this._batch.slice()
    const pending = this._pendingResolves.slice()
    this._batch = []
    this._pendingResolves = []
    if (this._timer) { clearTimeout(this._timer); this._timer = null }
    try {
      const outputs = await this._processor(batch)
      pending.forEach((p, i) => p.resolve(outputs[i]!))
    } catch (e) {
      pending.forEach(p => p.reject(e instanceof Error ? e : new Error(String(e))))
    }
  }

  size(): number { return this._batch.length }
}

// =============================================================================
// W20: StreamingResponse
// =============================================================================

export class StreamingResponse {
  private _chunks: string[] = []
  private _listeners: Set<(chunk: string) => void> = new Set()
  private _done: boolean = false

  emit(chunk: string): void {
    this._chunks.push(chunk)
    for (const l of this._listeners) l(chunk)
  }

  complete(): void { this._done = true }
  isDone(): boolean { return this._done }

  full(): string { return this._chunks.join('') }
  chunks(): string[] { return [...this._chunks] }

  subscribe(fn: (chunk: string) => void): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }
}

// =============================================================================
// W21: EmbeddingCache
// =============================================================================

export class EmbeddingCache {
  private _cache: Map<string, { vector: number[]; cachedAt: number; hits: number }> = new Map()
  private _maxSize: number
  private _ttlMs: number

  constructor(maxSize: number = 1000, ttlMs: number = 3_600_000) {
    this._maxSize = maxSize
    this._ttlMs = ttlMs
  }

  get(key: string): number[] | null {
    const entry = this._cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.cachedAt > this._ttlMs) {
      this._cache.delete(key)
      return null
    }
    entry.hits += 1
    return entry.vector
  }

  set(key: string, vector: number[]): void {
    if (this._cache.size >= this._maxSize) {
      const first = this._cache.keys().next().value
      if (first) this._cache.delete(first)
    }
    this._cache.set(key, { vector, cachedAt: Date.now(), hits: 0 })
  }

  size(): number { return this._cache.size }
  clear(): void { this._cache.clear() }
}

// =============================================================================
// W22: SemanticCache
// =============================================================================

export class SemanticCache {
  private _cache: Map<string, Array<{ query: string; vector: number[]; result: unknown; timestamp: number }>> = new Map()
  private _threshold: number

  constructor(threshold: number = 0.95) {
    this._threshold = threshold
  }

  getSimilar(query: string, vector: number[]): unknown | null {
    const candidates = this._cache.get('default') ?? []
    for (const c of candidates) {
      if (Date.now() - c.timestamp > 3_600_000) continue
      const v = c.vector
      if (v.length !== vector.length) continue
      const similarity = this._cosine(v, vector)
      if (similarity >= this._threshold) return c.result
    }
    return null
  }

  set(query: string, vector: number[], result: unknown): void {
    if (!this._cache.has('default')) this._cache.set('default', [])
    this._cache.get('default')!.push({ query, vector, result, timestamp: Date.now() })
  }

  private _cosine(a: number[], b: number[]): number {
    let dot = 0, nA = 0, nB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!; nA += a[i]! * a[i]!; nB += b[i]! * b[i]!
    }
    const denom = Math.sqrt(nA) * Math.sqrt(nB)
    return denom === 0 ? 0 : dot / denom
  }
}

// =============================================================================
// W23: LLMJudge
// =============================================================================

export interface Judgment {
  score: number  // 0-1
  reason: string
  pass: boolean
}

export class LLMJudge {
  private _gen: (prompt: string) => Promise<string>
  private _threshold: number

  constructor(gen: (prompt: string) => Promise<string>, threshold: number = 0.7) {
    this._gen = gen
    this._threshold = threshold
  }

  async judge(expected: string, actual: string): Promise<Judgment> {
    const prompt = `Compare the expected and actual responses. Provide a score from 0-1 and a brief reason.\n\nExpected: ${expected}\n\nActual: ${actual}\n\nScore and reason:`
    const response = await this._gen(prompt)
    const match = response.match(/(\d*\.?\d+)/)
    const score = match ? parseFloat(match[1]!) : 0
    return { score, reason: response, pass: score >= this._threshold }
  }
}

// =============================================================================
// W24: EvaluationHarness
// =============================================================================

export interface EvalCase {
  caseId: string
  input: string
  expectedOutput: string
}

export interface EvalResult {
  caseId: string
  passed: boolean
  score: number
  reason: string
}

export class EvaluationHarness {
  private _cases: EvalCase[] = []
  private _judge: LLMJudge

  constructor(judge: LLMJudge) {
    this._judge = judge
  }

  addCase(c: EvalCase): void { this._cases.push(c) }

  async run(): Promise<{ results: EvalResult[]; passRate: number }> {
    const results: EvalResult[] = []
    for (const c of this._cases) {
      const j = await this._judge.judge(c.expectedOutput, c.input)  // simplified
      results.push({ caseId: c.caseId, passed: j.pass, score: j.score, reason: j.reason })
    }
    const passRate = results.length === 0 ? 0 : results.filter(r => r.passed).length / results.length
    return { results, passRate }
  }
}

// =============================================================================
// W25: PromptOptimizer
// =============================================================================

export class PromptOptimizer {
  private _history: Array<{ prompt: string; score: number; variations: string[] }> = []

  record(prompt: string, score: number, variations: string[] = []): void {
    this._history.push({ prompt, score, variations })
  }

  /** Best-so-far */
  best(): { prompt: string; score: number } | null {
    if (this._history.length === 0) return null
    const best = this._history.reduce((a, b) => (b.score > a.score ? b : a))
    return { prompt: best.prompt, score: best.score }
  }

  /** 简单贪心: 替换 phrases 找 better */
  suggest(): string[] {
    if (this._history.length === 0) return []
    const best = this.best()
    if (!best) return []
    // 生成简单 variations
    const variations: string[] = []
    if (best.prompt.length > 20) {
      variations.push(best.prompt + ' Please.')
      variations.push('Please ' + best.prompt)
    }
    return variations
  }

  history(): Array<{ prompt: string; score: number }> {
    return this._history.map(h => ({ prompt: h.prompt, score: h.score }))
  }
}