/**
 * NarrativeQualityScorer Tests - V139
 * Tests for Multi-Dimensional Narrative Quality Assessment Engine
 */

import { describe, it, expect } from 'vitest'
import {
  createEmptyScorerState,
  calculatePacingScore,
  calculateCoherenceScore,
  calculateCharacterizationScore,
  calculateDialogueScore,
  calculateWorldBuildingScore,
  calculateEmotionalImpactScore,
  calculateProseStyleScore,
  scoreNarrative,
  formatSceneAssessment,
  formatScorerDashboard,
} from './NarrativeQualityScorer'

// =============================================================================
// createEmptyScorerState Tests
// =============================================================================

describe('createEmptyScorerState', () => {
  it('should create state with 5 grade thresholds', () => {
    const state = createEmptyScorerState()
    expect(state.gradeThresholds.size).toBe(5)
  })

  it('should have 7 dimension weights', () => {
    const state = createEmptyScorerState()
    expect(state.dimensionWeights.size).toBe(7)
  })

  it('should have heuristic as preferred method', () => {
    const state = createEmptyScorerState()
    expect(state.preferredMethod).toBe('heuristic')
  })

  it('should initialize stats to zero', () => {
    const state = createEmptyScorerState()
    expect(state.totalScenesScored).toBe(0)
    expect(state.mostCommonWeakness).toBeNull()
  })
})

// =============================================================================
// calculatePacingScore Tests
// =============================================================================

describe('calculatePacingScore', () => {
  it('should return score between 0-100', () => {
    const result = calculatePacingScore('Short sentence.')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should detect good sentence variation', () => {
    const content = 'Short. This is a medium length sentence with more words. And another one that is even longer with many more words than before.'
    const result = calculatePacingScore(content)
    expect(result.score).toBeGreaterThan(40)
    expect(result.evidence.length).toBeGreaterThan(0)
  })

  it('should penalize monotonous sentence length', () => {
    const content = 'One. Two. Three. Four. Five. Six. Seven. Eight. Nine. Ten.'
    const result = calculatePacingScore(content)
    expect(result.score).toBeLessThanOrEqual(51)
  })

  it('should return score for empty content', () => {
    const result = calculatePacingScore('')
    expect(result.score).toBeGreaterThanOrEqual(0)
  })
})

// =============================================================================
// calculateCoherenceScore Tests
// =============================================================================

describe('calculateCoherenceScore', () => {
  it('should return score between 0-100', () => {
    const result = calculateCoherenceScore('Some coherent content here.')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should detect consistent pronoun usage', () => {
    const content = 'He walked into the room. He looked around. He saw the desk. He sat down.'
    const result = calculateCoherenceScore(content)
    expect(result.score).toBeGreaterThanOrEqual(50)
  })

  it('should penalize tense inconsistency', () => {
    const content = 'She is walking. Then she walked. She goes there yesterday.'
    const result = calculateCoherenceScore(content)
    expect(result.score).toBeLessThanOrEqual(60)
  })

  it('should reward good transitions', () => {
    const content = 'The sun set. However, the sky remained bright. Moreover, the stars were visible.'
    const result = calculateCoherenceScore(content)
    expect(result.evidence.some(e => e.includes('transition'))).toBe(true)
  })
})

// =============================================================================
// calculateCharacterizationScore Tests
// =============================================================================

describe('calculateCharacterizationScore', () => {
  it('should return score between 0-100', () => {
    const result = calculateCharacterizationScore('Test content.')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should reward dialogue', () => {
    const content = '"Hello," she said. "How are you?" He smiled and replied, "I am well."'
    const result = calculateCharacterizationScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should reward emotional language', () => {
    const content = 'She felt a surge of happiness. The anger bubbled up inside him. Fear gripped her heart.'
    const result = calculateCharacterizationScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should penalize lack of dialogue in longer content', () => {
    const content = 'The character walked through the forest. The trees were tall. The path was winding. The sky was dark.'
    const result = calculateCharacterizationScore(content)
    expect(result.score).toBeLessThanOrEqual(60)
  })
})

// =============================================================================
// calculateDialogueScore Tests
// =============================================================================

describe('calculateDialogueScore', () => {
  it('should return 0 for no dialogue', () => {
    const result = calculateDialogueScore('No dialogue here.')
    expect(result.score).toBe(0)
    expect(result.confidence).toBeLessThan(0.2)
  })

  it('should reward varied tags', () => {
    const content = '"Hello," she whispered. "How are you?" he asked. "Fine," she replied.'
    const result = calculateDialogueScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should reward multiple exchanges', () => {
    const content = '"Hello." "Hi." "How are you?" "Fine." "Good."'
    const result = calculateDialogueScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should detect overuse of said', () => {
    const content = '"Hello," he said. "How are you?" she said. "I am fine," he said.'
    const result = calculateDialogueScore(content)
    expect(result.evidence.some(e => e.includes('said') || e.includes('overused'))).toBe(true)
  })
})

// =============================================================================
// calculateWorldBuildingScore Tests
// =============================================================================

describe('calculateWorldBuildingScore', () => {
  it('should return score between 0-100', () => {
    const result = calculateWorldBuildingScore('Test content.')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should reward sensory details', () => {
    const content = 'She heard the distant thunder. The smell of rain filled the air. She felt the cool breeze on her skin.'
    const result = calculateWorldBuildingScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should reward location references', () => {
    const content = 'In the forest, under the old oak tree, beyond the river, there stood a cottage.'
    const result = calculateWorldBuildingScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should reward environment objects', () => {
    const content = 'The room had a large table and comfortable chairs. A soft rug covered the wooden floor. A window overlooked the garden.'
    const result = calculateWorldBuildingScore(content)
    expect(result.score).toBeGreaterThan(40)
  })
})

// =============================================================================
// calculateEmotionalImpactScore Tests
// =============================================================================

describe('calculateEmotionalImpactScore', () => {
  it('should return score between 0-100', () => {
    const result = calculateEmotionalImpactScore('Test content.')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should reward intense emotions', () => {
    const content = 'Terror gripped her as she witnessed the horror. Anguish and despair overwhelmed her senses.'
    const result = calculateEmotionalImpactScore(content)
    expect(result.score).toBeGreaterThan(60)
  })

  it('should reward mild emotional variety', () => {
    const content = 'She felt happy and excited but also nervous and afraid. The mixed emotions churned inside her.'
    const result = calculateEmotionalImpactScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should penalize overuse of exclamation marks', () => {
    const content = 'Wow! Amazing! Incredible! Fantastic! Wow! Amazing!'
    const result = calculateEmotionalImpactScore(content)
    expect(result.score).toBeLessThanOrEqual(60)
  })
})

// =============================================================================
// calculateProseStyleScore Tests
// =============================================================================

describe('calculateProseStyleScore', () => {
  it('should return score between 0-100', () => {
    const result = calculateProseStyleScore('Test content.')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should reward rich vocabulary', () => {
    const content = 'The ephemeral nature of existence manifests through myriad experiences that transcend mundane boundaries.'
    const result = calculateProseStyleScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should reward sentence variety', () => {
    const content = 'Short. This medium sentence has a few more words. And this one is quite a bit longer with many more descriptive elements to create variation.'
    const result = calculateProseStyleScore(content)
    expect(result.score).toBeGreaterThan(40)
  })

  it('should penalize uniform sentence structure', () => {
    const content = 'One. Two. Three. Four. Five. Six. Seven. Eight. Nine. Ten.'
    const result = calculateProseStyleScore(content)
    expect(result.score).toBeLessThanOrEqual(51)
  })
})

// =============================================================================
// scoreNarrative Tests
// =============================================================================

describe('scoreNarrative', () => {
  it('should return complete assessment', () => {
    const state = createEmptyScorerState()
    const content = 'He walked into the room. "Hello," he said. She smiled and replied, "Welcome." The room was warm and inviting.'
    const assessment = scoreNarrative(state, content, 'scene_1')
    
    expect(assessment.sceneId).toBe('scene_1')
    expect(assessment.overallScore).toBeGreaterThan(0)
    expect(assessment.detailedScores.length).toBe(7)
    expect(assessment.grade).toBeDefined()
  })

  it('should include all metrics', () => {
    const state = createEmptyScorerState()
    const assessment = scoreNarrative(state, 'Test content with some variation.', 'scene_1')
    
    expect(assessment.metrics.pacingScore).toBeDefined()
    expect(assessment.metrics.coherenceScore).toBeDefined()
    expect(assessment.metrics.characterizationScore).toBeDefined()
    expect(assessment.metrics.dialogueScore).toBeDefined()
    expect(assessment.metrics.worldBuildingScore).toBeDefined()
    expect(assessment.metrics.emotionalImpactScore).toBeDefined()
    expect(assessment.metrics.proseStyleScore).toBeDefined()
  })

  it('should identify weaknesses', () => {
    const state = createEmptyScorerState()
    const content = 'A simple sentence without much detail or emotion or dialogue or anything interesting.'
    const assessment = scoreNarrative(state, content, 'scene_1')
    
    expect(assessment.weaknesses.length).toBeGreaterThanOrEqual(0)
  })

  it('should calculate weighted overall score', () => {
    const state = createEmptyScorerState()
    const assessment = scoreNarrative(state, 'Detailed narrative with dialogue and emotion. "This is great," she exclaimed! He felt happy and excited.', 'scene_1')
    
    const expected = 
      assessment.metrics.pacingScore * 0.15 +
      assessment.metrics.coherenceScore * 0.18 +
      assessment.metrics.characterizationScore * 0.17 +
      assessment.metrics.dialogueScore * 0.12 +
      assessment.metrics.worldBuildingScore * 0.10 +
      assessment.metrics.emotionalImpactScore * 0.15 +
      assessment.metrics.proseStyleScore * 0.13
    
    expect(assessment.overallScore).toBeCloseTo(expected, 0)
  })
})

// =============================================================================
// Formatting Tests
// =============================================================================

describe('formatSceneAssessment', () => {
  it('should include scene id', () => {
    const state = createEmptyScorerState()
    const assessment = scoreNarrative(state, 'Test content.', 'test_scene')
    const formatted = formatSceneAssessment(assessment)
    
    expect(formatted).toContain('test_scene')
    expect(formatted).toContain('Overall Score')
  })

  it('should include dimension scores', () => {
    const state = createEmptyScorerState()
    const assessment = scoreNarrative(state, 'Test content.', 'test')
    const formatted = formatSceneAssessment(assessment)
    
    expect(formatted).toContain('pacing')
    expect(formatted).toContain('coherence')
    expect(formatted).toContain('characterization')
  })

  it('should show grade for each dimension', () => {
    const state = createEmptyScorerState()
    const assessment = scoreNarrative(state, 'Test content.', 'test')
    const formatted = formatSceneAssessment(assessment)
    
    expect(formatted).toMatch(/pacing.*\(/)
    expect(formatted).toMatch(/dialogue.*\(/)
  })
})

describe('formatScorerDashboard', () => {
  it('should show total scenes scored', () => {
    const state = createEmptyScorerState()
    const dashboard = formatScorerDashboard(state)
    
    expect(dashboard).toContain('Total Scenes Scored: 0')
  })

  it('should show preferred method', () => {
    const state = createEmptyScorerState()
    const dashboard = formatScorerDashboard(state)
    
    expect(dashboard).toContain('Preferred Method')
    expect(dashboard).toContain('heuristic')
  })

  it('should show strict mode status', () => {
    const state = createEmptyScorerState()
    const dashboard = formatScorerDashboard(state)
    
    expect(dashboard).toContain('Strict Mode')
  })

  it('should show average scores when available', () => {
    let state = createEmptyScorerState()
    state = { ...state, totalScenesScored: 2 }
    state.averageScores.set('pacing', 65)
    state.averageScores.set('coherence', 55)
    
    const dashboard = formatScorerDashboard(state)
    expect(dashboard).toContain('pacing')
    expect(dashboard).toContain('65')
  })
})
