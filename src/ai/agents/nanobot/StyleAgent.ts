/**
 * StyleAgent.ts - 文风Agent
 * V41 多Agent协作系统核心组件
 */

import { WritingAgent, AgentConfig, Message, ProcessingResult } from './WritingAgent'

export interface StyleProfile {
  tone: 'formal' | 'casual' | 'dramatic' | 'humorous' | 'serious'
  pacing: 'fast' | 'moderate' | 'slow'
  detailLevel: 'minimal' | 'moderate' | 'elaborate'
  narrativeDistance: 'first_person' | 'third_person_limited' | 'third_person_omniscient'
}

export interface StyleGuide {
  profile: StyleProfile
  wordFrequency: Record<string, number>
  sentencePatterns: string[]
}

export class StyleAgent extends WritingAgent {
  readonly role: 'style' = 'style'
  private styleGuide?: StyleGuide

  constructor(config: AgentConfig, messageBusInstance?: import('./MessageBus').MessageBus) {
    super(config, messageBusInstance)
  }

  async process(message: Message): Promise<ProcessingResult> {
    this.setState('working')

    try {
      const payload = message.payload as { genre?: string; existingGuide?: StyleGuide }

      switch (message.type) {
        case 'request':
          return await this.handleStyleRequest(payload)
        case 'event':
          return await this.handleStyleEvent(payload)
        default:
          return { success: false, error: `Unsupported message type: ${message.type}` }
      }
    } catch (error) {
      this.setState('error')
      return { success: false, error: (error as Error).message }
    }
  }

  private async handleStyleRequest(payload: { genre?: string; existingGuide?: StyleGuide }): Promise<ProcessingResult> {
    const { genre } = payload

    if (payload.existingGuide) {
      this.styleGuide = payload.existingGuide
    }

    const guide = this.generateStyleGuide(genre || 'general')
    this.styleGuide = guide

    this.broadcast('style:feedback', {
      channel: 'style:feedback',
      type: 'event',
      payload: guide,
      timestamp: Date.now()
    })

    this.setState('done')
    return { success: true, output: guide }
  }

  private async handleStyleEvent(payload: unknown): Promise<ProcessingResult> {
    return { success: true }
  }

  private generateStyleGuide(genre: string): StyleGuide {
    return {
      profile: {
        tone: 'serious',
        pacing: 'moderate',
        detailLevel: 'moderate',
        narrativeDistance: 'third_person_limited'
      },
      wordFrequency: {
        '然而': 5,
        '因此': 3,
        '然而': 4
      },
      sentencePatterns: [
        '简短句增加节奏感',
        '长句描述复杂情感',
        '对话使用简短有力的语言'
      ]
    }
  }

  getStyleGuide(): StyleGuide | undefined {
    return this.styleGuide
  }

  setStyleGuide(guide: StyleGuide): void {
    this.styleGuide = guide
  }

  reset(): void {
    super.reset()
    this.styleGuide = undefined
  }
}
