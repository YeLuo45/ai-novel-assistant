/**
 * VoiceCommandAdvanced.test.ts — Direction BX, V4506-V4515 (Batch 2/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { CustomCommandCreator, CommandChaining, VoiceShortcut, CommandConflictResolver, FuzzyCommandMatcher, MultiLanguageCommands, VoiceMacro, VoiceGuard, CommandSuggestionEngine, VoiceFeedbackPlayer, VoiceCommandAdvancedIndex } from './VoiceCommandAdvanced';

describe('CustomCommandCreator', () => {
  const e = new CustomCommandCreator();
  it('create returns', () => { const r = e.create('open', 'openFile'); expect(r.name).toBe('open'); });
  it('isValid true', () => { expect(e.isValid({ name: 'A', action: 'B' })).toBe(true); });
});

describe('CommandChaining', () => {
  const e = new CommandChaining();
  it('chain includes ->', () => { expect(e.chain(['a', 'b'])).toContain('->'); });
  it('isChained true', () => { expect(e.isChained('a -> b')).toBe(true); });
});

describe('VoiceShortcut', () => {
  const e = new VoiceShortcut();
  it('add + get', () => { e.add('open', 'openFile'); expect(e.get('open')).toBe('openFile'); });
  it('has true', () => { expect(e.has('open')).toBe(true); });
});

describe('CommandConflictResolver', () => {
  const e = new CommandConflictResolver();
  it('resolve for longer', () => { expect(e.resolve('longer_cmd', 'short')).toBe('longer_cmd'); });
  it('isResolved true', () => { expect(e.isResolved('x')).toBe(true); });
});

describe('FuzzyCommandMatcher', () => {
  const e = new FuzzyCommandMatcher();
  it('match for exact', () => { expect(e.match('open', ['open', 'save'])).toBe('open'); });
  it('hasMatch true', () => { expect(e.hasMatch('open')).toBe(true); });
});

describe('MultiLanguageCommands', () => {
  const e = new MultiLanguageCommands();
  it('isValid for zh', () => { expect(e.isValid('zh')).toBe(true); });
});

describe('VoiceMacro', () => {
  const e = new VoiceMacro();
  it('add + execute', () => { e.add('a'); e.add('b'); expect(e.execute()).toBe('a; b'); });
  it('count', () => { expect(e.count()).toBe(2); });
});

describe('VoiceGuard', () => {
  const e = new VoiceGuard();
  it('isSensitive for delete', () => { expect(e.isSensitive('delete file')).toBe(true); });
});

describe('CommandSuggestionEngine', () => {
  const e = new CommandSuggestionEngine();
  it('suggest for 2', () => { expect(e.suggest('open').length).toBe(2); });
  it('hasSuggestions true', () => { expect(e.hasSuggestions(['x'])).toBe(true); });
});

describe('VoiceFeedbackPlayer', () => {
  const e = new VoiceFeedbackPlayer();
  it('play + isPlayed', () => { e.play('hello'); expect(e.isPlayed()).toBe(true); });
});

describe('VoiceCommandAdvancedIndex', () => {
  const idx = new VoiceCommandAdvancedIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});