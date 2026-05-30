import { MaterialCard } from '../db'

interface Props {
  card: MaterialCard
  onClose: () => void
}

const typeLabels = {
  character: '角色',
  location: '地点',
  item: '物品'
}

const typeColors = {
  character: 'bg-purple-100 text-purple-800 border-purple-200',
  location: 'bg-green-100 text-green-800 border-green-200',
  item: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default function CardDetailModal({ card, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className={`px-6 py-4 border-b ${typeColors[card.type]}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {typeLabels[card.type]}
              </span>
              <span className="text-gray-400">|</span>
              <span className="font-semibold">{card.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {Object.keys(card.fields).length === 0 ? (
            <p className="text-gray-400 text-center py-4">暂无详细信息</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(card.fields).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-500">{key}</label>
                  <div className="mt-1 text-gray-800 whitespace-pre-wrap">{value || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
