/**
 * ai/native/Embedding.test.ts (W1-W10) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  cosineSimilarity, EmbeddingModel, VectorIndex, SemanticSearch, RAGPipeline,
  PromptTemplate, PromptComposer, FewShotSelector, ChainOfThought, ReActAgent,
} from './Embedding'

describe('W3: CosineSimilarity', () => {
  it('identical vectors = 1', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 5)
  })
  it('orthogonal = 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })
  it('different lengths = 0', () => {
    expect(cosineSimilarity([1], [1, 2])).toBe(0)
  })
})

describe('W1: EmbeddingModel', () => {
  it('embed + dim', async () => {
    const e = new EmbeddingModel('mock', 8)
    const v = await e.embed('hello')
    expect(v.length).toBe(8)
  })

  it('embedBatch', async () => {
    const e = new EmbeddingModel('mock', 16)
    const r = await e.embedBatch(['a', 'b'])
    expect(r.length).toBe(2)
    expect(r[0]?.model).toBe('mock')
  })
})

describe('W2: VectorIndex', () => {
  it('add + search', () => {
    const idx = new VectorIndex()
    idx.add('1', 'hello world', [1, 0, 0])
    idx.add('2', 'goodbye', [0, 1, 0])
    const r = idx.search([1, 0, 0], 2)
    expect(r[0]?.id).toBe('1')
  })

  it('remove', () => {
    const idx = new VectorIndex()
    idx.add('1', 'x', [1, 0])
    expect(idx.remove('1')).toBe(true)
    expect(idx.size()).toBe(0)
  })
})

describe('W4: SemanticSearch', () => {
  it('index + search', async () => {
    const embedder = new EmbeddingModel('mock', 8)
    const idx = new VectorIndex()
    const ss = new SemanticSearch(embedder, idx)
    await ss.index('hello world', '1')
    await ss.index('goodbye world', '2')
    const r = await ss.search('hello')
    expect(r.length).toBeGreaterThan(0)
  })
})

describe('W5: RAGPipeline', () => {
  it('query with context', async () => {
    const embedder = new EmbeddingModel('mock', 8)
    const idx = new VectorIndex()
    const ss = new SemanticSearch(embedder, idx)
    await ss.index('Alice is 30 years old', 'doc1')
    await ss.index('Bob is 25', 'doc2')
    const rag = new RAGPipeline(ss, { topK: 2, scoreThreshold: 0 }, async (prompt) => `Answer: ${prompt.split('Question:')[1]?.trim() ?? ''}`)
    const r = await rag.query('How old is Alice?')
    expect(r.answer).toContain('How old is Alice')
    expect(r.context.length).toBeGreaterThan(0)
  })
})

describe('W6: PromptTemplate', () => {
  it('render + variables', () => {
    const t = new PromptTemplate('Hello {{name}}, today is {{day}}')
    expect(t.variables()).toEqual(['name', 'day'])
    expect(t.render({ name: 'Alice', day: 'Monday' })).toBe('Hello Alice, today is Monday')
  })
})

describe('W7: PromptComposer', () => {
  it('compose multi-part', () => {
    const c = new PromptComposer()
    c.system('You are helpful').user('Hi!')
    const out = c.render()
    expect(out).toContain('[SYSTEM]')
    expect(out).toContain('[USER] Hi!')
    expect(c.size()).toBeGreaterThan(0)
  })

  it('examples', () => {
    const c = new PromptComposer()
    c.examples([{ role: 'user', content: 'Q1' }, { role: 'assistant', content: 'A1' }])
    expect(c.render()).toContain('[EXAMPLE USER]')
  })
})

describe('W8: FewShotSelector', () => {
  it('select by overlap', () => {
    const s = new FewShotSelector()
    s.add({ input: 'apple banana', output: 'fruit' })
    s.add({ input: 'car bus', output: 'vehicle' })
    const r = s.select('apple', 1)
    expect(r[0]?.output).toBe('fruit')
  })
})

describe('W9: ChainOfThought', () => {
  it('add + render + summary', () => {
    const c = new ChainOfThought()
    c.add({ description: 'Identify', reasoning: 'Numbers', result: [1, 2, 3] })
    c.add({ description: 'Sum', reasoning: 'Add them', result: 6 })
    expect(c.steps().length).toBe(2)
    expect(c.render()).toContain('Step 1')
    expect(c.summary()).toContain('Identify → Sum')
  })
})

describe('W10: ReActAgent', () => {
  it('step + tool + observation', async () => {
    const a = new ReActAgent()
    a.registerTool('search', async (q) => `result for ${q}`)
    const s = await a.step('Need to search', { tool: 'search', input: 'foo' })
    expect(s.observation).toContain('result for foo')
  })

  it('isDone', async () => {
    const a = new ReActAgent(2)
    expect(a.isDone()).toBe(false)
    await a.step('t1')
    await a.step('t2')
    expect(a.isDone()).toBe(true)
  })

  it('unknown tool', async () => {
    const a = new ReActAgent()
    const s = await a.step('t', { tool: 'unknown', input: 'x' })
    expect(s.observation).toContain('not found')
  })
})