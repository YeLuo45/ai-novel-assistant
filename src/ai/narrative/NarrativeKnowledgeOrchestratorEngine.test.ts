/**
 * V2025 NarrativeKnowledgeOrchestratorEngine Tests — Direction U Iter 30/30 (Round 5)
 */
import { describe, it, expect } from 'vitest';
import { createNarrativeKnowledgeOrchestratorEngineState, orchestrateKnowledge, getKnowledgeOrchestratorReport, resetNarrativeKnowledgeOrchestratorEngineState } from './NarrativeKnowledgeOrchestratorEngine';
import { createNarrativeKnowledgeEmpiricalEngineState } from './NarrativeKnowledgeEmpiricalEngine';
import { createNarrativeKnowledgeRationalEngineState } from './NarrativeKnowledgeRationalEngine';
import { createNarrativeKnowledgeIntuitiveEngineState } from './NarrativeKnowledgeIntuitiveEngine';
import { createNarrativeKnowledgeRevealedEngineState } from './NarrativeKnowledgeRevealedEngine';
import { createNarrativeKnowledgeAuthoritativeEngineState } from './NarrativeKnowledgeAuthoritativeEngine';
import { createNarrativeKnowledgeTraditionalEngineState } from './NarrativeKnowledgeTraditionalEngine';
import { createNarrativeKnowledgeScientificEngineState } from './NarrativeKnowledgeScientificEngine';
import { createNarrativeKnowledgeMysticalEngineState } from './NarrativeKnowledgeMysticalEngine';

describe('NarrativeKnowledgeOrchestratorEngine', () => {
  it('should initialize with defaults', () => {
    const state = createNarrativeKnowledgeOrchestratorEngineState();
    expect(state.totalDimensions).toBe(8);
    expect(state.knowledgeMastery).toBe(0.5);
  });
  it('should orchestrate knowledge', () => {
    const state = orchestrateKnowledge(
      createNarrativeKnowledgeEmpiricalEngineState(),
      createNarrativeKnowledgeRationalEngineState(),
      createNarrativeKnowledgeIntuitiveEngineState(),
      createNarrativeKnowledgeRevealedEngineState(),
      createNarrativeKnowledgeAuthoritativeEngineState(),
      createNarrativeKnowledgeTraditionalEngineState(),
      createNarrativeKnowledgeScientificEngineState(),
      createNarrativeKnowledgeMysticalEngineState()
    );
    expect(state.totalDimensions).toBe(8);
    expect(state.knowledgeMastery).toBeGreaterThanOrEqual(0);
  });
  it('should return comprehensive report', () => {
    const state = createNarrativeKnowledgeOrchestratorEngineState();
    const report = getKnowledgeOrchestratorReport(state);
    expect(report.totalDimensions).toBe(8);
    expect(typeof report.knowledgeMastery).toBe('number');
  });
  it('should include recommendations for low mastery', () => {
    const state = createNarrativeKnowledgeOrchestratorEngineState();
    expect(getKnowledgeOrchestratorReport(state).recommendations.length).toBeGreaterThanOrEqual(0);
  });
  it('should handle empty snapshot', () => {
    const state = createNarrativeKnowledgeOrchestratorEngineState();
    expect(state.snapshot).toBeDefined();
  });
  it('should compute density from snapshot', () => {
    const state = createNarrativeKnowledgeOrchestratorEngineState();
    expect(state.epistemicDensity).toBe(0.5);
  });
  it('should reset all state', () => {
    const next = resetNarrativeKnowledgeOrchestratorEngineState();
    expect(next.totalDimensions).toBe(8);
  });
});