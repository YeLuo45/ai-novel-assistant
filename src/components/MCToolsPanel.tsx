/**
 * MCP Tools Panel - UI for MCP Tool Bridge
 * V51: Panel for managing MCP tools and connections
 */

import { useState, useEffect } from 'react'
import { mcpClient, mcpServerAdapter, type MCPServerConfig, type MCPTool } from '@/ai/mcp'
import { registerLocalToolsToAdapter } from '@/ai/mcp/localTools'

interface Props {
  onClose?: () => void
}

export function MCToolsPanel({ onClose }: Props) {
  const [servers, setServers] = useState<MCPServerConfig[]>([])
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [tools, setTools] = useState<MCPTool[]>([])
  const [newServer, setNewServer] = useState({ name: '', command: '', args: '', description: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'servers' | 'local'>('servers')

  // Tool call form
  const [callForm, setCallForm] = useState({ toolName: '', args: '{}' })
  const [callResult, setCallResult] = useState<string | null>(null)
  const [callingTool, setCallingTool] = useState(false)

  useEffect(() => {
    setServers(mcpClient.listServers())
    // Register local tools to adapter
    registerLocalToolsToAdapter(mcpServerAdapter)
  }, [])

  const handleAddServer = () => {
    if (!newServer.name.trim() || !newServer.command.trim()) {
      setError('名称和命令不能为空')
      return
    }

    const id = `server_${Date.now()}`
    const args = newServer.args.trim() ? newServer.args.split(' ').filter(a => a) : []

    mcpClient.addServer({
      id,
      name: newServer.name.trim(),
      command: newServer.command.trim(),
      args,
      enabled: true,
      description: newServer.description.trim()
    })

    setServers(mcpClient.listServers())
    setNewServer({ name: '', command: '', args: '', description: '' })
    setIsAdding(false)
    setError(null)
  }

  const handleConnect = async (serverId: string) => {
    setConnecting(serverId)
    setError(null)
    try {
      await mcpClient.connect(serverId)
      const serverInfo = mcpClient.getConnectedServer(serverId)
      if (serverInfo) {
        const serverTools = await mcpClient.listTools(serverId)
        setTools(serverTools)
        setSelectedServer(serverId)
      }
    } catch (e) {
      setError(`连接失败: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (serverId: string) => {
    await mcpClient.disconnect(serverId)
    if (selectedServer === serverId) {
      setSelectedServer(null)
      setTools([])
    }
    setServers(mcpClient.listServers())
  }

  const handleRemoveServer = (id: string) => {
    mcpClient.removeServer(id)
    setServers(mcpClient.listServers())
    if (selectedServer === id) {
      setSelectedServer(null)
      setTools([])
    }
  }

  const handleCallTool = async () => {
    if (!selectedServer || !callForm.toolName) {
      setCallResult('请选择服务器和工具')
      return
    }

    setCallingTool(true)
    setCallResult(null)

    try {
      const args = JSON.parse(callForm.args)
      const result = await mcpClient.callTool(selectedServer, callForm.toolName, args)
      setCallResult(result.success ? result.output : `Error: ${result.error}`)
    } catch (e) {
      setCallResult(`执行失败: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setCallingTool(false)
    }
  }

  const localTools = mcpServerAdapter.getLocalTools()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-medium">MCP 工具桥</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'servers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('servers')}
        >
          外部服务器
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'local' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('local')}
        >
          本地工具 ({localTools.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'servers' && (
          <>
            {/* Server List */}
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

            {/* Server Items */}
            {servers.map(server => {
              const isConnected = mcpClient.isConnected(server.id)
              return (
                <div
                  key={server.id}
                  className="mb-3 p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-800">
                        {server.name}
                        {isConnected && <span className="ml-2 text-xs text-green-600">● 已连接</span>}
                      </div>
                      <div className="text-xs text-gray-500">{server.command} {server.args?.join(' ')}</div>
                      {server.description && (
                        <div className="text-xs text-gray-400 mt-1">{server.description}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isConnected ? (
                        <button
                          onClick={() => handleConnect(server.id)}
                          disabled={connecting === server.id}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          {connecting === server.id ? '连接中...' : '连接'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisconnect(server.id)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          断开
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveServer(server.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Tool invocation when connected */}
            {selectedServer && tools.length > 0 && (
              <div className="mt-4 p-4 border rounded-lg bg-indigo-50">
                <h3 className="font-medium mb-3">调用工具</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">选择工具</label>
                    <select
                      value={callForm.toolName}
                      onChange={e => setCallForm(f => ({ ...f, toolName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded"
                    >
                      <option value="">-- 选择工具 --</option>
                      {tools.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">参数 (JSON)</label>
                    <textarea
                      value={callForm.args}
                      onChange={e => setCallForm(f => ({ ...f, args: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border rounded font-mono"
                      rows={3}
                      placeholder='{"key": "value"}'
                    />
                  </div>
                  <button
                    onClick={handleCallTool}
                    disabled={callingTool || !callForm.toolName}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {callingTool ? '执行中...' : '执行'}
                  </button>
                  {callResult && (
                    <div className="mt-3 p-2 bg-white border rounded text-sm font-mono whitespace-pre-wrap">
                      {callResult}
                    </div>
                  )}
                </div>
              </div>
            )}

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
                    <label className="block text-sm text-gray-600 mb-1">命令</label>
                    <input
                      type="text"
                      value={newServer.command}
                      onChange={e => setNewServer(s => ({ ...s, command: e.target.value }))}
                      placeholder="npx"
                      className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">参数 (空格分隔)</label>
                    <input
                      type="text"
                      value={newServer.args}
                      onChange={e => setNewServer(s => ({ ...s, args: e.target.value }))}
                      placeholder="@modelcontextprotocol/server-filesystem /path/to/dir"
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
          </>
        )}

        {activeTab === 'local' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              以下是 ai-novel-assistant 暴露给外部 MCP 客户端的本地工具：
            </p>
            {localTools.map(tool => (
              <div key={tool.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="font-medium text-gray-800">{tool.name}</div>
                <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                <div className="mt-2 text-xs text-gray-400">
                  参数: {Object.keys(tool.inputSchema.properties || {}).join(', ') || '无'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-500">
          MCP (Model Context Protocol) 外部工具桥 - V51
        </div>
      </div>
    </div>
  )
}

export default MCToolsPanel