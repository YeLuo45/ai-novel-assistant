/**
 * DialogueAgent.ts - 对话Agent
 * V41 多Agent协作系统核心组件
 */

import { WritingAgent, AgentConfig, Message, ProcessingResult } from './WritingAgent'
import { CharacterSheet } from './CharacterAgent'

export interface DialogueLine {
  id: string
  characterId: string
  content: string
  emotion?: string
  context?: string
}

export interface DialogueScene {
  id: string
  title: string
  dialogues: DialogueLine[]
  setting?: string
}

export interface DialoguePlan {
  scenes: DialogueScene[]
  totalLines: number
}

export class DialogueAgent extends WritingAgent {
  readonly role: 'dialogue' = 'dialogue'
  private dialoguePlan?: DialoguePlan

  constructor(config: AgentConfig, messageBusInstance?: import('./MessageBus').MessageBus) {
    super(config, messageBusInstance)
  }

  async process(message: Message): Promise<ProcessingResult> {
    this.setState('working')

    try {
      const payload = message.payload as { characters?: CharacterSheet; sceneContext?: string }

      switch (message.type) {
        case 'request':
          return await this.handleDialogueRequest(payload)
        case 'event':
          return await this.handleDialogueEvent(payload)
        default:
          return { success: false, error: `Unsupported message type: ${message.type}` }
      }
    } catch (error) {
      this.setState('error')
      return { success: false, error: (error as Error).message }
    }
  }

  private async handleDialogueRequest(payload: { characters?: CharacterSheet; sceneContext?: string }): Promise<ProcessingResult> {
    const { characters, sceneContext } = payload

    const plan = this.generateDialoguePlan(characters, sceneContext || '默认场景')
    this.dialoguePlan = plan

    this.broadcast('dialogue:request', {
      channel: 'dialogue:request',
      type: 'event',
      payload: plan,
      timestamp: Date.now()
    })

    this.setState('done')
    return { success: true, output: plan }
  }

  private async handleDialogueEvent(payload: unknown): Promise<ProcessingResult> {
    return { success: true }
  }

  private generateDialoguePlan(characters?: CharacterSheet, context?: string): DialoguePlan {
    const scene: DialogueScene = {
      id: 'scene_1',
      title: '开场对话',
      setting: context,
      dialogues: [
        { id: 'dlg_1', characterId: 'char_1', content: '我们该怎么做？', emotion: '疑惑' },
        { id: 'dlg_2', characterId: 'char_3', content: '相信你的直觉。', emotion: '鼓励' },
        { id: 'dlg_3', characterId: 'char_1', content: '好的，我明白了。', emotion: '坚定' }
      ]
    }

    return {
      scenes: [scene],
      totalLines: scene.dialogues.length
    }
  }

  getDialoguePlan(): DialoguePlan | undefined {
    return this.dialoguePlan
  }

  setDialoguePlan(plan: DialoguePlan): void {
    this.dialoguePlan = plan
  }

  reset(): void {
    super.reset()
    this.dialoguePlan = undefined
  }
}
