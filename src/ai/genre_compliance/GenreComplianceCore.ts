/**
 * GenreComplianceCore.ts — Direction AZ, V3856-V3865 (Batch 1/3)
 * Genre Compliance Checker: 类型合规检查
 */

export class GenreRulesRepository {
  private _rules: Record<string, string[]> = {
    romance: ['有恋人', '有误会', '有重逢'],
    mystery: ['有谜题', '有线索', '有侦探'],
    fantasy: ['有魔法', '有冒险', '有成长'],
  };
  get(genre: string): string[] { return this._rules[genre] || []; }
  has(genre: string): boolean { return genre in this._rules; }
}

export class ComplianceChecker {
  check(text: string, genre: string): { compliant: boolean; missing: string[]; score: number } {
    const rules = new GenreRulesRepository().get(genre);
    const missing: string[] = [];
    for (const r of rules) {
      if (!text.includes(r)) missing.push(r);
    }
    return { compliant: missing.length === 0, missing, score: 1 - missing.length / Math.max(1, rules.length) };
  }
  isCompliant(result: { compliant: boolean }): boolean { return result.compliant; }
}

export class GenreViolationDetector {
  detect(text: string, genre: string): string[] {
    const violations: string[] = [];
    if (genre === 'romance' && /战斗|战争/.test(text)) violations.push('non-romance content');
    return violations;
  }
  hasViolation(violations: string[]): boolean { return violations.length > 0; }
}

export class GenreTropeChecker {
  private _tropes: Record<string, string[]> = {
    romance: ['一见钟情', '重逢'],
    mystery: ['线索', '推理'],
  };
  checkTropes(text: string, genre: string): { has: string[]; missing: string[] } {
    const t = this._tropes[genre] || [];
    return { has: t.filter((x) => text.includes(x)), missing: t.filter((x) => !text.includes(x)) };
  }
  isComplete(r: { has: string[]; missing: string[] }): boolean { return r.missing.length === 0; }
}

export class GenreConventionEnforcer {
  enforce(text: string, genre: string): string {
    if (genre === 'romance' && !/爱/.test(text)) return text + ' 他们相爱了。';
    return text;
  }
  isEnforced(original: string, enforced: string): boolean { return original !== enforced; }
}

export class GenreRulePredictor {
  private _keywords: Record<string, string[]> = {
    romance: ['爱', '心'],
    mystery: ['谜', '案'],
    fantasy: ['魔', '冒险'],
  };
  predict(text: string, genre: string): { genre: string; confidence: number } {
    const matches = (this._keywords[genre] || []).filter((k) => text.includes(k)).length;
    return { genre, confidence: matches / Math.max(1, (this._keywords[genre] || []).length) };
  }
  isConfident(p: { confidence: number }, threshold = 0.5): boolean { return p.confidence >= threshold; }
}

export class GenreComplianceScore {
  score(text: string, genre: string): number {
    const checker = new ComplianceChecker();
    return checker.check(text, genre).score;
  }
  isCompliant(score: number, threshold = 0.7): boolean { return score >= threshold; }
}

export class GenreRuleAdjuster {
  adjustRules(genre: string, rules: string[]): void {}
  hasAdjustedRules(genre: string): boolean { return genre.length > 0; }
}

export class GenreComplianceReporter {
  generate(genre: string, result: { compliant: boolean; missing: string[]; score: number }): string {
    return `${genre} 合规: ${result.compliant ? '是' : '否'} (${result.missing.length} 缺失)`;
  }
  hasReport(r: string): boolean { return r.includes('合规'); }
}

export class GenreComplianceLibrary {
  private _reports = new Map<string, unknown>();
  save(genre: string, report: unknown): void { this._reports.set(genre, report); }
  get(genre: string): unknown { return this._reports.get(genre); }
  count(): number { return this._reports.size; }
}

export class GenreComplianceCoreIndex {
  list(): string[] {
    return ['GenreRulesRepository', 'ComplianceChecker', 'GenreViolationDetector', 'GenreTropeChecker', 'GenreConventionEnforcer', 'GenreRulePredictor', 'GenreComplianceScore', 'GenreRuleAdjuster', 'GenreComplianceReporter', 'GenreComplianceLibrary'];
  }
  count(): number { return this.list().length; }
}

export const AZ_BATCH_1_ENGINES = {
  GenreRulesRepository, ComplianceChecker, GenreViolationDetector, GenreTropeChecker,
  GenreConventionEnforcer, GenreRulePredictor, GenreComplianceScore, GenreRuleAdjuster,
  GenreComplianceReporter, GenreComplianceLibrary, GenreComplianceCoreIndex,
} as const;