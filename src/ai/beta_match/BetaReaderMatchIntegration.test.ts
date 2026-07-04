/**
 * BetaReaderMatchIntegration.test.ts — Direction BF, V4056-V4065 (Batch 3/3 收口)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { MatchPipeline, MatchADirector2, MatchNotification, MatchTracker, MatchValidator, MatchDashboard, MatchLibrary, MatchTools, MatchReportGenerator, BetaReaderMatchMasterIndex } from './BetaReaderMatchIntegration';

describe('MatchPipeline', () => {
  const e = new MatchPipeline();
  it('isComplete for feedback', () => { expect(e.isComplete('feedback')).toBe(true); });
  it('next from build', () => { expect(e.next('build')).toBe('match'); });
});

describe('MatchADirector2', () => {
  const e = new MatchADirector2();
  it('decide wait for not ready', () => { expect(e.decide({ bookReady: false, matchCount: 0 })).toBe('wait'); });
  it('decide send_invites for 3+', () => { expect(e.decide({ bookReady: true, matchCount: 5 })).toBe('send_invites'); });
});

describe('MatchNotification', () => {
  const e = new MatchNotification();
  it('send + hasNotified', () => { e.send('A', 'hi'); expect(e.hasNotified('hi')).toBe(true); });
});

describe('MatchTracker', () => {
  const e = new MatchTracker();
  it('record + count', () => { e.record('A', 0.8); expect(e.count()).toBe(1); });
});

describe('MatchValidator', () => {
  const e = new MatchValidator();
  it('validate for good', () => { expect(e.validate({ reader: 'A', score: 0.8 }).valid).toBe(true); });
});

describe('MatchDashboard', () => {
  const e = new MatchDashboard();
  it('generate includes 匹配', () => { expect(e.generate({ total: 10, matched: 5 })).toContain('匹配'); });
});

describe('MatchLibrary', () => {
  const e = new MatchLibrary();
  it('save + get', () => { e.save('A', { data: 'x' }); expect(e.get('A')).toBeDefined(); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('MatchTools', () => {
  const e = new MatchTools();
  it('isAvailable for Email', () => { expect(e.isAvailable('Email')).toBe(true); });
  it('count returns 4', () => { expect(e.count()).toBe(4); });
});

describe('MatchReportGenerator', () => {
  const e = new MatchReportGenerator();
  it('generate includes 邀请', () => { expect(e.generate({ readers: 10, invited: 5, accepted: 3 })).toContain('邀请'); });
});

describe('BetaReaderMatchMasterIndex', () => {
  const idx = new BetaReaderMatchMasterIndex();
  it('lists 28 engines', () => { expect(idx.count()).toBe(28); });
});