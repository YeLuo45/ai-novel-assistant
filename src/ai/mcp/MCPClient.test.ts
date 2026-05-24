/**
 * MCPClient Tests
 * V51: Test suite for MCP external tool bridge client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock child_process before importing MCPClient
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

import { MCPClient } from './MCPClient'

describe('MCPClient', () => {
  let client: MCPClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new MCPClient({ timeout: 5000, retries: 2, retryDelay: 100 })
  })

  describe('Server Management', () => {
    it('should add a server configuration', () => {
      client.addServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'npx',
        args: ['test-server'],
        enabled: true
      })

      const servers = client.listServers()
      expect(servers).toHaveLength(1)
      expect(servers[0].id).toBe('test-server')
      expect(servers[0].name).toBe('Test Server')
    })

    it('should remove a server configuration', () => {
      client.addServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'npx',
        enabled: true
      })

      client.removeServer('test-server')
      expect(client.listServers()).toHaveLength(0)
    })

    it('should update server configuration', () => {
      client.addServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'npx',
        enabled: true
      })

      client.updateServer('test-server', { name: 'Updated Server', enabled: false })

      const servers = client.listServers()
      expect(servers[0].name).toBe('Updated Server')
      expect(servers[0].enabled).toBe(false)
    })
  })

  describe('Connection State', () => {
    it('should report not connected initially', () => {
      client.addServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'npx',
        enabled: true
      })

      expect(client.isConnected('test-server')).toBe(false)
    })

    it('should return null for unconnected server info', () => {
      expect(client.getConnectedServer('nonexistent')).toBeNull()
    })
  })

  describe('Local Tools', () => {
    it('should register and retrieve local tools', () => {
      const toolDef = {
        id: 'test-tool',
        name: 'testTool',
        description: 'A test tool',
        inputSchema: { type: 'object' as const, properties: {} },
        execute: async () => ({ success: true, output: 'test output' })
      }

      client.registerLocalTool(toolDef)

      const tools = client.getLocalTools()
      expect(tools).toHaveLength(1)
      expect(tools[0].id).toBe('test-tool')
    })
  })

  describe('Retry Logic', () => {
    it('should expose executeWithRetry method', async () => {
      const result = await client.executeWithRetry('nonexistent', 'testTool', {})
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('output')
      expect(result).toHaveProperty('error')
    })
  })

  describe('connect and disconnect', () => {
    it('should throw error when connecting to non-existent server', async () => {
      await expect(client.connect('nonexistent')).rejects.toThrow('Server nonexistent not found')
    })

    it('should throw error when server has no command', async () => {
      client.addServer({
        id: 'url-server',
        name: 'URL Server',
        url: 'https://example.com',
        enabled: true
      })

      await expect(client.connect('url-server')).rejects.toThrow('has no command configured')
    })

    it('should disconnect from server', async () => {
      client.addServer({
        id: 'test-server',
        name: 'Test Server',
        command: 'npx',
        args: ['test'],
        enabled: true
      })

      await expect(client.disconnect('test-server')).resolves.not.toThrow()
    })
  })
})

describe('MCPClient Type Exports', () => {
  it('should export MCPServerConfig type', () => {
    const config: import('./types').MCPServerConfig = {
      id: 'test',
      name: 'Test',
      enabled: true
    }
    expect(config.id).toBe('test')
  })

  it('should export MCPTool type', () => {
    const tool: import('./types').MCPTool = {
      name: 'testTool',
      description: 'A test tool'
    }
    expect(tool.name).toBe('testTool')
  })

  it('should export MCPToolResult type', () => {
    const result: import('./types').MCPToolResult = {
      success: true,
      output: 'test'
    }
    expect(result.success).toBe(true)
  })
})
