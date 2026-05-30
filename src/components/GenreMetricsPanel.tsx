import type { GenreDetectionResult } from '@/ai/genres/types'

interface Props {
  genreId: string
  result: GenreDetectionResult | null
  isLoading?: boolean
}

export function GenreMetricsPanel({ genreId, result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="genre-metrics-panel border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="animate-spin">⚙️</span>
          <span>类型检测中...</span>
        </div>
      </div>
    )
  }

  if (!result) return null

  const renderMetrics = () => {
    switch (genreId) {
      case 'mystery':
        return (
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="线索数" value={result.metrics.clueCount} color="purple" />
            <MetricCard label="红鲱鱼" value={result.metrics.redHerringCount} color="red" />
            <MetricCard label="悬念分" value={result.metrics.suspenseScore} color="blue" />
            <MetricCard label="揭晓时机" value={`${result.metrics.revelationTiming}%`} color="green" />
          </div>
        )
      
      case 'romance':
        return (
          <div className="grid grid-cols-4 gap-4">
            <MetricCard label="甜度" value={result.metrics.sweetnessIndex} color="pink" />
            <MetricCard label="虐度" value={result.metrics.angstIndex} color="gray" />
            <MetricCard label="关系进展" value={result.metrics.relationshipProgress} color="purple" />
            <MetricCard label="心动时刻" value={result.metrics.heartbeatMoments} color="red" />
          </div>
        )
      
      case 'scifi':
        return (
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="科技一致" value={result.metrics.techConsistencyScore} color="blue" />
            <MetricCard label="世界观" value={result.metrics.worldCoherence} color="green" />
            <MetricCard label="科学准确" value={result.metrics.scientificAccuracy} color="purple" />
          </div>
        )
      
      case 'fanfiction':
        return (
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="角色还原" value={result.metrics.characterAccuracy} color="blue" />
            <MetricCard label="原作风味" value={result.metrics.originalFlavor} color="green" />
            <MetricCard label="创新平衡" value={result.metrics.innovationBalance} color="purple" />
          </div>
        )
      
      default:
        return null
    }
  }

  const renderIssues = () => {
    if (result.issues.length === 0) return null

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">检测问题</h4>
        <div className="space-y-2">
          {result.issues.map((issue, i) => (
            <div 
              key={i} 
              className={`p-2 rounded text-sm ${
                issue.severity === 'critical' ? 'bg-red-50 border border-red-200' :
                issue.severity === 'major' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={
                  issue.severity === 'critical' ? 'text-red-600' :
                  issue.severity === 'major' ? 'text-yellow-600' :
                  'text-blue-600'
                }>
                  {issue.severity === 'critical' ? '❌' : issue.severity === 'major' ? '⚠️' : 'ℹ️'}
                </span>
                <span className="font-medium">{issue.description}</span>
              </div>
              {issue.suggestion && (
                <p className="text-xs text-gray-600 mt-1">建议：{issue.suggestion}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="genre-metrics-panel border rounded-lg p-4">
      <h4 className="font-medium mb-3">📊 类型指标</h4>
      {renderMetrics()}
      {renderIssues()}
    </div>
  )
}

// 辅助组件
function MetricCard({ label, value, color }: { label: string, value: any, color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'text-purple-600 bg-purple-50',
    pink: 'text-pink-600 bg-pink-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    gray: 'text-gray-600 bg-gray-50'
  }
  
  return (
    <div className={`text-center p-3 rounded-lg ${colorMap[color] || 'bg-gray-50'}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  )
}
