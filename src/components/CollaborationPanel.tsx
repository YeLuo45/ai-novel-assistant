/**
 * CollaborationPanel - Real-time collaboration status panel
 * V36: MessageBus collaboration UI component
 */

import React from 'react'
import { useAgents, useOnlineAgentCount, useCollaborationInit } from '../hooks/useCollaboration'
import type { AgentStatus } from '../ai/messagebus/types'

interface AgentCardProps {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask?: string
}

const statusColors: Record<AgentStatus, string> = {
  online: 'bg-green-500',
  busy: 'bg-yellow-500',
  offline: 'bg-gray-400',
  thinking: 'bg-blue-500 animate-pulse'
}

const statusLabels: Record<AgentStatus, string> = {
  online: '在线',
  busy: '忙碌',
  offline: '离线',
  thinking: '思考中'
}

function AgentCard({ name, role, status, currentTask }: AgentCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} title={statusLabels[status]} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{role}</div>
        {currentTask && (
          <div className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1">
            {currentTask}
          </div>
        )}
      </div>
      <span className="text-xs text-gray-400">{statusLabels[status]}</span>
    </div>
  )
}

interface CollaborationPanelProps {
  className?: string
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ className = '' }) => {
  useCollaborationInit()
  const agents = useAgents()
  const onlineCount = useOnlineAgentCount()
  
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">协作状态</h3>
          <span className="text-xs text-gray-500">
            {onlineCount} 人在线
          </span>
        </div>
      </div>
      
      <div className="p-2 max-h-64 overflow-y-auto">
        {agents.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            暂无协作者
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                id={agent.id}
                name={agent.name}
                role={agent.role}
                status={agent.status}
                currentTask={agent.currentTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CollaborationPanel