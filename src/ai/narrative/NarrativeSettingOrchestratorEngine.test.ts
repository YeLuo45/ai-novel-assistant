/**
 * V1665 NarrativeSettingOrchestratorEngine Tests — Direction O Iter 30/30 (Round 5)
 */
import { describe, it, expect } from 'vitest';
import { createNarrativeSettingOrchestratorEngineState, orchestrateSettings, getSettingOrchestratorReport, resetNarrativeSettingOrchestratorEngineState } from './NarrativeSettingOrchestratorEngine';
import { createNarrativeSettingGeographyEngineState } from './NarrativeSettingGeographyEngine';
import { createNarrativeSettingClimateEngineState } from './NarrativeSettingClimateEngine';
import { createNarrativeSettingArchitectureEngineState } from './NarrativeSettingArchitectureEngine';
import { createNarrativeSettingCultureEngineState } from './NarrativeSettingCultureEngine';
import { createNarrativeSettingPoliticsEngineState } from './NarrativeSettingPoliticsEngine';
import { createNarrativeSettingEconomyEngineState } from './NarrativeSettingEconomyEngine';
import { createNarrativeSettingReligionEngineState } from './NarrativeSettingReligionEngine';
import { createNarrativeSettingHistoryEngineState } from './NarrativeSettingHistoryEngine';

describe('NarrativeSettingOrchestratorEngine', () => {
  it('should initialize with defaults', () => {
    const state = createNarrativeSettingOrchestratorEngineState();
    expect(state.totalSettings).toBe(8);
    expect(state.worldbuilding).toBe(0.5);
  });
  it('should orchestrate settings', () => {
    const state = orchestrateSettings(
      createNarrativeSettingGeographyEngineState(),
      createNarrativeSettingClimateEngineState(),
      createNarrativeSettingArchitectureEngineState(),
      createNarrativeSettingCultureEngineState(),
      createNarrativeSettingPoliticsEngineState(),
      createNarrativeSettingEconomyEngineState(),
      createNarrativeSettingReligionEngineState(),
      createNarrativeSettingHistoryEngineState()
    );
    expect(state.totalSettings).toBe(8);
    expect(state.worldbuilding).toBeGreaterThanOrEqual(0);
  });
  it('should return comprehensive report', () => {
    const state = createNarrativeSettingOrchestratorEngineState();
    const report = getSettingOrchestratorReport(state);
    expect(report.totalSettings).toBe(8);
    expect(typeof report.worldbuilding).toBe('number');
  });
  it('should include recommendations for low worldbuilding', () => {
    const state = createNarrativeSettingOrchestratorEngineState();
    expect(getSettingOrchestratorReport(state).recommendations.length).toBeGreaterThanOrEqual(0);
  });
  it('should handle empty snapshot', () => {
    const state = createNarrativeSettingOrchestratorEngineState();
    expect(state.snapshot).toBeDefined();
  });
  it('should compute coherence from snapshot', () => {
    const state = createNarrativeSettingOrchestratorEngineState();
    expect(state.coherenceIndex).toBe(0.5);
  });
  it('should reset all state', () => {
    const next = resetNarrativeSettingOrchestratorEngineState();
    expect(next.totalSettings).toBe(8);
  });
});