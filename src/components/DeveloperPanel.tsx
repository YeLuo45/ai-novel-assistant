/**
 * Developer Panel - Developer Tools Management UI
 * V52: Developer dashboard for tool management, review submission, and stats
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  toolRegistryV3, 
  toolMarketplace, 
  type ToolDefinition,
  type ToolStats,
  type MarketplaceListing,
  type ToolCategoryV3,
  toolMarketplaceDb,
  type ToolCallLog
} from '../ai/tools'

// ============================================================================
// Types
// ============================================================================

interface DeveloperPanelProps {
  developerId: string
  onToolSelect?: (toolId: string) => void
}

interface ToolWithStats extends MarketplaceListing {
  stats?: ToolStats
  callLogs?: ToolCallLog[]
}

// ============================================================================
// Developer Panel Component
// ============================================================================

export function DeveloperPanel({ developerId, onToolSelect }: DeveloperPanelProps) {
  const [myTools, setMyTools] = useState<ToolWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [developerStats, setDeveloperStats] = useState<{ totalEarnings: number; totalCalls: number } | null>(null)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  // Load developer's tools
  const loadMyTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const tools = await toolMarketplace.getToolsByDeveloper(developerId)
      
      // Load stats for each tool
      const toolsWithStats = await Promise.all(
        tools.map(async (tool) => {
          try {
            const stats = await toolRegistryV3.getToolStats(tool.toolId)
            return { ...tool, stats }
          } catch {
            return { ...tool, stats: undefined }
          }
        })
      )

      setMyTools(toolsWithStats)

      // Load developer stats
      const stats = await toolMarketplaceDb.tool_developer_stats.get(developerId)
      if (stats) {
        setDeveloperStats({
          totalEarnings: stats.totalEarnings,
          totalCalls: stats.totalCalls
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tools')
    } finally {
      setLoading(false)
    }
  }, [developerId])

  useEffect(() => {
    loadMyTools()
  }, [loadMyTools])

  // Submit tool for review
  const handleSubmitForReview = async (toolId: string) => {
    try {
      await toolMarketplace.submitForReview(toolId)
      await loadMyTools()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit for review')
    }
  }

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="developer-panel bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">开发者面板</h2>
        <p className="text-sm text-gray-500 mt-1">管理您的工具并跟踪收益</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500">总收入</div>
          <div className="text-2xl font-bold text-primary-600">
            {developerStats?.totalEarnings || 0} Credits
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="text-sm text-gray-500">总调用次数</div>
          <div className="text-2xl font-bold text-primary-600">
            {developerStats?.totalCalls || 0}
          </div>
        </div>
      </div>

      {/* Tools List */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">我的工具</h3>
        
        {myTools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>您还没有注册任何工具</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTools.map((tool) => (
              <div
                key={tool.toolId}
                className={`border rounded-lg p-4 transition-shadow hover:shadow-md ${
                  selectedTool === tool.toolId ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'
                }`}
                onClick={() => {
                  setSelectedTool(tool.toolId)
                  onToolSelect?.(tool.toolId)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{tool.name}</h4>
                      <span className="text-sm text-gray-500">v{tool.version}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(tool.status)}`}>
                        {tool.status === 'approved' ? '已上线' : 
                         tool.status === 'pending' ? '审核中' : '已拒绝'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>分类: {tool.category}</span>
                      <span>下载: {tool.downloadCount}</span>
                      <span>评分: {tool.averageRating.toFixed(1)} ({tool.totalRatings})</span>
                      <span>费用: {tool.creditsPerCall} Credits/次</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {tool.stats && (
                      <div className="text-right text-xs text-gray-500">
                        <div>成功: {tool.stats.successfulCalls}</div>
                        <div>失败: {tool.stats.failedCalls}</div>
                      </div>
                    )}
                    
                    {tool.status === 'pending' && (
                      <span className="text-xs text-yellow-600">等待审核</span>
                    )}
                  </div>
                </div>

                {/* Tool Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  {tool.status === 'pending' && (
                    <button
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // View pending status
                      }}
                    >
                      查看状态
                    </button>
                  )}
                  {tool.stats && (
                    <button
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Show call logs
                      }}
                    >
                      调用日志
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Logs Section */}
      {selectedTool && (
        <ToolCallLogsPanel toolId={selectedTool} />
      )}
    </div>
  )
}

// ============================================================================
// Tool Call Logs Panel
// ============================================================================

interface ToolCallLogsPanelProps {
  toolId: string
}

function ToolCallLogsPanel({ toolId }: ToolCallLogsPanelProps) {
  const [logs, setLogs] = useState<ToolCallLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const allLogs = await toolMarketplaceDb.tool_call_logs
          .where('toolId')
          .equals(toolId)
          .reverse()
          .sortBy('createdAt')
        setLogs(allLogs.slice(0, 50)) // Last 50 calls
      } catch (e) {
        console.error('Failed to load call logs', e)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [toolId])

  if (loading) {
    return (
      <div className="p-6 border-t border-gray-200">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 border-t border-gray-200 bg-gray-50">
      <h4 className="text-sm font-medium text-gray-700 mb-3">最近调用日志</h4>
      
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">暂无调用记录</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`text-xs p-2 rounded ${
                log.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              <div className="flex justify-between">
                <span>{log.success ? '成功' : '失败'}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>消耗: {log.credits} Credits</span>
                <span>耗时: {log.duration}ms</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Category Filter Component
// ============================================================================

export function CategoryFilter({
  selected,
  onChange
}: {
  selected: ToolCategoryV3 | null
  onChange: (category: ToolCategoryV3 | null) => void
}) {
  const categories: { value: ToolCategoryV3 | null; label: string }[] = [
    { value: null, label: '全部' },
    { value: 'material', label: '素材' },
    { value: 'character', label: '角色' },
    { value: 'plot', label: '情节' },
    { value: 'review', label: '审核' },
    { value: 'export', label: '导出' },
    { value: 'custom', label: '自定义' }
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map(({ value, label }) => (
        <button
          key={label}
          onClick={() => onChange(value)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            selected === value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// Export
// ============================================================================

export default DeveloperPanel