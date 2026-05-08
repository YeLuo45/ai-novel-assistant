/**
 * 专家详情面板组件
 * Phase 4: UI集成 - 展示单个Agent的配置和输出
 */

import { getAgentConfig } from '@/ai/collaboration/agentRegistry'
import type { AgentId, AgentOutput } from '@/ai/collaboration/types'

interface Props {
  agentId: AgentId
  output?: AgentOutput
}

// PlotExpert 结构化输出类型
interface PlotExpertStructuredOutput {
  type: 'plot_expert'
  structure: Array<{
    type: string
    description: string
    foreshadowingTags?: string[]
  }>
  foreshadowing?: {
    planted: Array<{ tag: string; description: string; plotNodeId: string }>
    resolved: Array<{ tag: string; resolvedIn: string }>
  }
}

export function ExpertDetailPanel({ agentId, output }: Props) {
  const config = getAgentConfig(agentId)

  return (
    <div className="expert-panel border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-bold">{config.name}</h3>
        <span className="text-sm text-gray-500">{config.description}</span>
      </div>

      {/* 能力标签 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {config.capabilities.map(cap => (
          <span key={cap} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
            {cap}
          </span>
        ))}
      </div>

      {/* 输出内容 */}
      {output && (
        <div className="output-section">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">输出内容</span>
            <span className="text-xs text-gray-500">
              置信度：{(output.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <pre className="p-2 bg-white border rounded text-sm overflow-auto max-h-64">
            {output.content}
          </pre>

          {/* 警告 */}
          {output.warnings && output.warnings.length > 0 ? (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-yellow-700 mb-1">⚠️ 警告</div>
              <ul className="text-xs text-yellow-600 list-disc list-inside">
                {output.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* 结构化输出 */}
          {output?.metadata?.structuredOutput ? (
            <div className="structured-output mt-3 p-2 bg-gray-50 border rounded">
              {(output.metadata.structuredOutput as PlotExpertStructuredOutput).type === 'plot_expert' ? (
                <div>
                  <div className="text-sm font-medium mb-2">📍 情节节点</div>
                  {(output.metadata.structuredOutput as PlotExpertStructuredOutput).structure.map((node, i) => (
                    <div key={i} className="text-xs mb-1 pl-2 border-l-2 border-blue-200">
                      <span className="font-medium">{node.type}</span>: {node.description}
                      {node.foreshadowingTags && node.foreshadowingTags.length > 0 ? (
                        <span className="ml-2 text-purple-600">
                          🔮 {node.foreshadowingTags.join(', ')}
                        </span>
                      ) : null}
                    </div>
                  ))}
                  {(output.metadata.structuredOutput as PlotExpertStructuredOutput).foreshadowing ? (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">伏笔：</span>
                      {(output.metadata.structuredOutput as PlotExpertStructuredOutput).foreshadowing!.planted.length} 个埋设 / 
                      {(output.metadata.structuredOutput as PlotExpertStructuredOutput).foreshadowing!.resolved.length} 个回收
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {/* 元数据 */}
      {output?.metadata ? (
        <div className="mt-3 text-xs text-gray-500">
          附加信息：{JSON.stringify(output.metadata)}
        </div>
      ) : null}
    </div>
  )
}
