import { describe, it, expect } from 'vitest';
import {
  buildManifest,
  buildChangelog,
  runDeliveryChecks,
  renderDeliveryMarkdown,
} from '../CycleDelivery';

const modules = [
  { id: 'V2086', name: 'TarjanSCCCore', tests: 45, commitSha: '32fd8e3f' },
  { id: 'V2087', name: 'CycleDetector', tests: 24, commitSha: '977801ec' },
  { id: 'V2113', name: 'CycleEndToEndTest', tests: 8, commitSha: 'abcd1234' },
];

describe('CycleDelivery - buildManifest', () => {
  it('aggregates module count and total tests', () => {
    const m = buildManifest('v1.0.0', modules);
    expect(m.cycleEngineVersion).toBe('v1.0.0');
    expect(m.moduleCount).toBe(3);
    expect(m.totalTests).toBe(77);
    expect(m.modules.length).toBe(3);
  });
});

describe('CycleDelivery - buildChangelog', () => {
  it('produces a markdown changelog', () => {
    const m = buildManifest('v1.0.0', modules);
    const lines = buildChangelog(m);
    expect(lines.join('\n')).toContain('TarjanSCCCore');
    expect(lines.join('\n')).toContain('Tests: 77');
  });
});

describe('CycleDelivery - runDeliveryChecks', () => {
  it('passes for sufficient test counts', () => {
    const m = buildManifest('v1.0.0', modules);
    const c = runDeliveryChecks(m, { minTestsPerModule: 5, requiredModules: 3 });
    expect(c.passed).toBe(true);
    expect(c.failedChecks).toEqual([]);
  });

  it('uses default thresholds when options omitted', () => {
    // Forces the `?? 10` / `?? 30` fallback branches (lines 58–59).
    const m = buildManifest('v1.0.0', modules);
    const c = runDeliveryChecks(m);
    expect(c.failedChecks.length).toBeGreaterThan(0);
  });

  it('fails when module count below required', () => {
    const m = buildManifest('v1.0.0', modules);
    const c = runDeliveryChecks(m, { minTestsPerModule: 5, requiredModules: 10 });
    expect(c.passed).toBe(false);
    expect(c.failedChecks.some((f) => f.includes('moduleCount'))).toBe(true);
  });

  it('fails when a module has too few tests', () => {
    const m = buildManifest('v1.0.0', modules);
    const c = runDeliveryChecks(m, { minTestsPerModule: 50, requiredModules: 1 });
    expect(c.passed).toBe(false);
    expect(c.failedChecks.some((f) => f.includes('TarjanSCCCore'))).toBe(true);
  });

  it('fails when total tests below minimum', () => {
    // minTestsPerModule=5 with totalTests=4 (< 2 * 5) triggers the
    // "totalTests below threshold" check while also flagging individual
    // modules; we only assert the aggregate failed-check is present.
    const m = buildManifest('v1.0.0', [
      { id: 'X', name: 'X', tests: 1, commitSha: 'aaa' },
      { id: 'Y', name: 'Y', tests: 3, commitSha: 'bbb' },
    ]);
    const c = runDeliveryChecks(m, { minTestsPerModule: 5, requiredModules: 2 });
    expect(c.passed).toBe(false);
    expect(c.failedChecks.some((f) => f.includes('totalTests'))).toBe(true);
  });
});

describe('CycleDelivery - renderDeliveryMarkdown', () => {
  it('renders PASS status on success', () => {
    const m = buildManifest('v1.0.0', modules);
    const c = runDeliveryChecks(m, { minTestsPerModule: 5, requiredModules: 3 });
    const md = renderDeliveryMarkdown(c);
    expect(md).toContain('PASS');
  });

  it('renders FAIL status with failed checks', () => {
    const m = buildManifest('v1.0.0', modules);
    const c = runDeliveryChecks(m, { minTestsPerModule: 5, requiredModules: 100 });
    const md = renderDeliveryMarkdown(c);
    expect(md).toContain('FAIL');
    expect(md).toContain('Failed Checks');
  });
});
