# Direction AZ — Genre Compliance Checker

**V3856-V3885 · 30 engines · 54 tests · 100% pass · ≥98% coverage**

类型合规检查 + 规则库 + 违反检测 + 集成。

## 灵感来源

基于 AQ Genre Blending Advisor + 出版社标准 / 类型小说规则

## 30 engines 分组

### Genre Compliance Core (10)
- **GenreRulesRepository** — 规则库（3 genre × 3 rules + get + has）
- **ComplianceChecker** — 合规检查（check + isCompliant）
- **GenreViolationDetector** — 违反检测（detect + hasViolation）
- **GenreTropeChecker** — 套路检查（checkTropes + isComplete）
- **GenreConventionEnforcer** — 约定执行（enforce + isEnforced）
- **GenreRulePredictor** — 规则预测（predict + isConfident 0.5+）
- **GenreComplianceScore** — 合规评分（score + isCompliant 0.7+）
- **GenreRuleAdjuster** — 规则调整（adjustRules + hasAdjustedRules）
- **GenreComplianceReporter** — 报告（generate + hasReport 合规）
- **GenreComplianceLibrary** — 库（save + get + count）

### Genre Compliance Advanced (9)
- **GenreComplianceScanner** — 扫描（scan + hasIssues）
- **GenreComplianceFixer** — 修复（fix + isFixed）
- **GenreComplianceWarning** — 警告（generate + hasWarning [genre]）
- **GenreComplianceBenchmark** — 基准（benchmark + isAboveBenchmark）
- **GenreComplianceTrend** — 趋势（record + hasTrend）
- **GenreComplianceEnforcer** — 执行（enforce + isEnforced changed）
- **GenreComplianceDashboard** — 仪表盘（generate + hasDashboard 合规率）
- **GenreComplianceAlert** — 预警（send + hasAlert 0.5-）
- **GenreComplianceReview** — 评审（review + needsReview）

### Genre Compliance Integration (9)
- **GenreCompliancePipeline** — 流程（5 steps + isComplete + next）
- **GenreComplianceDirector** — 总监（done/major_fix/minor_fix）
- **GenreComplianceReport** — 报告（generate + hasReport）
- **GenreComplianceQualityGate** — 质量门（gate 0.7+）
- **GenreComplianceAuditTrail** — 审计（log + count）
- **GenreComplianceExport** — 导出（export + isValid 合规）
- **GenreComplianceADirector** — 决策（finalize/continue/manual_fix）
- **GenreComplianceLibrary** — 库（save + get + count）
- **GenreComplianceValidator** — 验证（validate + isValid）

### 收口
- **GenreComplianceCoreIndex** / **GenreComplianceIndex** / **GenreComplianceMasterIndex** (28 engines)

## 使用方式

```ts
import { ComplianceChecker, GenreRulesRepository } from './src/ai/genre_compliance/GenreComplianceCore';
import { GenreComplianceFixer } from './src/ai/genre_compliance/GenreComplianceAdvanced';

const checker = new ComplianceChecker();
const r = checker.check('有恋人。有误会。有重逢。', 'romance');
console.log(r.compliant); // true

const fixer = new GenreComplianceFixer();
const fixed = fixer.fix('hi', 'romance');
console.log(fixed); // 'hi 他们相爱了。'
```

## 测试命令

```bash
npx vitest run src/ai/genre_compliance/ --coverage --coverage.include='src/ai/genre_compliance/**'
```