import { describe, it, expect } from 'vitest';
import {
  configToYAML,
  yamlToConfig,
  validateYAMLConfig,
  roundTripYAML,
  type CycleYAMLConfig,
} from '../CycleConfigYAML';

const sample: CycleYAMLConfig = {
  cycleId: 'cyc1',
  maxIterations: 10,
  minImprovement: 0.05,
  targetQuality: 0.9,
  isolationMode: 'strict',
  exitConditions: ['quality', 'timeout'],
  metrics: ['latency', 'cost'],
};

describe('CycleConfigYAML - configToYAML', () => {
  it('renders all fields', () => {
    const y = configToYAML(sample);
    expect(y).toContain('cycleId: cyc1');
    expect(y).toContain('maxIterations: 10');
    expect(y).toContain('  - quality');
    expect(y).toContain('  - latency');
  });

  it('renders empty lists as "none"', () => {
    const y = configToYAML({ ...sample, exitConditions: [], metrics: [] });
    expect(y).toContain('  - none');
  });
});

describe('CycleConfigYAML - yamlToConfig', () => {
  it('parses full config', () => {
    const y = configToYAML(sample);
    const c = yamlToConfig(y);
    expect(c).toEqual(sample);
  });

  it('skips empty list marker "none"', () => {
    const y = configToYAML({ ...sample, exitConditions: [], metrics: [] });
    const c = yamlToConfig(y);
    expect(c.exitConditions).toEqual([]);
    expect(c.metrics).toEqual([]);
  });

  it('throws when missing required fields', () => {
    expect(() => yamlToConfig('maxIterations: 5')).toThrow(/missing required/);
  });

  it('skips comments and blank lines', () => {
    const y = `# comment\n\n${configToYAML(sample)}`;
    const c = yamlToConfig(y);
    expect(c).toEqual(sample);
  });
});

describe('CycleConfigYAML - validateYAMLConfig', () => {
  it('returns no errors for valid config', () => {
    expect(validateYAMLConfig(sample)).toEqual([]);
  });

  it('flags missing cycleId', () => {
    expect(validateYAMLConfig({ ...sample, cycleId: '' }).length).toBeGreaterThan(0);
  });

  it('flags invalid maxIterations', () => {
    expect(validateYAMLConfig({ ...sample, maxIterations: 0 }).length).toBeGreaterThan(0);
    expect(validateYAMLConfig({ ...sample, maxIterations: -1 }).length).toBeGreaterThan(0);
  });

  it('flags invalid targetQuality', () => {
    expect(validateYAMLConfig({ ...sample, targetQuality: -0.1 }).length).toBeGreaterThan(0);
    expect(validateYAMLConfig({ ...sample, targetQuality: 1.5 }).length).toBeGreaterThan(0);
  });

  it('flags invalid isolationMode', () => {
    expect(validateYAMLConfig({ ...sample, isolationMode: 'invalid' as never }).length).toBeGreaterThan(0);
  });

  it('flags negative minImprovement', () => {
    expect(validateYAMLConfig({ ...sample, minImprovement: -0.01 }).length).toBeGreaterThan(0);
  });
});

describe('CycleConfigYAML - roundTripYAML', () => {
  it('preserves all fields', () => {
    expect(roundTripYAML(sample)).toEqual(sample);
  });
});

describe('CycleConfigYAML - malformed lines', () => {
  it('skips lines without a colon key separator', () => {
    // Forces the `idx < 0` branch in yamlToConfig (line ~63).
    const y = `cycleId: cyc1\nthis line has no colon\nmaxIterations: 10\nminImprovement: 0.05\ntargetQuality: 0.9\nisolationMode: strict\nexitConditions:\nmetrics:`;
    const c = yamlToConfig(y);
    expect(c.cycleId).toBe('cyc1');
    expect(c.maxIterations).toBe(10);
  });
});
