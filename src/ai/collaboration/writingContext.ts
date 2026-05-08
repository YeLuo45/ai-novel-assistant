/**
 * 共享写作上下文
 * Phase 1: WritingContext 工厂函数和操作原语
 */

import type { WritingContext, Entity, PlotPoint, StyleProfile, AgentId, AgentOutput } from './types'

export function createWritingContext(params: {
  projectId: number
  userRequest: string
  viewpoint: WritingContext['viewpoint']
  povCharacter: string
  genre: string
  contextBefore: string
  contextAfter: string
  chapterTitle: string
  chapterOutline: string
  targetWordCount: number
}): WritingContext {
  return {
    sessionId: `collab_${Date.now()}`,
    projectId: params.projectId,
    userRequest: params.userRequest,
    viewpoint: params.viewpoint,
    povCharacter: params.povCharacter,
    genre: params.genre,
    contextBefore: params.contextBefore,
    contextAfter: params.contextAfter,
    chapterTitle: params.chapterTitle,
    chapterOutline: params.chapterOutline,
    targetWordCount: params.targetWordCount,
    outputs: new Map(),
    sharedData: {
      keyEntities: [],
      plotPoints: [],
      styleProfile: {
        avgSentenceLength: 0,
        dialogueRatio: 0,
        commonPhrases: []
      }
    }
  }
}

export function setAgentOutput(
  context: WritingContext,
  agentId: AgentId,
  output: AgentOutput
): void {
  context.outputs.set(agentId, output)
}

export function getAgentOutput(
  context: WritingContext,
  agentId: AgentId
): AgentOutput | undefined {
  return context.outputs.get(agentId)
}

export function addEntity(context: WritingContext, entity: Entity): void {
  context.sharedData.keyEntities.push(entity)
}

export function getEntity(context: WritingContext, name: string): Entity | undefined {
  return context.sharedData.keyEntities.find(e => e.name === name)
}

export function addPlotPoint(context: WritingContext, plotPoint: PlotPoint): void {
  context.sharedData.plotPoints.push(plotPoint)
}

export function updateStyleProfile(
  context: WritingContext,
  profile: Partial<StyleProfile>
): void {
  context.sharedData.styleProfile = {
    ...context.sharedData.styleProfile,
    ...profile
  }
}

// V13 增强导出
export { foresightManager } from './foresightManager'
export type { ForeshadowingRecord } from './types'
export { enhanceDialogue } from './dialogueEnhancer'
export { filterSensitiveWords, type FilterResult } from './sensitiveWordFilter'
