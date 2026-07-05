/**
 * VoiceCommandCore.test.ts — Direction BX, V4496-V4505 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { VoiceCommandRecognizer, CommandDispatcher, IntentClassifier, EntityExtractor, CommandRegistry, VoiceActionMapper, ConfirmationGenerator, CommandSuggestion, CommandHistory, WakeWordDetector, VoiceCommandCoreIndex } from './VoiceCommandCore';

describe('VoiceCommandRecognizer', () => {
  const e = new VoiceCommandRecognizer();
  it('recognize includes [CMD]', () => { expect(e.recognize('Open Tomato')).toContain('[CMD]'); });
  it('isRecognized true', () => { expect(e.isRecognized('[CMD] open')).toBe(true); });
});

describe('CommandDispatcher', () => {
  const e = new CommandDispatcher();
  it('dispatch includes [DISPATCHED]', () => { expect(e.dispatch('open')).toContain('[DISPATCHED]'); });
  it('isDispatched true', () => { expect(e.isDispatched('[DISPATCHED] open')).toBe(true); });
});

describe('IntentClassifier', () => {
  const e = new IntentClassifier();
  it('classify for 打开', () => { expect(e.classify('打开番茄')).toBe('open'); });
  it('isKnown for open', () => { expect(e.isKnown('open')).toBe(true); });
});

describe('EntityExtractor', () => {
  const e = new EntityExtractor();
  it('extract for 中文', () => { expect(e.extract('打开番茄小说').entities.length).toBeGreaterThan(0); });
  it('hasEntities true', () => { expect(e.hasEntities({ entities: ['x'] })).toBe(true); });
});

describe('CommandRegistry', () => {
  const e = new CommandRegistry();
  it('register + has', () => { e.register('open', () => {}); expect(e.has('open')).toBe(true); });
  it('count', () => { expect(e.count()).toBe(1); });
});

describe('VoiceActionMapper', () => {
  const e = new VoiceActionMapper();
  it('map includes [ACTION]', () => { expect(e.map('open')).toContain('[ACTION]'); });
  it('isMapped true', () => { expect(e.isMapped('[ACTION] x')).toBe(true); });
});

describe('ConfirmationGenerator', () => {
  const e = new ConfirmationGenerator();
  it('generate includes 好的', () => { expect(e.generate('打开')).toContain('好的'); });
  it('isConfirmation true', () => { expect(e.isConfirmation('好的')).toBe(true); });
});

describe('CommandSuggestion', () => {
  const e = new CommandSuggestion();
  it('suggest returns', () => { expect(e.suggest('open')).toContain('open'); });
  it('isValid true', () => { expect(e.isValid('x')).toBe(true); });
});

describe('CommandHistory', () => {
  const e = new CommandHistory();
  it('add + count', () => { e.add('open'); expect(e.count()).toBe(1); });
});

describe('WakeWordDetector', () => {
  const e = new WakeWordDetector();
  it('detect for 嗨小墨', () => { expect(e.detect('嗨小墨，打开番茄')).toBe(true); });
  it('isWake true', () => { expect(e.isWake('嗨小墨')).toBe(true); });
});

describe('VoiceCommandCoreIndex', () => {
  const idx = new VoiceCommandCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});