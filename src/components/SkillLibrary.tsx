import { useState, useEffect, useMemo } from 'react'
import type { CrystallizedSkill } from '@/ai/tools/types'
import { pluginRegistry } from '@/ai/plugins/PluginRegistry'
import type { PluginStatus } from '@/ai/plugins/types'

interface Props {
  onApplySkill?: (skill: CrystallizedSkill) => void
}

const BUILTIN_PLUGINS = ['error-handler', 'alert', 'telemetry', 'block', 'learning']

export function SkillLibrary({ onApplySkill }: Props) {
  const [activeTab, setActiveTab] = useState<'skills' | 'tools' | 'plugins'>('skills')
  const [skills, setSkills] = useState<CrystallizedSkill[]>([])
  const [plugins, setPlugins] = useState<PluginStatus[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'successCount' | 'avgRating' | 'lastUsed'>('successCount')
  const [isLoading, setIsLoading] = useState(false)

  // Load skills and plugins from Dexie DB / PluginRegistry
  useEffect(() => {
    const loadSkills = async () => {
      setIsLoading(true)
      try {
        const { Dexie } = await import('dexie')
        class SkillDB extends Dexie {
          skills!: CrystallizedSkill[]
          constructor() {
            super('NovelAssistantDB')
            this.version(38).stores({
              skills: 'id, toolId, name, pattern, successCount, avgRating, lastUsed, createdAt'
            })
          }
        }
        const db = new SkillDB()
        const allSkills = await db.skills.toArray()
        setSkills(allSkills)
      } catch (error) {
        console.error('Failed to load skills:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSkills()
  }, [])

  // Load plugin registry list
  useEffect(() => {
    setPlugins(pluginRegistry.listPlugins())
  }, [])

  const filteredSkills = useMemo(() => {
    let result = [...skills]
    
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.pattern.toLowerCase().includes(q) ||
        s.toolId.toLowerCase().includes(q)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'successCount':
          return b.successCount - a.successCount
        case 'avgRating':
          return b.avgRating - a.avgRating
        case 'lastUsed':
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        default:
          return 0
      }
    })
    
    return result
  }, [skills, searchQuery, sortBy])

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { Dexie } = await import('dexie')
      class SkillDB extends Dexie {
        skills!: CrystallizedSkill[]
        constructor() {
          super('NovelAssistantDB')
          this.version(38).stores({
            skills: 'id, toolId, name, pattern, successCount, avgRating, lastUsed, createdAt'
          })
        }
      }
      const db = new SkillDB()
      await db.skills.delete(skillId)
      setSkills(prev => prev.filter(s => s.id !== skillId))
    } catch (error) {
      console.error('Failed to delete skill:', error)
    }
  }

  const handleTogglePlugin = async (name: string, enabled: boolean) => {
    if (enabled) {
      await pluginRegistry.enable(name)
    } else {
      await pluginRegistry.disable(name)
    }
    setPlugins(pluginRegistry.listPlugins())
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-800 mb-3">📚 技能库</h2>
        {/* Tab Bar */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'skills' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            技能
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            工具
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'plugins' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            插件
          </button>
        </div>
        {/* Search (skills/tools only) */}
        {activeTab !== 'plugins' && (
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索技能..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-3"
          />
        )}
      </div>

      {/* Sort Controls (skills only) */}
      {activeTab === 'skills' && (
        <div className="px-4 py-2 border-b flex gap-2">
          <button
            onClick={() => setSortBy('successCount')}
            className={`px-3 py-1 text-xs rounded ${sortBy === 'successCount' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
          >
            按使用次数
          </button>
          <button
            onClick={() => setSortBy('avgRating')}
            className={`px-3 py-1 text-xs rounded ${sortBy === 'avgRating' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
          >
            按评分
          </button>
          <button
            onClick={() => setSortBy('lastUsed')}
            className={`px-3 py-1 text-xs rounded ${sortBy === 'lastUsed' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
          >
            按最近使用
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          isLoading ? (
            <div className="text-center text-gray-400 py-8">加载中...</div>
          ) : filteredSkills.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📚</div>
              <div className="text-sm">暂无技能结晶</div>
              <div className="text-xs text-gray-400 mt-1">使用工具成功后会自动结晶</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSkills.map(skill => (
                <div key={skill.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{skill.name}</span>
                      <span className="text-xs text-gray-400">来源: {skill.toolId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                        使用 {skill.successCount} 次
                      </span>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    模式: <span className="font-mono text-xs bg-gray-200 px-1 rounded">{skill.pattern}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      评分: {skill.avgRating.toFixed(1)} | 最后使用: {new Date(skill.lastUsed).toLocaleDateString()}
                    </div>
                    {onApplySkill && (
                      <button
                        onClick={() => onApplySkill(skill)}
                        className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        应用
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tools Tab placeholder */}
        {activeTab === 'tools' && (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-2">🔧</div>
            <div className="text-sm">工具列表</div>
            <div className="text-xs text-gray-400 mt-1">工具注册表</div>
          </div>
        )}

        {/* Plugins Tab */}
        {activeTab === 'plugins' && (
          plugins.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">🔌</div>
              <div className="text-sm">暂无插件</div>
            </div>
          ) : (
            <div className="space-y-3">
              {plugins.map(plugin => (
                <div key={plugin.name} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{plugin.name}</span>
                      <span className="text-xs text-gray-400">v{plugin.version}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plugin.enabled}
                          onChange={e => handleTogglePlugin(plugin.name, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {plugin.enabled ? '已启用' : '已禁用'} | 加载于: {new Date(plugin.loadedAt).toLocaleTimeString()}
                  </div>
                  {BUILTIN_PLUGINS.includes(plugin.name) && (
                    <div className="mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">内置插件</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default SkillLibrary
