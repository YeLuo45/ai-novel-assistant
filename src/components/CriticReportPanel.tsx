import type { CriticReport } from '@/ai/collaboration/types'

interface Props {
  report: CriticReport | null
  isLoading?: boolean
}

export function CriticReportPanel({ report, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="critic-panel border rounded-lg p-4 bg-purple-50">
        <div className="flex items-center gap-2">
          <span className="animate-spin">⚙️</span>
          <span>AI评审团正在评审...</span>
        </div>
      </div>
    )
  }

  if (!report) return null

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDimensionLabel = (dim: string) => ({
    plot: '情节',
    character: '人物',
    writing: '文笔',
    logic: '逻辑'
  }[dim] || dim)

  return (
    <div className="critic-panel border border-purple-300 rounded-lg p-4 bg-purple-50">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎯</span>
        <h3 className="font-bold">AI评审团评审</h3>
        <span className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
          {report.overallScore.toFixed(1)}/10
        </span>
      </div>

      {/* 维度评分 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {report.scores.map(score => (
          <div key={score.dimension} className="bg-white rounded p-2 border">
            <div className="text-sm text-gray-500">{getDimensionLabel(score.dimension)}</div>
            <div className={`text-xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}/10
            </div>
          </div>
        ))}
      </div>

      {/* 改进建议 */}
      {report.improvements.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-blue-700 mb-1">💡 改进建议</h4>
          <ul className="text-sm list-disc list-inside space-y-1">
            {report.improvements.map((imp, i) => (
              <li key={i} className="text-gray-700">{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 潜在风险 */}
      {report.risks.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-yellow-700 mb-1">⚠️ 潜在风险</h4>
          <ul className="text-sm list-disc list-inside space-y-1">
            {report.risks.map((risk, i) => (
              <li key={i} className="text-yellow-600">{risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 一致性问题 */}
      {report.consistencyIssues.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-700 mb-1">❌ 一致性问题</h4>
          <ul className="text-sm list-disc list-inside space-y-1">
            {report.consistencyIssues.map((issue, i) => (
              <li key={i} className="text-red-600">{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
