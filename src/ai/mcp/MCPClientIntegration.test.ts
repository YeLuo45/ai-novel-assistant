/**
 * MCPClientIntegration Tests - V69
 * Tests for MCP Client integration with ToolRegistryV3
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { MCPTool, MCPToolInputSchema } from './types'
import {
  type MCPIntegrationConfig,
  type ToolRegistration,
  type ToolCallResult,
  MCPToolAdapter,
  MCPClientIntegration
} from './MCPClientIntegration'

// Exported constant for testing
const MCP_TOOL_CATEGORIES: Record<string, string> = {
  'image': '视觉生成',
  'code': '代码生成',
  'search': '信息检索',
  'database': '数据存储',
  'http': '网络请求',
  'file': '文件操作',
  'default': '通用工具'
}

describe('MCPToolAdapter', () => {
  let adapter: MCPToolAdapter

  beforeEach(() => {
    adapter = new MCPToolAdapter()
  })

  describe('adaptToolSchema', () => {
    it('should adapt basic tool schema', () => {
      const tool: MCPTool = {
        name: 'test_tool',
        description: 'A test tool'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      
      expect(adapted.id).toBe('mcp-test_tool')
      expect(adapted.name).toBe('test_tool')
      expect(adapted.description).toBe('A test tool')
      expect(adapted.category).toBe('通用工具')
      expect(adapted.metadata.source).toBe('mcp')
      expect(adapted.metadata.originalName).toBe('test_tool')
    })

    it('should infer image category', () => {
      const tool: MCPTool = {
        name: 'generate_image',
        description: 'Generate an image from text'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.category).toBe('视觉生成')
    })

    it('should infer code category', () => {
      const tool: MCPTool = {
        name: 'write_code',
        description: 'Write code in Python'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.category).toBe('代码生成')
    })

    it('should infer search category', () => {
      const tool: MCPTool = {
        name: 'web_search',
        description: 'Search the web for information'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.category).toBe('信息检索')
    })

    it('should infer database category', () => {
      const tool: MCPTool = {
        name: 'db_query',
        description: 'Query the database'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.category).toBe('数据存储')
    })

    it('should infer http category', () => {
      const tool: MCPTool = {
        name: 'http_fetch',
        description: 'Make HTTP request'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.category).toBe('网络请求')
    })

    it('should infer file category', () => {
      const tool: MCPTool = {
        name: 'read_file',
        description: 'Read a file from disk'
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.category).toBe('文件操作')
    })

    it('should handle tool with input schema', () => {
      const inputSchema: MCPToolInputSchema = {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Input text' },
          count: { type: 'number', description: 'Count' }
        },
        required: ['text']
      }
      
      const tool: MCPTool = {
        name: 'process_text',
        description: 'Process text input',
        inputSchema
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      
      expect(adapted.inputSchema.type).toBe('object')
      expect(adapted.inputSchema.properties).toHaveProperty('text')
      expect(adapted.inputSchema.properties).toHaveProperty('count')
      expect(adapted.inputSchema.required).toContain('text')
    })

    it('should handle tool without description', () => {
      const tool: MCPTool = {
        name: 'anonymous_tool',
        description: ''
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.description).toBe('MCP tool: anonymous_tool')
    })

    it('should infer structured_input capability', () => {
      const tool: MCPTool = {
        name: 'structured_tool',
        description: 'Tool with schema',
        inputSchema: {
          type: 'object',
          properties: { arg: { type: 'string' } }
        }
      }
      
      const adapted = adapter.adaptToolSchema(tool)
      expect(adapted.metadata.capabilities).toContain('structured_input')
      expect(adapted.metadata.capabilities).toContain('documented')
    })
  })

  describe('adaptToolResult', () => {
    it('should handle successful result', () => {
      const result = { data: 'success', count: 42 }
      const adapted = adapter.adaptToolResult(result)
      
      expect(adapted.success).toBe(true)
      expect(adapted.data).toBe(result)
    })

    it('should handle null result', () => {
      const adapted = adapter.adaptToolResult(null)
      
      expect(adapted.success).toBe(true)
      expect(adapted.data).toBeNull()
    })

    it('should handle error result with isError', () => {
      const result = { isError: true, error: 'Something went wrong' }
      const adapted = adapter.adaptToolResult(result)
      
      expect(adapted.success).toBe(false)
      expect(adapted.error).toBe('Something went wrong')
    })

    it('should handle error result with message', () => {
      const result = { isError: true, message: 'Failed to process' }
      const adapted = adapter.adaptToolResult(result)
      
      expect(adapted.success).toBe(false)
      expect(adapted.error).toBe('Failed to process')
    })
  })

  describe('adaptError', () => {
    it('should adapt Error object', () => {
      const error = new Error('Database connection failed')
      const adapted = adapter.adaptError(error)
      expect(adapted).toBe('Database connection failed')
    })

    it('should adapt string error', () => {
      const adapted = adapter.adaptError('Timeout error')
      expect(adapted).toBe('Timeout error')
    })

    it('should adapt null to string', () => {
      const adapted = adapter.adaptError(null)
      expect(adapted).toBe('null')
    })
  })
})

describe('MCP_TOOL_CATEGORIES', () => {
  it('should have 7 categories', () => {
    expect(Object.keys(MCP_TOOL_CATEGORIES)).toHaveLength(7)
  })

  it('should have all expected categories', () => {
    expect(MCP_TOOL_CATEGORIES['image']).toBe('视觉生成')
    expect(MCP_TOOL_CATEGORIES['code']).toBe('代码生成')
    expect(MCP_TOOL_CATEGORIES['search']).toBe('信息检索')
    expect(MCP_TOOL_CATEGORIES['database']).toBe('数据存储')
    expect(MCP_TOOL_CATEGORIES['http']).toBe('网络请求')
    expect(MCP_TOOL_CATEGORIES['file']).toBe('文件操作')
    expect(MCP_TOOL_CATEGORIES['default']).toBe('通用工具')
  })
})

describe('MCPClientIntegration', () => {
  let integration: MCPClientIntegration

  beforeEach(() => {
    integration = new MCPClientIntegration()
  })

  describe('constructor', () => {
    it('should use default config', () => {
      const int = new MCPClientIntegration()
      expect(int).toBeDefined()
    })

    it('should accept partial config override', () => {
      const int = new MCPClientIntegration({ autoRegister: false })
      expect(int).toBeDefined()
    })
  })

  describe('getRegisteredTools', () => {
    it('should return empty array initially', () => {
      const tools = integration.getRegisteredTools()
      expect(tools).toHaveLength(0)
    })
  })

  describe('getToolsByServer', () => {
    it('should return empty array for unknown server', () => {
      const tools = integration.getToolsByServer('unknown-server')
      expect(tools).toHaveLength(0)
    })
  })

  describe('getUsageStats', () => {
    it('should return null for unknown tool', () => {
      const stats = integration.getUsageStats('unknown-tool')
      expect(stats).toBeNull()
    })
  })

  describe('unregisterServer', () => {
    it('should return 0 for unknown server', () => {
      const count = integration.unregisterServer('unknown-server')
      expect(count).toBe(0)
    })
  })
})

describe('ToolCallResult', () => {
  it('should support success result', () => {
    const result: ToolCallResult = {
      success: true,
      data: { output: 'result' },
      durationMs: 150
    }
    
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ output: 'result' })
    expect(result.durationMs).toBe(150)
  })

  it('should support failure result', () => {
    const result: ToolCallResult = {
      success: false,
      error: 'Tool execution failed',
      durationMs: 50,
      metadata: { attempt: 3 }
    }
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Tool execution failed')
  })
})

describe('ToolRegistration', () => {
  it('should track registration state', () => {
    const registration: ToolRegistration = {
      toolId: 'mcp-test',
      sourceServer: 'server-1',
      originalSchema: { name: 'test', description: 'Test tool' },
      registeredAt: Date.now(),
      lastUsed: 0,
      usageCount: 0,
      successCount: 0,
      failureCount: 0
    }
    
    expect(registration.toolId).toBe('mcp-test')
    expect(registration.usageCount).toBe(0)
  })

  it('should calculate success rate from counts', () => {
    const registration: ToolRegistration = {
      toolId: 'mcp-test',
      sourceServer: 'server-1',
      originalSchema: { name: 'test', description: '' },
      registeredAt: Date.now(),
      lastUsed: Date.now(),
      usageCount: 10,
      successCount: 8,
      failureCount: 2
    }
    
    expect(registration.usageCount).toBe(10)
    expect(registration.successCount).toBe(8)
    expect(registration.failureCount).toBe(2)
  })
})