/**
 * 文风一致性分数 Badge 组件
 * 根据分数显示不同颜色
 */

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function StyleBadge({ score, size = 'md', showLabel = true }: Props) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-red-100 text-red-700 border-red-300'
  }

  const getLabel = () => {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    return '需改进'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${getColor()} ${sizeClasses[size]}`}
    >
      <span>{score}</span>
      {showLabel && <span className="opacity-75">/ {getLabel()}</span>}
    </span>
  )
}
