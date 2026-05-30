/**
 * WritingMetricsPanel - V55
 * Real-time writing quality metrics display
 */

import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import type { WritingMetrics } from './types'

export interface WritingMetricsPanelProps {
  metrics: WritingMetrics | null
  compact?: boolean
}

const DIMENSION_LABELS = ['coherence', 'expression', 'creativity', 'structure', 'engagement'] as const

export function WritingMetricsPanel({ metrics, compact = false }: WritingMetricsPanelProps) {
  const overallScore = useMemo(() => {
    if (!metrics) return 0
    const { coherence, expression, creativity, structure, engagement } = metrics
    const avg = (coherence + expression + creativity + structure + engagement) / 5
    return Math.round(avg * 100)
  }, [metrics])

  const dimensionValues = metrics
    ? [metrics.coherence, metrics.expression, metrics.creativity, metrics.structure, metrics.engagement]
    : [0, 0, 0, 0, 0]

  const radarPoints = useMemo(() => {
    const center = 50
    const radius = 40
    const values = dimensionValues.map(v => Math.min(100, Math.max(0, v * 100)))

    return values.map((value, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
      const distance = (value / 100) * radius
      const x = center + Math.cos(angle) * distance
      const y = center + Math.sin(angle) * distance
      return `${x},${y}`
    }).join(' ')
  }, [dimensionValues])

  const wordCountPercent = metrics
    ? Math.min(100, (metrics.wordCount / metrics.targetWordCount) * 100)
    : 0

  if (compact) {
    return (
      <div class="metrics-panel-compact" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          Ch.{metrics?.chapterNumber ?? '-'} {metrics?.chapterTitle ?? 'No title'}
        </div>
        <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 2 }}>
          <div style={{ width: `${wordCountPercent}%`, height: '100%', background: '#3B82F6', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 12, color: '#374151' }}>
          {metrics?.wordCount ?? 0} / {metrics?.targetWordCount ?? 0}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: overallScore >= 70 ? '#10B981' : overallScore >= 50 ? '#F59E0B' : '#EF4444' }}>
          {overallScore}%
        </div>
      </div>
    )
  }

  return (
    <div class="metrics-panel" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>
            Ch.{metrics?.chapterNumber ?? '-'} {metrics?.chapterTitle ?? 'No title'}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {metrics?.wordCount ?? 0} / {metrics?.targetWordCount ?? 0} words
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: overallScore >= 70 ? '#10B981' : overallScore >= 50 ? '#F59E0B' : '#EF4444' }}>
            {overallScore}%
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Overall Score</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Radar Chart */}
        <div style={{ width: 120, height: 120, position: 'relative' }}>
          <svg width="120" height="120" viewBox="0 0 100 100">
            {/* Background pentagon */}
            {[100, 80, 60, 40, 20].map(r => (
              <polygon
                key={r}
                points={[50, 50 - r * 0.4].concat(
                  Array(5).fill(0).map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
                    return `${50 + Math.cos(angle) * r * 0.4},${50 + Math.sin(angle) * r * 0.4}`
                  })
                ).join(' ')}
                fill="none"
                stroke="#E5E7EB"
                stroke-width="0.5"
              />
            ))}

            {/* Data polygon */}
            <polygon
              points={radarPoints}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              stroke-width="2"
            />

            {/* Axis lines */}
            {Array(5).fill(0).map((_, i) => {
              const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
              return (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={50 + Math.cos(angle) * 40}
                  y2={50 + Math.sin(angle) * 40}
                  stroke="#E5E7EB"
                  stroke-width="0.5"
                />
              )
            })}

            {/* Labels */}
            {DIMENSION_LABELS.map((label, i) => {
              const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
              const x = 50 + Math.cos(angle) * 48
              const y = 50 + Math.sin(angle) * 48
              return (
                <text
                  key={label}
                  x={x}
                  y={y}
                  font-size="6"
                  fill="#6B7280"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >
                  {label.slice(0, 3)}
                </text>
              )
            })}
          </svg>
        </div>

        {/* Dimension bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DIMENSION_LABELS.map((dim, i) => (
            <div key={dim} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>{dim}</div>
              <div style={{ flex: 1, height: 8, background: '#F3F4F6', borderRadius: 4 }}>
                <div
                  style={{
                    width: `${dimensionValues[i] * 100}%`,
                    height: '100%',
                    background: dimensionValues[i] >= 0.7 ? '#10B981' : dimensionValues[i] >= 0.5 ? '#F59E0B' : '#EF4444',
                    borderRadius: 4,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <div style={{ width: 32, fontSize: 11, color: '#374151', textAlign: 'right' }}>
                {Math.round(dimensionValues[i] * 100)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
          <span>Progress</span>
          <span>{wordCountPercent.toFixed(0)}%</span>
        </div>
        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4 }}>
          <div
            style={{
              width: `${wordCountPercent}%`,
              height: '100%',
              background: wordCountPercent >= 100 ? '#10B981' : '#3B82F6',
              borderRadius: 4,
              transition: 'width 0.3s'
            }}
          />
        </div>
      </div>
    </div>
  )
}