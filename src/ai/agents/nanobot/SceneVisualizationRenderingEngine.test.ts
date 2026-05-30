/**
 * SceneVisualizationRenderingEngine Tests — V510
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  createVisualization,
  addVisualElement,
  setDominantImagery,
  setColorPalette,
  addNarrativeVisualMapping,
  updateMappingEffectiveness,
  createRenderingPipeline,
  advancePipelineStage,
  markVisualizationRendered,
  cacheVisualization,
  getVisualizationForScene,
  getEffectiveMappings,
  getRenderingProgress,
  getVisualizationSummary
} from './SceneVisualizationRenderingEngine'

describe('SceneVisualizationRenderingEngine', () => {
  describe('createEmptyState', () => {
    it('should initialize empty state', () => {
      const state = createEmptyState()
      expect(state.visualizations).toEqual({})
      expect(state.mappings).toEqual({})
      expect(state.pipelines).toEqual({})
      expect(state.totalRendered).toBe(0)
    })
  })

  describe('createVisualization', () => {
    it('should create a visualization', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'A dark castle', 'fantasy')
      expect(Object.keys(state.visualizations)).toHaveLength(1)
      const viz = state.visualizations[Object.keys(state.visualizations)[0]]
      expect(viz.sceneId).toBe('scene1')
      expect(viz.visualStyle).toBe('fantasy')
      expect(viz.rendered).toBe(false)
    })
  })

  describe('addVisualElement', () => {
    it('should add visual element', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'A dark castle')
      const vizId = Object.keys(state.visualizations)[0]
      state = addVisualElement(state, vizId, 'character', 'Hero standing', { x: 50, y: 50 }, 1.2, 0.9, '#ff0000', 'high')

      expect(state.visualizations[vizId].elements).toHaveLength(1)
      expect(state.visualizations[vizId].elements[0].type).toBe('character')
      expect(state.visualizations[vizId].elements[0].priority).toBe('high')
    })

    it('should clamp opacity and scale', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'Test')
      const vizId = Object.keys(state.visualizations)[0]
      state = addVisualElement(state, vizId, 'object', 'Test', { x: 0, y: 0 }, 5, 2, undefined, 'medium')
      expect(state.visualizations[vizId].elements[0].scale).toBeLessThanOrEqual(5)
      expect(state.visualizations[vizId].elements[0].opacity).toBeLessThanOrEqual(1)
    })
  })

  describe('setDominantImagery', () => {
    it('should set dominant imagery types', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'Test')
      const vizId = Object.keys(state.visualizations)[0]
      state = setDominantImagery(state, vizId, ['emotional', 'symbolic'])

      expect(state.visualizations[vizId].dominantImagery).toContain('emotional')
      expect(state.visualizations[vizId].dominantImagery).toContain('symbolic')
    })
  })

  describe('setColorPalette', () => {
    it('should set color palette', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'Test')
      const vizId = Object.keys(state.visualizations)[0]
      state = setColorPalette(state, vizId, ['#1a1a2e', '#16213e', '#0f3460'])

      expect(state.visualizations[vizId].colorPalette).toHaveLength(3)
    })
  })

  describe('addNarrativeVisualMapping', () => {
    it('should create a mapping', () => {
      let state = createEmptyState()
      state = addNarrativeVisualMapping(state, 'his heart sank', 'A heavy stone sinking', 'symbolic')

      expect(Object.keys(state.mappings)).toHaveLength(1)
      expect(state.mappings[Object.keys(state.mappings)[0]].imageryType).toBe('symbolic')
    })
  })

  describe('updateMappingEffectiveness', () => {
    it('should update effectiveness score', () => {
      let state = createEmptyState()
      state = addNarrativeVisualMapping(state, 'test phrase', 'visual rep', 'emotional')
      const mapId = Object.keys(state.mappings)[0]

      state = updateMappingEffectiveness(state, mapId, 80)
      expect(state.mappings[mapId].effectivenessScore).toBe(80)
      expect(state.mappings[mapId].usageCount).toBe(1)

      state = updateMappingEffectiveness(state, mapId, 60)
      expect(state.mappings[mapId].effectivenessScore).toBe(70)
      expect(state.mappings[mapId].usageCount).toBe(2)
    })
  })

  describe('createRenderingPipeline', () => {
    it('should create a pipeline', () => {
      let state = createEmptyState()
      state = createRenderingPipeline(state, 'scene1', ['layout', 'shading', 'effects'])

      expect(Object.keys(state.pipelines)).toHaveLength(1)
      const pipe = state.pipelines[Object.keys(state.pipelines)[0]]
      expect(pipe.stages).toHaveLength(3)
      expect(pipe.currentStage).toBe(0)
    })
  })

  describe('advancePipelineStage', () => {
    it('should advance through stages', () => {
      let state = createEmptyState()
      state = createRenderingPipeline(state, 'scene1', ['layout', 'shading', 'effects'])
      const pipeId = Object.keys(state.pipelines)[0]

      state = advancePipelineStage(state, pipeId, 'layout done')
      const pipe = state.pipelines[pipeId]
      expect(pipe.stages[0].status).toBe('done')
      expect(pipe.currentStage).toBe(1)
    })

    it('should mark completed when all stages done', () => {
      let state = createEmptyState()
      state = createRenderingPipeline(state, 'scene1', ['layout', 'effects'])
      const pipeId = Object.keys(state.pipelines)[0]

      state = advancePipelineStage(state, pipeId)
      state = advancePipelineStage(state, pipeId)
      expect(state.pipelines[pipeId].completedAt).toBeDefined()
    })
  })

  describe('markVisualizationRendered', () => {
    it('should mark as rendered and update stats', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'Test')
      const vizId = Object.keys(state.visualizations)[0]

      state = markVisualizationRendered(state, vizId, 85)
      expect(state.visualizations[vizId].rendered).toBe(true)
      expect(state.visualizations[vizId].qualityScore).toBe(85)
      expect(state.totalRendered).toBe(1)
      expect(state.avgQualityScore).toBe(85)
    })
  })

  describe('cacheVisualization', () => {
    it('should cache visualization data', () => {
      let state = createEmptyState()
      state = cacheVisualization(state, 'scene1', '{"rendered": true}')
      expect(state.visualCache['scene1']).toBe('{"rendered": true}')
    })
  })

  describe('getVisualizationForScene', () => {
    it('should find visualization by sceneId', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'Test')

      const viz = getVisualizationForScene(state, 'scene1')
      expect(viz).not.toBeNull()
      expect(viz?.sceneId).toBe('scene1')
    })

    it('should return null for unknown scene', () => {
      const state = createEmptyState()
      expect(getVisualizationForScene(state, 'unknown')).toBeNull()
    })
  })

  describe('getEffectiveMappings', () => {
    it('should return sorted mappings', () => {
      let state = createEmptyState()
      state = addNarrativeVisualMapping(state, 'low', 'visual', 'emotional')
      state = addNarrativeVisualMapping(state, 'high', 'visual', 'emotional')
      const lowId = Object.keys(state.mappings)[0]
      const highId = Object.keys(state.mappings)[1]
      state = updateMappingEffectiveness(state, lowId, 30)
      state = updateMappingEffectiveness(state, highId, 90)

      const effective = getEffectiveMappings(state, 'emotional')
      expect(effective[0].narrativePhrase).toBe('high')
    })

    it('should filter by imagery type', () => {
      let state = createEmptyState()
      state = addNarrativeVisualMapping(state, 'phrase1', 'vis1', 'emotional')
      state = addNarrativeVisualMapping(state, 'phrase2', 'vis2', 'symbolic')

      const emotional = getEffectiveMappings(state, 'emotional')
      expect(emotional).toHaveLength(1)
    })
  })

  describe('getRenderingProgress', () => {
    it('should calculate progress percentage', () => {
      let state = createEmptyState()
      state = createRenderingPipeline(state, 'scene1', ['a', 'b', 'c'])
      const pipeId = Object.keys(state.pipelines)[0]

      const progress = getRenderingProgress(state, pipeId)
      expect(progress.percent).toBe(0)
      expect(progress.stagesRemaining).toBe(3)
    })
  })

  describe('getVisualizationSummary', () => {
    it('should return comprehensive summary', () => {
      let state = createEmptyState()
      state = createVisualization(state, 'scene1', 1, 'Test')
      state = createVisualization(state, 'scene2', 1, 'Test2')
      const vizId = Object.keys(state.visualizations)[0]
      state = markVisualizationRendered(state, vizId, 80)
      state = setDominantImagery(state, vizId, ['action', 'environmental'])

      const summary = getVisualizationSummary(state)
      expect(summary.totalVisualizations).toBe(2)
      expect(summary.renderedCount).toBe(1)
      expect(summary.avgQuality).toBe(80)
      expect(summary.topImageryTypes).toContain('action')
    })
  })
})