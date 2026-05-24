import { useState, useMemo, useEffect, useCallback } from 'react'
import { toolRegistryV2, ToolRegistryV2 } from '@/ai/tools/ToolRegistry'
import { executeInSandboxV2 } from '@/ai/tools/SandboxV2'
import { DictionaryTool } from '@/ai/tools/builtIn/DictionaryTool'
import { CharacterRelationTool } from '@/ai/tools/builtIn/CharacterRelationTool'
import { PlotGeneratorTool } from '@/ai/tools/builtIn/PlotGeneratorTool'
import { SceneDescriptionTool } from '@/ai/tools/builtIn/SceneDescriptionTool'
import type { WritingToolV2, ToolInput } from '@/ai/tools/types'

const CATEGORY_LABELS: Record<string, string> = {
  dictionary: '字典查询',
  generator: '生成器',
  search: '搜索',
  analysis: '分析',
  creative: '创作',
  mcp: 'MCP工具',
  custom: '自定义'
}

const CATEGORY_ICONS: Record<string, string> = {
  dictionary: '📖',
  generator: '🧩',
  search: '🔍',
  analysis: '📊',
  creative: '🎨',
  mcp: '🔌',
  custom: '✏️'
}

interface Props {
  projectId: number
  chapterId: number
}

type TabType = 'builtin' | 'mcp' | 'custom'

export function ToolPanelV2({ projectId, chapterId }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('builtin')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<WritingToolV2 | null>(null)
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<{ success: boolean; output: string; error?: string; executionTime?: number } | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionHistory, setExecutionHistory] = useState<Array<{ toolId: string; toolName: string; input: string; success: boolean; timestamp: number; executionTime: number }>>([])

  // Initialize built-in tools on mount
  useEffect(() => {
    if (toolRegistryV2.count() === 0) {
      toolRegistryV2.register(DictionaryTool)
      toolRegistryV2.register(CharacterRelationTool)
      toolRegistryV2.register(PlotGeneratorTool)
      toolRegistryV2.register(SceneDescriptionTool)
    }
  }, [])

  const tools = useMemo(() => {
    switch (activeTab) {
      case 'builtin':
        return toolRegistryV2.listBuiltIn()
      case 'mcp':
        return toolRegistryV2.listMcp()
      case 'custom':
        return toolRegistryV2.listCustom()
      default:
        return []
    }
  }, [activeTab])

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

  const handleToolSelect = useCallback((tool: WritingToolV2) => {
    setSelectedTool(tool)
    setInputText('')
    setResult(null)
  }, [])

  const handleExecute = useCallback(async () => {
    if (!selectedTool || !inputText.trim()) return

    setIsExecuting(true)
    setResult(null)

    try {
      const toolInput: ToolInput = { text: inputText, context: { projectId, chapterId } }
      const execResult = await executeInSandboxV2(selectedTool, toolInput, { projectId, chapterId })

      setResult({
        success: execResult.success,
        output: execResult.output,
        error: execResult.error,
        executionTime: execResult.metadata?.executionTime as number
      })

      setExecutionHistory(prev => [{
        toolId: selectedTool.id,
        toolName: selectedTool.name,
        input: inputText,
        success: execResult.success,
        timestamp: Date.now(),
        executionTime: execResult.metadata?.executionTime as number || 0
      }, ...prev].slice(0, 50))
    } catch (error) {
      setResult({
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsExecuting(false)
    }
  }, [selectedTool, inputText, projectId, chapterId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleExecute()
    }
  }, [handleExecute])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => { setActiveTab('builtin'); setSelectedTool(null); }}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'builtin'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          🛠️ 内建工具
        </button>
        <button
          onClick={() => { setActiveTab('mcp'); setSelectedTool(null); }}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'mcp'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          🔌 MCP工具
        </button>
        <button
          onClick={() => { setActiveTab('custom'); setSelectedTool(null); }}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'custom'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          ✏️ 自定义工具
        </button>
      </div>

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
              className={`px-2 py-1 text-xs rounded transition-colors ${
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
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
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
                {activeTab === 'mcp' ? '暂无MCP工具，请先连接MCP服务器' :
                 activeTab === 'custom' ? '暂无自定义工具' : '未找到工具'}
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
                      <span className="text-xl">{tool.icon || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {tool.description}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        v{tool.version || '1.0'}
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
                <div className="text-xs mt-1">按 Ctrl+Enter 执行</div>
              </div>
            </div>
          ) : (
            <>
              {/* Tool Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTool.icon || '📦'}</span>
                  <div>
                    <h3 className="font-medium text-gray-800">{selectedTool.name}</h3>
                    <p className="text-sm text-gray-500">{selectedTool.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 px-2 py-1 bg-gray-200 rounded">
                    {CATEGORY_LABELS[selectedTool.category] || selectedTool.category}
                  </span>
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
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      <pre className="whitespace-pre-wrap font-sans">{result.error || result.output}</pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom: Execution History */}
      {executionHistory.length > 0 && (
        <div className="border-t bg-gray-50 p-2 max-h-32 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-1">最近执行</div>
          <div className="flex gap-2 overflow-x-auto">
            {executionHistory.slice(0, 10).map((record, index) => (
              <div
                key={index}
                className={`flex-shrink-0 px-2 py-1 rounded text-xs ${
                  record.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {record.toolName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolPanelV2
