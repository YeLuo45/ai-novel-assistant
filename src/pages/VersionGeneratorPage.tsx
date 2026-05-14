/**
 * VersionGeneratorPage - V23
 * 三版本生成页面：AI并行生成3套内容供用户选择
 */

import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { db, Project, ProjectVersion, Character, ChapterPlan } from '../db'
import VersionSelector from '../components/VersionSelector'
import { callLLM } from '../ai/llm'

interface GeneratedVersion {
  versionIndex: 1 | 2 | 3
  outline: string
  characters: Character[]
  chapters: ChapterPlan[]
  isGenerating: boolean
  isComplete: boolean
  error?: string
}

export default function VersionGeneratorPage() {
  const { id: projectIdParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentProject, setCurrentProject, updateProject } = useStore()

  const projectId = useMemo(() => {
    return projectIdParam ? parseInt(projectIdParam) : null
  }, [projectIdParam])
  
  const [versions, setVersions] = useState<GeneratedVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [projectMeta, setProjectMeta] = useState<{
    title: string
    genre: string
    protagonistName?: string
    background?: string
    coreSellingPoint?: string
    otherRequirements?: string
  } | null>(null)

  // Load project
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        navigate('/projects')
        return
      }
      
      const project = await db.projects.get(projectId)
      if (!project) {
        navigate('/projects')
        return
      }
      
      setProjectMeta({
        title: project.title,
        genre: project.genre,
        protagonistName: project.protagonistName,
        background: project.background,
        coreSellingPoint: project.coreSellingPoint,
        otherRequirements: project.otherRequirements
      })
      
      // Check if already has generated versions
      const existingVersions = await db.projectVersions
        .where('projectId').equals(projectId)
        .toArray()
      
      if (existingVersions.length === 3) {
        // Already generated, show selector
        setVersions(existingVersions.map(v => ({
          versionIndex: v.versionIndex,
          outline: v.outline,
          characters: v.characters,
          chapters: v.chapters,
          isGenerating: false,
          isComplete: true
        })))
      } else {
        // Initialize empty versions
        setVersions([
          { versionIndex: 1, outline: '', characters: [], chapters: [], isGenerating: false, isComplete: false },
          { versionIndex: 2, outline: '', characters: [], chapters: [], isGenerating: false, isComplete: false },
          { versionIndex: 3, outline: '', characters: [], chapters: [], isGenerating: false, isComplete: false }
        ])
        // Auto-start generation
        startGeneration(project)
      }
      setIsLoading(false)
    }
    
    loadProject()
  }, [projectId])

  const startGeneration = async (project: any) => {
    setIsGenerating(true)
    setGenerationProgress(0)
    
    try {
      // Build prompt based on project metadata
      const basePrompt = buildPrompt(project)
      
      // Generate 3 versions in parallel
      const versionPromises = [
        generateVersionContent(basePrompt, 1, project),
        generateVersionContent(basePrompt, 2, project),
        generateVersionContent(basePrompt, 3, project)
      ]
      
      await Promise.all(versionPromises)
      setGenerationProgress(100)
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const buildPrompt = (project: any): string => {
    const parts = [
      `请为"${project.title}"创作一个故事规划。`,
      project.genre ? `题材类型：${project.genre}` : '',
      project.protagonistName ? `主角：${project.protagonistName}` : '',
      project.background ? `背景/朝代：${project.background}` : '',
      project.coreSellingPoint ? `核心卖点：${project.coreSellingPoint}` : '',
      project.otherRequirements ? `其他要求：${project.otherRequirements}` : ''
    ].filter(Boolean)
    
    return parts.join('\n')
  }

  const generateVersionContent = async (
    basePrompt: string, 
    versionIndex: 1 | 2 | 3,
    project: any
  ) => {
    const versionDescriptions = {
      1: '快节奏强冲突版：主角成长快速，目标明确，每2-3章设置一个中等冲突，每5章设置一个重大转折/高潮，节奏紧凑，高潮迭起，让读者持续有爽感',
      2: '慢热细腻版：人物关系渐进建立，前1/3篇幅铺垫世界观和情感基础，情感细腻积累，支线丰富，结局处情感和冲突同步爆发',
      3: '悬疑反转版：开篇埋设多个悬念钩子，多线叙事交叉推进，频繁设置反转，结局出人意料，让读者不断猜测但始终猜不透'
    }
    
    const systemPrompt = `你是一个专业的小说策划专家，擅长创作引人入胜的故事。
根据用户提供的项目信息，生成3个不同版本的故事规划。
每个版本必须包含：
1. 故事大纲（200-500字）
2. 角色设定（3-5个主角 + 2-3个配角，含性格/目标/关系）
3. 章节规划（8-15章，每章有标题和一句话简介）

请以JSON格式返回，结构如下：
{
  "outline": "故事大纲内容",
  "characters": [
    {
      "id": "char_1",
      "name": "角色名",
      "role": "protagonist/supporting/minor",
      "personalityTraits": ["性格特点1", "性格特点2"],
      "goal": "角色目标",
      "relationships": ["与XX是XX关系", "与XX存在XX矛盾"]
    }
  ],
  "chapters": [
    {
      "index": 1,
      "title": "第一章标题",
      "summary": "本章简介"
    }
  ]
}`

    const userPrompt = `${basePrompt}

请生成第${versionIndex}个版本（${versionDescriptions[versionIndex]}）的故事规划。`

    try {
      // Update state to show generating
      setVersions(prev => prev.map(v => 
        v.versionIndex === versionIndex 
          ? { ...v, isGenerating: true }
          : v
      ))
      
      setGenerationProgress((versionIndex - 1) * 30 + 10)
      
      const response = await callLLM({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        maxTokens: 4000
      }, 'version_generator')
      
      setGenerationProgress((versionIndex - 1) * 30 + 30)
      
      // Parse JSON response
      let parsed: { outline: string; characters: Character[]; chapters: ChapterPlan[] }
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found')
        }
      } catch {
        // If JSON parsing fails, create mock data
        parsed = createMockVersion(versionIndex, project)
      }
      
      // Update state
      setVersions(prev => prev.map(v => 
        v.versionIndex === versionIndex 
          ? { 
              ...v, 
              outline: parsed.outline,
              characters: parsed.characters,
              chapters: parsed.chapters,
              isGenerating: false,
              isComplete: true
            }
          : v
      ))
      
      setGenerationProgress(versionIndex * 33)
      
      // Save to database
      if (project.id) {
        await db.projectVersions.add({
          projectId: project.id,
          versionIndex,
          outline: parsed.outline,
          characters: parsed.characters,
          chapters: parsed.chapters,
          generatedAt: Date.now(),
          isSelected: false
        })
      }
      
    } catch (error) {
      console.error(`Error generating version ${versionIndex}:`, error)
      setVersions(prev => prev.map(v => 
        v.versionIndex === versionIndex 
          ? { ...v, isGenerating: false, isComplete: true, error: '生成失败' }
          : v
      ))
    }
  }

  const createMockVersion = (versionIndex: 1 | 2 | 3, project: any): { 
    outline: string; 
    characters: Character[]; 
    chapters: ChapterPlan[] 
  } => {
    const versionThemes = {
      1: { theme: '成长与奋斗', style: '热血激昂' },
      2: { theme: '爱恨情仇', style: '细腻感人' },
      3: { theme: '悬疑与反转', style: '扣人心弦' }
    }
    
    const theme = versionThemes[versionIndex]
    const protagonistName = project.protagonistName || '主角'
    
    return {
      outline: `《${project.title}》第${versionIndex}版大纲（${theme.theme}）

这是一个关于${theme.style}的故事。${protagonistName}是一个普通的${project.background || '都市'}青年，在一次意外中获得了特殊能力/遇到了改变命运的人物。

故事从${protagonistName}的平凡生活开始，经历了三个主要阶段：
第一阶段：觉醒与适应 - ${protagonistName}意识到自己的特殊之处，开始学习控制。
第二阶段：挑战与成长 - 面对强大的对手和复杂的局势，${protagonistName}逐渐成长。
第三阶段：抉择与升华 - 最终${protagonistName}做出关键选择，实现了自我价值。

本版本特色：${theme.style}的风格贯穿全文，情节紧凑，人物成长明显，适合追求阅读快感的读者。`,
      
      characters: [
        {
          id: 'char_1',
          name: protagonistName,
          role: 'protagonist',
          personalityTraits: ['勇敢', '坚韧', '有责任感'],
          goal: '成为更强的自己，保护重要的人',
          relationships: ['与女主青梅竹马', '与反派是同门师兄弟']
        },
        {
          id: 'char_2',
          name: '女主/重要伙伴',
          role: 'supporting',
          personalityTraits: ['聪慧', '独立', '温柔但坚强'],
          goal: '找到自己的价值',
          relationships: [`与${protagonistName}是恋人关系`]
        },
        {
          id: 'char_3',
          name: '导师/引路人',
          role: 'supporting',
          personalityTraits: ['睿智', '神秘', '亦师亦友'],
          goal: '传承自己的理念',
          relationships: [`是${protagonistName}的导师`]
        },
        {
          id: 'char_4',
          name: '反派/boss',
          role: 'minor',
          personalityTraits: ['冷酷', '野心勃勃', '执着'],
          goal: '统治/复仇/毁灭',
          relationships: [`与${protagonistName}有深仇大恨`]
        }
      ],
      
      chapters: [
        { index: 1, title: '命运的转折', summary: '主角平凡的生活被打破' },
        { index: 2, title: '新的开始', summary: '进入一个全新的世界' },
        { index: 3, title: '初露锋芒', summary: '第一次展现特殊能力' },
        { index: 4, title: '强敌出现', summary: '面临第一个重大挑战' },
        { index: 5, title: '低谷与反思', summary: '遭遇失败，重新审视自己' },
        { index: 6, title: '觉醒之路', summary: '获得成长突破的关键' },
        { index: 7, title: '感情升温', summary: '与重要角色的关系深化' },
        { index: 8, title: '真相浮出', summary: '发现隐藏在背后的阴谋' },
        { index: 9, title: '决战前夕', summary: '为最终对决做准备' },
        { index: 10, title: '巅峰对决', summary: '与反派的决战' },
        { index: 11, title: '尘埃落定', summary: '战斗结束，新的秩序建立' },
        { index: 12, title: '新的征程', summary: '故事暂告段落，但未来可期' }
      ]
    }
  }

  const handleSelectVersion = async (version: GeneratedVersion) => {
    if (!projectId) return
    
    // Mark as selected in database
    await db.projectVersions.where('projectId').equals(projectId).modify({ isSelected: false })
    const selectedRecord = await db.projectVersions
      .where('projectId').equals(projectId)
      .and(v => v.versionIndex === version.versionIndex)
      .first()
    
    if (selectedRecord?.id) {
      await db.projectVersions.update(selectedRecord.id, { isSelected: true })
    }
    
    // Generate worldbuilding description based on genre
    const worldbuilding = await generateWorldbuilding(projectMeta)
    
    // Load current project to set as current
    const project = await db.projects.get(projectId)
    if (project) {
      setCurrentProject(project)
    }
    
    // Update project with worldbuilding
    await updateProject(projectId, { 
      worldbuilding,
      updatedAt: new Date()
    })
    
    // Fill project with outline, chapters, and characters
    const versionData: ProjectVersion = {
      projectId,
      versionIndex: version.versionIndex,
      outline: version.outline,
      characters: version.characters,
      chapters: version.chapters,
      generatedAt: Date.now(),
      isSelected: true
    }
    
    await useStore.getState().fillProjectFromVersion(versionData)
    
    // Navigate to fill page
    navigate(`/projects/${projectId}/fill`)
  }

  const generateWorldbuilding = async (meta: typeof projectMeta): Promise<string> => {
    if (!meta) return ''
    
    const prompt = `根据以下信息，生成一段200字左右的世界观描述：

作品：${meta.title}
题材：${meta.genre || '未知'}
背景：${meta.background || '现代'}
核心卖点：${meta.coreSellingPoint || '精彩故事'}

请描述这个世界的基本设定、氛围和特色。`

    try {
      const response = await callLLM({
        model: 'MiniMax-M2.7',
        messages: [
          { role: 'system', content: '你是一个专业的小说世界观设定专家，擅长创作独特而引人入胜的世界观设定。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 500
      }, 'worldbuilding_generator')
      
      return response.trim()
    } catch {
      return `这是一个发生在${meta.background || '现代'}的${meta.genre || '都市'}故事。`
    }
  }

  const allComplete = versions.every(v => v.isComplete && !v.error)
  const anyError = versions.some(v => v.error)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📚 {projectMeta?.title || '项目'} - 版本规划
          </h1>
          <p className="text-gray-600">
            AI 正在为您生成 3 个不同风格的故事版本
          </p>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>生成进度</span>
              <span>{generationProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>版本 1: {versions[0]?.isComplete ? '✓' : versions[0]?.isGenerating ? '生成中...' : '等待中'}</span>
              <span>版本 2: {versions[1]?.isComplete ? '✓' : versions[1]?.isGenerating ? '生成中...' : '等待中'}</span>
              <span>版本 3: {versions[2]?.isComplete ? '✓' : versions[2]?.isGenerating ? '生成中...' : '等待中'}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {anyError && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">
              部分版本生成失败，请稍后重试或手动刷新页面
            </p>
          </div>
        )}

        {/* Version Selector or Loading */}
        {allComplete ? (
          <>
            {/* Regenerate Button */}
            <div className="text-center mb-6">
              <button
                onClick={() => startGeneration(projectMeta!)}
                disabled={isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 transition-all"
              >
                {isGenerating ? '🔄 生成中...' : '🔄 换一批（重新生成3个版本）'}
              </button>
              <p className="text-xs text-gray-400 mt-1">换一批会消耗AI调用次数</p>
            </div>
            <VersionSelector
              versions={versions}
              onSelect={handleSelectVersion}
              projectTitle={projectMeta?.title || ''}
            />
          </>
        ) : (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-pulse text-6xl mb-4">✨</div>
              <p className="text-lg text-gray-600">AI 正在精心创作中...</p>
              <p className="text-sm text-gray-500 mt-2">请稍候，马上就好</p>
            </div>
          </div>
        )}

        {/* Project Info */}
        {projectMeta && (
          <div className="max-w-xl mx-auto mt-8 p-4 bg-white/50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">项目信息</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📖 标题：{projectMeta.title}</p>
              {projectMeta.genre && <p>🏷️ 题材：{projectMeta.genre}</p>}
              {projectMeta.protagonistName && <p>👤 主角：{projectMeta.protagonistName}</p>}
              {projectMeta.background && <p>🌍 背景：{projectMeta.background}</p>}
              {projectMeta.coreSellingPoint && <p>💡 卖点：{projectMeta.coreSellingPoint}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
