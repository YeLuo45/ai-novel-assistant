/**
 * MarketFilters - V57
 * Filter and sort controls for the tool market
 */

import { h } from 'preact'
import type { MarketFilters as MarketFiltersType } from './toolMarketTypes'
import { SORT_OPTIONS } from './toolMarketTypes'

export interface MarketFiltersProps {
  filters: MarketFiltersType
  categoryCounts: Record<string, number>
  onCategoryChange: (category: MarketFiltersType['category']) => void
  onSortChange: (sortBy: MarketFiltersType['sortBy']) => void
  onSearchChange: (search: string) => void
}

export function MarketFilters({
  filters,
  onCategoryChange,
  onSortChange,
  onSearchChange
}: MarketFiltersProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      marginBottom: 16,
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {/* Search */}
      <div style={{ flex: '1 1 200px' }}>
        <input
          type="text"
          placeholder="🔍 Search tools..."
          value={filters.search || ''}
          onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            fontSize: 13,
            outline: 'none'
          }}
        />
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#6B7280' }}>Sort:</label>
        <select
          value={filters.sortBy}
          onChange={(e) => onSortChange((e.target as HTMLSelectElement).value as MarketFiltersType['sortBy'])}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            fontSize: 13,
            background: '#FFFFFF',
            cursor: 'pointer'
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Min Rating Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: '#6B7280' }}>Min ⭐:</label>
        <select
          value={filters.minRating || 0}
          onChange={(e) => {
            const val = parseInt((e.target as HTMLSelectElement).value)
            onCategoryChange(filters.category)
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            fontSize: 13,
            background: '#FFFFFF'
          }}
        >
          <option value={0}>All</option>
          <option value={3}>3+</option>
          <option value={4}>4+</option>
          <option value={4.5}>4.5+</option>
        </select>
      </div>

      {/* Free Only Toggle */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: '#6B7280',
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={filters.freeOnly || false}
          onChange={(e) => onCategoryChange(filters.category)}
        />
        Free only
      </label>
    </div>
  )
}