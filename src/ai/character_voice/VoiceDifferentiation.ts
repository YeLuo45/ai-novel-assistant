/**
 * VoiceDifferentiation.ts — Direction AH, V3326-V3335 (Batch 2/3)
 * Character Voice Differentiator: 角色声音差异化分析
 *
 * 10 engines:
 * 1.  VoiceDifferentiationAnalyzer — 声音差异化分析器
 * 2.  CrossCharacterComparison — 跨角色对比
 * 3.  VoiceConsistencyChecker — 声音一致性
 * 4.  VoiceEvolutionTracker — 声音进化追踪
 * 5.  VoiceAnomalyDetector — 声音异常检测
 * 6.  DialogueConflictDetector — 对话冲突
 * 7.  CharacterVoiceClassifier — 角色声音分类
 * 8.  VoiceStrengthMeter — 声音强度计
 * 9.  VoiceTemplateBuilder — 声音模板构建
 * 10. VoiceDifferentiationIndex — 收口
 *
 * 灵感：长篇多角色辨识度
 */

import {
  CharacterSpeechPattern,
  SentenceLengthByCharacter,
  VocabularyRichnessByCharacter,
  QuestionFrequencyByCharacter,
  ExclamationByCharacter,
  FillerWordsByCharacter,
  FormalityByCharacter,
} from './VoiceFeatures';

// ============================================================================
// Engine 1: VoiceDifferentiationAnalyzer
// ============================================================================

export interface CharacterVoiceProfile {
  character: string;
  avgLen: number;
  ttr: number;
  questionRate: number;
  exclamationRate: number;
  fillerCount: number;
  formality: number;
}

export class VoiceDifferentiationAnalyzer {
  private _sp = new CharacterSpeechPattern();
  private _sl = new SentenceLengthByCharacter();
  private _vr = new VocabularyRichnessByCharacter();
  private _qf = new QuestionFrequencyByCharacter();
  private _ex = new ExclamationByCharacter();
  private _fw = new FillerWordsByCharacter();
  private _fm = new FormalityByCharacter();

  profile(character: string, lines: string[]): CharacterVoiceProfile {
    return {
      character,
      avgLen: this._sp.extract(character, lines).avgLen,
      ttr: this._vr.compute(lines).ttr,
      questionRate: this._qf.rate(lines),
      exclamationRate: this._ex.rate(lines),
      fillerCount: this._fw.count(lines).reduce((s, x) => s + x.count, 0),
      formality: this._fm.score(lines),
    };
  }
}

// ============================================================================
// Engine 2: CrossCharacterComparison
// ============================================================================

export class CrossCharacterComparison {
  compare(a: CharacterVoiceProfile, b: CharacterVoiceProfile): number {
    // 0-1, higher = more different
    const lenDiff = Math.abs(a.avgLen - b.avgLen) / 50;
    const ttrDiff = Math.abs(a.ttr - b.ttr);
    const qDiff = Math.abs(a.questionRate - b.questionRate);
    const eDiff = Math.abs(a.exclamationRate - b.exclamationRate);
    const fDiff = Math.abs(a.formality - b.formality);
    return Math.min(1, (lenDiff + ttrDiff + qDiff + eDiff + fDiff) / 5);
  }

  isDistinct(a: CharacterVoiceProfile, b: CharacterVoiceProfile, threshold = 0.3): boolean {
    return this.compare(a, b) > threshold;
  }
}

// ============================================================================
// Engine 3: VoiceConsistencyChecker
// ============================================================================

export class VoiceConsistencyChecker {
  check(profiles: CharacterVoiceProfile[]): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        if (Math.abs(profiles[i].avgLen - profiles[j].avgLen) < 3) {
          issues.push(`${profiles[i].character} and ${profiles[j].character} have similar sentence length`);
        }
      }
    }
    return { consistent: issues.length === 0, issues };
  }
}

// ============================================================================
// Engine 4: VoiceEvolutionTracker
// ============================================================================

export class VoiceEvolutionTracker {
  private _snapshots: { character: string; chapter: number; profile: CharacterVoiceProfile }[] = [];

  record(character: string, chapter: number, profile: CharacterVoiceProfile): void {
    this._snapshots.push({ character, chapter, profile });
  }

  hasVoiceShift(character: string, threshold = 0.3): boolean {
    const snaps = this._snapshots.filter((s) => s.character === character);
    if (snaps.length < 2) return false;
    for (let i = 1; i < snaps.length; i++) {
      const a = snaps[i - 1].profile;
      const b = snaps[i].profile;
      if (Math.abs(a.formality - b.formality) > threshold) return true;
    }
    return false;
  }
}

// ============================================================================
// Engine 5: VoiceAnomalyDetector
// ============================================================================

export class VoiceAnomalyDetector {
  private _baseline = new Map<string, CharacterVoiceProfile>();

  setBaseline(profile: CharacterVoiceProfile): void {
    this._baseline.set(profile.character, profile);
  }

  isAnomalous(profile: CharacterVoiceProfile, threshold = 0.5): boolean {
    const base = this._baseline.get(profile.character);
    if (!base) return false;
    const diff = Math.abs(base.avgLen - profile.avgLen) / 50 + Math.abs(base.formality - profile.formality);
    return diff > threshold;
  }
}

// ============================================================================
// Engine 6: DialogueConflictDetector
// ============================================================================

export class DialogueConflictDetector {
  detect(profiles: CharacterVoiceProfile[]): { conflicts: string[] } {
    const conflicts: string[] = [];
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const a = profiles[i];
        const b = profiles[j];
        // If two characters have very similar style, dialogue attribution may be confused
        if (Math.abs(a.avgLen - b.avgLen) < 2 && Math.abs(a.formality - b.formality) < 0.1) {
          conflicts.push(`${a.character} and ${b.character} voice too similar`);
        }
      }
    }
    return { conflicts };
  }

  hasConflict(profiles: CharacterVoiceProfile[]): boolean {
    return this.detect(profiles).conflicts.length > 0;
  }
}

// ============================================================================
// Engine 7: CharacterVoiceClassifier
// ============================================================================

export class CharacterVoiceClassifier {
  classify(profile: CharacterVoiceProfile): 'child' | 'elder' | 'educated' | 'common' | 'dramatic' {
    if (profile.fillerCount >= 3) return 'common';
    if (profile.formality > 0.7) return 'educated';
    if (profile.exclamationRate > 0.3) return 'dramatic';
    if (profile.avgLen < 10) return 'child';
    return 'elder';
  }
}

// ============================================================================
// Engine 8: VoiceStrengthMeter
// ============================================================================

export class VoiceStrengthMeter {
  measure(profile: CharacterVoiceProfile): number {
    // Strong voice = distinctive pattern
    let strength = 0;
    if (profile.fillerCount > 0) strength += 0.2;
    if (profile.ttr > 0.5) strength += 0.2;
    if (profile.formality > 0.5 || profile.formality < 0.3) strength += 0.2;
    if (profile.questionRate > 0.2) strength += 0.2;
    if (profile.exclamationRate > 0.2) strength += 0.2;
    return Math.min(1, strength);
  }

  isStrong(profile: CharacterVoiceProfile, threshold = 0.6): boolean {
    return this.measure(profile) >= threshold;
  }
}

// ============================================================================
// Engine 9: VoiceTemplateBuilder
// ============================================================================

export class VoiceTemplateBuilder {
  build(character: string, profile: CharacterVoiceProfile): string {
    return `${character} voice: avg ${profile.avgLen.toFixed(0)} chars/line, TTR ${profile.ttr.toFixed(2)}, formality ${profile.formality.toFixed(2)}`;
  }

  toMarkdown(profiles: CharacterVoiceProfile[]): string {
    return profiles.map((p) => `- ${this.build(p.character, p)}`).join('\n');
  }
}

// ============================================================================
// Engine 10: VoiceDifferentiationIndex
// ============================================================================

export class VoiceDifferentiationIndex {
  list(): string[] {
    return [
      'VoiceDifferentiationAnalyzer', 'CrossCharacterComparison', 'VoiceConsistencyChecker',
      'VoiceEvolutionTracker', 'VoiceAnomalyDetector', 'DialogueConflictDetector',
      'CharacterVoiceClassifier', 'VoiceStrengthMeter', 'VoiceTemplateBuilder',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AH_BATCH_2_ENGINES = {
  VoiceDifferentiationAnalyzer,
  CrossCharacterComparison,
  VoiceConsistencyChecker,
  VoiceEvolutionTracker,
  VoiceAnomalyDetector,
  DialogueConflictDetector,
  CharacterVoiceClassifier,
  VoiceStrengthMeter,
  VoiceTemplateBuilder,
  VoiceDifferentiationIndex,
} as const;
