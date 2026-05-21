import { useState, useMemo } from 'react'
import { toolRegistry, type WritingTool } from '@/ai/tools/registry'
import { executeInSandbox, getExecutionHistory, getToolUsageStats, type ToolExecutionRecord } from '@/ai/tools/sandbox'

const CATEGORY_LABELS: Record<string, string> = {
  text: '文本处理',
  search: '搜索查询',
  calc: '数据计算',
  media: '媒体处理',
  mcp: 'MCP工具'
}

const CATEGORY_ICONS: Record<string, string> = {
  text: '📝',
  search: '🔍',
  calc: '🧮',
  media: '🎬',
  mcp: '🔌'
}

interface Props {
  projectId: number
  chapterId: number
}

export function ToolPanel({ projectId, chapterId }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<WritingTool | null>(null)
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<{ success: boolean; output: string; executionTime?: number } | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [activeTab, setActiveTab] = useState<'tools' | 'history' | 'stats'>('tools')
  const [executionHistory, setExecutionHistory] = useState<ToolExecutionRecord[]>([])

  const tools = useMemo(() => toolRegistry.list(), [])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = searchQuery === '' ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === null || tool.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, selectedCategory])

  const categories = useMemo(() => {
    const cats = new Set(tools.map(t => t.category))
    return Array.from(cats)
  }, [tools])

  const handleToolSelect = (tool: WritingTool) => {
    setSelectedTool(tool)
    setInputText('')
    setResult(null)
  }

  const handleExecute = async () => {
    if (!selectedTool || !inputText.trim()) return

    setIsExecuting(true)
    setResult(null)

    try {
      // Use sandbox for execution
      const execResult = await executeInSandbox(selectedTool, inputText, { projectId, chapterId })
      setResult(execResult)
      // Refresh history
      setExecutionHistory(getExecutionHistory(20))
    } catch (error) {
      setResult({
        success: false,
        output: `执行错误: ${error instanceof Error ? error.message : String(error)}`
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleExecute()
    }
  }

  const usageStats = useMemo(() => {
    if (activeTab !== 'stats') return {}
    return getToolUsageStats()
  }, [activeTab, executionHistory])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'tools'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🛠️ 工具
        </button>
        <button
          onClick={() => { setActiveTab('history'); setExecutionHistory(getExecutionHistory(20)); }}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'history'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 历史
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'stats'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 统计
        </button>
      </div>

      {activeTab === 'tools' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Tool List */}
          <div className="w-72 border-r flex flex-col">
            {/* Search */}
            <div className="p-3 border-b">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索工具..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="p-2 border-b flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategory === null
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                    selectedCategory === cat
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span>{CATEGORY_LABELS[cat] || cat}</span>
                </button>
              ))}
            </div>

            {/* Tool List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredTools.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  未找到工具
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool)}
                      className={`w-full p-3 text-left rounded-lg transition-colors ${
                        selectedTool?.id === tool.id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-800 truncate">
                            {tool.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {tool.description}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {CATEGORY_ICONS[tool.category]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Tool Execution */}
          <div className="flex-1 flex flex-col">
            {!selectedTool ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">🛠️</div>
                  <div className="text-sm">选择左侧工具开始使用</div>
                </div>
              </div>
            ) : (
              <>
                {/* Tool Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedTool.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-800">{selectedTool.name}</h3>
                      <p className="text-sm text-gray-500">{selectedTool.description}</p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      输入内容
                    </label>
                    <textarea
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入要处理的文本..."
                      className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleExecute}
                    disabled={!inputText.trim() || isExecuting}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecuting ? '执行中...' : '执行 (Ctrl+Enter)'}
                  </button>

                  {/* Result Area */}
                  {result && (
                    <div className="mt-4 flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        结果
                        {result.success ? (
                          <span className="ml-2 text-green-600">✓</span>
                        ) : (
                          <span className="ml-2 text-red-600">✗</span>
                        )}
                        {result.executionTime !== undefined && (
                          <span className="ml-2 text-gray-400 text-xs">({result.executionTime}ms)</span>
                        )}
                      </label>
                      <div className={`p-3 rounded border text-sm h-40 overflow-auto ${
                        result.success
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <pre className="whitespace-pre-wrap font-sans">{result.output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex-1 overflow-auto p-4">
          {executionHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📜</div>
              <div className="text-sm">暂无执行历史</div>
            </div>
          ) : (
            <div className="space-y-3">
              {executionHistory.map((record, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{record.toolName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        record.result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {record.result.success ? '成功' : '失败'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(record.timestamp).toLocaleTimeString()} · {record.result.executionTime}ms
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 truncate">{record.input}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="flex-1 overflow-auto p-4">
          {Object.keys(usageStats).length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm">暂无统计数据</div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">工具使用统计</h3>
              {Object.entries(usageStats).map(([toolId, stats]) => {
                const tool = tools.find(t => t.id === toolId)
                return (
                  <div key={toolId} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tool?.icon || '📦'}</span>
                        <span className="font-medium text-gray-800">{tool?.name || toolId}</span>
                      </div>
                      <span className="text-sm text-gray-500">使用 {stats.count} 次</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, stats.count * 10)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      平均执行时间: {stats.avgExecutionTime}ms
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ToolPanel
