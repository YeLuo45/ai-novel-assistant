/**
 * 角色对话生成 Modal 组件
 * - 场景描述输入
 * - 角色勾选（从素材卡读取）
 * - 情绪氛围下拉（紧张/轻松/悬疑/温情/冲突）
 * - 对话长度选择（短/中/长）
 * - 预览+编辑+插入
 */

import { useState, useEffect } from 'react'
import { generateDialogue, formatDialogue, type MoodType, type DialogueLength, type GeneratedDialogue } from '../ai/dialogueGenerator'
import { useStore } from '../store'
import { type MaterialCard } from '../db'

interface Props {
  isOpen: boolean
  onClose: () => void
  onInsert: (dialogue: string) => void
}

const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string; description: string }[] = [
  { value: 'tense', label: '紧张', emoji: '😰', description: '紧张压抑的对话' },
  { value: 'relaxed', label: '轻松', emoji: '😄', description: '轻松愉快的对话' },
  { value: 'suspenseful', label: '悬疑', emoji: '🤔', description: '悬疑紧张的对话' },
  { value: 'warm', label: '温情', emoji: '🥰', description: '温情脉脉的对话' },
  { value: 'conflicting', label: '冲突', emoji: '😤', description: '充满冲突的对话' }
]

const LENGTH_OPTIONS: { value: DialogueLength; label: string; description: string }[] = [
  { value: 'short', label: '短', description: '3-5轮对话' },
  { value: 'medium', label: '中', description: '6-10轮对话' },
  { value: 'long', label: '长', description: '10-20轮对话' }
]

export default function DialogueGeneratorModal({
  isOpen,
  onClose,
  onInsert
}: Props) {
  const { materialCards, currentProject } = useStore()
  
  const [scene, setScene] = useState('')
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([])
  const [mood, setMood] = useState<MoodType>('relaxed')
  const [length, setLength] = useState<DialogueLength>('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDialogue, setGeneratedDialogue] = useState<GeneratedDialogue | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [editableContent, setEditableContent] = useState('')

  // Get character cards
  const characterCards = materialCards.filter(card => card.type === 'character')

  // Get selected characters
  const selectedCharacters = materialCards.filter(card => selectedCharacterIds.includes(card.id!))

  // Toggle character selection
  const toggleCharacter = (id: number) => {
    setSelectedCharacterIds(prev =>
      prev.includes(id)
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (!scene.trim()) {
      setError('请输入场景描述')
      return
    }
    if (selectedCharacters.length < 2) {
      setError('请至少选择2个角色')
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setGeneratedDialogue(null)

    try {
      setProgress(30)
      
      const result = await generateDialogue({
        scene,
        characters: selectedCharacters,
        mood,
        length,
        model: 'gpt-4o-mini'
      })
      
      setProgress(100)
      setGeneratedDialogue(result)
      setEditableContent(formatDialogue(result))
      setShowPreview(true)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsert = () => {
    const content = editableContent || (generatedDialogue ? formatDialogue(generatedDialogue) : '')
    onInsert(content)
    onClose()
  }

  const handleCopy = async () => {
    const content = editableContent || (generatedDialogue ? formatDialogue(generatedDialogue) : '')
    try {
      await navigator.clipboard.writeText(content)
      alert('已复制到剪贴板')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScene('')
      setSelectedCharacterIds([])
      setMood('relaxed')
      setLength('medium')
      setGeneratedDialogue(null)
      setShowPreview(false)
      setError(null)
      setEditableContent('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-800">💬 AI 对话生成</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Scene Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                场景描述
              </label>
              <textarea
                value={scene}
                onChange={e => setScene(e.target.value)}
                placeholder="描述对话发生的场景，例如：深夜的书房里，两人对坐，气氛凝重..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Character Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择角色（至少2个）
              </label>
              {characterCards.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {characterCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => toggleCharacter(card.id!)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCharacterIds.includes(card.id!)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {card.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  暂无角色素材卡，请在「素材库」中添加角色
                </div>
              )}
            </div>

            {/* Mood Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                情绪氛围
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setMood(option.value)}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      mood === option.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg">{option.emoji}</div>
                    <div className="text-xs font-medium mt-1">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Length Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                对话长度
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LENGTH_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setLength(option.value)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      length === option.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">AI 创作中...</span>
                  <span className="text-indigo-600">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            {/* Preview */}
            {showPreview && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    预览 / 编辑
                  </label>
                  <span className="text-xs text-gray-500">
                    可直接编辑内容
                  </span>
                </div>
                <textarea
                  value={editableContent}
                  onChange={e => setEditableContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              onClick={handleCopy}
              disabled={!showPreview}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              📋 复制
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              取消
            </button>
            {!showPreview ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedCharacterIds.length < 2 || !scene.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中...' : '💡 生成对话'}
              </button>
            ) : (
              <button
                onClick={handleInsert}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✅ 插入到编辑器
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
