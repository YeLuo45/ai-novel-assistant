/**
 * Orchestrator.ts - 主编排器
 * V41 多Agent协作系统核心组件
 */

import { MessageBus, messageBus, Message, MessageType } from './MessageBus'
import { AgentRegistry, agentRegistry } from './AgentRegistry'
import { WritingAgent, AgentRole } from './WritingAgent'
import { PlotAgent, PlotPlan } from './PlotAgent'
import { CharacterAgent, CharacterSheet } from './CharacterAgent'
import { DialogueAgent, DialoguePlan } from './DialogueAgent'
import { StyleAgent, StyleGuide } from './StyleAgent'
import { CriticAgent, ReviewResult } from './CriticAgent'

// 通道定义
export const CHANNELS = {
  PLOT_PLANNING: 'plot:planning',
  CHARACTER_UPDATE: 'character:update',
  DIALOGUE_REQUEST: 'dialogue:request',
  STYLE_FEEDBACK: 'style:feedback',
  CRITIC_REVIEW: 'critic:review',
  ORCHESTRATOR: 'orchestrator:coordination'
} as const

export interface WritingTask {
  id: string
  title: string
  genre?: string
  initialInput?: string
}

export interface WritingResult {
  success: boolean
  taskId: string
  plotPlan?: PlotPlan
  characterSheet?: CharacterSheet
  dialoguePlan?: DialoguePlan
  styleGuide?: StyleGuide
  review?: ReviewResult
  iterations: number
  error?: string
}

export class Orchestrator {
  private messageBus: MessageBus
  private registry: AgentRegistry
  private plotAgent?: PlotAgent
  private characterAgent?: CharacterAgent
  private dialogueAgent?: DialogueAgent
  private styleAgent?: StyleAgent
  private criticAgent?: CriticAgent

  constructor(messageBusInstance?: MessageBus, registryInstance?: AgentRegistry) {
    this.messageBus = messageBusInstance ?? messageBus
    this.registry = registryInstance ?? agentRegistry
  }

  /**
   * 初始化所有Agent
   */
  private initializeAgents(): void {
    // 创建所有专业Agent
    this.plotAgent = new PlotAgent({ id: 'plot_1', name: 'PlotAgent', role: 'plot' }, this.messageBus)
    this.characterAgent = new CharacterAgent({ id: 'char_1', name: 'CharacterAgent', role: 'character' }, this.messageBus)
    this.dialogueAgent = new DialogueAgent({ id: 'dlg_1', name: 'DialogueAgent', role: 'dialogue' }, this.messageBus)
    this.styleAgent = new StyleAgent({ id: 'style_1', name: 'StyleAgent', role: 'style' }, this.messageBus)
    this.criticAgent = new CriticAgent({ id: 'critic_1', name: 'CriticAgent', role: 'critic' }, this.messageBus)

    // 注册所有Agent
    this.registry.register(this.plotAgent)
    this.registry.register(this.characterAgent)
    this.registry.register(this.dialogueAgent)
    this.registry.register(this.styleAgent)
    this.registry.register(this.criticAgent)
  }

  /**
   * 协调执行写作任务
   */
  async coordinate(task: WritingTask): Promise<WritingResult> {
    const result: WritingResult = {
      success: false,
      taskId: task.id,
      iterations: 0
    }

    try {
      // 1. 初始化Agent
      this.initializeAgents()

      // 2. 启动PlotAgent生成情节
      const plotMessage: Message = {
        id: `msg_${Date.now()}_0`,
        from: 'orchestrator',
        to: 'plot_1',
        channel: CHANNELS.PLOT_PLANNING,
        type: 'request' as MessageType,
        payload: { task: task.title, genre: task.genre },
        timestamp: Date.now()
      }

      if (!this.plotAgent) {
        throw new Error('PlotAgent not initialized')
      }

      const plotResult = await this.plotAgent.process(plotMessage)
      if (!plotResult.success) {
        result.error = 'PlotAgent failed'
        return result
      }

      result.plotPlan = plotResult.output as PlotPlan

      // 3. 等待情节计划生成后，触发CharacterAgent
      await this.delay(100)

      const charMessage: Message = {
        id: `msg_${Date.now()}_1`,
        from: 'orchestrator',
        to: 'char_1',
        channel: CHANNELS.CHARACTER_UPDATE,
        type: 'request' as MessageType,
        payload: { plotPlan: result.plotPlan, genre: task.genre },
        timestamp: Date.now()
      }

      if (!this.characterAgent) {
        throw new Error('CharacterAgent not initialized')
      }

      const charResult = await this.characterAgent.process(charMessage)
      if (charResult.success) {
        result.characterSheet = charResult.output as CharacterSheet
      }

      // 4. 触发DialogueAgent
      await this.delay(100)

      const dlgMessage: Message = {
        id: `msg_${Date.now()}_2`,
        from: 'orchestrator',
        to: 'dlg_1',
        channel: CHANNELS.DIALOGUE_REQUEST,
        type: 'request' as MessageType,
        payload: { characters: result.characterSheet },
        timestamp: Date.now()
      }

      if (!this.dialogueAgent) {
        throw new Error('DialogueAgent not initialized')
      }

      const dlgResult = await this.dialogueAgent.process(dlgMessage)
      if (dlgResult.success) {
        result.dialoguePlan = dlgResult.output as DialoguePlan
      }

      // 5. 触发StyleAgent
      await this.delay(100)

      const styleMessage: Message = {
        id: `msg_${Date.now()}_3`,
        from: 'orchestrator',
        to: 'style_1',
        channel: CHANNELS.STYLE_FEEDBACK,
        type: 'request' as MessageType,
        payload: { genre: task.genre },
        timestamp: Date.now()
      }

      if (!this.styleAgent) {
        throw new Error('StyleAgent not initialized')
      }

      const styleResult = await this.styleAgent.process(styleMessage)
      if (styleResult.success) {
        result.styleGuide = styleResult.output as StyleGuide
      }

      // 6. CriticAgent评审
      await this.delay(100)

      const reviewMessage: Message = {
        id: `msg_${Date.now()}_4`,
        from: 'orchestrator',
        to: 'critic_1',
        channel: CHANNELS.CRITIC_REVIEW,
        type: 'request' as MessageType,
        payload: {
          context: {
            plotPlan: result.plotPlan,
            characterSheet: result.characterSheet,
            dialoguePlan: result.dialoguePlan,
            styleGuide: result.styleGuide
          }
        },
        timestamp: Date.now()
      }

      if (!this.criticAgent) {
        throw new Error('CriticAgent not initialized')
      }

      const reviewResult = await this.criticAgent.process(reviewMessage)
      result.review = reviewResult.output as ReviewResult
      result.iterations = 1

      // 7. 根据评审结果决定是否迭代
      if (!result.review?.approved && result.iterations < 3) {
        // 可以增加迭代逻辑，这里简化为一次
        result.iterations++
      }

      result.success = true
      return result
    } catch (error) {
      result.error = (error as Error).message
      return result
    }
  }

  /**
   * 延迟辅助函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取协调结果摘要
   */
  getSummary(): { registeredAgents: number; channels: string[] } {
    return {
      registeredAgents: this.registry.size(),
      channels: Object.values(CHANNELS)
    }
  }

  /**
   * 重置编排器
   */
  reset(): void {
    this.registry.clear()
    this.plotAgent = undefined
    this.characterAgent = undefined
    this.dialogueAgent = undefined
    this.styleAgent = undefined
    this.criticAgent = undefined
  }
}

export const orchestrator = new Orchestrator()
