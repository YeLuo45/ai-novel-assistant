/**
 * 核心编排器 - Phase 3
 * 负责多 Agent 协作的调度、执行和结果聚合
 */

import { callLLM } from '../llm'
import type { WritingContext, Subtask, AgentOutput, PlotExpertOutput, PlotNode } from './types'
import { getAgentConfig, callAgentViaRegistry } from './agentRegistry'
import { createWritingContext, setAgentOutput } from './writingContext'
import { decomposeTask, getReadyTasks, allTasksCompleted } from './taskDecomposer'
import { resolveConflicts } from './conflictResolver'
import { aggregate } from './resultAggregator'
import { callCriticAgent } from './criticAgent'
import { foresightManager } from './foresightManager'
import { memoryManager } from '../memory/memoryManager'
import { checkConsistency } from '../memory/consistencyChecker'
import { generateChapterSummary } from '../memory/chapterSummaryGenerator'
import type { ConsistencyIssue } from '../memory/types'
// V15: 类型系统集成
import { getGenreConfig } from '../genres/genreConfig'
import { getGenreEnhancedPrompt, detectByGenre } from '../genres/genreDetector'
import type { GenreId } from '../genres/types'

export interface CollaborationOptions {
  projectId: number
  userRequest: string
  viewpoint: WritingContext['viewpoint']
  povCharacter: string
  genre: string
  genreId?: GenreId  // V15 新增：类型ID
  contextBefore: string
  contextAfter: string
  chapterTitle: string
  chapterOutline: string
  targetWordCount: number
}

export class CollaborationOrchestrator {
  private context: WritingContext
  private subtasks: Subtask[] = []
  private options: CollaborationOptions  // V15: 存储选项

  constructor(options: CollaborationOptions) {
    this.options = options
    this.context = createWritingContext(options)
  }

  /**
   * 开始协作写作
   */
  async start(): Promise<string> {
    // V14: 1. 加载记忆上下文
    const memoryContext = await this.loadMemoryContext()
    
    // V14: 2. 合并到 context
    this.context = { ...this.context, ...memoryContext }

    // V15: 3. 加载类型配置
    const genreConfig = this.options.genreId ? getGenreConfig(this.options.genreId) : null

    // 4. 分解任务
    this.subtasks = decomposeTask(this.context)

    // 5. 拓扑排序执行（使用类型增强的提示词）
    await this.executeTasks(genreConfig)

    // 6. 冲突处理
    resolveConflicts(this.subtasks, this.context)

    // V13: CriticAgent 评审
    const interimContent = this.subtasks.map(t => t.output).filter(Boolean).join('\n\n')
    const criticReport = await callCriticAgent(
      interimContent,
      {
        chapterTitle: this.context.chapterTitle,
        genre: this.context.genre,
        viewpoint: this.context.viewpoint,
        contextBefore: this.context.contextBefore
      }
    )

    // V14: 7. 一致性检查
    const consistencyIssues = await checkConsistency(
      this.context.projectId,
      interimContent,
      'all'
    )
    
    if (consistencyIssues.length > 0) {
      console.warn('[Orchestrator] 一致性警告:', consistencyIssues)
    }

    // V15: 8. 类型检测
    let genreDetectionResult = null
    if (genreConfig && this.options.genreId) {
      genreDetectionResult = detectByGenre(interimContent, this.options.genreId)
      if (genreDetectionResult.issues.length > 0) {
        console.warn('[Orchestrator] 类型检测问题:', genreDetectionResult.issues)
      }
    }

    // 9. 聚合结果（V15: 暂不传递genreDetectionResult，保持向后兼容）
    const result = await aggregate(this.context, this.subtasks, criticReport, { 
      consistencyIssues
    })

    // V14: 10. 保存到记忆
    await this.saveToMemory(result)

    return result
  }

  /**
   * V14: 加载记忆上下文
   */
  private async loadMemoryContext(): Promise<Partial<WritingContext>> {
    // 获取前3章摘要
    const recentChapters = await memoryManager.getRecentChapterSummaries(this.context.projectId, 3)
    const previousSummary = recentChapters.map(c => `第${c.chapterId}章 ${c.title}: ${c.summary}`).join('\n\n')
    
    // 获取角色状态
    const characterStates = await memoryManager.getAllCharacterStates(this.context.projectId)
    const characterStatesText = Object.entries(characterStates)
      .map(([name, state]) => `${name}: ${state}`)
      .join('\n')
    
    // 获取活跃伏笔
    const activeThreads = await memoryManager.getActivePlotThreads(this.context.projectId)
    const foreshadowingText = activeThreads
      .map(t => `[${t.tag}] ${t.description}`)
      .join('\n')
    
    // 获取世界观规则
    const worldRules = await memoryManager.getWorldRules(this.context.projectId)
    const worldRulesText = worldRules.map(r => r.content).join('\n')

    return {
      contextBefore: previousSummary || this.context.contextBefore,
      // 扩展 context 添加记忆相关字段
      memoryContext: {
        characterStates: characterStatesText,
        activeForeshadowing: foreshadowingText,
        worldRules: worldRulesText
      }
    } as Partial<WritingContext>
  }

  /**
   * V14: 保存结果到记忆
   */
  private async saveToMemory(result: string): Promise<void> {
    const projectId = this.context.projectId
    const chapterId = this.context.chapterTitle ? 
      parseInt(this.context.chapterTitle.replace(/[^0-9]/g, '')) || 1 : 1
    
    // 生成摘要
    const { summary, keyEvents, characterStates } = await generateChapterSummary(
      this.context.chapterTitle,
      result,
      this.context.contextBefore
    )
    
    // 保存章节摘要
    await memoryManager.addChapterSummary(
      projectId,
      chapterId,
      this.context.chapterTitle,
      summary,
      keyEvents,
      characterStates,
      result.length
    )
    
    // 处理伏笔回收
    // 从 PlotExpertOutput 中提取伏笔
    const plotOutput = this.subtasks.find(t => t.type === 'plot_design')?.output
    if (plotOutput) {
      // 解析伏笔标记并保存
      const threadMatches = Array.from(plotOutput.matchAll(/伏笔[：:]\s*\[([^\]]+)\]/g))
      for (const match of threadMatches) {
        const tag = match[1]
        await memoryManager.plantPlotThread(
          projectId,
          tag,
          `自动标记: ${tag}`,
          chapterId,
          []
        )
      }
    }
    
    // 更新角色状态
    for (const [charName, state] of Object.entries(characterStates)) {
      await memoryManager.updateCharacterState(
        projectId,
        charName,
        state,
        `第${chapterId}章结束`,
        chapterId
      )
    }
  }

  /**
   * 执行所有 subtask（拓扑排序 + 并行）
   * @param genreConfig V15: 类型配置，用于增强提示词
   */
  private async executeTasks(genreConfig: any): Promise<void> {
    while (!allTasksCompleted(this.subtasks)) {
      const readyTasks = getReadyTasks(this.subtasks)

      if (readyTasks.length === 0) {
        // 没有可执行的任务但仍有未完成的
        console.warn('[Orchestrator] No ready tasks but some still pending')
        break
      }

      // 并行执行所有就绪任务
      await Promise.all(readyTasks.map(t => this.executeSubtask(t, genreConfig)))
    }
  }

  /**
   * 执行单个 subtask
   * @param genreConfig V15: 类型配置
   */
  private async executeSubtask(subtask: Subtask, genreConfig: any): Promise<void> {
    const config = getAgentConfig(subtask.responsible)
    subtask.status = 'running'

    try {
      let output: string

      if (subtask.responsible === 'PlotExpert') {
        // PlotExpert 直接 LLM 调用
        output = await this.callPlotExpert(subtask, genreConfig)
      } else {
        // DialogueMaster / StyleGuard 通过 registry 代理
        output = await callAgentViaRegistry(subtask.responsible, this.buildParams(subtask, genreConfig))
      }

      subtask.output = output
      subtask.status = 'completed'

      // 写入 context
      const agentOutput: AgentOutput = {
        agentId: subtask.responsible,
        content: output,
        confidence: 0.8,
        warnings: []
      }
      setAgentOutput(this.context, subtask.responsible, agentOutput)

    } catch (error) {
      subtask.status = 'failed'
      subtask.error = error instanceof Error ? error.message : String(error)
      console.error(`[Orchestrator] Subtask ${subtask.id} failed:`, error)
    }
  }

  /**
   * PlotExpert 直接 LLM 调用
   * @param genreConfig V15: 类型配置
   */
  private async callPlotExpert(_subtask: Subtask, genreConfig: any): Promise<string> {
    const config = getAgentConfig('PlotExpert')
    
    // 替换 placeholder 为实际的 POV 角色
    let systemPrompt = config.systemPrompt.replace(/\{\{POV_CHARACTER\}\}/g, this.context.povCharacter || '角色')

    // V15: 类型增强提示词
    if (genreConfig && this.options.genreId) {
      systemPrompt = getGenreEnhancedPrompt(systemPrompt, 'plotExpert', this.options.genreId)
    }

    const userPrompt = `请为以下章节设计情节结构：

【章节标题】${this.context.chapterTitle}
【写作要求】${this.context.userRequest}
【章节大纲】${this.context.chapterOutline || '（无）'}
【前文衔接】${this.context.contextBefore || '（无）'}
【目标字数】约${this.context.targetWordCount}字
【叙事视角】${this.context.viewpoint}
【POV角色】${this.context.povCharacter || '（未指定）'}

请设计：
1. 三段式结构：建立 → 对抗 → 高潮
2. 每段的字数分配
3. 情感曲线：平静 → 紧张 → 高潮
4. 关键情节点（2-3个）
5. 伏笔标记（如有）
6. 世界观补充（如有）

输出格式：
## 情节结构
[结构描述]

## 情感曲线
[0, 20, 40, 60, 80, 100]

## 关键情节点
1. [setup/development/climax/resolution/foreshadow/callback] - [描述] (情感: [calm/tense/excited/sad/joyful])
   角色弧线：从[前状态]到[后状态]

## 伏笔标记（如有）
- [伏笔标签]: [描述] → 计划在第X章回收

## 世界观补充（如有）
- [category]: [内容]`

    const response = await callLLM({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      maxTokens: 2000
    }, 'collab-PlotExpert')

    // 解析结构化输出并更新伏笔管理器
    this.parsePlotExpertOutput(response)

    return response
  }

  /**
   * 解析 PlotExpert 输出，提取伏笔等信息
   */
  private parsePlotExpertOutput(response: string): void {
    try {
      // 提取伏笔标记
      const foreshadowMatch = response.match(/## 伏笔标记[\s\S]*?(?=##|$)/gi)
      if (foreshadowMatch) {
        const foreshadowText = foreshadowMatch[0]
        const foreshadowReg = /- (.+?): (.+?) → 计划在第(\d+)章回收/g
        let match
        while ((match = foreshadowReg.exec(foreshadowText)) !== null) {
          const [, tag, description, chapter] = match
          foresightManager.plant(this.context.projectId, tag.trim(), description.trim(), `chapter_${chapter}`)
        }
      }
    } catch (error) {
      console.warn('[Orchestrator] Failed to parse PlotExpert output:', error)
    }
  }

  /**
   * 解析 PlotExpert 输出为结构化类型
   */
  parsePlotExpertOutputToType(response: string): PlotExpertOutput {
    const output: PlotExpertOutput = {
      structure: [],
      characterArcs: [],
      foreshadowing: { planted: [], resolved: [] },
      emotionCurve: [0, 50, 100]
    }

    try {
      // 解析情感曲线
      const emotionMatch = response.match(/## 情感曲线[\s\S]*?\[[\d,\s]+\]/gi)
      if (emotionMatch) {
        const numbersMatch = emotionMatch[0].match(/\[[\d,\s]+\]/)
        if (numbersMatch) {
          output.emotionCurve = numbersMatch[0].replace(/[\[\]]/g, '').split(',').map(n => parseInt(n.trim(), 10))
        }
      }

      // 解析关键情节点
      const plotPointsMatch = response.match(/## 关键情节点[\s\S]*?(?=##|$)/gi)
      if (plotPointsMatch) {
        const plotText = plotPointsMatch[0]
        const nodeReg = /\d+\.\s*\[(\w+)\]\s*-\s*([^\(]+)\s*\(情感:\s*\[(\w+)\]\)/gi
        let match
        while ((match = nodeReg.exec(plotText)) !== null) {
          const [, type, description, emotion] = match
          const plotNode: PlotNode = {
            id: `node_${output.structure.length + 1}`,
            type: type as PlotNode['type'],
            description: description.trim(),
            emotionalTone: emotion as PlotNode['emotionalTone']
          }
          output.structure.push(plotNode)
        }
      }

      // 解析伏笔标记
      const foreshadowMatch = response.match(/## 伏笔标记[\s\S]*?(?=##|$)/gi)
      if (foreshadowMatch) {
        const foreshadowText = foreshadowMatch[0]
        const foreshadowReg = /- (.+?): (.+?) → 计划在第(\d+)章回收/g
        let match
        while ((match = foreshadowReg.exec(foreshadowText)) !== null) {
          const [, tag, description, chapter] = match
          output.foreshadowing.planted.push({
            tag: tag.trim(),
            description: description.trim(),
            plotNodeId: `chapter_${chapter}`
          })
        }
      }

      // 解析世界观补充
      const worldBuildingMatch = response.match(/## 世界观补充[\s\S]*?(?=##|$)/gi)
      if (worldBuildingMatch && worldBuildingMatch[0]) {
        output.worldBuilding = []
        const worldText = worldBuildingMatch[0]
        const worldReg = /- \[(\w+)\]:\s*(.+)/g
        let match
        while ((match = worldReg.exec(worldText)) !== null) {
          const [, category, content] = match
          output.worldBuilding.push({
            category: category as 'location' | 'faction' | 'rule' | 'history',
            content: content.trim()
          })
        }
      }

    } catch (error) {
      console.warn('[Orchestrator] Failed to parse PlotExpert output:', error)
    }

    return output
  }

  /**
   * 构建 agent 参数
   * @param genreConfig V15: 类型配置
   */
  private buildParams(subtask: Subtask, genreConfig: any): Record<string, unknown> {
    const plotOutput = this.subtasks.find(t => t.id === 't1')?.output || ''

    const baseParams: Record<string, unknown> = {
      genreConfig,  // V15: 传递类型配置
      genreId: this.options.genreId  // V15: 传递类型ID
    }

    switch (subtask.responsible) {
      case 'DialogueMaster':
        // V15: 对话大师使用类型增强
        let sceneDescription = `基于情节：${plotOutput}`
        if (genreConfig && this.options.genreId) {
          const enhancedPrompt = getGenreEnhancedPrompt(sceneDescription, 'dialogueMaster', this.options.genreId)
          return {
            ...baseParams,
            scene: enhancedPrompt,
            characters: [],  // TODO: 从项目素材库获取
            mood: 'conflicting',
            length: 'medium' as const,
            model: 'gpt-4o-mini'
          }
        }
        return {
          ...baseParams,
          scene: sceneDescription,
          characters: [],  // TODO: 从项目素材库获取
          mood: 'conflicting',
          length: 'medium' as const,
          model: 'gpt-4o-mini'
        }
      case 'StyleGuard':
        return {
          ...baseParams,
          projectId: this.context.projectId,
          chapterId: 0  // TODO: 需要实际章节 ID
        }
      default:
        return baseParams
    }
  }

  /**
   * V15: 获取 Agent 类型字符串
   */
  private getAgentType(agentId: string): 'plotExpert' | 'dialogueMaster' | 'styleGuard' | 'criticAgent' {
    switch (agentId) {
      case 'PlotExpert': return 'plotExpert'
      case 'DialogueMaster': return 'dialogueMaster'
      case 'StyleGuard': return 'styleGuard'
      case 'CriticAgent': return 'criticAgent'
      default: return 'plotExpert'
    }
  }
}
