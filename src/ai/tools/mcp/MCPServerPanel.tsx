/**
 * MCP Server Management Panel
 * UI for managing MCP server connections
 */

import { useState } from 'react'
import { mcpClient, type MCPServerConfig } from './client'

interface Props {
  onClose?: () => void
}

export function MCPServerPanel({ onClose }: Props) {
  const [servers, setServers] = useState<MCPServerConfig[]>(mcpClient.listServers())
  const [newServer, setNewServer] = useState({ name: '', url: '', description: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testingServer, setTestingServer] = useState<string | null>(null)

  const handleAddServer = () => {
    if (!newServer.name.trim() || !newServer.url.trim()) {
      setError('名称和URL不能为空')
      return
    }

    const id = `server_${Date.now()}`
    mcpClient.addServer({
      id,
      name: newServer.name.trim(),
      url: newServer.url.trim(),
      enabled: true,
      description: newServer.description.trim()
    })

    setServers(mcpClient.listServers())
    setNewServer({ name: '', url: '', description: '' })
    setIsAdding(false)
    setError(null)
  }

  const handleRemoveServer = (id: string) => {
    mcpClient.removeServer(id)
    setServers(mcpClient.listServers())
  }

  const handleToggleServer = (id: string) => {
    const server = servers.find(s => s.id === id)
    if (server) {
      mcpClient.updateServer(id, { enabled: !server.enabled })
      setServers(mcpClient.listServers())
    }
  }

  const handleTestConnection = async (id: string) => {
    setTestingServer(id)
    setError(null)
    try {
      await mcpClient.connectAndListTools(id)
      setError(null)
    } catch (e) {
      setError(`连接失败: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setTestingServer(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">MCP 服务器管理</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Server List */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {servers.length === 0 && !isAdding && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🔌</div>
            <div className="text-sm">暂无 MCP 服务器</div>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
            >
              + 添加服务器
            </button>
          </div>
        )}

        {servers.map(server => (
          <div
            key={server.id}
            className="mb-3 p-3 border rounded-lg bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={server.enabled}
                  onChange={() => handleToggleServer(server.id)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-800">{server.name}</div>
                  <div className="text-xs text-gray-500">{server.url}</div>
                  {server.description && (
                    <div className="text-xs text-gray-400 mt-1">{server.description}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTestConnection(server.id)}
                  disabled={!server.enabled || testingServer === server.id}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  {testingServer === server.id ? '测试中...' : '测试'}
                </button>
                <button
                  onClick={() => handleRemoveServer(server.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Server Form */}
        {isAdding && (
          <div className="mt-4 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
            <h3 className="font-medium mb-3">添加 MCP 服务器</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">名称</label>
                <input
                  type="text"
                  value={newServer.name}
                  onChange={e => setNewServer(s => ({ ...s, name: e.target.value }))}
                  placeholder="我的 MCP 服务器"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">服务器 URL</label>
                <input
                  type="text"
                  value={newServer.url}
                  onChange={e => setNewServer(s => ({ ...s, url: e.target.value }))}
                  placeholder="https://mcp.example.com/jsonrpc"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">描述（可选）</label>
                <input
                  type="text"
                  value={newServer.description}
                  onChange={e => setNewServer(s => ({ ...s, description: e.target.value }))}
                  placeholder="用于文件操作的 MCP 服务器"
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddServer}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  添加
                </button>
                <button
                  onClick={() => { setIsAdding(false); setError(null); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAdding && servers.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-3 w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            + 添加 MCP 服务器
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          MCP (Model Context Protocol) 允许连接外部工具服务器来扩展写作工具能力。
        </div>
      </div>
    </div>
  )
}
