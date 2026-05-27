/**
 * EvolutionAnalytics Dashboard - V72
 * Analytics & Monitoring Dashboard for Self-Evolution system
 * Visualizes: Self-Evolution metrics, Tool usage, Dream Memory, Federated Instance, Hook Lifecycle
 * 
 * Panels:
 * 1. Self-Evolution KPI cards (crystallized/demoted/patterns)
 * 2. Tool usage bar chart + top tools table
 * 3. Dream Memory progress ring
 * 4. Federated Instance status
 * 5. Hook Lifecycle distribution
 * 6. Timeline of skill evolution events
 */

import React, { useState, useEffect, useCallback } from 'react'
import type {
  EvolutionMetrics,
  SkillEvolutionRecord,
  ToolUsageStat,
  TimeWindowOption,
  ChartSeries,
  PanelConfig
} from './EvolutionAnalytics'
import {
  createEmptyMetrics,
  generateMockMetrics,
  getTimeRange,
  formatMetricValue
} from './EvolutionAnalytics'

// ===============================================================================
// Sub-components
// ===============================================================================

interface KPICardProps {
  label: string
  value: string | number
  subLabel?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  accentColor?: string
}

function KPICard({ label, value, subLabel, icon, accentColor = '#3b82f6' }: KPICardProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderRadius: 12,
      padding: '16px 20px',
      border: `1px solid ${accentColor}30`,
      minWidth: 140
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        <span style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accentColor, lineHeight: 1 }}>
        {value}
      </div>
      {subLabel && (
        <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{subLabel}</div>
      )}
    </div>
  )
}

interface ProgressRingProps {
  value: number  // 0-1
  label: string
  subLabel?: string
  color?: string
  size?: number
}

function ProgressRing({ value, label, subLabel, color = '#10b981', size = 80 }: ProgressRingProps) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.min(value, 1))
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1e293b" strokeWidth={6} />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color} strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, fontWeight: 600, color: color
        }}>
          {Math.round(value * 100)}%
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{label}</div>
        {subLabel && <div style={{ color: '#64748b', fontSize: 10 }}>{subLabel}</div>}
      </div>
    </div>
  )
}

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  maxValue?: number
  barColor?: string
  height?: number
}

function BarChart({ data, maxValue, barColor = '#3b82f6', height = 120 }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1)
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 4 }}>
          <div style={{
            width: '100%', background: `${barColor}40`, borderRadius: 4,
            height: `${(item.value / max) * height}px`,
            minHeight: item.value > 0 ? 4 : 0,
            transition: 'height 0.3s ease'
          }} />
          <div style={{ color: '#94a3b8', fontSize: 9, textAlign: 'center', maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ToolTableProps {
  tools: ToolUsageStat[]
}

function ToolTable({ tools }: ToolTableProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #334155' }}>
          <th style={{ textAlign: 'left', color: '#94a3b8', padding: '8px 0', fontWeight: 500 }}>Tool</th>
          <th style={{ textAlign: 'right', color: '#94a3b8', padding: '8px 0', fontWeight: 500 }}>Calls</th>
          <th style={{ textAlign: 'right', color: '#94a3b8', padding: '8px 0', fontWeight: 500 }}>Rate</th>
          <th style={{ textAlign: 'right', color: '#94a3b8', padding: '8px 0', fontWeight: 500 }}>Latency</th>
        </tr>
      </thead>
      <tbody>
        {tools.slice(0, 5).map((tool, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
            <td style={{ color: '#e2e8f0', padding: '6px 0' }}>{tool.toolName}</td>
            <td style={{ color: '#94a3b8', textAlign: 'right', padding: '6px 0' }}>{tool.callCount}</td>
            <td style={{
              textAlign: 'right', padding: '6px 0',
              color: tool.successRate >= 0.9 ? '#10b981' : tool.successRate >= 0.7 ? '#f59e0b' : '#ef4444'
            }}>
              {(tool.successRate * 100).toFixed(0)}%
            </td>
            <td style={{ color: '#64748b', textAlign: 'right', padding: '6px 0' }}>{tool.avgLatencyMs}ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface FederatedStatusProps {
  connectedInstances: number
  activeTasks: number
  completedTasks: number
  failedTasks: number
  pendingTasks: number
}

function FederatedStatus({ connectedInstances, activeTasks, completedTasks, failedTasks, pendingTasks }: FederatedStatusProps) {
  const total = completedTasks + failedTasks
  const successRate = total > 0 ? completedTasks / total : 0
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid #1e3a5f' }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Instances</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#3b82f6' }}>{connectedInstances}</div>
      </div>
      <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid #1e3a5f' }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Tasks Done</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#10b981' }}>{completedTasks}</div>
      </div>
      <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid #1e3a5f' }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Active</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#f59e0b' }}>{activeTasks}</div>
      </div>
      <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, border: '1px solid #1e3a5f' }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>Success</div>
        <div style={{ fontSize: 22, fontWeight: 600', color: successRate >= 0.9 ? '#10b981' : '#f59e0b' }}>
          {(successRate * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  )
}

interface HookStateProps {
  hookByState: Record<string, number>
  total: number
}

function HookState({ hookByState, total }: HookStateProps) {
  const colors: Record<string, string> = {
    active: '#10b981',
    paused: '#f59e0b',
    registered: '#3b82f6',
    deprecated: '#64748b'
  }
  
  const entries = Object.entries(hookByState).filter(([, v]) => v > 0)
  
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {entries.map(([state, count]) => (
        <div key={state} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#0f172a', borderRadius: 16, padding: '4px 12px',
          border: `1px solid ${colors[state] || '#64748b'}40`
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[state] || '#64748b' }} />
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{state}</span>
          <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{count}</span>
        </div>
      ))}
    </div>
  )
}

interface TimelineEventProps {
  event: SkillEvolutionRecord
}

function TimelineEvent({ event }: TimelineEventProps) {
  const eventColors = {
    crystallized: '#10b981',
    demoted: '#ef4444',
    split: '#3b82f6',
    merged: '#8b5cf6'
  }
  const color = eventColors[event.event] || '#64748b'
  
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{event.skillName}</span>
          <span style={{ color: '#64748b', fontSize: 10 }}>
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
          {event.event === 'crystallized' && `↑ Level up: ${event.fromLevel} → ${event.toLevel}`}
          {event.event === 'demoted' && `↓ Level down: ${event.fromLevel} → ${event.toLevel}`}
          {event.event === 'split' && `↔ Split`}
          {event.event === 'merged' && `⊕ Merge`}
        </div>
        <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{event.triggerReason}</div>
      </div>
    </div>
  )
}

// ===============================================================================
// Main Dashboard Component
// ===============================================================================

interface EvolutionAnalyticsDashboardProps {
  initialMetrics?: EvolutionMetrics
  refreshIntervalMs?: number
}

export function EvolutionAnalyticsDashboard({
  initialMetrics,
  refreshIntervalMs = 30_000
}: EvolutionAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<EvolutionMetrics>(
    initialMetrics ?? createEmptyMetrics()
  )
  const [timeWindow, setTimeWindow] = useState<TimeWindowOption>('24h')
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Load metrics (mock data + refresh)
  const loadMetrics = useCallback(() => {
    setIsLoading(true)
    setTimeout(() => {
      setMetrics(generateMockMetrics(timeWindow))
      setLastRefresh(new Date())
      setIsLoading(false)
    }, 300)
  }, [timeWindow])
  
  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, refreshIntervalMs)
    return () => clearInterval(interval)
  }, [loadMetrics, refreshIntervalMs])
  
  // Time window change
  const handleTimeWindowChange = (window: TimeWindowOption) => {
    setTimeWindow(window)
  }
  
  const timeWindows: TimeWindowOption[] = ['1h', '6h', '24h', '7d', '30d']
  
  // Tool chart data
  const toolChartData = metrics.mostUsedTools.slice(0, 6).map(t => ({
    label: t.toolName.replace('-', '\n'),
    value: t.callCount
  }))
  
  return (
    <div style={{ padding: 20, background: '#0a0a14', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f1f5f9' }}>
            📊 Evolution Analytics Dashboard
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
            Self-Evolution · Dream Memory · Federated · Hook Lifecycle
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Time window selector */}
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: 8, padding: 2 }}>
            {timeWindows.map(w => (
              <button
                key={w}
                onClick={() => handleTimeWindowChange(w)}
                style={{
                  padding: '4px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 500,
                  background: timeWindow === w ? '#3b82f6' : 'transparent',
                  color: timeWindow === w ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                {w}
              </button>
            ))}
          </div>
          {/* Refresh indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isLoading ? (
              <span style={{ color: '#f59e0b', fontSize: 12 }}>⟳ Updating...</span>
            ) : (
              <span style={{ color: '#64748b', fontSize: 11 }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Self-Evolution KPI Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KPICard
          label="Patterns" icon="🔍"
          value={metrics.patternRecognitionCount}
          subLabel="recognized"
          accentColor="#3b82f6"
        />
        <KPICard
          label="Crystallized" icon="💎"
          value={metrics.skillCrystallizationCount}
          subLabel="skills formed"
          accentColor="#10b981"
        />
        <KPICard
          label="Demoted" icon="📉"
          value={metrics.skillDemotionCount}
          subLabel="skills degraded"
          accentColor="#ef4444"
        />
        <KPICard
          label="Total Tool Calls" icon="⚡"
          value={formatMetricValue(metrics.totalToolCalls, 'count')}
          subLabel="in this window"
          accentColor="#8b5cf6"
        />
      </div>
      
      {/* Middle Row: Tool Chart + Dream Memory + Federated */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, marginBottom: 24, alignItems: 'start' }}>
        {/* Tool Usage Chart */}
        <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>
            ⚡ Tool Usage (Top 6)
          </h3>
          <BarChart data={toolChartData} barColor="#3b82f6" height={100} />
          <div style={{ marginTop: 16 }}>
            <ToolTable tools={metrics.mostUsedTools} />
          </div>
        </div>
        
        {/* Dream Memory + Hook State */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
          <ProgressRing
            value={metrics.memoryCompressionRatio}
            label="Memory Compression"
            subLabel={`${metrics.dreamSessionCount} sessions`}
            color="#10b981"
            size={90}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {metrics.skillsExtractedFromDreams}
            </div>
            <div style={{ color: '#64748b', fontSize: 11 }}>Dream Skills</div>
          </div>
        </div>
        
        {/* Federated Status */}
        <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>
            🌐 Federated Instance
          </h3>
          <FederatedStatus
            connectedInstances={metrics.connectedInstances}
            activeTasks={metrics.activeTasks}
            completedTasks={metrics.completedTasks}
            failedTasks={metrics.failedTasks}
            pendingTasks={metrics.pendingTasks}
          />
          <div style={{ marginTop: 16 }}>
            <HookState hookByState={metrics.hookByState} total={metrics.hookRegistryTotal} />
          </div>
        </div>
      </div>
      
      {/* Bottom Row: Evolution Timeline */}
      <div style={{ background: '#0f172a', borderRadius: 12, padding: 16, border: '1px solid #1e293b' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>
          📈 Skill Evolution Timeline
        </h3>
        {metrics.skillEvolutionHistory.length > 0 ? (
          metrics.skillEvolutionHistory.slice(0, 8).map((event, i) => (
            <TimelineEvent key={i} event={event} />
          ))
        ) : (
          <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 20 }}>
            No evolution events yet — start writing to trigger Self-Evolution patterns
          </div>
        )}
      </div>
    </div>
  )
}

// ===============================================================================
// Export
// ===============================================================================

export default EvolutionAnalyticsDashboard