/**
 * Tool Marketplace Grid - Browse and Search Marketplace Tools
 * V52: Grid layout for marketplace tool discovery
 */

import React, { useState, useEffect, useCallback } from 'react'
import { toolMarketplace, type MarketplaceListing, type ToolCategoryV3 } from '../ai/tools'
import { ToolCard } from './ToolCard'

// ============================================================================
// Types
// ============================================================================

interface ToolMarketplaceGridProps {
  onToolClick?: (toolId: string) => void
  initialCategory?: ToolCategoryV3 | null
}

// ============================================================================
// Tool Marketplace Grid Component
// ============================================================================

export function ToolMarketplaceGrid({ onToolClick, initialCategory = null }: ToolMarketplaceGridProps) {
  const [tools, setTools] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryV3 | null>(initialCategory)

  const loadTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const results = await toolMarketplace.searchTools(searchQuery, selectedCategory || undefined)
      setTools(results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tools')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    loadTools()
  }, [loadTools])

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadTools()
  }

  // Category options
  const categories: { value: ToolCategoryV3 | null; label: string }[] = [
    { value: null, label: '全部' },
    { value: 'material', label: '素材工具' },
    { value: 'character', label: '角色工具' },
    { value: 'plot', label: '情节工具' },
    { value: 'review', label: '审核工具' },
    { value: 'export', label: '导出工具' },
    { value: 'custom', label: '自定义' }
  ]

  if (loading && tools.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="tool-marketplace-grid">
      {/* Search and Filter Header */}
      <div className="bg-white rounded-t-lg border-b border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索工具名称或描述..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            搜索
          </button>
        </form>

        {/* Category Filter Tags */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => setSelectedCategory(value)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedCategory === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tools Grid */}
      <div className="p-4">
        {tools.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">未找到工具</p>
            <p className="text-sm mt-1">尝试调整搜索条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <ToolCard
                key={tool.toolId}
                tool={tool}
                onClick={() => onToolClick?.(tool.toolId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && tools.length > 0 && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Export
// ============================================================================

export default ToolMarketplaceGrid