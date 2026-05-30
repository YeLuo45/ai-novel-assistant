/**
 * MCPServerAdapter Tests
 * V51: Test suite for MCP server adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock child_process before importing MCPServerAdapter
vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    pid: 12345,
    stdin: { write: vi.fn(), on: vi.fn() },
    stdout: { on: vi.fn(), off: vi.fn() },
    stderr: { on: vi.fn(), off: vi.fn() },
    kill: vi.fn(),
    on: vi.fn((event: string, cb: (code: number) => void) => {
      if (event === 'close') {
        setTimeout(() => cb(0), 10)
      }
    })
  }))
}))

import { MCPServerAdapter } from './MCPServerAdapter'

describe('MCPServerAdapter', () => {
  let adapter: MCPServerAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new MCPServerAdapter()
  })

  describe('Tool Registration', () => {
    it('should register a local tool', () => {
      const tool = {
        id: 'test-tool',
        name: 'testTool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const, properties: {} },
        execute: async () => ({ success: true, output: 'test' })
      }

      adapter.registerLocalTool(tool)

      const tools = adapter.getLocalTools()
      expect(tools.some(t => t.id === 'test-tool')).toBe(true)
    })

    it('should unregister a local tool', () => {
      const tool = {
        id: 'test-tool',
        name: 'testTool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const, properties: {} },
        execute: async () => ({ success: true, output: 'test' })
      }

      adapter.registerLocalTool(tool)
      const removed = adapter.unregisterLocalTool('test-tool')

      expect(removed).toBe(true)
      expect(adapter.getLocalTools().some(t => t.id === 'test-tool')).toBe(false)
    })

    it('should return false when unregistering non-existent tool', () => {
      const removed = adapter.unregisterLocalTool('nonexistent')
      expect(removed).toBe(false)
    })

    it('should have built-in tools by default', () => {
      const tools = adapter.getLocalTools()
      expect(tools.length).toBeGreaterThan(0)
      // Check for expected built-in tools
      const toolNames = tools.map(t => t.name)
      expect(toolNames).toContain('queryMaterials')
      expect(toolNames).toContain('generateCharacter')
      expect(toolNames).toContain('suggestPlot')
    })
  })

  describe('Request Handling', () => {
    it('should handle initialize request', async () => {
      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {},
        id: 1
      })

      expect(response.jsonrpc).toBe('2.0')
      expect(response.id).toBe(1)
      expect(response.result).toBeDefined()
      expect((response.result as any).protocolVersion).toBe('2024-11-05')
    })

    it('should handle tools/list request', async () => {
      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      })

      expect(response.jsonrpc).toBe('2.0')
      expect(response.id).toBe(2)
      expect((response.result as any).tools).toBeDefined()
      expect(Array.isArray((response.result as any).tools)).toBe(true)
    })

    it('should handle tools/call request for built-in tool', async () => {
      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'queryMaterials',
          arguments: { keyword: 'test' }
        },
        id: 3
      })

      expect(response.jsonrpc).toBe('2.0')
      expect(response.id).toBe(3)
      expect(response.result).toBeDefined()
    })

    it('should return error for non-existent tool', async () => {
      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'nonexistentTool',
          arguments: {}
        },
        id: 4
      })

      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe(-32602)
    })

    it('should handle unknown methods with error', async () => {
      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'unknown/method',
        params: {},
        id: 5
      })

      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe(-32601)
      expect(response.error?.message).toContain('Method not found')
    })

    it('should handle shutdown request', async () => {
      adapter.start() // Ensure initialized

      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'shutdown',
        params: {},
        id: 6
      })

      expect(response.jsonrpc).toBe('2.0')
      expect(response.id).toBe(6)
      expect(response.result).toEqual({})
    })

    it('should handle notifications without id', async () => {
      const response = await adapter.handleRequest({
        jsonrpc: '2.0',
        method: 'initialized',
        params: {}
        // No id - should be treated as notification
      })

      // Should return empty response for notifications
      expect(response.jsonrpc).toBe('2.0')
      // Notification responses are empty
    })
  })

  describe('Lifecycle', () => {
    it('should start and stop without error', () => {
      adapter.start()
      adapter.stop()
      // No error means success
    })

    it('should allow multiple start calls without error', () => {
      adapter.start()
      adapter.start() // Should not throw
      adapter.stop()
    })
  })
})

describe('MCPServerAdapter Type Exports', () => {
  it('should export LocalToolDefinition type', () => {
    const tool: import('./types').LocalToolDefinition = {
      id: 'test',
      name: 'test',
      description: 'test',
      inputSchema: { type: 'object' as const, properties: {} },
      execute: async () => ({ success: true, output: 'test' })
    }
    expect(tool.id).toBe('test')
  })

  it('should export MCPToolResult type', () => {
    const result: import('./types').MCPToolResult = {
      success: true,
      output: 'test'
    }
    expect(result.success).toBe(true)
  })
})