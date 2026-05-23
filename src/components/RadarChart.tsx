/**
 * RadarChart - V38
 * 7-dimension radar chart component using recharts
 */

import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import type { QualityScore } from '../ai/critic/types'

interface Props {
  qualityScore: QualityScore | null
  size?: 'small' | 'medium' | 'large'
  showLegend?: boolean
  onDimensionClick?: (dimension: string, value: number) => void
}

const DIMENSION_COLORS: Record<string, string> = {
  overall: '#6366f1',     // Indigo
  consistency: '#10b981', // Emerald
  pacing: '#f59e0b',      // Amber
  tension: '#ef4444',     // Red
  dialogue: '#3b82f6',    // Blue
  style: '#8b5cf6',       // Violet
  length: '#14b8a6'      // Teal
}

const DIMENSION_LABELS: Record<string, string> = {
  overall: '综合',
  consistency: '一致性',
  pacing: '节奏',
  tension: '张力',
  dialogue: '对话',
  style: '风格',
  length: '长度'
}

export default function RadarChartComponent({
  qualityScore,
  size = 'medium',
  showLegend = false,
  onDimensionClick
}: Props) {
  if (!qualityScore) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        暂无数据
      </div>
    )
  }

  const chartData = [
    { dimension: '综合', value: qualityScore.overall, fullMark: 100 },
    { dimension: '一致性', value: qualityScore.consistency, fullMark: 100 },
    { dimension: '节奏', value: qualityScore.pacing, fullMark: 100 },
    { dimension: '张力', value: qualityScore.tension, fullMark: 100 },
    { dimension: '对话', value: qualityScore.dialogue, fullMark: 100 },
    { dimension: '风格', value: qualityScore.style, fullMark: 100 },
    { dimension: '长度', value: qualityScore.length, fullMark: 100 }
  ]

  const dimensions = ['overall', 'consistency', 'pacing', 'tension', 'dialogue', 'style', 'length'] as const

  const heightMap = {
    small: 180,
    medium: 240,
    large: 320
  }

  const handleClick = (data: { dimension: string }) => {
    const dimensionKey = Object.entries(DIMENSION_LABELS).find(
      ([, label]) => label === data.dimension
    )?.[0]
    
    if (dimensionKey && onDimensionClick) {
      const value = qualityScore[dimensionKey as keyof QualityScore] as number
      onDimensionClick(dimensionKey, value)
    }
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={heightMap[size]}>
        <RechartsRadarChart data={chartData} onClick={handleClick as any}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickCount={5}
          />
          <Radar
            name="质量得分"
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              onClick={handleClick as any}
            />
          )}
          <Tooltip
            formatter={(value: number) => [`${Math.round(value)}`, '得分']}
            labelStyle={{ color: '#374151', fontWeight: 500 }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Dimension scores grid */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {dimensions.map(dim => (
          <div
            key={dim}
            className="text-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => onDimensionClick?.(dim, qualityScore[dim as keyof QualityScore] as number)}
          >
            <div className="text-xs text-gray-500">{DIMENSION_LABELS[dim]}</div>
            <div
              className={`text-lg font-semibold ${
                (qualityScore[dim as keyof QualityScore] as number) >= 80
                  ? 'text-green-600'
                  : (qualityScore[dim as keyof QualityScore] as number) >= 60
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {qualityScore[dim as keyof QualityScore] as number}
            </div>
          </div>
        ))}
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {dimensions.map(dim => (
          <div key={dim} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: DIMENSION_COLORS[dim] }}
            />
            <span className="text-xs text-gray-500">{DIMENSION_LABELS[dim]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}