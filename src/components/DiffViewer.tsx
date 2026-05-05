/**
 * Diff对比组件
 * 以行为单位计算diff，绿色显示新增行，红色显示删除行
 */

import { useState, useMemo } from 'react'

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber?: number
}

interface Props {
  oldContent: string
  newContent: string
  oldVersionLabel?: string
  newVersionLabel?: string
  onOldVersionChange?: (version: string) => void
  onNewVersionChange?: (version: string) => void
  versions?: { label: string; content: string }[]
}

export default function DiffViewer({
  oldContent,
  newContent,
  oldVersionLabel = '旧版本',
  newVersionLabel = '新版本',
  versions
}: Props) {
  const [selectedOldIndex, setSelectedOldIndex] = useState(0)
  const [selectedNewIndex, setSelectedNewIndex] = useState(1)

  // Compute diff
  const diffLines = useMemo(() => {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    
    const result: DiffLine[] = []
    
    // Simple line-by-line diff algorithm (LCS-based)
    const lcs = computeLCS(oldLines, newLines)
    let oldIndex = 0
    let newIndex = 0
    let lcsIndex = 0
    
    let oldLineNum = 1
    let newLineNum = 1
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (lcsIndex < lcs.length && oldIndex < oldLines.length && newIndex < newLines.length &&
          oldLines[oldIndex] === lcs[lcsIndex] && newLines[newIndex] === lcs[lcsIndex]) {
        // Unchanged line
        result.push({
          type: 'unchanged',
          content: oldLines[oldIndex],
          lineNumber: oldLineNum
        })
        oldIndex++
        newIndex++
        lcsIndex++
        oldLineNum++
        newLineNum++
      } else if (newIndex < newLines.length && (lcsIndex >= lcs.length || newLines[newIndex] !== lcs[lcsIndex])) {
        // Added line
        result.push({
          type: 'added',
          content: newLines[newIndex],
          lineNumber: newLineNum
        })
        newIndex++
        newLineNum++
      } else if (oldIndex < oldLines.length && (lcsIndex >= lcs.length || oldLines[oldIndex] !== lcs[lcsIndex])) {
        // Removed line
        result.push({
          type: 'removed',
          content: oldLines[oldIndex],
          lineNumber: oldLineNum
        })
        oldIndex++
        oldLineNum++
      }
    }
    
    return result
  }, [oldContent, newContent])

  // Statistics
  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    let unchanged = 0
    
    diffLines.forEach(line => {
      if (line.type === 'added') added++
      else if (line.type === 'removed') removed++
      else unchanged++
    })
    
    return { added, removed, unchanged }
  }, [diffLines])

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header with stats */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600">+{stats.added} 新增</span>
          <span className="text-red-600">-{stats.removed} 删除</span>
          <span className="text-gray-500">{stats.unchanged} 未变</span>
        </div>
        
        {versions && versions.length >= 2 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedOldIndex}
              onChange={e => setSelectedOldIndex(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {versions.map((v, i) => (
                <option key={i} value={i}>{v.label}</option>
              ))}
            </select>
            <span className="text-gray-400">vs</span>
            <select
              value={selectedNewIndex}
              onChange={e => setSelectedNewIndex(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {versions.map((v, i) => (
                <option key={i} value={i}>{v.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Version labels */}
      <div className="flex border-b border-gray-200">
        <div className="flex-1 px-4 py-2 text-sm text-red-600 bg-red-50 border-r border-gray-200">
          ← {oldVersionLabel}
        </div>
        <div className="flex-1 px-4 py-2 text-sm text-green-600 bg-green-50">
          → {newVersionLabel}
        </div>
      </div>
      
      {/* Diff content */}
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={`flex ${
              line.type === 'added' ? 'bg-green-50 text-green-800' :
              line.type === 'removed' ? 'bg-red-50 text-red-800' :
              'text-gray-700'
            }`}
          >
            <div className="w-12 px-2 py-0.5 text-right text-gray-400 border-r border-gray-200 select-none">
              {line.lineNumber}
            </div>
            <div className="w-6 px-1 py-0.5 text-center select-none">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ''}
            </div>
            <div className="flex-1 px-2 py-0.5 whitespace-pre-wrap break-all">
              {line.content || '\u00A0'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Compute Longest Common Subsequence
 */
function computeLCS(oldLines: string[], newLines: string[]): string[] {
  const m = oldLines.length
  const n = newLines.length
  
  // Build DP table
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  
  // Backtrack to find LCS
  const lcs: string[] = []
  let i = m
  let j = n
  
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      lcs.unshift(oldLines[i - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  
  return lcs
}
