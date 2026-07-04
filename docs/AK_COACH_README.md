# Direction AK — Adaptive Writing Coach

**V3406-V3435 · 30 engines · 64 tests · 100% pass · ≥98% coverage**

写作者分析 + 自适应难度 + 技能树 + 个人化反馈 + 成长可视化。

## 灵感来源

个人化写作教练 / 学习曲线 / 写作教学法 / 教育心理学

## 30 engines 分组

### 写作者分析 (9)
- **WriterStrengthFinder** — 强项发现（4 category: action/emotion/description/dialogue + isStrength 3+）
- **WriterWeaknessFinder** — 弱项发现（3 category: pacing/show/variety + topWeakness）
- **WritingStyleAnalyzer** — 风格分析（4 fields: avgSentenceLen/paragraphCount/dialogueRatio/descriptionRatio）
- **PacingProfiler** — 节奏画像（slow/normal/fast 1000/3000 阈值）
- **DialogueProfiler** — 对话画像（count/avgLen/tagVariety）
- **DescriptionProfiler** — 描写画像（10 senses + isRich 3+）
- **CharacterProfiler** — 角色画像（mentions + unique）
- **PlotProfiler** — 情节画像（11 causal keywords + isCausallyRich 0.1+）
- **GenreAffinityDetector** — 类型适配（5 genre + isAffinity 3+）

### 自适应教练 (9)
- **AdaptiveDifficultyEngine** — 自适应难度（adjust + recommendExercise）
- **ProgressTracker** — 进度追踪（record + getHistory + totalWords + skillsImprovedCount）
- **GoalRecommender** — 目标推荐（daily/weekly/monthly + isAmbitious 1.5x）
- **SkillTreeBuilder** — 技能树（addSkill + setLevel + availableSkills with prereqs）
- **LessonPlanGenerator** — 课程计划（3 lessons + recommend by skill）
- **PracticeExerciseSelector** — 练习选择（select matching + isSuitable）
- **FeedbackPersonalizer** — 反馈个性化（3 type: encouragement/critique/praise + context）
- **CoachAIDirector** — AI 教练（decideNextStep practice/lesson/rest + tracker）
- **ImprovementPlanGenerator** — 改进计划（per-week focus + totalDuration）

### 集成 (9)
- **WriterPersonalization** — 写作者个性化（profile + skills + recommendFocus）
- **CoachingSession** — 教练会话（start + addNote + end + duration）
- **WritingMentorMatch** — 导师匹配（3 mentor + match + listAll）
- **DailyWritingCoach** — 每日教练（getDailyTip + getDailyExercise）
- **WeeklyReviewGenerator** — 周回顾（generate + isGoodWeek 3000+/3+）
- **MilestoneTracker** — 里程碑（add + check + getAchieved + date）
- **WritingStreakAdvisor** — 连续写作顾问（0/3/7/30 阶段）
- **CoachRecommendationEngine** — 教练推荐（4 context-based）
- **WriterGrowthVisualizer** — 成长可视化（█░ + ▁▂▃▄▅▆▇█）

### 收口 (3)
- **WriterAnalysisIndex** — 9 engines 收口
- **AdaptiveCoachingIndex** — 9 engines 收口
- **CoachingIndexFinal** — 28 engines 收口

## 使用方式

```ts
import { WriterStrengthFinder, WriterWeaknessFinder, GenreAffinityDetector } from './src/ai/coach/WriterAnalysis';
import { AdaptiveDifficultyEngine, SkillTreeBuilder, GoalRecommender } from './src/ai/coach/AdaptiveCoaching';
import { WriterPersonalization, MilestoneTracker, WriterGrowthVisualizer } from './src/ai/coach/CoachingIntegration';

const strength = new WriterStrengthFinder();
console.log(strength.detect('战斗燃爆！')); 
// { category: 'action', score: 2 }

const weakness = new WriterWeaknessFinder();
console.log(weakness.topWeakness('他很生气。他很高兴。'));
// { category: 'show', count: 2 }

const tree = new SkillTreeBuilder();
tree.addSkill('pacing');
tree.addSkill('plot', ['pacing']);
console.log(tree.availableSkills([]).map(s => s.name));
// ['pacing']

const viz = new WriterGrowthVisualizer();
console.log(viz.renderProgress({ pacing: 0.7, dialogue: 0.4 }));
// pacing: ███████░░░ 70%
// dialogue: ████░░░░░░ 40%
```

## 测试命令

```bash
npx vitest run src/ai/coach/ --coverage --coverage.include='src/ai/coach/**'
```

## 文件位置

- `src/ai/coach/WriterAnalysis.ts` — 写作者分析
- `src/ai/coach/AdaptiveCoaching.ts` — 自适应教练
- `src/ai/coach/CoachingIntegration.ts` — 集成 + 收口
