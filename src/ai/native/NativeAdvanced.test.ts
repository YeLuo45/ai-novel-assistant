/**
 * ai/native/NativeAdvanced.test.ts (W11-W25) - 25+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  ToolUse, FunctionCallParser, AgentRouter, SkillRegistry, MemoryAugmentedLLM,
  TokenCounter, CostCalculator, RateController, BatchInference, StreamingResponse,
  EmbeddingCache, SemanticCache, LLMJudge, EvaluationHarness, PromptOptimizer,
} from './NativeAdvanced'

describe('W11: ToolUse', () => {
  it('register + call', async () => {
    const tu = new ToolUse()
    tu.register({ name: 'echo', description: 'echo', parameters: [{ name: 'text', type: 'string', required: true }], execute: async (args) => args.text })
    expect(await tu.call('echo', { text: 'hi' })).toBe('hi')
  })

  it('toOpenAIFormat', () => {
    const tu = new ToolUse()
    tu.register({ name: 'x', description: 'd', parameters: [{ name: 'a', type: 'string', required: true }], execute: async () => null })
    const fmt = tu.toOpenAIFormat()
    expect(fmt[0]?.function.name).toBe('x')
  })
})

describe('W12: FunctionCallParser', () => {
  it('parse JSON', () => {
    const p = new FunctionCallParser()
    const r = p.parse('{"function_call": {"name": "foo", "args": {"x": 1}}}')
    expect(r?.name).toBe('foo')
  })

  it('parse function syntax', () => {
    const p = new FunctionCallParser()
    const r = p.parse('foo({"x": 1})')
    expect(r?.name).toBe('foo')
  })

  it('no call', () => {
    const p = new FunctionCallParser()
    expect(p.parse('hello world')).toBeNull()
  })
})

describe('W13: AgentRouter', () => {
  it('route + default', async () => {
    const r = new AgentRouter()
    r.addRoute('weather', async (q) => `Weather: ${q}`)
    const r1 = await r.route('weather in NY', 'NY')
    expect(r1.route).toBe('weather')
    const r2 = await r.route('unknown', 'x')
    expect(r2.route).toBe('default')
  })
})

describe('W14: SkillRegistry', () => {
  it('register + byTag + invoke', async () => {
    const s = new SkillRegistry()
    s.register({ skillId: 's1', name: 'Test', description: 'd', tags: ['test'], execute: async (x) => x * 2 })
    expect(s.byTag('test').length).toBe(1)
    expect(await s.invoke('s1', 5)).toBe(10)
  })
})

describe('W15: MemoryAugmentedLLM', () => {
  it('chat with memory', async () => {
    const llm = new MemoryAugmentedLLM(async (p) => `Echo: ${p.split('User:')[1]?.trim() ?? ''}`)
    const r = await llm.chat('hello')
    expect(r).toContain('Echo: hello')
    expect(llm.memorySize()).toBe(2)
  })
})

describe('W16: TokenCounter', () => {
  it('estimate basic', () => {
    expect(TokenCounter.estimate('')).toBe(0)
    expect(TokenCounter.estimate('hello world')).toBeGreaterThan(0)
  })

  it('Chinese chars', () => {
    const e = TokenCounter.estimate('你好世界')
    expect(e).toBeGreaterThan(0)
  })
})

describe('W17: CostCalculator', () => {
  it('estimate cost', () => {
    const c = new CostCalculator()
    c.setPricing('gpt-4', { inputPer1k: 0.03, outputPer1k: 0.06 })
    // 1000 input + 500 output = 0.03 + 0.03 = 0.06
    expect(c.estimate('gpt-4', 1000, 500)).toBeCloseTo(0.06, 5)
  })
})

describe('W18: RateController', () => {
  it('canProceed + remaining', () => {
    const r = new RateController(3)
    expect(r.canProceed('u1')).toBe(true)
    expect(r.canProceed('u1')).toBe(true)
    expect(r.canProceed('u1')).toBe(true)
    expect(r.canProceed('u1')).toBe(false)
    expect(r.remaining('u1')).toBe(0)
  })
})

describe('W19: BatchInference', () => {
  it('batch + flush at size', async () => {
    const b = new BatchInference<number, number>(async (batch) => batch.map(x => x * 2), 3, 10000)
    const promises = [1, 2, 3].map(x => b.submit(x))
    const r = await Promise.all(promises)
    expect(r).toEqual([2, 4, 6])
  })
})

describe('W20: StreamingResponse', () => {
  it('emit + subscribe + full', () => {
    const s = new StreamingResponse()
    const received: string[] = []
    s.subscribe(c => received.push(c))
    s.emit('hello ')
    s.emit('world')
    s.complete()
    expect(s.full()).toBe('hello world')
    expect(received).toEqual(['hello ', 'world'])
    expect(s.isDone()).toBe(true)
  })
})

describe('W21: EmbeddingCache', () => {
  it('set + get + TTL', async () => {
    const c = new EmbeddingCache(10, 5)
    c.set('k1', [1, 0])
    expect(c.get('k1')).toEqual([1, 0])
    await new Promise(r => setTimeout(r, 10))
    expect(c.get('k1')).toBeNull()  // expired
  })
})

describe('W22: SemanticCache', () => {
  it('getSimilar with high sim', () => {
    const c = new SemanticCache(0.9)
    c.set('q1', [1, 0, 0], 'answer-1')
    const r = c.getSimilar('q2', [0.99, 0.01, 0])  // very similar
    expect(r).toBe('answer-1')
  })
})

describe('W23: LLMJudge', () => {
  it('judge returns score', async () => {
    const j = new LLMJudge(async (p) => {
      // 简单规则: 如果 expected 出现在 actual 中, 0.9
      if (p.includes('hello') && p.includes('world')) return '0.9 good match'
      return '0.2 poor'
    }, 0.7)
    const r = await j.judge('hello', 'hello world')
    expect(r.score).toBe(0.9)
    expect(r.pass).toBe(true)
  })
})

describe('W24: EvaluationHarness', () => {
  it('run cases + passRate', async () => {
    const j = new LLMJudge(async () => '0.8 good', 0.7)
    const h = new EvaluationHarness(j)
    h.addCase({ caseId: 'c1', input: 'q1', expectedOutput: 'a1' })
    h.addCase({ caseId: 'c2', input: 'q2', expectedOutput: 'a2' })
    const r = await h.run()
    expect(r.passRate).toBe(1)
  })
})

describe('W25: PromptOptimizer', () => {
  it('record + best + suggest', () => {
    const p = new PromptOptimizer()
    p.record('short', 0.5)
    p.record('this is a longer prompt with details', 0.9)
    expect(p.best()?.score).toBe(0.9)
    expect(p.suggest().length).toBeGreaterThan(0)
  })
})