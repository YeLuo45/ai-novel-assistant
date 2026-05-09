import type { ExecutionStatus, InterventionPoint, UserAction } from '@/ai/intervention/types'

interface Props {
  status: ExecutionStatus
  currentPoint: InterventionPoint | null
  onAction: (action: UserAction) => void
}

export function InterventionStatusBar({ status, currentPoint, onAction }: Props) {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-blue-500'
      case 'paused': return 'bg-yellow-500'
      case 'waiting_approval': return 'bg-orange-500'
      case 'user_reviewing': return 'bg-purple-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'running': return '执行中...'
      case 'paused': return '已暂停'
      case 'waiting_approval': return '等待确认...'
      case 'user_reviewing': return '用户审查中'
      case 'resuming': return '恢复中...'
      case 'completed': return '完成'
      case 'idle': return '空闲'
    }
  }

  return (
    <div className="intervention-status-bar flex items-center gap-3 p-3 bg-white border rounded-lg shadow">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${status === 'waiting_approval' ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-medium">{getStatusText()}</span>

      {currentPoint && status === 'waiting_approval' && (
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm text-gray-600">Agent输出等待确认：</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
            {currentPoint.agentId || 'unknown'}
          </span>
        </div>
      )}

      {status === 'waiting_approval' && currentPoint && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onAction({ type: 'approve' })}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            ✓ 确认
          </button>
          <button
            onClick={() => onAction({ type: 'modify' })}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            ✎ 修改
          </button>
          <button
            onClick={() => onAction({ type: 'rerun', targetAgent: currentPoint.agentId || undefined })}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            ↻ 重跑
          </button>
          <button
            onClick={() => onAction({ type: 'skip' })}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            跳过
          </button>
        </div>
      )}

      {status === 'running' && (
        <button
          onClick={() => onAction({ type: 'pause' })}
          className="ml-auto px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
        >
          ⏸ 暂停
        </button>
      )}
    </div>
  )
}
