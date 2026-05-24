import { describe, it, expect, vi } from 'vitest'
import { DictionaryTool } from '../builtIn/DictionaryTool'
import { CharacterRelationTool } from '../builtIn/CharacterRelationTool'
import { PlotGeneratorTool } from '../builtIn/PlotGeneratorTool'
import { SceneDescriptionTool } from '../builtIn/SceneDescriptionTool'
import type { ToolInput } from '../types'

describe('DictionaryTool', () => {
  const ctx = { projectId: 1, chapterId: 1 }

  it('should return definition for known word', async () => {
    const result = await DictionaryTool.execute({ text: '守株待兔' }, ctx)
    expect(result.success).toBe(true)
    expect(result.output).toContain('守株待兔')
    expect(result.output).toContain('拼音')
  })

  it('should return not found for unknown word', async () => {
    const result = await DictionaryTool.execute({ text: 'xyzabc123' }, ctx)
    expect(result.success).toBe(true)
    expect(result.output).toContain('未找到')
  })

  it('should validate empty input', () => {
    const result = DictionaryTool.validateInput!({ text: '' }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should validate too long input', () => {
    const result = DictionaryTool.validateInput!({ text: 'a'.repeat(51) }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should crystallize successfully', async () => {
    const skill = await DictionaryTool.crystallize!()
    expect(skill.toolId).toBe('dictionary')
    expect(skill.name).toBe('DictionaryLookup')
  })
})

describe('CharacterRelationTool', () => {
  const ctx = { projectId: 1, chapterId: 1 }

  it('should generate relations for two characters', async () => {
    const result = await CharacterRelationTool.execute({ text: '张三, 李四' }, ctx)
    expect(result.success).toBe(true)
    expect(result.output).toContain('张三')
    expect(result.output).toContain('李四')
  })

  it('should fail with less than two names', async () => {
    const result = await CharacterRelationTool.execute({ text: '张三' }, ctx)
    expect(result.success).toBe(false)
    expect(result.error).toContain('至少两个角色')
  })

  it('should validate empty input', () => {
    const result = CharacterRelationTool.validateInput!({ text: '' }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should validate too many characters', () => {
    const names = Array(21).fill('name').join(',')
    const result = CharacterRelationTool.validateInput!({ text: names }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should include relationship descriptions', async () => {
    const result = await CharacterRelationTool.execute({ text: '小明, 小红' }, ctx)
    expect(result.output).toContain('关系:')
    expect(result.output).toContain('描述:')
  })

  it('should crystallize successfully', async () => {
    const skill = await CharacterRelationTool.crystallize!()
    expect(skill.toolId).toBe('character-relation')
    expect(skill.name).toBe('CharacterRelationGenerate')
  })
})

describe('PlotGeneratorTool', () => {
  const ctx = { projectId: 1, chapterId: 1 }

  it('should generate plot with theme', async () => {
    const result = await PlotGeneratorTool.execute({ text: '冒险', context: { genre: 'fantasy' } }, ctx)
    expect(result.success).toBe(true)
    expect(result.output).toContain('冒险')
    expect(result.output).toContain('第1幕')
  })

  it('should use default genre when not specified', async () => {
    const result = await PlotGeneratorTool.execute({ text: '爱情' }, ctx)
    expect(result.success).toBe(true)
    expect(result.output).toContain('爱情')
  })

  it('should validate empty input', () => {
    const result = PlotGeneratorTool.validateInput!({ text: '' }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should validate too long input', () => {
    const result = PlotGeneratorTool.validateInput!({ text: 'a'.repeat(101) }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should include act structure', async () => {
    const result = await PlotGeneratorTool.execute({ text: '冒险' }, ctx)
    expect(result.output).toContain('第1幕')
    expect(result.output).toContain('第2幕')
    expect(result.output).toContain('第3幕')
  })

  it('should crystallize successfully', async () => {
    const skill = await PlotGeneratorTool.crystallize!()
    expect(skill.toolId).toBe('plot-generator')
    expect(skill.name).toBe('PlotGenerate')
  })
})

describe('SceneDescriptionTool', () => {
  const ctx = { projectId: 1, chapterId: 1 }

  it('should generate scene description', async () => {
    const result = await SceneDescriptionTool.execute({ text: '' }, ctx)
    expect(result.success).toBe(true)
    expect(result.output).toContain('场景描写')
    expect(result.output).toContain('时间')
    expect(result.output).toContain('天气')
    expect(result.output).toContain('地点')
  })

  it('should include sensory details', async () => {
    const result = await SceneDescriptionTool.execute({ text: '' }, ctx)
    expect(result.output).toContain('感官细节')
  })

  it('should generate sample prose', async () => {
    const result = await SceneDescriptionTool.execute({ text: '' }, ctx)
    expect(result.output).toContain('示范段落')
  })

  it('should parse time preference', async () => {
    const result = await SceneDescriptionTool.execute({ text: '夜晚' }, ctx)
    expect(result.success).toBe(true)
  })

  it('should validate too long input', () => {
    const result = SceneDescriptionTool.validateInput!({ text: 'a'.repeat(201) }, ctx)
    expect(result.valid).toBe(false)
  })

  it('should crystallize successfully', async () => {
    const skill = await SceneDescriptionTool.crystallize!()
    expect(skill.toolId).toBe('scene-description')
    expect(skill.name).toBe('SceneDescription')
  })
})
