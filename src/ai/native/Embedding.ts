/**
 * ai/native/Embedding.ts (W1-W10) - 10 engines
 *
 * - W1 EmbeddingModel
 * - W2 VectorIndex
 * - W3 CosineSimilarity
 * - W4 SemanticSearch
 * - W5 RAGPipeline
 * - W6 PromptTemplate
 * - W7 PromptComposer
 * - W8 FewShotSelector
 * - W9 ChainOfThought
 * - W10 ReActAgent
 */

// =============================================================================
// W3: CosineSimilarity (utility, 放在前面)
// =============================================================================

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    normA += a[i]! * a[i]!
    normB += b[i]! * b[i]!
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

// =============================================================================
// W1: EmbeddingModel
// =============================================================================

export interface Embedding {
  text: string
  vector: number[]
  model: string
  dim: number
}

export class EmbeddingModel {
  private _modelName: string
  private _dim: number

  constructor(modelName: string = 'mock-embed', dim: number = 128) {
    this._modelName = modelName
    this._dim = dim
  }

  /** 模拟 embed (实际生产调用 OpenAI/Cohere API) */
  async embed(text: string): Promise<number[]> {
    // 简单 hash-based mock embedding
    const vec = new Array(this._dim).fill(0)
    for (let i = 0; i < text.length; i++) {
      vec[i % this._dim] = (vec[i % this._dim]! + text.charCodeAt(i) / 255) % 1
    }
    // normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
    return vec.map(v => v / (norm || 1))
  }

  async embedBatch(texts: string[]): Promise<Embedding[]> {
    const results: Embedding[] = []
    for (const t of texts) {
      results.push({ text: t, vector: await this.embed(t), model: this._modelName, dim: this._dim })
    }
    return results
  }

  modelName(): string { return this._modelName }
  dim(): number { return this._dim }
}

// =============================================================================
// W2: VectorIndex
// =============================================================================

export class VectorIndex {
  private _entries: Array<{ id: string; text: string; vector: number[]; metadata?: Record<string, unknown> }> = []

  add(id: string, text: string, vector: number[], metadata?: Record<string, unknown>): void {
    this._entries.push({ id, text, vector, metadata })
  }

  size(): number { return this._entries.length }

  /** 搜索 top-k by cosine similarity */
  search(query: number[], topK: number = 5): Array<{ id: string; text: string; score: number; metadata?: Record<string, unknown> }> {
    const scored = this._entries.map(e => ({
      id: e.id,
      text: e.text,
      score: cosineSimilarity(query, e.vector),
      metadata: e.metadata,
    }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK)
  }

  remove(id: string): boolean {
    const before = this._entries.length
    this._entries = this._entries.filter(e => e.id !== id)
    return this._entries.length < before
  }
}

// =============================================================================
// W4: SemanticSearch
// =============================================================================

export class SemanticSearch {
  private _index: VectorIndex
  private _embedder: EmbeddingModel

  constructor(embedder: EmbeddingModel, index: VectorIndex) {
    this._embedder = embedder
    this._index = index
  }

  async index(text: string, id: string, metadata?: Record<string, unknown>): Promise<void> {
    const vector = await this._embedder.embed(text)
    this._index.add(id, text, vector, metadata)
  }

  async search(query: string, topK: number = 5): Promise<Array<{ id: string; text: string; score: number }>> {
    const queryVector = await this._embedder.embed(query)
    return this._index.search(queryVector, topK)
  }
}

// =============================================================================
// W5: RAGPipeline
// =============================================================================

export interface RAGConfig {
  topK: number
  scoreThreshold: number
  systemPrompt: string
  template: string  // e.g. "Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
}

export class RAGPipeline {
  private _search: SemanticSearch
  private _config: RAGConfig
  private _gen: (prompt: string) => Promise<string>

  constructor(search: SemanticSearch, config: Partial<RAGConfig>, gen: (prompt: string) => Promise<string>) {
    this._search = search
    this._config = {
      topK: config.topK ?? 3,
      scoreThreshold: config.scoreThreshold ?? 0.5,
      systemPrompt: config.systemPrompt ?? 'You are a helpful assistant. Use the context to answer.',
      template: config.template ?? 'Context:\n{context}\n\nQuestion: {question}\n\nAnswer:',
    }
    this._gen = gen
  }

  async query(question: string): Promise<{ answer: string; context: Array<{ id: string; text: string; score: number }> }> {
    const results = await this._search.search(question, this._config.topK)
    const filtered = results.filter(r => r.score >= this._config.scoreThreshold)
    const context = filtered.map(r => r.text).join('\n---\n')
    const prompt = this._config.template.replace('{context}', context).replace('{question}', question)
    const answer = await this._gen(prompt)
    return { answer, context: filtered }
  }
}

// =============================================================================
// W6: PromptTemplate
// =============================================================================

export class PromptTemplate {
  private _template: string
  private _variables: string[]

  constructor(template: string) {
    this._template = template
    // extract {{var}} variables
    const matches = template.matchAll(/\{\{(\w+)\}\}/g)
    this._variables = Array.from(new Set(Array.from(matches).map(m => m[1]!)))
  }

  render(vars: Record<string, string>): string {
    let out = this._template
    for (const v of this._variables) {
      out = out.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), vars[v] ?? `{{${v}}}`)
    }
    return out
  }

  variables(): string[] { return [...this._variables] }
}

// =============================================================================
// W7: PromptComposer
// =============================================================================

export class PromptComposer {
  private _parts: string[] = []

  system(msg: string): this { this._parts.push(`[SYSTEM] ${msg}`); return this }
  context(msg: string): this { this._parts.push(`[CONTEXT] ${msg}`); return this }
  examples(msgs: Array<{ role: string; content: string }>): this {
    for (const m of msgs) this._parts.push(`[EXAMPLE ${m.role.toUpperCase()}] ${m.content}`)
    return this
  }
  user(msg: string): this { this._parts.push(`[USER] ${msg}`); return this }
  assistant(msg: string): this { this._parts.push(`[ASSISTANT] ${msg}`); return this }

  render(): string { return this._parts.join('\n\n') }
  size(): number { return this._parts.reduce((s, p) => s + p.length, 0) }
}

// =============================================================================
// W8: FewShotSelector
// =============================================================================

export interface Example {
  input: string
  output: string
}

export class FewShotSelector {
  private _examples: Example[] = []

  add(example: Example): void { this._examples.push(example) }

  /** 基于 query 选 top-k 最相关 examples (by token overlap) */
  select(query: string, k: number = 3): Example[] {
    const queryTokens = new Set(query.toLowerCase().split(/\s+/))
    const scored = this._examples.map(ex => {
      const exTokens = ex.input.toLowerCase().split(/\s+/)
      const overlap = exTokens.filter(t => queryTokens.has(t)).length
      return { example: ex, score: overlap }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, k).map(s => s.example)
  }

  count(): number { return this._examples.length }
}

// =============================================================================
// W9: ChainOfThought
// =============================================================================

export interface ThoughtStep {
  stepId: string
  description: string
  result: unknown
  reasoning: string
}

export class ChainOfThought {
  private _steps: ThoughtStep[] = []

  add(step: Omit<ThoughtStep, 'stepId'>): ThoughtStep {
    const s: ThoughtStep = { ...step, stepId: `step_${this._steps.length + 1}` }
    this._steps.push(s)
    return s
  }

  steps(): ThoughtStep[] { return [...this._steps] }

  render(): string {
    return this._steps.map((s, i) => `Step ${i + 1}: ${s.description}\nReasoning: ${s.reasoning}\nResult: ${JSON.stringify(s.result)}`).join('\n\n')
  }

  /** 总结所有 step */
  summary(): string {
    return `Chain of thought (${this._steps.length} steps): ${this._steps.map(s => s.description).join(' → ')}`
  }
}

// =============================================================================
// W10: ReActAgent
// =============================================================================

export interface ReactStep {
  thought: string
  action?: { tool: string; input: unknown }
  observation?: string
}

export class ReActAgent {
  private _tools: Map<string, (input: any) => Promise<any>> = new Map()
  private _history: ReactStep[] = []
  private _maxSteps: number

  constructor(maxSteps: number = 10) {
    this._maxSteps = maxSteps
  }

  registerTool(name: string, fn: (input: any) => Promise<any>): void {
    this._tools.set(name, fn)
  }

  async step(thought: string, action?: { tool: string; input: unknown }): Promise<ReactStep> {
    let observation: string | undefined
    if (action) {
      const tool = this._tools.get(action.tool)
      if (!tool) observation = `Error: tool '${action.tool}' not found`
      else {
        try {
          const result = await tool(action.input)
          observation = JSON.stringify(result)
        } catch (e) {
          observation = `Error: ${e instanceof Error ? e.message : String(e)}`
        }
      }
    }
    const s: ReactStep = { thought, action, observation }
    this._history.push(s)
    return s
  }

  history(): ReactStep[] { return [...this._history] }
  isDone(): boolean { return this._history.length >= this._maxSteps }
  reset(): void { this._history = [] }
  render(): string {
    return this._history.map((s, i) => `Step ${i + 1}:\nThought: ${s.thought}\nAction: ${JSON.stringify(s.action ?? null)}\nObservation: ${s.observation ?? '-'}`).join('\n\n')
  }
}