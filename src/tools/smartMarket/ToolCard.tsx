/**
 * ToolCard - V57
 * Card component for displaying a tool in the market
 */

import { h } from 'preact'
import type { ToolListing } from './toolMarketTypes'
import { TOOL_CATEGORIES } from './toolMarketTypes'

export interface ToolCardProps {
  tool: ToolListing
  isSelected?: boolean
  onClick?: () => void
}

export function ToolCard({ tool, isSelected = false, onClick }: ToolCardProps) {
  const category = TOOL_CATEGORIES[tool.category]
  const stars = '★'.repeat(Math.floor(tool.rating)) + '☆'.repeat(5 - Math.floor(tool.rating))

  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
        borderRadius: 12,
        padding: 16,
        background: isSelected ? '#EFF6FF' : '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20
        }}>
          {tool.icon || category.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 2 }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            by {tool.author}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
          v{tool.version}
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 12,
        color: '#4B5563',
        margin: '0 0 12px 0',
        lineHeight: 1.5,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {tool.description}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {tool.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              background: '#F3F4F6',
              fontSize: 10,
              color: '#6B7280'
            }}
          >
            {tag}
          </span>
        ))}
        {tool.tags.length > 3 && (
          <span style={{ padding: '2px 8px', fontSize: 10, color: '#9CA3AF' }}>
            +{tool.tags.length - 3}
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTop: '1px solid #E5E7EB'
      }}>
        <div style={{ fontSize: 11, color: '#6B7280' }}>
          📥 {tool.downloads.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: '#F59E0B' }}>
          {stars} {tool.rating.toFixed(1)}
        </div>
      </div>
    </div>
  )
}