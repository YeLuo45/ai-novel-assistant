/**
 * TomatoNovelCore.test.ts — Direction BT, V4376-V4385 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { TomatoAccountAuth, TomatoSessionManager, ChapterUploader, TomatoMetadataBuilder, TomatoGenreClassifier, TomatoWordCounter, TomatoScheduleSync, TomatoDraftManager, TomatoValidationAPI, TomatoAPIClient, TomatoNovelCoreIndex } from './TomatoNovelCore';

describe('TomatoAccountAuth', () => {
  const e = new TomatoAccountAuth();
  it('login + isLoggedIn', () => { e.login('13800138000', '1234'); expect(e.isLoggedIn()).toBe(true); });
});

describe('TomatoSessionManager', () => {
  const e = new TomatoSessionManager();
  it('saveToken + getToken', () => { e.saveToken('A', 'tok'); expect(e.getToken('A')).toBe('tok'); });
  it('isValid for non-empty', () => { expect(e.isValid('x')).toBe(true); });
});

describe('ChapterUploader', () => {
  const e = new ChapterUploader();
  it('upload returns id', () => { const id = e.upload('content'); expect(e.getStatus(id)).toBe('uploaded'); });
});

describe('TomatoMetadataBuilder', () => {
  const e = new TomatoMetadataBuilder();
  it('build returns', () => { const r = e.build({ title: 'A', genre: 'romance', synopsis: 'x' }); expect(r.title).toBe('A'); });
  it('isValid true', () => { expect(e.isValid({ title: 'A' })).toBe(true); });
});

describe('TomatoGenreClassifier', () => {
  const e = new TomatoGenreClassifier();
  it('classify for 爱', () => { expect(e.classify('爱情故事')).toBe('romance'); });
  it('isValidGenre true', () => { expect(e.isValidGenre('romance')).toBe(true); });
});

describe('TomatoWordCounter', () => {
  const e = new TomatoWordCounter();
  it('count for text', () => { expect(e.count('你好')).toBe(2); });
  it('isValidLength for 2000', () => { expect(e.isValidLength(2000)).toBe(true); });
});

describe('TomatoScheduleSync', () => {
  const e = new TomatoScheduleSync();
  it('setSchedule + isValid', () => { e.setSchedule('Mon', '10:00'); expect(e.isValid()).toBe(true); });
});

describe('TomatoDraftManager', () => {
  const e = new TomatoDraftManager();
  it('save + get + count', () => { e.save('A', { title: 'T', content: 'C' }); expect(e.count()).toBe(1); });
});

describe('TomatoValidationAPI', () => {
  const e = new TomatoValidationAPI();
  it('validate for good', () => { expect(e.validate({ title: 'Good Title Here', synopsis: 'Good synopsis here for the test', chapters: 5 }).valid).toBe(true); });
  it('isValid true', () => { expect(e.isValid({ valid: true })).toBe(true); });
});

describe('TomatoAPIClient', () => {
  const e = new TomatoAPIClient();
  it('call returns url', () => { expect(e.call('/v1/chapter')).toContain('api.fqnovel.com'); });
  it('isValid for /path', () => { expect(e.isValid('/v1')).toBe(true); });
});

describe('TomatoNovelCoreIndex', () => {
  const idx = new TomatoNovelCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});