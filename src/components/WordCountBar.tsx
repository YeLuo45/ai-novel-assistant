interface Props {
  chapterWordCount: number
  totalWordCount: number
  completedChapters: number
  totalChapters: number
}

export default function WordCountBar({
  chapterWordCount,
  totalWordCount,
  completedChapters,
  totalChapters
}: Props) {
  const progressPercent = totalChapters > 0 
    ? Math.round((completedChapters / totalChapters) * 100) 
    : 0

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
      <div className="flex items-center gap-4">
        <span>
          本章字数: <strong className="text-gray-800">{chapterWordCount.toLocaleString()}</strong>
        </span>
        <span>
          总字数: <strong className="text-gray-800">{totalWordCount.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span>
          完成进度: <strong className="text-gray-800">{completedChapters}/{totalChapters}</strong> 章节
        </span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{progressPercent}%</span>
        </div>
      </div>
    </div>
  )
}
