import { describe, it, expect } from 'vitest';
import { buildPanel, renderProgressBar, summarizeActivity } from '../CycleProgressPanel';

describe('CycleProgressPanel - buildPanel', () => {
  it('handles empty entries', () => {
    const p = buildPanel({ cycleId: 'c', maxIterations: 5, entries: [], status: 'idle' });
    expect(p.currentIteration).toBe(0);
    expect(p.currentQuality).toBe(0);
    expect(p.averageQuality).toBe(0);
    expect(p.qualityTrajectory).toEqual([]);
  });

  it('aggregates entries', () => {
    const entries = [
      { iteration: 1, timestamp: 1000, quality: 0.5, durationMs: 100 },
      { iteration: 2, timestamp: 1100, quality: 0.7, durationMs: 200 },
      { iteration: 3, timestamp: 1300, quality: 0.85, durationMs: 300 },
    ];
    const p = buildPanel({ cycleId: 'c', maxIterations: 10, entries, status: 'running' });
    expect(p.currentIteration).toBe(3);
    expect(p.currentQuality).toBe(0.85);
    expect(p.averageQuality).toBeCloseTo((0.5 + 0.7 + 0.85) / 3, 5);
    expect(p.qualityTrajectory).toEqual([0.5, 0.7, 0.85]);
    expect(p.recentActivity.length).toBe(3);
  });

  it('keeps only last 5 entries in recentActivity', () => {
    const entries = Array.from({ length: 8 }, (_, i) => ({
      iteration: i + 1,
      timestamp: 1000 + i,
      quality: 0.1 * (i + 1),
      durationMs: 10,
    }));
    const p = buildPanel({ cycleId: 'c', maxIterations: 10, entries, status: 'running' });
    expect(p.recentActivity.length).toBe(5);
    expect(p.recentActivity[0].iteration).toBe(4);
  });

  it('computes ETA from average duration', () => {
    const entries = [
      { iteration: 1, timestamp: 1000, quality: 0.5, durationMs: 100 },
      { iteration: 2, timestamp: 1100, quality: 0.7, durationMs: 100 },
    ];
    const p = buildPanel({ cycleId: 'c', maxIterations: 5, entries, status: 'running' });
    expect(p.etaMs).toBe(300); // 3 remaining * 100 avg
  });
});

describe('CycleProgressPanel - renderProgressBar', () => {
  it('renders bar of correct width', () => {
    const entries = [
      { iteration: 5, timestamp: 1000, quality: 0.9, durationMs: 100 },
    ];
    const p = buildPanel({ cycleId: 'c', maxIterations: 10, entries, status: 'running' });
    const bar = renderProgressBar(p, 10);
    expect(bar).toContain('5/10');
  });

  it('clamps to full when over max', () => {
    const entries = [
      { iteration: 15, timestamp: 1000, quality: 0.9, durationMs: 100 },
    ];
    const p = buildPanel({ cycleId: 'c', maxIterations: 10, entries, status: 'running' });
    const bar = renderProgressBar(p, 5);
    expect(bar).toContain('15/10');
  });

  it('renders full bar when maxIterations is 0', () => {
    // Forces the `maxIterations === 0 ? 1 : …` branch in renderProgressBar.
    const p = buildPanel({ cycleId: 'c', maxIterations: 0, entries: [], status: 'idle' });
    const bar = renderProgressBar(p, 4);
    expect(bar.startsWith('[████]')).toBe(true);
    expect(bar).toContain('0/0');
  });
});

describe('CycleProgressPanel - summarizeActivity', () => {
  it('produces a one-line summary', () => {
    const entries = [{ iteration: 2, timestamp: 1000, quality: 0.7, durationMs: 100 }];
    const p = buildPanel({ cycleId: 'c', maxIterations: 5, entries, status: 'running' });
    const s = summarizeActivity(p);
    expect(s).toContain('cycle=c');
    expect(s).toContain('iter=2/5');
    expect(s).toContain('status=running');
  });
});
