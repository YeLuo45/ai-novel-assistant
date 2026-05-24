/**
 * SelfEvolutionEngine 类型接口测试
 * 注：不依赖真实数据库，仅验证类型和接口
 */

import { describe, it, expect } from 'vitest'
import type { PromptVersion, EvolutionInsight } from './types'

describe('SelfEvolutionEngine types', () => {
  it('PromptVersion has required fields', () => {
    const pv: PromptVersion = {
      id: 'pv_1',
      version: 1,
      basePrompt: 'base prompt',
      improvedPrompt: 'improved prompt',
      insight: 'test insight',
      performanceScore: 0.9,
      createdAt: Date.now(),
      useCount: 0,
      taskType: 'chapter',
    }
    expect(pv.version).toBe(1)
    expect(pv.taskType).toBe('chapter')
    expect(pv.useCount).toBe(0)
  })

  it('EvolutionInsight has required fields', () => {
    const ei: EvolutionInsight = {
      pattern: 'action_scene',
      successRate: 0.85,
      sampleCount: 10,
      recommendation: 'use short sentences',
    }
    expect(ei.successRate).toBe(0.85)
    expect(ei.pattern).toBe('action_scene')
  })

  it('PromptVersion allows incremental useCount', () => {
    const pv: PromptVersion = {
      id: 'pv_2',
      version: 5,
      basePrompt: 'base',
      improvedPrompt: 'improved',
      insight: 'insight',
      performanceScore: 0.75,
      createdAt: Date.now(),
      useCount: 42,
      taskType: 'dialogue',
    }
    expect(pv.useCount).toBe(42)
  })
})