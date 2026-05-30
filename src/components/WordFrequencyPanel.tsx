import { useState, useEffect, useMemo } from 'react'
import { analyzeText, type TextAnalysis } from '../utils/textAnalyzer'

interface Props {
  fullText: string
  chapterText?: string
  isOpen: boolean
  onToggle: () => void
}

export default function WordFrequencyPanel({ fullText, chapterText, isOpen, onToggle }: Props) {
  const [activeView, setActiveView] = useState<'full' | 'chapter'>('full')
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null)

  useEffect(() => {
    if (fullText && isOpen) {
      const result = analyzeText(fullText, chapterText || '', { topN: 20 })
      setAnalysis(result)
    }
  }, [fullText, chapterText, isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
      >
        <span>📊</span>
        <span>词频统计</span>
      </button>
    )
  }

  const displayData = activeView === 'full' ? analysis?.topWords : analysis?.chapterTopWords
  const repeatedWords = analysis?.repeatedWords || []

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">📊 词频统计</span>
          {analysis && (
            <span className="text-xs text-gray-500">
              共 {analysis.uniqueWords} 个不重复词
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveView('full')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            activeView === 'full'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          全文 ({analysis?.totalWords || 0} 字)
        </button>
        <button
          onClick={() => setActiveView('chapter')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            activeView === 'chapter'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          disabled={!chapterText}
        >
          本章
        </button>
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {/* Top words */}
        {displayData && displayData.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-gray-500 mb-2">高频词 Top{activeView === 'full' ? 20 : 10}</p>
            {displayData.map((item, idx) => (
              <div
                key={item.word}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
                  <span className="font-medium text-gray-800">{item.word}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{item.count}次</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{item.percentage}%</span>
                  {/* Mini bar */}
                  <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">暂无数据</p>
        )}

        {/* Repeated words warning */}
        {repeatedWords.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-red-500 font-medium mb-2">⚠️ 重复词警告</p>
            <div className="space-y-1">
              {repeatedWords.slice(0, 5).map((item) => (
                <div
                  key={item.word}
                  className="flex items-center justify-between text-sm bg-red-50 px-2 py-1 rounded"
                >
                  <span className="text-red-700 font-medium">{item.word}</span>
                  <span className="text-xs text-red-500">
                    连续出现 {item.count} 次
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
