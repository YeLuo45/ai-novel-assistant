/**
 * SceneVisualizationRenderingEngine — V509
 * Visual scene rendering, imagery optimization, and narrative-to-visual mapping.
 * Inspired by: ruflo (hierarchical decomposition) + chatdev (visual feedback) + thunderbolt (pipeline)
 */

export type VisualStyle = 'realistic' | 'stylized' | 'abstract' | 'noir' | 'fantasy' | 'minimalist'
export type RenderPriority = 'critical' | 'high' | 'medium' | 'low'
export type ImageryType = 'action' | 'emotional' | 'environmental' | 'symbolic' | 'descriptive'

export interface VisualElement {
  id: string
  type: 'character' | 'object' | 'background' | 'effect' | 'text'
  description: string
  position: { x: number, y: number, z?: number }
  scale: number
  opacity: number
  color?: string
  priority: RenderPriority
}

export interface SceneVisualization {
  id: string
  sceneId: string
  chapterNumber: number
  sceneDescription: string
  visualStyle: VisualStyle
  elements: VisualElement[]
  dominantImagery: ImageryType[]
  colorPalette: string[]
  mood: string
  rendered: boolean
  qualityScore: number
  timestamp: number
}

export interface NarrativeVisualMapping {
  id: string
  narrativePhrase: string
  visualRepresentation: string
  imageryType: ImageryType
  effectivenessScore: number
  usageCount: number
}

export interface RenderingPipeline {
  id: string
  sceneId: string
  stages: { name: string, status: 'pending' | 'processing' | 'done', output?: string }[]
  currentStage: number
  estimatedTimeMs: number
  completedAt?: number
}

export interface VisualizationState {
  visualizations: Record<string, SceneVisualization>
  mappings: Record<string, NarrativeVisualMapping>
  pipelines: Record<string, RenderingPipeline>
  visualCache: Record<string, string>  // sceneId -> cached visualization
  avgQualityScore: number
  totalRendered: number
}

export function createEmptyState(): VisualizationState {
  return {
    visualizations: {},
    mappings: {},
    pipelines: {},
    visualCache: {},
    avgQualityScore: 0,
    totalRendered: 0
  }
}

export function createVisualization(
  state: VisualizationState,
  sceneId: string,
  chapterNumber: number,
  sceneDescription: string,
  visualStyle: VisualStyle = 'fantasy'
): VisualizationState {
  const id = `vis_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const visualization: SceneVisualization = {
    id,
    sceneId,
    chapterNumber,
    sceneDescription,
    visualStyle,
    elements: [],
    dominantImagery: [],
    colorPalette: [],
    mood: '',
    rendered: false,
    qualityScore: 0,
    timestamp: Date.now()
  }

  return {
    ...state,
    visualizations: { ...state.visualizations, [id]: visualization }
  }
}

export function addVisualElement(
  state: VisualizationState,
  visualizationId: string,
  type: VisualElement['type'],
  description: string,
  position: { x: number, y: number, z?: number },
  scale: number = 1,
  opacity: number = 1,
  color?: string,
  priority: RenderPriority = 'medium'
): VisualizationState {
  const viz = state.visualizations[visualizationId]
  if (!viz) return state

  const element: VisualElement = {
    id: `elem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    description,
    position,
    scale: Math.max(0.1, scale),
    opacity: Math.max(0, Math.min(1, opacity)),
    color,
    priority
  }

  return {
    ...state,
    visualizations: {
      ...state.visualizations,
      [visualizationId]: {
        ...viz,
        elements: [...viz.elements, element]
      }
    }
  }
}

export function setDominantImagery(
  state: VisualizationState,
  visualizationId: string,
  imagery: ImageryType[]
): VisualizationState {
  const viz = state.visualizations[visualizationId]
  if (!viz) return state

  return {
    ...state,
    visualizations: {
      ...state.visualizations,
      [visualizationId]: { ...viz, dominantImagery: imagery }
    }
  }
}

export function setColorPalette(
  state: VisualizationState,
  visualizationId: string,
  palette: string[]
): VisualizationState {
  const viz = state.visualizations[visualizationId]
  if (!viz) return state

  return {
    ...state,
    visualizations: {
      ...state.visualizations,
      [visualizationId]: { ...viz, colorPalette: palette }
    }
  }
}

export function addNarrativeVisualMapping(
  state: VisualizationState,
  narrativePhrase: string,
  visualRepresentation: string,
  imageryType: ImageryType
): VisualizationState {
  const id = `map_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const mapping: NarrativeVisualMapping = {
    id,
    narrativePhrase,
    visualRepresentation,
    imageryType,
    effectivenessScore: 50,
    usageCount: 0
  }

  return {
    ...state,
    mappings: { ...state.mappings, [id]: mapping }
  }
}

export function updateMappingEffectiveness(
  state: VisualizationState,
  mappingId: string,
  score: number
): VisualizationState {
  const mapping = state.mappings[mappingId]
  if (!mapping) return state

  const newUsage = mapping.usageCount + 1
  const newScore = ((mapping.effectivenessScore * mapping.usageCount) + score) / newUsage

  return {
    ...state,
    mappings: {
      ...state.mappings,
      [mappingId]: {
        ...mapping,
        effectivenessScore: Math.round(newScore),
        usageCount: newUsage
      }
    }
  }
}

export function createRenderingPipeline(
  state: VisualizationState,
  sceneId: string,
  stages: string[]
): VisualizationState {
  const id = `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const pipeline: RenderingPipeline = {
    id,
    sceneId,
    stages: stages.map(name => ({ name, status: 'pending' as const })),
    currentStage: 0,
    estimatedTimeMs: stages.length * 500
  }

  return {
    ...state,
    pipelines: { ...state.pipelines, [id]: pipeline }
  }
}

export function advancePipelineStage(
  state: VisualizationState,
  pipelineId: string,
  output?: string
): VisualizationState {
  const pipeline = state.pipelines[pipelineId]
  if (!pipeline) return state

  const stages = [...pipeline.stages]
  if (pipeline.currentStage < stages.length) {
    stages[pipeline.currentStage] = {
      name: stages[pipeline.currentStage].name,
      status: 'done',
      output
    }
  }

  const nextStage = pipeline.currentStage + 1
  if (nextStage < stages.length) {
    stages[nextStage] = { ...stages[nextStage], status: 'processing' }
  }

  return {
    ...state,
    pipelines: {
      ...state.pipelines,
      [pipelineId]: {
        ...pipeline,
        stages,
        currentStage: Math.min(nextStage, stages.length - 1),
        completedAt: nextStage >= stages.length ? Date.now() : undefined
      }
    }
  }
}

export function markVisualizationRendered(
  state: VisualizationState,
  visualizationId: string,
  qualityScore: number
): VisualizationState {
  const viz = state.visualizations[visualizationId]
  if (!viz) return state

  const updatedViz: SceneVisualization = {
    ...viz,
    rendered: true,
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    timestamp: Date.now()
  }

  const newTotal = state.totalRendered + 1
  const newAvg = ((state.avgQualityScore * state.totalRendered) + qualityScore) / newTotal

  return {
    ...state,
    visualizations: { ...state.visualizations, [visualizationId]: updatedViz },
    totalRendered: newTotal,
    avgQualityScore: Math.round(newAvg)
  }
}

export function cacheVisualization(
  state: VisualizationState,
  sceneId: string,
  visualizationData: string
): VisualizationState {
  return {
    ...state,
    visualCache: { ...state.visualCache, [sceneId]: visualizationData }
  }
}

export function getVisualizationForScene(
  state: VisualizationState,
  sceneId: string
): SceneVisualization | null {
  const viz = Object.values(state.visualizations).find(v => v.sceneId === sceneId)
  return viz || null
}

export function getEffectiveMappings(
  state: VisualizationState,
  imageryType?: ImageryType
): NarrativeVisualMapping[] {
  return Object.values(state.mappings)
    .filter(m => !imageryType || m.imageryType === imageryType)
    .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
}

export function getRenderingProgress(
  state: VisualizationState,
  pipelineId: string
): { percent: number, currentStage: string, stagesRemaining: number } {
  const pipeline = state.pipelines[pipelineId]
  if (!pipeline) return { percent: 0, currentStage: '', stagesRemaining: 0 }

  const doneCount = pipeline.stages.filter(s => s.status === 'done').length
  const percent = Math.round((doneCount / pipeline.stages.length) * 100)
  const currentStage = pipeline.stages[pipeline.currentStage]?.name || ''
  const stagesRemaining = pipeline.stages.length - doneCount

  return { percent, currentStage, stagesRemaining }
}

export function getVisualizationSummary(state: VisualizationState): {
  totalVisualizations: number,
  renderedCount: number,
  avgQuality: number,
  cachedCount: number,
  totalMappings: number,
  topImageryTypes: ImageryType[]
} {
  const vizs = Object.values(state.visualizations)
  const renderedCount = vizs.filter(v => v.rendered).length

  const imageryCounts: Record<string, number> = {}
  for (const v of vizs) {
    for (const img of v.dominantImagery) {
      imageryCounts[img] = (imageryCounts[img] || 0) + 1
    }
  }

  const topImagery = Object.entries(imageryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([img]) => img as ImageryType)

  return {
    totalVisualizations: vizs.length,
    renderedCount,
    avgQuality: state.avgQualityScore,
    cachedCount: Object.keys(state.visualCache).length,
    totalMappings: Object.keys(state.mappings).length,
    topImageryTypes: topImagery
  }
}