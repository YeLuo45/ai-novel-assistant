/**
 * CrossAuthorFederatedLearningEngine — V499
 * Privacy-preserving multi-author collaborative learning and writing style transfer.
 * Inspired by: generic-agent (L0-L4分层记忆) + thunderbolt (离线优先)
 */

export type StyleAttribute = 'vocabulary_richness' | 'sentence_variety' | 'dialogue_ratio' | 'description_density' | 'pacing_tension' | 'emotional_depth'
export type PrivacyLevel = 'public' | 'anonymous' | 'private'

export interface AuthorStyleVector {
  authorId: string
  vocabularyRichness: number  // 0-100
  sentenceVariety: number
  dialogueRatio: number
  descriptionDensity: number
  pacingTension: number
  emotionalDepth: number
  lastUpdated: number
}

export interface FederatedInstance {
  id: string
  name: string
  authorIds: string[]
  aggregatedStyle: AuthorStyleVector | null
  contributionCount: number
  privacyLevel: PrivacyLevel
  modelVersion: string
  createdAt: number
}

export interface Contribution {
  id: string
  instanceId: string
  authorId: string
  styleVector: AuthorStyleVector
  contributionWeight: number
  timestamp: number
}

export interface CrossAuthorState {
  instances: Record<string, FederatedInstance>
  contributions: Contribution[]
  localStyle: AuthorStyleVector | null
  pendingSync: boolean
  privacyLevel: PrivacyLevel
  modelCache: Record<string, AuthorStyleVector>
}

export function createEmptyState(): CrossAuthorState {
  return {
    instances: {},
    contributions: [],
    localStyle: null,
    pendingSync: false,
    privacyLevel: 'anonymous',
    modelCache: {}
  }
}

export function initLocalStyle(
  state: CrossAuthorState,
  authorId: string,
  vocab: number = 50,
  sentence: number = 50,
  dialogue: number = 50,
  description: number = 50,
  pacing: number = 50,
  emotional: number = 50
): CrossAuthorState {
  const style: AuthorStyleVector = {
    authorId,
    vocabularyRichness: Math.max(0, Math.min(100, vocab)),
    sentenceVariety: Math.max(0, Math.min(100, sentence)),
    dialogueRatio: Math.max(0, Math.min(100, dialogue)),
    descriptionDensity: Math.max(0, Math.min(100, description)),
    pacingTension: Math.max(0, Math.min(100, pacing)),
    emotionalDepth: Math.max(0, Math.min(100, emotional)),
    lastUpdated: Date.now()
  }
  return { ...state, localStyle: style }
}

export function createFederatedInstance(
  state: CrossAuthorState,
  name: string,
  privacyLevel: PrivacyLevel = 'anonymous'
): CrossAuthorState {
  const id = `instance_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const instance: FederatedInstance = {
    id,
    name,
    authorIds: [],
    aggregatedStyle: null,
    contributionCount: 0,
    privacyLevel,
    modelVersion: '1.0.0',
    createdAt: Date.now()
  }
  return { ...state, instances: { ...state.instances, [id]: instance } }
}

export function joinInstance(
  state: CrossAuthorState,
  instanceId: string,
  authorId: string
): CrossAuthorState {
  const instance = state.instances[instanceId]
  if (!instance) return state
  if (instance.authorIds.includes(authorId)) return state

  return {
    ...state,
    instances: {
      ...state.instances,
      [instanceId]: {
        ...instance,
        authorIds: [...instance.authorIds, authorId]
      }
    }
  }
}

export function leaveInstance(
  state: CrossAuthorState,
  instanceId: string,
  authorId: string
): CrossAuthorState {
  const instance = state.instances[instanceId]
  if (!instance) return state

  return {
    ...state,
    instances: {
      ...state.instances,
      [instanceId]: {
        ...instance,
        authorIds: instance.authorIds.filter(id => id !== authorId)
      }
    }
  }
}

export function submitContribution(
  state: CrossAuthorState,
  instanceId: string,
  authorId: string,
  styleVector: AuthorStyleVector
): CrossAuthorState {
  const instance = state.instances[instanceId]
  if (!instance || !instance.authorIds.includes(authorId)) return state

  const contribution: Contribution = {
    id: `contrib_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    instanceId,
    authorId,
    styleVector,
    contributionWeight: 1.0,
    timestamp: Date.now()
  }

  return {
    ...state,
    contributions: [...state.contributions, contribution],
    instances: {
      ...state.instances,
      [instanceId]: {
        ...instance,
        contributionCount: instance.contributionCount + 1
      }
    }
  }
}

export function aggregateStyles(state: CrossAuthorState, instanceId: string): CrossAuthorState {
  const instance = state.instances[instanceId]
  if (!instance || instance.contributionCount === 0) return state

  const relevantContributions = state.contributions.filter(c => c.instanceId === instanceId)
  if (relevantContributions.length === 0) return state

  const weights = relevantContributions.map(c => c.contributionWeight)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const avgStyle: AuthorStyleVector = {
    authorId: 'aggregated',
    vocabularyRichness: Math.round(relevantContributions.reduce((s, c) => s + c.styleVector.vocabularyRichness * c.contributionWeight, 0) / totalWeight),
    sentenceVariety: Math.round(relevantContributions.reduce((s, c) => s + c.styleVector.sentenceVariety * c.contributionWeight, 0) / totalWeight),
    dialogueRatio: Math.round(relevantContributions.reduce((s, c) => s + c.styleVector.dialogueRatio * c.contributionWeight, 0) / totalWeight),
    descriptionDensity: Math.round(relevantContributions.reduce((s, c) => s + c.styleVector.descriptionDensity * c.contributionWeight, 0) / totalWeight),
    pacingTension: Math.round(relevantContributions.reduce((s, c) => s + c.styleVector.pacingTension * c.contributionWeight, 0) / totalWeight),
    emotionalDepth: Math.round(relevantContributions.reduce((s, c) => s + c.styleVector.emotionalDepth * c.contributionWeight, 0) / totalWeight),
    lastUpdated: Date.now()
  }

  return {
    ...state,
    instances: {
      ...state.instances,
      [instanceId]: {
        ...instance,
        aggregatedStyle: avgStyle
      }
    }
  }
}

export function getInstanceAggregatedStyle(state: CrossAuthorState, instanceId: string): AuthorStyleVector | null {
  return state.instances[instanceId]?.aggregatedStyle || null
}

export function applyStyleTransfer(
  localStyle: AuthorStyleVector,
  targetStyle: AuthorStyleVector,
  blendFactor: number  // 0-1, how much target style to apply
): AuthorStyleVector {
  const blend = Math.max(0, Math.min(1, blendFactor))
  const invBlend = 1 - blend

  return {
    authorId: localStyle.authorId,
    vocabularyRichness: Math.round(localStyle.vocabularyRichness * invBlend + targetStyle.vocabularyRichness * blend),
    sentenceVariety: Math.round(localStyle.sentenceVariety * invBlend + targetStyle.sentenceVariety * blend),
    dialogueRatio: Math.round(localStyle.dialogueRatio * invBlend + targetStyle.dialogueRatio * blend),
    descriptionDensity: Math.round(localStyle.descriptionDensity * invBlend + targetStyle.descriptionDensity * blend),
    pacingTension: Math.round(localStyle.pacingTension * invBlend + targetStyle.pacingTension * blend),
    emotionalDepth: Math.round(localStyle.emotionalDepth * invBlend + targetStyle.emotionalDepth * blend),
    lastUpdated: Date.now()
  }
}

export function cacheModel(state: CrossAuthorState, modelKey: string, style: AuthorStyleVector): CrossAuthorState {
  return { ...state, modelCache: { ...state.modelCache, [modelKey]: style } }
}

export function getCachedModel(state: CrossAuthorState, modelKey: string): AuthorStyleVector | null {
  return state.modelCache[modelKey] || null
}

export function updateLocalStyle(
  state: CrossAuthorState,
  updates: Partial<Pick<AuthorStyleVector, 'vocabularyRichness' | 'sentenceVariety' | 'dialogueRatio' | 'descriptionDensity' | 'pacingTension' | 'emotionalDepth'>>
): CrossAuthorState {
  if (!state.localStyle) return state
  return {
    ...state,
    localStyle: { ...state.localStyle, ...updates, lastUpdated: Date.now() }
  }
}

export function getStyleDifference(a: AuthorStyleVector, b: AuthorStyleVector): Record<StyleAttribute, number> {
  return {
    vocabulary_richness: Math.abs(a.vocabularyRichness - b.vocabularyRichness),
    sentence_variety: Math.abs(a.sentenceVariety - b.sentenceVariety),
    dialogue_ratio: Math.abs(a.dialogueRatio - b.dialogueRatio),
    description_density: Math.abs(a.descriptionDensity - b.descriptionDensity),
    pacing_tension: Math.abs(a.pacingTension - b.pacingTension),
    emotional_depth: Math.abs(a.emotionalDepth - b.emotionalDepth)
  }
}

export function getInstanceContributors(state: CrossAuthorState, instanceId: string): string[] {
  return state.instances[instanceId]?.authorIds || []
}

export function getContributionsByAuthor(state: CrossAuthorState, authorId: string): Contribution[] {
  return state.contributions.filter(c => c.authorId === authorId)
}

export function setPrivacyLevel(state: CrossAuthorState, level: PrivacyLevel): CrossAuthorState {
  return { ...state, privacyLevel: level }
}

export function markPendingSync(state: CrossAuthorState, pending: boolean): CrossAuthorState {
  return { ...state, pendingSync: pending }
}