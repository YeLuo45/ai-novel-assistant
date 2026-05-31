/**
 * VersionSelector - V23
 * 三版本卡片选择组件，并排展示三个版本供用户选择
 */

import { useState } from 'react'
import type { Character, ChapterPlan } from '../db'

interface GeneratedVersion {
  versionIndex: 1 | 2 | 3
  outline: string
  characters: Character[]
  chapters: ChapterPlan[]
  isGenerating: boolean
  isComplete: boolean
  error?: string
}

interface Props {
  versions: GeneratedVersion[]
  onSelect: (version: GeneratedVersion) => void
  projectTitle: string
}

const versionLabels = {
  1: { title: '快节奏强冲突版', icon: '⚡', color: 'from-orange-500 to-red-500', description: '主角成长快速，章节起伏明显，高潮迭起' },
  2: { title: '慢热细腻版', icon: '💝', color: 'from-pink-500 to-rose-500', description: '人物关系渐进建立，情感细腻积累，结局爆发' },
  3: { title: '悬疑反转版', icon: '🔮', color: 'from-purple-500 to-indigo-500', description: '多线叙事，埋设伏笔，反转不断，结局意外' }
}

export default function VersionSelector({ versions, onSelect, projectTitle }: Props) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  const handleToggleExpand = (index: number) => {
    setExpandedVersion(expandedVersion === index ? null : index)
  }

  const handleSelect = (version: GeneratedVersion) => {
    if (selectedVersion !== null) return
    setSelectedVersion(version.versionIndex)
    onSelect(version)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🎯 选择最适合你的版本
        </h2>
        <p className="text-gray-600">
          三个版本各有特色，点击查看详情后选择你喜欢的版本
        </p>
      </div>

      {/* Version Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {versions.map(version => {
          const label = versionLabels[version.versionIndex]
          const isExpanded = expandedVersion === version.versionIndex
          
          return (
            <div
              key={version.versionIndex}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ${
                isExpanded ? 'ring-2 ring-indigo-400 scale-[1.02]' : 'hover:shadow-xl'
              }`}
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${label.color} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{label.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold">版本 {version.versionIndex}</h3>
                    <p className="text-white/80 text-sm">{label.title}</p>
                  </div>
                </div>
                <p className="text-white/90 text-sm">{label.description}</p>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Outline Preview */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    📜 大纲预览
                  </h4>
                  <div className={`text-sm text-gray-600 leading-relaxed ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}>
                    {version.outline || '加载中...'}
                  </div>
                  {!isExpanded && version.outline && (
                    <button
                      onClick={() => handleToggleExpand(version.versionIndex)}
                      className="text-indigo-600 text-sm mt-2 hover:underline"
                    >
                      展开全部大纲
                    </button>
                  )}
                </div>

                {/* Characters Summary */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    👥 角色设定
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                      {version.characters?.length || 0} 人
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {version.characters?.slice(0, isExpanded ? undefined : 4).map(char => (
                      <div
                        key={char.id}
                        className={`px-3 py-1.5 rounded-full text-xs ${
                          char.role === 'protagonist'
                            ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200'
                            : char.role === 'supporting'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {char.name}
                        {char.role === 'protagonist' && ' ⭐'}
                      </div>
                    ))}
                    {!isExpanded && version.characters && version.characters.length > 4 && (
                      <span className="text-xs text-gray-400 px-2 py-1">
                        +{version.characters.length - 4} 人
                      </span>
                    )}
                  </div>
                </div>

                {/* Chapters Summary */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    📖 章节规划
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      {version.chapters?.length || 0} 章
                    </span>
                  </h4>
                  {isExpanded ? (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {version.chapters?.map(chapter => (
                        <div
                          key={chapter.index}
                          className="flex gap-2 text-xs p-2 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          <span className="font-medium text-indigo-600 w-6">
                            {chapter.index}.
                          </span>
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">{chapter.title}</span>
                            <p className="text-gray-500 truncate">{chapter.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {version.chapters?.[0]?.title} → ... → {version.chapters?.[version.chapters.length - 1]?.title}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleToggleExpand(version.versionIndex)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    {isExpanded ? '收起详情' : '查看详情'}
                  </button>
                  <button
                    onClick={() => handleSelect(version)}
                    disabled={selectedVersion !== null}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all ${
                      `bg-gradient-to-r ${label.color} hover:opacity-90`
                    } shadow-md hover:shadow-lg ${selectedVersion !== null ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {selectedVersion === version.versionIndex ? '跳转中...' : selectedVersion !== null ? '已选择' : '使用此版本'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Hint */}
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>💡 提示：版本1强情节驱动，版本2情感丰富，版本3悬疑迭起</p>
        <p className="mt-1">选择后，系统将自动填充大纲、角色、章节到你的项目中</p>
      </div>
    </div>
  )
}
