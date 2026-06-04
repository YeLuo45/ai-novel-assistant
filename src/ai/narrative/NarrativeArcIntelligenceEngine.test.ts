/**
 * V563 NarrativeArcIntelligenceEngine Tests — Direction B Iter 1/9
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createArcIntelligenceState,
  addArcLayer,
  buildHierarchicalStructure,
  computeFeedbackScores,
  getOverallIntelligenceScore,
  flattenHierarchy,
  checkCrossLayerConsistency,
  updateTrends,
  type ArcIntelligenceState,
  type ArcLayer,
  type FeedbackScore,
} from './NarrativeArcIntelligenceEngine';

describe('NarrativeArcIntelligenceEngine', () => {
  let state: ArcIntelligenceState;

  beforeEach(() => {
    state = createArcIntelligenceState();
  });

  describe('createArcIntelligenceState', () => {
    it('should create empty state', () => {
      expect(state.layers).toEqual([]);
      expect(state.hierarchicalStructure).toBeNull();
      expect(state.feedbackScores).toEqual([]);
      expect(state.lastAnalysisTimestamp).toBeGreaterThan(0);
    });
  });

  describe('addArcLayer', () => {
    it('should add a single layer', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.85 };
      const next = addArcLayer(state, layer);
      expect(next.layers).toHaveLength(1);
      expect(next.layers[0]).toEqual(layer);
    });

    it('should replace layer of same type', () => {
      const layer1: ArcLayer = { type: 'character', state: {}, coherence: 0.7 };
      const layer2: ArcLayer = { type: 'character', state: {extra: true}, coherence: 0.9 };
      const next = addArcLayer(addArcLayer(state, layer1), layer2);
      expect(next.layers).toHaveLength(1);
      expect(next.layers[0]).toEqual(layer2);
    });

    it('should accumulate layers of different types', () => {
      const layerChar: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const layerEmotion: ArcLayer = { type: 'emotional', state: {}, coherence: 0.75 };
      const layerTheme: ArcLayer = { type: 'thematic', state: {}, coherence: 0.9 };
      let next = addArcLayer(state, layerChar);
      next = addArcLayer(next, layerEmotion);
      next = addArcLayer(next, layerTheme);
      expect(next.layers).toHaveLength(3);
    });

    it('should update lastAnalysisTimestamp', () => {
      const layer: ArcLayer = { type: 'plot', state: {}, coherence: 0.6 };
      const before = state.lastAnalysisTimestamp;
      const next = addArcLayer(state, layer);
      expect(next.lastAnalysisTimestamp).toBeGreaterThanOrEqual(before);
    });
  });

  describe('buildHierarchicalStructure', () => {
    it('should build root with four act children', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const withLayer = addArcLayer(state, layer);
      const next = buildHierarchicalStructure(withLayer, 'story1', 'My Story');

      expect(next.hierarchicalStructure).not.toBeNull();
      const root = next.hierarchicalStructure!;
      expect(root.id).toBe('story1');
      expect(root.name).toBe('My Story');
      expect(root.level).toBe(0);
      expect(root.children).toHaveLength(4);
      expect(root.children.map(c => c.name)).toEqual(['Character Arc', 'Emotional Arc', 'Thematic Arc', 'Plot Arc']);
    });

    it('should map character layers to Character Arc child', () => {
      const layer: ArcLayer = { type: 'character', state: {id: 'char1'}, coherence: 0.85 };
      const withLayer = addArcLayer(state, layer);
      const next = buildHierarchicalStructure(withLayer, 's1', 'Story');

      const charArc = next.hierarchicalStructure!.children.find(c => c.name === 'Character Arc')!;
      expect(charArc.children).toHaveLength(1);
      expect(charArc.children[0].arcData).toEqual(layer);
    });

    it('should handle empty layers gracefully', () => {
      const next = buildHierarchicalStructure(state, 'empty', 'Empty Story');
      expect(next.hierarchicalStructure!.children).toHaveLength(4);
      next.hierarchicalStructure!.children.forEach(child => {
        expect(child.children).toEqual([]);
      });
    });
  });

  describe('computeFeedbackScores', () => {
    it('should compute score from coherence', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.85 };
      const next = computeFeedbackScores(addArcLayer(state, layer));
      expect(next.feedbackScores).toHaveLength(1);
      expect(next.feedbackScores[0].score).toBe(85);
    });

    it('should generate suggestions based on score thresholds', () => {
      const highLayer: ArcLayer = { type: 'character', state: {}, coherence: 0.9 };
      const midLayer: ArcLayer = { type: 'emotional', state: {}, coherence: 0.65 };
      const lowLayer: ArcLayer = { type: 'thematic', state: {}, coherence: 0.3 };
      let next = addArcLayer(state, highLayer);
      next = addArcLayer(next, midLayer);
      next = addArcLayer(next, lowLayer);
      next = computeFeedbackScores(next);

      const charScore = next.feedbackScores.find(s => s.layerType === 'character')!;
      const emotionScore = next.feedbackScores.find(s => s.layerType === 'emotional')!;
      const themeScore = next.feedbackScores.find(s => s.layerType === 'thematic')!;

      expect(charScore.suggestions.length).toBeGreaterThan(0);
      expect(emotionScore.suggestions.length).toBeGreaterThan(0);
      expect(themeScore.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle empty layers', () => {
      const next = computeFeedbackScores(state);
      expect(next.feedbackScores).toEqual([]);
    });
  });

  describe('getOverallIntelligenceScore', () => {
    it('should return 0 for empty state', () => {
      expect(getOverallIntelligenceScore(state)).toBe(0);
    });

    it('should average layer scores', () => {
      const layer1: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const layer2: ArcLayer = { type: 'emotional', state: {}, coherence: 0.6 };
      let next = addArcLayer(state, layer1);
      next = addArcLayer(next, layer2);
      expect(getOverallIntelligenceScore(next)).toBe(70);
    });

    it('should round to nearest integer', () => {
      const layer: ArcLayer = { type: 'plot', state: {}, coherence: 0.833 };
      const next = addArcLayer(state, layer);
      expect(getOverallIntelligenceScore(next)).toBe(83);
    });
  });

  describe('flattenHierarchy', () => {
    it('should return root only when no children', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const withLayer = addArcLayer(state, layer);
      const structured = buildHierarchicalStructure(withLayer, 's1', 'S');
      const flat = flattenHierarchy(structured.hierarchicalStructure!);
      // Root + 4 level-1 children
      expect(flat.length).toBeGreaterThanOrEqual(5);
    });

    it('should preserve node structure', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const withLayer = addArcLayer(state, layer);
      const structured = buildHierarchicalStructure(withLayer, 's1', 'S');
      const flat = flattenHierarchy(structured.hierarchicalStructure!);
      expect(flat[0].level).toBe(0);
    });
  });

  describe('checkCrossLayerConsistency', () => {
    it('should return default 50 when no layers', () => {
      const result = checkCrossLayerConsistency(state);
      expect(result.characterEmotional).toBe(50);
      expect(result.thematicPlot).toBe(50);
      expect(result.overall).toBe(50);
    });

    it('should compute min coherence for cross-layer scores', () => {
      const charLayer: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const emotionLayer: ArcLayer = { type: 'emotional', state: {}, coherence: 0.6 };
      const themeLayer: ArcLayer = { type: 'thematic', state: {}, coherence: 0.9 };
      const plotLayer: ArcLayer = { type: 'plot', state: {}, coherence: 0.7 };
      let next = addArcLayer(state, charLayer);
      next = addArcLayer(next, emotionLayer);
      next = addArcLayer(next, themeLayer);
      next = addArcLayer(next, plotLayer);
      const result = checkCrossLayerConsistency(next);

      expect(result.characterEmotional).toBe(60); // min(0.8, 0.6) * 100
      expect(result.thematicPlot).toBe(70);         // min(0.9, 0.7) * 100
      expect(result.overall).toBe(75);              // average of all
    });
  });

  describe('updateTrends', () => {
    it('should detect improving trend', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.9 };
      const withLayer = addArcLayer(state, layer);
      const scored = computeFeedbackScores(withLayer);

      const prevScores: FeedbackScore[] = scored.feedbackScores.map(s => ({ ...s, score: s.score - 10 }));
      const updated = updateTrends(scored, prevScores);

      expect(updated.feedbackScores[0].trend).toBe('improving');
      expect(updated.feedbackScores[0].delta).toBe(10);
    });

    it('should detect declining trend', () => {
      const layer: ArcLayer = { type: 'emotional', state: {}, coherence: 0.5 };
      const withLayer = addArcLayer(state, layer);
      const scored = computeFeedbackScores(withLayer);

      const prevScores: FeedbackScore[] = scored.feedbackScores.map(s => ({ ...s, score: s.score + 20 }));
      const updated = updateTrends(scored, prevScores);

      expect(updated.feedbackScores[0].trend).toBe('declining');
      expect(updated.feedbackScores[0].delta).toBe(-20);
    });

    it('should detect stable trend for small delta', () => {
      const layer: ArcLayer = { type: 'thematic', state: {}, coherence: 0.75 };
      const withLayer = addArcLayer(state, layer);
      const scored = computeFeedbackScores(withLayer);

      const prevScores: FeedbackScore[] = scored.feedbackScores.map(s => ({ ...s, score: s.score + 3 }));
      const updated = updateTrends(scored, prevScores);

      expect(updated.feedbackScores[0].trend).toBe('stable');
    });

    it('should handle unknown previous layer types as stable', () => {
      const layer: ArcLayer = { type: 'character', state: {}, coherence: 0.8 };
      const withLayer = addArcLayer(state, layer);
      const scored = computeFeedbackScores(withLayer);

      const updated = updateTrends(scored, []);
      expect(updated.feedbackScores[0].trend).toBe('stable');
      expect(updated.feedbackScores[0].delta).toBe(0);
    });
  });
});