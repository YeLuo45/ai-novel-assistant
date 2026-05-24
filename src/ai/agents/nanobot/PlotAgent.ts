/**
 * PlotAgent.ts - 情节Agent
 * V41 多Agent协作系统核心组件
 */

import { WritingAgent, AgentConfig, AgentState, Message, ProcessingResult } from './WritingAgent'

export interface PlotPoint {
  id: string
  title: string
  description: string
  chapter?: number
}

export interface PlotPlan {
  title: string
  outline: PlotPoint[]
  conflicts: string[]
  themes: string[]
}

export class PlotAgent extends WritingAgent {
  readonly role: 'plot' = 'plot'
  private plotPlan?: PlotPlan

  constructor(config: AgentConfig, messageBusInstance?: import('./MessageBus').MessageBus) {
    super(config, messageBusInstance)
  }

  async process(message: Message): Promise<ProcessingResult> {
    this.setState('working')

    try {
      const payload = message.payload as { task?: string; genre?: string; existingPlot?: PlotPlan }

      switch (message.type) {
        case 'request':
          return await this.handlePlotRequest(payload)
        case 'event':
          return await this.handlePlotEvent(payload)
        default:
          return { success: false, error: `Unsupported message type: ${message.type}` }
      }
    } catch (error) {
      this.setState('error')
      return { success: false, error: (error as Error).message }
    }
  }

  private async handlePlotRequest(payload: { task?: string; genre?: string; existingPlot?: PlotPlan }): Promise<ProcessingResult> {
    const { task, genre, existingPlot } = payload

    if (existingPlot) {
      this.plotPlan = existingPlot
    }

    const plan = this.generatePlotPlan(task || '默认任务', genre || 'general')
    this.plotPlan = plan

    this.broadcast('plot:planning', {
      channel: 'plot:planning',
      type: 'event',
      payload: plan,
      timestamp: Date.now()
    })

    this.setState('done')
    return { success: true, output: plan }
  }

  private async handlePlotEvent(payload: unknown): Promise<ProcessingResult> {
    return { success: true }
  }

  private generatePlotPlan(task: string, genre: string): PlotPlan {
    const plotPoints: PlotPoint[] = [
      { id: 'plot_1', title: '开篇引入', description: `设定故事背景和主要角色， genre=${genre}` },
      { id: 'plot_2', title: '冲突升级', description: '引入主要冲突，推动故事发展' },
      { id: 'plot_3', title: '高潮迭起', description: '达到故事高潮，解决主要矛盾' },
      { id: 'plot_4', title: '结局收束', description: '完成故事线，给出合理结局' }
    ]

    return {
      title: task,
      outline: plotPoints,
      conflicts: ['主角与反派的对抗', '内心挣扎'],
      themes: [genre, '成长', '救赎']
    }
  }

  getPlotPlan(): PlotPlan | undefined {
    return this.plotPlan
  }

  setPlotPlan(plan: PlotPlan): void {
    this.plotPlan = plan
  }

  reset(): void {
    super.reset()
    this.plotPlan = undefined
  }
}
