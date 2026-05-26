/**
 * AgentTimeline - V55
 * Timeline view of agent executions
 */

import { h } from 'preact'
import { useMemo } from 'preact/hooks'
import type { AgentExecution } from './types'

export interface AgentTimelineProps {
  executions: AgentExecution[]
  startTime?: number
  endTime?: number
  height?: number
}

const AGENT_COLORS: Record<string, string> = {
  'planning': '#8B5CF6',
  'plot_design': '#3B82F6',
  'world_building': '#10B981',
  'character_design': '#F59E0B',
  'writing': '#EF4444',
  'review': '#EC4899',
  'evolution': '#6366F1'
}

export function AgentTimeline({
  executions,
  startTime,
  endTime,
  height = 200
}: AgentTimelineProps) {
  const { minTime, maxTime, totalDuration } = useMemo(() => {
    if (executions.length === 0) {
      const now = Date.now()
      return { minTime: now, maxTime: now + 60000, totalDuration: 60000 }
    }

    const times = executions.flatMap(e => [e.startTime, e.endTime || Date.now()])
    const min = Math.min(...times)
    const max = Math.max(...times)
    return {
      minTime: startTime || min,
      maxTime: endTime || max,
      totalDuration: (endTime || max) - (startTime || min)
    }
  }, [executions, startTime, endTime])

  const timeToX = (time: number): number => {
    if (totalDuration === 0) return 0
    return ((time - minTime) / totalDuration) * 100
  }

  const getColor = (agentId: string): string => {
    return AGENT_COLORS[agentId] || '#6B7280'
  }

  const formatDuration = (start: number, end?: number): string => {
    const duration = (end || Date.now()) - start
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
  }

  const formatTime = (time: number): string => {
    const d = new Date(time)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  }

  return (
    <div class="agent-timeline" style={{ height, position: 'relative', background: '#F9FAFB', borderRadius: 8, padding: '16px' }}>
      <div class="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, color: '#6B7280' }}>
        <span>Agent Execution Timeline</span>
        <span>{formatTime(minTime)} - {formatTime(maxTime)}</span>
      </div>

      <div class="timeline-ruler" style={{ position: 'relative', height: 24, background: '#E5E7EB', borderRadius: 4, marginBottom: 16 }}>
        {/* Ruler marks */}
        {[0, 25, 50, 75, 100].map(percent => (
          <div
            key={percent}
            style={{
              position: 'absolute',
              left: `${percent}%`,
              top: 0,
              height: '100%',
              borderLeft: '1px solid #9CA3AF',
              paddingLeft: 4,
              fontSize: 10,
              color: '#6B7280'
            }}
          >
            {formatTime(minTime + (totalDuration * percent / 100))}
          </div>
        ))}
      </div>

      <div class="timeline-executions" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {executions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: 24 }}>No agent executions yet</div>
        ) : (
          executions.map((execution, idx) => {
            const x = timeToX(execution.startTime)
            const width = execution.endTime ? timeToX(execution.endTime) - x : 100 - x
            const color = getColor(execution.agentId)

            return (
              <div
                key={execution.agentId + idx}
                class="execution-row"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div
                  class="agent-label"
                  style={{ width: 120, fontSize: 12, color: '#374151', fontWeight: 500, textAlign: 'right' }}
                >
                  {execution.agentName}
                </div>
                <div
                  class="execution-bar"
                  style={{
                    flex: 1,
                    height: 28,
                    background: '#E5E7EB',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.max(0, x)}%`,
                      width: `${Math.min(100 - Math.max(0, x), width)}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 8,
                      fontSize: 11,
                      color: '#FFF',
                      fontWeight: 500
                    }}
                  >
                    {execution.status === 'running' && '🔄 '}
                    {formatDuration(execution.startTime, execution.endTime)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}