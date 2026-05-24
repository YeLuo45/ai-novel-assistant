/**
 * CharacterAgent.ts - 角色Agent
 * V41 多Agent协作系统核心组件
 */

import { WritingAgent, AgentConfig, Message, ProcessingResult } from './WritingAgent'
import { PlotPlan } from './PlotAgent'

export interface Character {
  id: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  description: string
  personality: string[]
  relationships: Record<string, string>
}

export interface CharacterSheet {
  characters: Character[]
  mainCharacters: Character[]
  updatedAt: number
}

export class CharacterAgent extends WritingAgent {
  readonly role: 'character' = 'character'
  private characterSheet?: CharacterSheet

  constructor(config: AgentConfig, messageBusInstance?: import('./MessageBus').MessageBus) {
    super(config, messageBusInstance)
  }

  async process(message: Message): Promise<ProcessingResult> {
    this.setState('working')

    try {
      const payload = message.payload as { plotPlan?: PlotPlan; genre?: string; existingCharacters?: CharacterSheet }

      switch (message.type) {
        case 'request':
          return await this.handleCharacterRequest(payload)
        case 'event':
          return await this.handleCharacterEvent(payload)
        default:
          return { success: false, error: `Unsupported message type: ${message.type}` }
      }
    } catch (error) {
      this.setState('error')
      return { success: false, error: (error as Error).message }
    }
  }

  private async handleCharacterRequest(payload: { plotPlan?: PlotPlan; genre?: string; existingCharacters?: CharacterSheet }): Promise<ProcessingResult> {
    const { plotPlan, genre } = payload

    if (payload.existingCharacters) {
      this.characterSheet = payload.existingCharacters
    }

    const sheet = this.generateCharacterSheet(plotPlan, genre || 'general')
    this.characterSheet = sheet

    this.broadcast('character:update', {
      channel: 'character:update',
      type: 'event',
      payload: sheet,
      timestamp: Date.now()
    })

    this.setState('done')
    return { success: true, output: sheet }
  }

  private async handleCharacterEvent(payload: unknown): Promise<ProcessingResult> {
    return { success: true }
  }

  private generateCharacterSheet(plotPlan?: PlotPlan, genre?: string): CharacterSheet {
    const characters: Character[] = [
      {
        id: 'char_1',
        name: '主角',
        role: 'protagonist',
        description: '故事的主要视角角色',
        personality: ['勇敢', '坚定', '有时犹豫'],
        relationships: { char_2: '对手', char_3: '盟友' }
      },
      {
        id: 'char_2',
        name: '反派',
        role: 'antagonist',
        description: '故事的主要对立角色',
        personality: ['狡猾', '野心勃勃', '复杂'],
        relationships: { char_1: '对手' }
      },
      {
        id: 'char_3',
        name: '配角',
        role: 'supporting',
        description: '辅助主角的角色',
        personality: ['忠诚', '智慧', '幽默'],
        relationships: { char_1: '盟友' }
      }
    ]

    return {
      characters,
      mainCharacters: characters.filter(c => c.role === 'protagonist' || c.role === 'antagonist'),
      updatedAt: Date.now()
    }
  }

  getCharacterSheet(): CharacterSheet | undefined {
    return this.characterSheet
  }

  setCharacterSheet(sheet: CharacterSheet): void {
    this.characterSheet = sheet
  }

  reset(): void {
    super.reset()
    this.characterSheet = undefined
  }
}
