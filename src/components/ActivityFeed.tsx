/**
 * ActivityFeed - Real-time activity stream component
 * V36: MessageBus collaboration activity feed
 */

import React, { useRef, useEffect } from 'react'
import { useActivities, useCollaborationInit } from '../hooks/useCollaboration'
import type { ActivityType } from '../ai/messagebus/types'

interface ActivityItemProps {
  type: ActivityType
  userName: string
  description: string
  timestamp: number
}

const activityIcons: Record<ActivityType, string> = {
  edit_chapter: '✏️',
  create_chapter: '📄',
  delete_chapter: '🗑️',
  move_chapter: '📑',
  update_outline: '📝',
  agent_thinking: '🤔',
  agent_idle: '💤',
  conflict_resolved: '✅',
  user_activity: '👤'
}

const activityLabels: Record<ActivityType, string> = {
  edit_chapter: '编辑章节',
  create_chapter: '创建章节',
  delete_chapter: '删除章节',
  move_chapter: '移动章节',
  update_outline: '更新大纲',
  agent_thinking: 'AI思考',
  agent_idle: 'AI空闲',
  conflict_resolved: '冲突解决',
  user_activity: '用户活动'
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, userName, description, timestamp }) => {
  return (
    <div className="flex gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded px-2">
      <span className="text-lg flex-shrink-0" title={activityLabels[type]}>
        {activityIcons[type] || '📌'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium">{userName}</span>
          <span className="text-gray-500 mx-1">-</span>
          <span className="text-gray-600 dark:text-gray-400">{description}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  )
}

interface ActivityFeedProps {
  limit?: number
  className?: string
  autoScroll?: boolean
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  limit = 20,
  className = '',
  autoScroll = true
}) => {
  useCollaborationInit()
  const activities = useActivities(limit)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to top when new activities arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [activities, autoScroll])
  
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm">活动记录</h3>
      </div>
      
      <div
        ref={scrollRef}
        className="p-2 max-h-48 overflow-y-auto"
      >
        {activities.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            暂无活动记录
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {activities.map(activity => (
              <ActivityItem
                key={activity.id}
                type={activity.type}
                userName={activity.userName}
                description={activity.description}
                timestamp={activity.timestamp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityFeed