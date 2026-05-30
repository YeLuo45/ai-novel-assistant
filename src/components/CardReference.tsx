import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { MaterialCard, MaterialCardType } from '../db'
import CardDetailModal from './CardDetailModal'

// 正则匹配 [[type:name]] 格式
const CARD_REF_REGEX = /\[\[(character|location|item):([^\]]+)\]\]/g

interface ParsedRef {
  type: MaterialCardType
  name: string
  fullMatch: string
  startIndex: number
  endIndex: number
}

interface Props {
  content: string
}

export function parseCardRefs(text: string): ParsedRef[] {
  const refs: ParsedRef[] = []
  let match: RegExpExecArray | null

  // 重置正则状态
  CARD_REF_REGEX.lastIndex = 0

  while ((match = CARD_REF_REGEX.exec(text)) !== null) {
    refs.push({
      type: match[1] as MaterialCardType,
      name: match[2],
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return refs
}

export default function CardReference({ content }: Props) {
  const { materialCards } = useStore()
  const [selectedCard, setSelectedCard] = useState<MaterialCard | null>(null)

  // 解析内容中的卡片引用
  const parsedRefs = useMemo(() => parseCardRefs(content), [content])

  // 构建带有高亮标签的内容片段
  const elements = useMemo(() => {
    if (parsedRefs.length === 0) {
      return [{ type: 'text' as const, content }]
    }

    const result: Array<{ type: 'text' | 'ref'; content: string; ref?: ParsedRef }> = []
    let lastIndex = 0

    parsedRefs.forEach((ref) => {
      // 添加引用之前的文本
      if (ref.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, ref.startIndex)
        })
      }

      // 添加引用标签
      result.push({
        type: 'ref',
        content: ref.fullMatch,
        ref
      })

      lastIndex = ref.endIndex
    })

    // 添加最后剩余的文本
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex)
      })
    }

    return result
  }, [content, parsedRefs])

  // 根据名称查找卡片
  const findCard = (type: MaterialCardType, name: string): MaterialCard | undefined => {
    return materialCards.find(c => c.type === type && c.name === name)
  }

  // 标签颜色
  const tagColors = {
    character: 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200',
    location: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
    item: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
  }

  const typeLabels = {
    character: '角色',
    location: '地点',
    item: '物品'
  }

  return (
    <>
      <span>
        {elements.map((el, idx) => {
          if (el.type === 'text') {
            return <span key={idx}>{el.content}</span>
          }

          const ref = el.ref!
          const card = findCard(ref.type, ref.name)

          return (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-sm font-medium cursor-pointer transition-colors mx-0.5 ${tagColors[ref.type]}`}
              onClick={() => card && setSelectedCard(card)}
              title={card ? `查看${typeLabels[ref.type]}详情` : `${typeLabels[ref.type]}「${ref.name}」未找到`}
            >
              <span className="opacity-60 text-xs">{typeLabels[ref.type]}</span>
              <span>{ref.name}</span>
            </span>
          )
        })}
      </span>

      {/* 卡片详情弹窗 */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  )
}
