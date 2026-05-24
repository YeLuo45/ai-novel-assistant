import { describe, it, expect } from 'vitest'
import type { WritingToolV2, ToolInput, ToolOutput, CrystallizedSkill, ToolCategoryV2, ValidationResult } from '../types'

describe('Tool Types', () => {
  describe('ToolCategoryV2', () => {
    it('should allow valid category values', () => {
      const categories: ToolCategoryV2[] = ['dictionary', 'generator', 'search', 'analysis', 'creative', 'mcp', 'custom']
      categories.forEach(cat => {
        expect(typeof cat).toBe('string')
      })
    })
  })

  describe('ToolInput', () => {
    it('should accept valid tool input', () => {
      const input: ToolInput = {
        text: '测试文本',
        context: {
          projectId: 1,
          chapterId: 2
        }
      }
      expect(input.text).toBe('测试文本')
      expect(input.context?.projectId).toBe(1)
    })

    it('should allow optional context', () => {
      const input: ToolInput = { text: '测试' }
      expect(input.text).toBe('测试')
      expect(input.context).toBeUndefined()
    })
  })

  describe('ToolOutput', () => {
    it('should accept valid tool output', () => {
      const output: ToolOutput = {
        success: true,
        output: '结果文本',
        metadata: { key: 'value' }
      }
      expect(output.success).toBe(true)
      expect(output.output).toBe('结果文本')
    })

    it('should allow error field', () => {
      const output: ToolOutput = {
        success: false,
        output: '',
        error: '错误信息'
      }
      expect(output.success).toBe(false)
      expect(output.error).toBe('错误信息')
    })
  })

  describe('CrystallizedSkill', () => {
    it('should accept valid skill structure', () => {
      const skill: CrystallizedSkill = {
        id: 'skill_123',
        name: 'TestSkill',
        toolId: 'test-tool',
        pattern: 'test.*pattern',
        successCount: 10,
        avgRating: 4.5,
        lastUsed: new Date().toISOString(),
        code: 'console.log("test")',
        createdAt: Date.now()
      }
      expect(skill.id).toBe('skill_123')
      expect(skill.successCount).toBe(10)
      expect(skill.avgRating).toBe(4.5)
    })
  })

  describe('ValidationResult', () => {
    it('should accept valid result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: []
      }
      expect(result.valid).toBe(true)
    })

    it('should include errors when invalid', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['Error 1', 'Error 2']
      }
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('WritingToolV2 interface', () => {
    it('should allow tool with all fields', () => {
      const tool: WritingToolV2 = {
        id: 'test-tool',
        name: 'Test Tool',
        category: 'generator',
        description: 'A test tool',
        icon: '🧪',
        version: '2.0.0',
        execute: async () => ({ success: true, output: 'test' }),
        isMcp: false,
        isCustom: false,
        crystallize: async () => ({
          id: 'skill_1',
          name: 'Test',
          toolId: 'test-tool',
          pattern: 'test',
          successCount: 1,
          avgRating: 5,
          lastUsed: new Date().toISOString(),
          code: '',
          createdAt: Date.now()
        }),
        validateInput: () => ({ valid: true }),
        mcpServerId: 'server-1'
      }
      expect(tool.id).toBe('test-tool')
      expect(tool.crystallize).toBeDefined()
      expect(tool.validateInput).toBeDefined()
    })

    it('should allow minimal tool', () => {
      const tool: WritingToolV2 = {
        id: 'minimal-tool',
        name: 'Minimal',
        category: 'creative',
        description: 'Minimal tool',
        icon: '📦',
        version: '1.0',
        execute: async () => ({ success: true, output: '' })
      }
      expect(tool.id).toBe('minimal-tool')
    })
  })
})
