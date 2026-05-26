/**
 * ToolSmartMarket - V57
 * Smart Tool Marketplace with search, filter, and sorting
 */

import { h } from 'preact'
import { useState, useMemo } from 'preact/hooks'
import { ToolCard } from './ToolCard'
import { MarketFilters } from './MarketFilters'
import type { ToolListing, MarketFilters as MarketFiltersType, ToolCategory } from './toolMarketTypes'
import { filterAndSortTools, generateMockTools, TOOL_CATEGORIES } from './toolMarketTypes'

export interface ToolSmartMarketProps {
  initialTools?: ToolListing[]
  onToolSelect?: (tool: ToolListing) => void
  className?: string
}

export function ToolSmartMarket({
  initialTools,
  onToolSelect,
  className = ''
}: ToolSmartMarketProps) {
  const [tools] = useState<ToolListing[]>(initialTools || generateMockTools(15))
  const [filters, setFilters] = useState<MarketFiltersType>({ sortBy: 'downloads' })
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)

  const filteredTools = useMemo(() => filterAndSortTools(tools, filters), [tools, filters])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length }
    for (const tool of tools) {
      counts[tool.category] = (counts[tool.category] || 0) + 1
    }
    return counts
  }, [tools])

  const handleCategoryChange = (category: ToolCategory | undefined) => {
    setFilters(prev => ({ ...prev, category }))
  }

  const handleSortChange = (sortBy: MarketFiltersType['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }))
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleToolClick = (tool: ToolListing) => {
    setSelectedToolId(tool.id === selectedToolId ? null : tool.id)
    onToolSelect?.(tool)
  }

  return (
    <div class={`tool-smart-market ${className}`} style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: 0, marginBottom: 4 }}>
          🛒 Tool Smart Market
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
          {tools.length} tools available • {filteredTools.length} shown
        </p>
      </div>

      {/* Filters */}
      <MarketFilters
        filters={filters}
        categoryCounts={categoryCounts}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
      />

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => handleCategoryChange(undefined)}
          style={{
            padding: '6px 12px',
            borderRadius: 16,
            border: filters.category === undefined ? '2px solid #3B82F6' : '1px solid #E5E7EB',
            background: filters.category === undefined ? '#EFF6FF' : '#FFFFFF',
            fontSize: 12,
            cursor: 'pointer',
            color: filters.category === undefined ? '#3B82F6' : '#6B7280'
          }}
        >
          全部 ({categoryCounts.all})
        </button>
        {Object.entries(TOOL_CATEGORIES).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key as ToolCategory)}
            style={{
              padding: '6px 12px',
              borderRadius: 16,
              border: filters.category === key ? '2px solid #3B82F6' : '1px solid #E5E7EB',
              background: filters.category === key ? '#EFF6FF' : '#FFFFFF',
              fontSize: 12,
              cursor: 'pointer',
              color: filters.category === key ? '#3B82F6' : '#6B7280'
            }}
          >
            {icon} {label} ({categoryCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Tool Grid */}
      {filteredTools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
          <div>No tools match your filters</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16
        }}>
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isSelected={tool.id === selectedToolId}
              onClick={() => handleToolClick(tool)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      <div style={{ marginTop: 16, fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
        Showing {filteredTools.length} of {tools.length} tools
      </div>
    </div>
  )
}