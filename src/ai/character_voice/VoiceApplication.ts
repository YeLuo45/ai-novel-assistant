/**
 * VoiceApplication.ts — Direction AH, V3336-V3345 (Batch 3/3 收口)
 * Character Voice Differentiator: 应用 + 收口
 *
 * 10 engines:
 * 1.  VoiceGenerationPrompt — 声音生成 prompt
 * 2.  CharacterVoiceLibrary — 角色声音库
 * 3.  VoiceConsistencyEnforcer — 声音一致性执行
 * 4.  DialogueAttributor — 对话归属
 * 5.  POVVoiceAdapter — POV 声音适配
 * 6.  MultiCharacterSimulator — 多角色模拟器
 * 7.  VoiceTemplateLibrary — 声音模板库
 * 8.  VoiceMigrationHelper — 声音迁移助手
 * 9.  VoiceComparisonReport — 声音对比报告
 * 10. CharacterVoiceIndex — 28 engines 收口
 *
 * 灵感：长篇多 POV 实用工具
 */

import type { CharacterVoiceProfile } from './VoiceDifferentiation';

// ============================================================================
// Engine 1: VoiceGenerationPrompt
// ============================================================================

export class VoiceGenerationPrompt {
  generate(character: string, profile: CharacterVoiceProfile): string {
    let prompt = `角色 ${character} 的声音特征：\n`;
    prompt += `- 平均句长：${profile.avgLen.toFixed(0)} 字符\n`;
    prompt += `- 词汇丰富度（TTR）：${profile.ttr.toFixed(2)}\n`;
    prompt += `- 提问率：${(profile.questionRate * 100).toFixed(0)}%\n`;
    prompt += `- 感叹率：${(profile.exclamationRate * 100).toFixed(0)}%\n`;
    prompt += `- 正式度：${profile.formality.toFixed(2)} (0=口语, 1=正式)\n`;
    if (profile.fillerCount > 0) prompt += `- 口头禅数：${profile.fillerCount}\n`;
    prompt += '\n生成对话时请遵循以上特征。';
    return prompt;
  }

  isActionable(profile: CharacterVoiceProfile): boolean {
    return profile.avgLen > 0;
  }
}

// ============================================================================
// Engine 2: CharacterVoiceLibrary
// ============================================================================

export class CharacterVoiceLibrary {
  private _library = new Map<string, CharacterVoiceProfile>();

  register(profile: CharacterVoiceProfile): void {
    this._library.set(profile.character, profile);
  }

  get(character: string): CharacterVoiceProfile | null {
    return this._library.get(character) || null;
  }

  list(): string[] {
    return Array.from(this._library.keys());
  }

  size(): number {
    return this._library.size;
  }
}

// ============================================================================
// Engine 3: VoiceConsistencyEnforcer
// ============================================================================

export class VoiceConsistencyEnforcer {
  check(character: string, line: string, library: CharacterVoiceLibrary): { consistent: boolean; deviation: number } {
    const profile = library.get(character);
    if (!profile) return { consistent: true, deviation: 0 };
    const lineLen = line.length;
    const deviation = Math.abs(lineLen - profile.avgLen) / 50;
    return { consistent: deviation < 0.5, deviation };
  }

  hasDeviation(character: string, line: string, library: CharacterVoiceLibrary, threshold = 0.5): boolean {
    return this.check(character, line, library).deviation > threshold;
  }
}

// ============================================================================
// Engine 4: DialogueAttributor
// ============================================================================

export class DialogueAttributor {
  // Given a line and library, attribute to most likely character
  attribute(line: string, library: CharacterVoiceLibrary): string | null {
    let best: string | null = null;
    let bestDev = Infinity;
    for (const char of library.list()) {
      const profile = library.get(char);
      if (!profile) continue;
      const dev = Math.abs(line.length - profile.avgLen) / 50;
      if (dev < bestDev) {
        bestDev = dev;
        best = char;
      }
    }
    return best;
  }

  hasMultipleCandidates(line: string, library: CharacterVoiceLibrary, threshold = 0.1): boolean {
    const devs: number[] = [];
    for (const char of library.list()) {
      const profile = library.get(char);
      if (!profile) continue;
      devs.push(Math.abs(line.length - profile.avgLen) / 50);
    }
    devs.sort((a, b) => a - b);
    return devs.length >= 2 && devs[1] - devs[0] < threshold;
  }
}

// ============================================================================
// Engine 5: POVVoiceAdapter
// ============================================================================

export class POVVoiceAdapter {
  // Adapt narration style to POV character's voice
  adapt(narration: string, povProfile: CharacterVoiceProfile): string {
    if (povProfile.formality > 0.7) {
      return narration.replace(/你/g, '汝').replace(/我/g, '余');
    } else if (povProfile.formality < 0.3) {
      return narration.replace(/您/g, '你');
    }
    return narration;
  }

  adaptsTo(narration: string, profile: CharacterVoiceProfile): boolean {
    return profile.avgLen > 0;
  }
}

// ============================================================================
// Engine 6: MultiCharacterSimulator
// ============================================================================

export class MultiCharacterSimulator {
  // Simulate: given library, which characters are most likely in a scene
  predictScene(lineLength: number, library: CharacterVoiceLibrary): string[] {
    const devs: { char: string; dev: number }[] = [];
    for (const char of library.list()) {
      const profile = library.get(char);
      if (!profile) continue;
      devs.push({ char, dev: Math.abs(lineLength - profile.avgLen) / 50 });
    }
    devs.sort((a, b) => a.dev - b.dev);
    return devs.slice(0, 3).map((d) => d.char);
  }
}

// ============================================================================
// Engine 7: VoiceTemplateLibrary
// ============================================================================

export class VoiceTemplateLibrary {
  private _templates: { name: string; profile: CharacterVoiceProfile }[] = [];

  add(name: string, profile: CharacterVoiceProfile): void {
    this._templates.push({ name, profile });
  }

  getAll(): { name: string; profile: CharacterVoiceProfile }[] {
    return [...this._templates];
  }

  findClosest(profile: CharacterVoiceProfile): string | null {
    let best: string | null = null;
    let bestDev = Infinity;
    for (const t of this._templates) {
      const dev = Math.abs(t.profile.avgLen - profile.avgLen) / 50;
      if (dev < bestDev) {
        bestDev = dev;
        best = t.name;
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 8: VoiceMigrationHelper
// ============================================================================

export class VoiceMigrationHelper {
  // When changing POV, generate transition prompt
  generateTransition(fromChar: string, toChar: string, library: CharacterVoiceLibrary): string {
    const from = library.get(fromChar);
    const to = library.get(toChar);
    if (!from || !to) return 'characters not found';
    return `视角从 ${fromChar} 切换到 ${toChar}：\n` +
      `${fromChar}: 句长 ${from.avgLen.toFixed(0)}, 正式度 ${from.formality.toFixed(2)}\n` +
      `${toChar}: 句长 ${to.avgLen.toFixed(0)}, 正式度 ${to.formality.toFixed(2)}\n` +
      `请在过渡段体现两种声音的差异。`;
  }
}

// ============================================================================
// Engine 9: VoiceComparisonReport
// ============================================================================

export class VoiceComparisonReport {
  generate(a: CharacterVoiceProfile, b: CharacterVoiceProfile): string {
    return `Voice comparison: ${a.character} vs ${b.character}
- avgLen: ${a.avgLen.toFixed(0)} vs ${b.avgLen.toFixed(0)} (diff ${Math.abs(a.avgLen - b.avgLen).toFixed(0)})
- TTR: ${a.ttr.toFixed(2)} vs ${b.ttr.toFixed(2)}
- formality: ${a.formality.toFixed(2)} vs ${b.formality.toFixed(2)}
- question rate: ${a.questionRate.toFixed(2)} vs ${b.questionRate.toFixed(2)}
- exclamation rate: ${a.exclamationRate.toFixed(2)} vs ${b.exclamationRate.toFixed(2)}`;
  }

  toMarkdown(profiles: CharacterVoiceProfile[]): string {
    let md = '# Character Voice Report\n\n';
    for (const p of profiles) {
      md += `## ${p.character}\n`;
      md += `- Avg length: ${p.avgLen.toFixed(0)} chars\n`;
      md += `- TTR: ${p.ttr.toFixed(2)}\n`;
      md += `- Formality: ${p.formality.toFixed(2)}\n\n`;
    }
    return md;
  }
}

// ============================================================================
// Engine 10: CharacterVoiceIndex
// ============================================================================

export class CharacterVoiceIndex {
  list(): string[] {
    return [
      'CharacterSpeechPattern', 'SentenceLengthByCharacter', 'VocabularyRichnessByCharacter',
      'QuestionFrequencyByCharacter', 'ExclamationByCharacter', 'FillerWordsByCharacter',
      'FormalityByCharacter', 'DialectByCharacter', 'SlangByCharacter',
      'VoiceDifferentiationAnalyzer', 'CrossCharacterComparison', 'VoiceConsistencyChecker',
      'VoiceEvolutionTracker', 'VoiceAnomalyDetector', 'DialogueConflictDetector',
      'CharacterVoiceClassifier', 'VoiceStrengthMeter', 'VoiceTemplateBuilder',
      'VoiceGenerationPrompt', 'CharacterVoiceLibrary', 'VoiceConsistencyEnforcer',
      'DialogueAttributor', 'POVVoiceAdapter', 'MultiCharacterSimulator',
      'VoiceTemplateLibrary', 'VoiceMigrationHelper', 'VoiceComparisonReport',
      'CharacterVoiceIndex',
    ];
  }

  count(): number {
    return this.list().length;
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AH_BATCH_3_ENGINES = {
  VoiceGenerationPrompt,
  CharacterVoiceLibrary,
  VoiceConsistencyEnforcer,
  DialogueAttributor,
  POVVoiceAdapter,
  MultiCharacterSimulator,
  VoiceTemplateLibrary,
  VoiceMigrationHelper,
  VoiceComparisonReport,
  CharacterVoiceIndex,
} as const;

export type { CharacterVoiceProfile };
