/**
 * V1725 NarrativeReaderOrchestratorEngine Tests — Direction P Iter 30/30 (Round 5)
 */
import { describe, it, expect } from 'vitest';
import { createNarrativeReaderOrchestratorEngineState, orchestrateReaders, getReaderOrchestratorReport, resetNarrativeReaderOrchestratorEngineState } from './NarrativeReaderOrchestratorEngine';
import { createNarrativeReaderEngagementEngineState } from './NarrativeReaderEngagementEngine';
import { createNarrativeReaderEmpathyEngineState } from './NarrativeReaderEmpathyEngine';
import { createNarrativeReaderIdentificationEngineState } from './NarrativeReaderIdentificationEngine';
import { createNarrativeReaderSuspenseEngineState } from './NarrativeReaderSuspenseEngine';
import { createNarrativeReaderCuriosityEngineState } from './NarrativeReaderCuriosityEngine';
import { createNarrativeReaderImmersionEngineState } from './NarrativeReaderImmersionEngine';
import { createNarrativeReaderEmotionEngineState } from './NarrativeReaderEmotionEngine';
import { createNarrativeReaderReflectionEngineState } from './NarrativeReaderReflectionEngine';

describe('NarrativeReaderOrchestratorEngine', () => {
  it('should initialize with defaults', () => {
    const state = createNarrativeReaderOrchestratorEngineState();
    expect(state.totalDimensions).toBe(8);
    expect(state.readerMastery).toBe(0.5);
  });
  it('should orchestrate readers', () => {
    const state = orchestrateReaders(
      createNarrativeReaderEngagementEngineState(),
      createNarrativeReaderEmpathyEngineState(),
      createNarrativeReaderIdentificationEngineState(),
      createNarrativeReaderSuspenseEngineState(),
      createNarrativeReaderCuriosityEngineState(),
      createNarrativeReaderImmersionEngineState(),
      createNarrativeReaderEmotionEngineState(),
      createNarrativeReaderReflectionEngineState()
    );
    expect(state.totalDimensions).toBe(8);
    expect(state.readerMastery).toBeGreaterThanOrEqual(0);
  });
  it('should return comprehensive report', () => {
    const state = createNarrativeReaderOrchestratorEngineState();
    const report = getReaderOrchestratorReport(state);
    expect(report.totalDimensions).toBe(8);
    expect(typeof report.readerMastery).toBe('number');
  });
  it('should include recommendations for low mastery', () => {
    const state = createNarrativeReaderOrchestratorEngineState();
    expect(getReaderOrchestratorReport(state).recommendations.length).toBeGreaterThanOrEqual(0);
  });
  it('should handle empty snapshot', () => {
    const state = createNarrativeReaderOrchestratorEngineState();
    expect(state.snapshot).toBeDefined();
  });
  it('should compute experience from snapshot', () => {
    const state = createNarrativeReaderOrchestratorEngineState();
    expect(state.overallExperience).toBe(0.5);
  });
  it('should reset all state', () => {
    const next = resetNarrativeReaderOrchestratorEngineState();
    expect(next.totalDimensions).toBe(8);
  });
});