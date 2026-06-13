import { describe, it, expect } from 'vitest';
import { validateBuild, countLines, summarizeBuild } from '../CycleProductionBuild';

describe('CycleProductionBuild - validateBuild', () => {
  it('passes when all exports present and no forbidden strings', () => {
    const exports = {
      'foo.ts': 'export function foo() {}',
      'bar.ts': 'export function bar() {}',
    };
    const report = validateBuild(
      { expectedExports: ['foo.ts', 'bar.ts'], forbiddenSubstrings: ['TODO'], maxTotalBytes: 100_000 },
      exports
    );
    expect(report.passed).toBe(true);
    expect(report.missingExports).toEqual([]);
    expect(report.forbiddenMatches).toEqual([]);
  });

  it('fails on missing exports', () => {
    const report = validateBuild(
      { expectedExports: ['foo.ts', 'missing.ts'], forbiddenSubstrings: [], maxTotalBytes: 100_000 },
      { 'foo.ts': 'export const x = 1;' }
    );
    expect(report.passed).toBe(false);
    expect(report.missingExports).toContain('missing.ts');
  });

  it('fails on forbidden substrings', () => {
    const report = validateBuild(
      { expectedExports: ['foo.ts'], forbiddenSubstrings: ['TODO', 'FIXME'], maxTotalBytes: 100_000 },
      { 'foo.ts': '// TODO: implement' }
    );
    expect(report.passed).toBe(false);
    expect(report.forbiddenMatches.length).toBe(1);
    expect(report.forbiddenMatches[0].matched).toBe('TODO');
  });

  it('fails when total bytes exceed limit', () => {
    const exports = { 'big.ts': 'x'.repeat(200_000) };
    const report = validateBuild(
      { expectedExports: ['big.ts'], forbiddenSubstrings: [], maxTotalBytes: 1000 },
      exports
    );
    expect(report.passed).toBe(false);
    expect(report.totalBytes).toBeGreaterThan(1000);
  });

  it('emits warning when approaching 90% of limit', () => {
    const exports = { 'a.ts': 'x'.repeat(95) };
    const report = validateBuild(
      { expectedExports: ['a.ts'], forbiddenSubstrings: [], maxTotalBytes: 100 },
      exports
    );
    expect(report.warnings.length).toBeGreaterThan(0);
  });
});

describe('CycleProductionBuild - countLines', () => {
  it('counts newlines + 1 for non-empty', () => {
    expect(countLines('a\nb\nc')).toBe(3);
  });
  it('returns 0 for empty', () => {
    expect(countLines('')).toBe(0);
  });
});

describe('CycleProductionBuild - summarizeBuild', () => {
  it('reports OK on pass', () => {
    const report = validateBuild(
      { expectedExports: [], forbiddenSubstrings: [], maxTotalBytes: 1000 },
      {}
    );
    expect(summarizeBuild(report)).toContain('build OK');
  });

  it('reports FAIL on missing exports', () => {
    const report = validateBuild(
      { expectedExports: ['x.ts'], forbiddenSubstrings: [], maxTotalBytes: 1000 },
      {}
    );
    expect(summarizeBuild(report)).toContain('build FAIL');
    expect(summarizeBuild(report)).toContain('missing');
  });

  it('reports FAIL with forbidden and size info', () => {
    // Forces the `forbiddenMatches.length > 0` and `totalBytes > 0` branches
    // (lines 74–75) in summarizeBuild.
    const exports = { 'a.ts': '// FIXME: replace later' };
    const report = validateBuild(
      { expectedExports: ['a.ts'], forbiddenSubstrings: ['FIXME'], maxTotalBytes: 1000 },
      exports
    );
    const summary = summarizeBuild(report);
    expect(summary).toContain('build FAIL');
    expect(summary).toContain('forbidden');
    expect(summary).toMatch(/size=/);
  });
});
