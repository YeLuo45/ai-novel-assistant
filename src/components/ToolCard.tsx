/**
 * Tool Card - Individual Tool Display Card
 * V52: Displays tool info with rating stars, download count, and credits
 */

import React from 'react'
import { type MarketplaceListing } from '../ai/tools'

// ============================================================================
// Types
// ============================================================================

interface ToolCardProps {
  tool: MarketplaceListing
  onClick?: (toolId: string) => void
}

// ============================================================================
// Tool Card Component
// ============================================================================

export function ToolCard({ tool, onClick }: ToolCardProps) {
  // Render rating stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating - fullStars >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400 text-sm">★</span>
        ))}
        {/* Half star */}
        {hasHalfStar && <span className="text-yellow-400 text-sm">½</span>}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">☆</span>
        ))}
      </div>
    )
  }

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'material':
        return 'bg-blue-100 text-blue-700'
      case 'character':
        return 'bg-purple-100 text-purple-700'
      case 'plot':
        return 'bg-green-100 text-green-700'
      case 'review':
        return 'bg-orange-100 text-orange-700'
      case 'export':
        return 'bg-teal-100 text-teal-700'
      case 'custom':
        return 'bg-pink-100 text-pink-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Get category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'material': return '素材'
      case 'character': return '角色'
      case 'plot': return '情节'
      case 'review': return '审核'
      case 'export': return '导出'
      case 'custom': return '自定义'
      default: return category
    }
  }

  return (
    <div
      onClick={() => onClick?.(tool.toolId)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 line-clamp-1">{tool.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">v{tool.version}</p>
        </div>
        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(tool.category)}`}>
          {getCategoryLabel(tool.category)}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{tool.description}</p>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-3">
          {/* Downloads */}
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{tool.downloadCount}</span>
          </div>
          {/* Credits */}
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{tool.creditsPerCall}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {renderStars(tool.averageRating)}
          <span className="text-xs text-gray-500 ml-1">
            {tool.averageRating.toFixed(1)}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {tool.totalRatings} 评分
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Export
// ============================================================================

export default ToolCard