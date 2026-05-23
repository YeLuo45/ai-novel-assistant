/**
 * ConflictIndicator - Conflict detection and display component
 * V36: MessageBus conflict indicator for real-time collaboration
 */

import React, { useState } from 'react'
import { useConflicts } from '../hooks/useCollaboration'
import type { ConflictInfo } from '../ai/messagebus/types'

interface ConflictDetailModalProps {
  conflict: ConflictInfo
  onClose: () => void
  onResolve: (conflictId: string) => void
}

const ConflictDetailModal: React.FC<ConflictDetailModalProps> = ({ conflict, onClose, onResolve }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="font-semibold text-lg mb-4">冲突详情</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">冲突类型:</span>
            <span className="font-medium">
              {conflict.type === 'edit_conflict' ? '编辑冲突' :
               conflict.type === 'delete_conflict' ? '删除冲突' : '并发编辑'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">章节ID:</span>
            <span>{conflict.chapterId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">位置:</span>
            <span>字符 {conflict.position}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">检测时间:</span>
            <span>{new Date(conflict.detectedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">我们的版本:</div>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto max-h-32">
            {conflict.ourVersion || '(空)'}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-sm text-gray-500 mb-2">对方版本:</div>
          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto max-h-32">
            {conflict.theirVersion || '(空)'}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            关闭
          </button>
          <button
            onClick={() => onResolve(conflict.id)}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            解决冲突
          </button>
        </div>
      </div>
    </div>
  )
}

interface ConflictIndicatorProps {
  className?: string
}

export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({ className = '' }) => {
  useConflicts()
  const conflicts = useConflicts()
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null)
  
  const handleResolve = (conflictId: string) => {
    // The store's resolveConflict would be called here
    // For now, just close the modal
    setSelectedConflict(null)
  }
  
  if (conflicts.length === 0) {
    return null
  }
  
  return (
    <>
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold text-sm text-red-700 dark:text-red-400">
                检测到 {conflicts.length} 个冲突
              </div>
              <div className="text-xs text-red-600/70 dark:text-red-500/70 mt-1">
                点击查看详情并解决
              </div>
            </div>
          </div>
          
          <div className="mt-3 space-y-2">
            {conflicts.slice(0, 3).map(conflict => (
              <button
                key={conflict.id}
                onClick={() => setSelectedConflict(conflict)}
                className="w-full text-left p-2 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <div className="text-sm font-medium">
                  章节 {conflict.chapterId} - {conflict.type === 'edit_conflict' ? '编辑冲突' : conflict.type}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {new Date(conflict.detectedAt).toLocaleTimeString('zh-CN')}
                </div>
              </button>
            ))}
          </div>
          
          {conflicts.length > 3 && (
            <div className="mt-2 text-xs text-center text-red-600/70 dark:text-red-500/70">
              还有 {conflicts.length - 3} 个冲突...
            </div>
          )}
        </div>
      </div>
      
      {selectedConflict && (
        <ConflictDetailModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onResolve={handleResolve}
        />
      )}
    </>
  )
}

export default ConflictIndicator