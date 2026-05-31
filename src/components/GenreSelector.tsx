import type { GenreId } from '@/ai/genres/types'

const GENRES = [
  { id: 'mystery' as GenreId, name: '🔍 悬疑', desc: '线索、误导、揭晓' },
  { id: 'romance' as GenreId, name: '💕 言情', desc: '甜虐、情感、CP' },
  { id: 'scifi' as GenreId, name: '🚀 科幻', desc: '科技、世界观、逻辑' },
  { id: 'fanfiction' as GenreId, name: '📚 同人', desc: '原作、OOC、彩蛋' },
  { id: 'urban' as GenreId, name: '🏙️ 都市', desc: '社会、职场、生活' },
  { id: 'fantasy' as GenreId, name: '🐉 玄幻', desc: '修炼、境界、功法' }
]

interface Props {
  value?: GenreId
  onChange: (genre: GenreId) => void
}

export function GenreSelector({ value, onChange }: Props) {
  return (
    <div className="genre-selector">
      <label className="block text-sm font-medium mb-2">小说类型</label>
      <div className="grid grid-cols-3 gap-2">
        {GENRES.map(genre => (
          <button
            key={genre.id}
            onClick={() => onChange(genre.id)}
            className={`p-3 border rounded-lg text-center transition-colors ${
              value === genre.id 
                ? 'border-purple-500 bg-purple-50 text-purple-700' 
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-lg mb-1">{genre.name.replace(/^[^\s]+\s/, '')}</div>
            <div className="text-xs text-gray-500">{genre.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
