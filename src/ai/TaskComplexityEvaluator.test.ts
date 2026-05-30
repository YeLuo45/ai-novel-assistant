/**
 * TaskComplexityEvaluator 测试
 */

import { describe, it, expect } from 'vitest'
import { evaluateComplexity } from './TaskComplexityEvaluator'

describe('TaskComplexityEvaluator', () => {
  it('基础分应为1', () => {
    const result = evaluateComplexity('你好')
    expect(result.score).toBe(1)
  })

  it('检测到步骤词应加分', () => {
    // "首先、然后、最后" = 3步 = 1分, 基础分1 = 2分
    const result = evaluateComplexity('首先写开头，然后写发展，最后写结局')
    expect(result.steps).toBeGreaterThanOrEqual(3)
    expect(result.score).toBeGreaterThanOrEqual(2)
  })

  it('检测到情节词应归类为plot', () => {
    const result = evaluateComplexity('设计一下小说大纲')
    expect(result.domain).toContain('plot')
    expect(result.routingHint).toBe('PlotExpert')
  })

  it('检测到对话词应归类为dialogue', () => {
    const result = evaluateComplexity('帮我写一段对话')
    expect(result.domain).toContain('dialogue')
    expect(result.routingHint).toBe('DialogueMaster')
  })

  it('检测到风格词应归类为style', () => {
    const result = evaluateComplexity('检查一下错别字')
    expect(result.domain).toContain('style')
    expect(result.routingHint).toBe('StyleGuard')
  })

  it('复杂度高应路由到PlotExpert', () => {
    // 多个情节词 + 步骤词应该路由到 PlotExpert
    const result = evaluateComplexity('首先设计大纲，然后在章节中铺设伏笔，接着设计情节高潮和转折点，最后制定详细的叙事结构')
    // 步骤词 4个，情节词检测到 plot domain，路由到 PlotExpert
    expect(result.routingHint).toBe('PlotExpert')
    expect(result.domain).toContain('plot')
  })

  it('无关键词时根据步骤数路由', () => {
    const result = evaluateComplexity('首先做A，然后做B，最后做C')
    expect(result.steps).toBeGreaterThanOrEqual(3)
    // 3步 -> 1分, 基础1分 = 2分
    expect(result.score).toBeGreaterThanOrEqual(2)
  })
})