/**
 * 多Agent协作可视化组件
 * Phase 4: UI集成 - 展示3个Agent的执行状态
 */

import type { Subtask, AgentOutput, AgentId } from '@/ai/collaboration/types'

interface Props {
  subtasks: Subtask[]
  outputs: Map<AgentId, AgentOutput>
  currentPhase: 'decomposing' | 'executing' | 'aggregating' | 'done' | 'failed'
}

export function CollaborationVisualizer({ subtasks, outputs, currentPhase }: Props) {
  const getAgentIcon = (id: AgentId) => {
    switch (id) {
      case 'PlotExpert': return '🎭'
      case 'DialogueMaster': return '💬'
      case 'StyleGuard': return '🛡️'
    }
  }

  const getAgentName = (id: AgentId) => {
    switch (id) {
      case 'PlotExpert': return '情节专家'
      case 'DialogueMaster': return '对白专家'
      case 'StyleGuard': return '文风卫士'
    }
  }

  const getStatusColor = (status: Subtask['status']) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'running': return 'text-blue-500'
      case 'failed': return 'text-red-500'
      default: return 'text-gray-400'
    }
  }

  const getPhaseLabel = (phase: Props['currentPhase']) => {
    switch (phase) {
      case 'decomposing': return '任务分解中'
      case 'executing': return '执行中'
      case 'aggregating': return '聚合结果'
      case 'done': return '完成'
      case 'failed': return '失败'
    }
  }

  return (
    <div className="collaboration-visualizer border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">🤝 多Agent协作</h3>
        <span className="text-sm text-gray-500">
          阶段：{getPhaseLabel(currentPhase)}
        </span>
      </div>

      {/* Agent 执行流程 */}
      <div className="flex items-center gap-2 mb-4">
        {subtasks.map((task, idx) => (
          <div key={task.id} className="flex items-center">
            {/* Agent 卡片 */}
            <div className={`agent-card p-3 border rounded-lg min-w-[120px] ${
              task.status === 'running' ? 'border-blue-400 bg-blue-50' :
              task.status === 'completed' ? 'border-green-400 bg-green-50' :
              task.status === 'failed' ? 'border-red-400 bg-red-50' :
              'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{getAgentIcon(task.responsible)}</span>
                <span className="font-medium text-sm">{getAgentName(task.responsible)}</span>
              </div>
              <div className={`text-xs ${getStatusColor(task.status)}`}>
                {task.status === 'pending' && '⏳ 等待'}
                {task.status === 'running' && '⚙️ 执行中'}
                {task.status === 'completed' && '✅ 完成'}
                {task.status === 'failed' && '❌ 失败'}
              </div>
            </div>

            {/* 箭头 */}
            {idx < subtasks.length - 1 && (
              <div className="mx-2 text-gray-400">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 展开详情 */}
      {subtasks.some(t => t.output) && (
        <div className="agent-details mt-4">
          <h4 className="text-sm font-medium mb-2">Agent 输出详情</h4>
          <div className="space-y-2">
            {subtasks.filter(t => t.output).map(task => {
              const output = outputs.get(task.responsible)
              return (
                <details key={task.id} className="border rounded p-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    {getAgentIcon(task.responsible)} {getAgentName(task.responsible)}
                    {output?.warnings?.length ? ` (${output.warnings.length} 个警告)` : ''}
                  </summary>
                  <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto max-h-48">
                    {task.output}
                  </pre>
                </details>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
