import { describe, it, expect, beforeEach } from 'vitest'
import { ToolRegistryV2 } from '../ToolRegistry'
import type { WritingToolV2, ToolInput, ToolOutput } from '../types'

// Mock tool for testing
const createMockTool = (overrides: Partial<WritingToolV2> = {}): WritingToolV2 => ({
  id: 'test-tool',
  name: 'Test Tool',
  category: 'generator',
  description: 'A test tool',
  icon: '🧪',
  version: '1.0.0',
  execute: async () => ({ success: true, output: 'test output' }),
  isMcp: false,
  isCustom: false,
  ...overrides
})

describe('ToolRegistryV2', () => {
  let registry: ToolRegistryV2

  beforeEach(() => {
    registry = new ToolRegistryV2()
  })

  describe('register', () => {
    it('should register a tool successfully', () => {
      const tool = createMockTool()
      const result = registry.register(tool)
      expect(result).toBe(true)
      expect(registry.count()).toBe(1)
    })

    it('should not register duplicate tool', () => {
      const tool = createMockTool()
      registry.register(tool)
      const result = registry.register(tool)
      expect(result).toBe(false)
      expect(registry.count()).toBe(1)
    })

    it('should allow multiple different tools', () => {
      registry.register(createMockTool({ id: 'tool-1', name: 'Tool 1' }))
      registry.register(createMockTool({ id: 'tool-2', name: 'Tool 2' }))
      expect(registry.count()).toBe(2)
    })
  })

  describe('unregister', () => {
    it('should unregister existing tool', () => {
      const tool = createMockTool()
      registry.register(tool)
      const result = registry.unregister('test-tool')
      expect(result).toBe(true)
      expect(registry.count()).toBe(0)
    })

    it('should return false for non-existent tool', () => {
      const result = registry.unregister('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('get', () => {
    it('should get existing tool', () => {
      const tool = createMockTool()
      registry.register(tool)
      const result = registry.get('test-tool')
      expect(result).toEqual(tool)
    })

    it('should return undefined for non-existent tool', () => {
      const result = registry.get('non-existent')
      expect(result).toBeUndefined()
    })
  })

  describe('list', () => {
    it('should list all tools', () => {
      registry.register(createMockTool({ id: 'tool-1' }))
      registry.register(createMockTool({ id: 'tool-2' }))
      const tools = registry.list()
      expect(tools).toHaveLength(2)
    })

    it('should return empty array when no tools', () => {
      const tools = registry.list()
      expect(tools).toHaveLength(0)
    })
  })

  describe('listByCategory', () => {
    it('should filter tools by category', () => {
      registry.register(createMockTool({ id: 'tool-1', category: 'generator' }))
      registry.register(createMockTool({ id: 'tool-2', category: 'dictionary' }))
      const generators = registry.listByCategory('generator')
      expect(generators).toHaveLength(1)
      expect(generators[0].id).toBe('tool-1')
    })
  })

  describe('listBuiltIn', () => {
    it('should list only built-in tools', () => {
      registry.register(createMockTool({ id: 'builtin', isCustom: false, isMcp: false }))
      registry.register(createMockTool({ id: 'custom', isCustom: true }))
      registry.register(createMockTool({ id: 'mcp', isMcp: true }))
      const builtins = registry.listBuiltIn()
      expect(builtins).toHaveLength(1)
      expect(builtins[0].id).toBe('builtin')
    })
  })

  describe('listMcp', () => {
    it('should list only MCP tools', () => {
      registry.register(createMockTool({ id: 'builtin', isMcp: false }))
      registry.register(createMockTool({ id: 'mcp', isMcp: true }))
      const mcpTools = registry.listMcp()
      expect(mcpTools).toHaveLength(1)
      expect(mcpTools[0].id).toBe('mcp')
    })
  })

  describe('listCustom', () => {
    it('should list only custom tools', () => {
      registry.register(createMockTool({ id: 'builtin', isCustom: false }))
      registry.register(createMockTool({ id: 'custom', isCustom: true }))
      const customTools = registry.listCustom()
      expect(customTools).toHaveLength(1)
      expect(customTools[0].id).toBe('custom')
    })
  })

  describe('search', () => {
    it('should find tools by name', () => {
      registry.register(createMockTool({ id: 'tool-1', name: 'Dictionary Lookup' }))
      registry.register(createMockTool({ id: 'tool-2', name: 'Plot Generator' }))
      const results = registry.search('dictionary')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('tool-1')
    })

    it('should find tools by description', () => {
      registry.register(createMockTool({ id: 'tool-1', description: 'Look up words in dictionary' }))
      const results = registry.search('words')
      expect(results).toHaveLength(1)
    })

    it('should be case insensitive', () => {
      registry.register(createMockTool({ id: 'tool-1', name: 'Dictionary' }))
      const results = registry.search('DICTIONARY')
      expect(results).toHaveLength(1)
    })

    it('should return empty for no matches', () => {
      registry.register(createMockTool())
      const results = registry.search('xyz123')
      expect(results).toHaveLength(0)
    })
  })

  describe('execute', () => {
    it('should execute tool successfully', async () => {
      const tool = createMockTool({
        execute: async () => ({ success: true, output: 'Hello World' })
      })
      registry.register(tool)
      const result = await registry.execute('test-tool', { text: 'test input' }, { projectId: 1, chapterId: 1 })
      expect(result.success).toBe(true)
      expect(result.output).toBe('Hello World')
    })

    it('should return error for non-existent tool', async () => {
      const result = await registry.execute('non-existent', { text: 'test' }, { projectId: 1, chapterId: 1 })
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should validate input when validator exists', async () => {
      const tool = createMockTool({
        validateInput: () => ({ valid: false, errors: ['Invalid input'] })
      })
      registry.register(tool)
      const result = await registry.execute('test-tool', { text: '' }, { projectId: 1, chapterId: 1 })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
    })

    it('should catch execution errors', async () => {
      const tool = createMockTool({
        execute: async () => { throw new Error('Execution failed') }
      })
      registry.register(tool)
      const result = await registry.execute('test-tool', { text: 'test' }, { projectId: 1, chapterId: 1 })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Execution failed')
    })
  })

  describe('crystallizeTool', () => {
    it('should return null when tool has no crystallize method', async () => {
      registry.register(createMockTool())
      const result = await registry.crystallizeTool('test-tool')
      expect(result).toBeNull()
    })

    it('should call tool crystallize method', async () => {
      const skill = {
        id: 'skill_1',
        name: 'TestSkill',
        toolId: 'test-tool',
        pattern: 'test.*',
        successCount: 5,
        avgRating: 4.5,
        lastUsed: new Date().toISOString(),
        code: 'test code',
        createdAt: Date.now()
      }
      const tool = createMockTool({
        crystallize: async () => skill
      })
      registry.register(tool)
      const result = await registry.crystallizeTool('test-tool')
      expect(result).toEqual(skill)
    })

    it('should return null when crystallize throws', async () => {
      const tool = createMockTool({
        crystallize: async () => { throw new Error('Crystallize failed') }
      })
      registry.register(tool)
      const result = await registry.crystallizeTool('test-tool')
      expect(result).toBeNull()
    })
  })

  describe('has', () => {
    it('should return true for existing tool', () => {
      registry.register(createMockTool())
      expect(registry.has('test-tool')).toBe(true)
    })

    it('should return false for non-existent tool', () => {
      expect(registry.has('non-existent')).toBe(false)
    })
  })

  describe('clearCustomTools', () => {
    it('should remove all custom tools', () => {
      registry.register(createMockTool({ id: 'builtin', isCustom: false }))
      registry.register(createMockTool({ id: 'custom1', isCustom: true }))
      registry.register(createMockTool({ id: 'custom2', isCustom: true }))
      registry.clearCustomTools()
      expect(registry.count()).toBe(1)
      expect(registry.has('builtin')).toBe(true)
      expect(registry.has('custom1')).toBe(false)
    })
  })

  describe('getCategories', () => {
    it('should return all unique categories', () => {
      registry.register(createMockTool({ id: 'tool-1', category: 'generator' }))
      registry.register(createMockTool({ id: 'tool-2', category: 'dictionary' }))
      registry.register(createMockTool({ id: 'tool-3', category: 'generator' }))
      const categories = registry.getCategories()
      expect(categories).toContain('generator')
      expect(categories).toContain('dictionary')
    })
  })
})
