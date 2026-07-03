/**
 * StructureTemplates — Direction AB, V3016-V3025 (Batch 1/3)
 * Pacing & Structure Mastery: 经典叙事结构模板 + 场景功能分析
 *
 * 10 engines:
 * 1.  ThreeActStructure — 三幕结构（建置/对抗/解决）
 * 2.  HeroJourney12Stages — 英雄之旅 12 阶段
 * 3.  SaveTheCat15Beats — 救猫咪 15 节拍
 * 4.  StoryGrid5Commandments — 故事网格 5 大戒律
 * 5.  SnowflakeMethod10Steps — 雪花写作法 10 步
 * 6.  ScenePurpose — 场景目的（goal/conflict/disaster）
 * 7.  MRUDetector — 动机-反应单元检测
 * 8.  SceneSequelBalance — 场景-后续平衡
 * 9.  IncitingIncidentLocator — 激励事件定位
 * 10. MidpointDetector — 中点检测
 *
 * 灵感来源：Save the Cat / Story Grid / K.M.Weiland / 雪花法
 */

// Local Chapter interface (pacing analysis only requires content + position)
export interface Chapter {
  id?: string;
  title?: string;
  content: string;
  order?: number;
}

// ============================================================================
// Engine 1: ThreeActStructure
// ============================================================================

export interface ActMarker {
  act: 1 | 2 | 3;
  position: number; // 0-1
  label: string;
}

export class ThreeActStructure {
  private _markers: ActMarker[] = [
    { act: 1, position: 0.0, label: 'inciting_incident' },
    { act: 1, position: 0.25, label: 'plot_point_1' },
    { act: 2, position: 0.5, label: 'midpoint' },
    { act: 2, position: 0.75, label: 'plot_point_2' },
    { act: 3, position: 1.0, label: 'climax' },
  ];

  classify(progress: number): ActMarker {
    if (progress < 0.25) return this._markers[0];
    if (progress < 0.5) return this._markers[1];
    if (progress < 0.75) return this._markers[2];
    if (progress < 1.0) return this._markers[3];
    return this._markers[4];
  }

  getActNumber(progress: number): 1 | 2 | 3 {
    if (progress < 0.25) return 1;
    if (progress < 0.75) return 2;
    return 3;
  }

  getAllMarkers(): ActMarker[] {
    return [...this._markers];
  }
}

// ============================================================================
// Engine 2: HeroJourney12Stages (Campbell)
// ============================================================================

export interface JourneyStage {
  index: number;
  name: string;
  position: number;
  description: string;
}

export class HeroJourney12Stages {
  private _stages: JourneyStage[] = [
    { index: 0, name: 'ordinary_world', position: 0.0, description: '英雄的平凡世界' },
    { index: 1, name: 'call_to_adventure', position: 0.083, description: '冒险召唤' },
    { index: 2, name: 'refusal_of_call', position: 0.167, description: '拒绝召唤' },
    { index: 3, name: 'meeting_mentor', position: 0.25, description: '遇见导师' },
    { index: 4, name: 'crossing_threshold', position: 0.333, description: '跨越门槛' },
    { index: 5, name: 'tests_allies_enemies', position: 0.417, description: '试炼、盟友与敌人' },
    { index: 6, name: 'approach_inmost_cave', position: 0.5, description: '接近最深处' },
    { index: 7, name: 'ordeal', position: 0.583, description: '严酷考验' },
    { index: 8, name: 'reward', position: 0.667, description: '奖赏' },
    { index: 9, name: 'road_back', position: 0.75, description: '归途' },
    { index: 10, name: 'resurrection', position: 0.833, description: '复活' },
    { index: 11, name: 'return_with_elixir', position: 1.0, description: '携灵药归来' },
  ];

  getStageAt(progress: number): JourneyStage {
    const idx = Math.min(11, Math.floor(progress * 12));
    return this._stages[idx];
  }

  getAllStages(): JourneyStage[] {
    return [...this._stages];
  }

  findStage(name: string): JourneyStage | undefined {
    return this._stages.find((s) => s.name === name);
  }
}

// ============================================================================
// Engine 3: SaveTheCat15Beats (Blake Snyder)
// ============================================================================

export interface Beat {
  index: number;
  name: string;
  pagePercent: number; // 0-100
}

export class SaveTheCat15Beats {
  private _beats: Beat[] = [
    { index: 0, name: 'opening_image', pagePercent: 1 },
    { index: 1, name: 'theme_stated', pagePercent: 5 },
    { index: 2, name: 'setup', pagePercent: 10 },
    { index: 3, name: 'catalyst', pagePercent: 12 },
    { index: 4, name: 'debate', pagePercent: 20 },
    { index: 5, name: 'break_into_two', pagePercent: 25 },
    { index: 6, name: 'b_story', pagePercent: 30 },
    { index: 7, name: 'fun_and_games', pagePercent: 40 },
    { index: 8, name: 'midpoint', pagePercent: 50 },
    { index: 9, name: 'bad_guys_close_in', pagePercent: 60 },
    { index: 10, name: 'all_is_lost', pagePercent: 75 },
    { index: 11, name: 'dark_night_of_soul', pagePercent: 80 },
    { index: 12, name: 'break_into_three', pagePercent: 85 },
    { index: 13, name: 'finale', pagePercent: 90 },
    { index: 14, name: 'final_image', pagePercent: 99 },
  ];

  getBeats(): Beat[] {
    return [...this._beats];
  }

  findBeat(name: string): Beat | undefined {
    return this._beats.find((b) => b.name === name);
  }

  getBeatsBetween(fromPct: number, toPct: number): Beat[] {
    return this._beats.filter((b) => b.pagePercent >= fromPct && b.pagePercent <= toPct);
  }
}

// ============================================================================
// Engine 4: StoryGrid5Commandments (Shawn Coyne)
// ============================================================================

export interface Commandment {
  index: number;
  key: 'inciting_incident' | 'progressive_complications' | 'crisis' | 'climax' | 'resolution';
  description: string;
}

export interface CommandmentCheck {
  commandment: Commandment;
  hasIncitingIncident: boolean;
  hasProgressiveComplications: boolean;
  hasCrisis: boolean;
  hasClimax: boolean;
  hasResolution: boolean;
  score: number; // 0-5
}

export class StoryGrid5Commandments {
  private _commandments: Commandment[] = [
    { index: 0, key: 'inciting_incident', description: '激励事件 - 故事开始的事件' },
    { index: 1, key: 'progressive_complications', description: '递进冲突 - 让主角越陷越深' },
    { index: 2, key: 'crisis', description: '危机 - 主角必须做出选择' },
    { index: 3, key: 'climax', description: '高潮 - 选择产生结果' },
    { index: 4, key: 'resolution', description: '解决 - 故事结果' },
  ];

  getCommandments(): Commandment[] {
    return [...this._commandments];
  }

  check(check: Omit<CommandmentCheck, 'commandment' | 'score'>): CommandmentCheck {
    const score = [
      check.hasIncitingIncident,
      check.hasProgressiveComplications,
      check.hasCrisis,
      check.hasClimax,
      check.hasResolution,
    ].filter(Boolean).length;
    return { commandment: this._commandments[0], ...check, score };
  }

  grade(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score <= 1) return 'poor';
    if (score <= 3) return 'fair';
    if (score === 4) return 'good';
    return 'excellent';
  }
}

// ============================================================================
// Engine 5: SnowflakeMethod10Steps (Randy Ingermanson)
// ============================================================================

export interface SnowflakeStep {
  index: number;
  step: string;
  description: string;
}

export class SnowflakeMethod10Steps {
  private _steps: SnowflakeStep[] = [
    { index: 0, step: 'one_sentence', description: '用一句话写故事' },
    { index: 1, step: 'one_paragraph', description: '扩展为一段话（5句）' },
    { index: 2, step: 'major_characters', description: '写出主要角色' },
    { index: 3, step: 'one_page_summary', description: '每角色一页摘要' },
    { index: 4, step: 'character_synopsis', description: '角色完整简介' },
    { index: 5, step: 'long_summary', description: '扩展为 4 页' },
    { index: 6, step: 'character_charts', description: '角色详细图表' },
    { index: 7, step: 'scene_list', description: '场景列表' },
    { index: 8, step: 'scene_details', description: '场景详细描述' },
    { index: 9, step: 'first_draft', description: '写第一稿' },
  ];

  getSteps(): SnowflakeStep[] {
    return [...this._steps];
  }

  getStepAt(index: number): SnowflakeStep | undefined {
    return this._steps[index];
  }

  progressAt(stepIndex: number): number {
    return (stepIndex + 1) / this._steps.length;
  }
}

// ============================================================================
// Engine 6: ScenePurpose (Dwight Swain / Scene-Sequel)
// ============================================================================

export interface SceneAnalysis {
  goal: string;
  conflict: string;
  disaster: boolean;
  hasGoal: boolean;
  hasConflict: boolean;
  isComplete: boolean;
}

export class ScenePurpose {
  analyze(scene: { goal?: string; conflict?: string; disaster?: string }): SceneAnalysis {
    const hasGoal = !!scene.goal && scene.goal.trim().length > 0;
    const hasConflict = !!scene.conflict && scene.conflict.trim().length > 0;
    const disaster = !!scene.disaster && scene.disaster.trim().length > 0;
    return {
      goal: scene.goal || '',
      conflict: scene.conflict || '',
      disaster,
      hasGoal,
      hasConflict,
      isComplete: hasGoal && hasConflict,
    };
  }

  diagnose(scene: SceneAnalysis): string[] {
    const issues: string[] = [];
    if (!scene.hasGoal) issues.push('missing_goal');
    if (!scene.hasConflict) issues.push('missing_conflict');
    if (!scene.disaster) issues.push('missing_disaster');
    return issues;
  }
}

// ============================================================================
// Engine 7: MRUDetector (Motivation-Reaction Unit)
// ============================================================================

export interface MRU {
  motivation: string; // 触发情境
  reaction: string;   // 主角反应
  decision: string;   // 主角决定
  hasAll: boolean;
}

export class MRUDetector {
  private _motivationKeywords = ['看到', '听到', '发现', '意识到', '感到', '觉得', 'saw', 'heard', 'felt', 'realized'];
  private _reactionKeywords = ['决定', '选择', '打算', '准备', '想', 'wanted', 'decided', 'planned', 'chose'];
  private _decisionKeywords = ['于是', '因此', '所以', '然后', 'so', 'then', 'therefore'];

  detect(text: string): MRU {
    const lower = text.toLowerCase();
    const hasMotivation = this._motivationKeywords.some((k) => lower.includes(k));
    const hasReaction = this._reactionKeywords.some((k) => lower.includes(k));
    const hasDecision = this._decisionKeywords.some((k) => lower.includes(k));
    return {
      motivation: hasMotivation ? 'detected' : 'missing',
      reaction: hasReaction ? 'detected' : 'missing',
      decision: hasDecision ? 'detected' : 'missing',
      hasAll: hasMotivation && hasReaction && hasDecision,
    };
  }

  scoreText(text: string): number {
    const lower = text.toLowerCase();
    const motCount = this._motivationKeywords.filter((k) => lower.includes(k)).length;
    const reaCount = this._reactionKeywords.filter((k) => lower.includes(k)).length;
    const decCount = this._decisionKeywords.filter((k) => lower.includes(k)).length;
    return motCount * 1 + reaCount * 1 + decCount * 1;
  }
}

// ============================================================================
// Engine 8: SceneSequelBalance
// ============================================================================

export interface SceneSequelRatio {
  sceneCount: number;
  sequelCount: number;
  ratio: number; // scene / (scene + sequel)
  isBalanced: boolean;
}

export class SceneSequelBalance {
  private _balanceThreshold = 0.6; // 60% scene, 40% sequel

  compute(scenes: number, sequels: number): SceneSequelRatio {
    const total = scenes + sequels;
    const ratio = total === 0 ? 0 : scenes / total;
    return {
      sceneCount: scenes,
      sequelCount: sequels,
      ratio,
      isBalanced: ratio >= this._balanceThreshold && ratio <= 0.85,
    };
  }

  recommend(currentRatio: number): 'more_scene' | 'more_sequel' | 'balanced' {
    if (currentRatio < this._balanceThreshold) return 'more_scene';
    if (currentRatio > 0.85) return 'more_sequel';
    return 'balanced';
  }
}

// ============================================================================
// Engine 9: IncitingIncidentLocator
// ============================================================================

export interface IncidentCandidate {
  chapter: number;
  text: string;
  position: number; // 0-1 within chapter
  disruptionScore: number; // 0-1
}

export class IncitingIncidentLocator {
  private _disruptionKeywords = ['突然', '意外', '闯入', '死亡', '发现真相', '突变', 'sudden', 'discovered', 'died', 'revealed'];

  score(text: string): number {
    const lower = text.toLowerCase();
    const matches = this._disruptionKeywords.filter((k) => lower.includes(k)).length;
    return Math.min(1, matches / 3);
  }

  locate(chapters: Chapter[]): IncidentCandidate | null {
    let best: IncidentCandidate | null = null;
    for (let i = 0; i < chapters.length; i++) {
      const text = chapters[i].content || '';
      const score = this.score(text);
      if (!best || score > best.disruptionScore) {
        best = {
          chapter: i,
          text: text.slice(0, 100),
          position: i / Math.max(1, chapters.length - 1),
          disruptionScore: score,
        };
      }
    }
    return best;
  }
}

// ============================================================================
// Engine 10: MidpointDetector
// ============================================================================

export interface MidpointCandidate {
  chapter: number;
  progress: number; // 0-1
  reversibilityScore: number;
  isTrueMidpoint: boolean;
}

export class MidpointDetector {
  private _idealRange = [0.45, 0.55];
  private _reversibilityKeywords = ['反转', '真相', '身份', '立场改变', 'twist', 'reversal', 'truth', 'revelation'];

  isInIdealRange(progress: number): boolean {
    return progress >= this._idealRange[0] && progress <= this._idealRange[1];
  }

  scoreReversibility(text: string): number {
    const lower = text.toLowerCase();
    const matches = this._reversibilityKeywords.filter((k) => lower.includes(k)).length;
    return Math.min(1, matches / 2);
  }

  detect(chapter: number, totalChapters: number, text: string): MidpointCandidate {
    const progress = totalChapters <= 1 ? 0.5 : chapter / (totalChapters - 1);
    const reversibilityScore = this.scoreReversibility(text);
    return {
      chapter,
      progress,
      reversibilityScore,
      isTrueMidpoint: this.isInIdealRange(progress) && reversibilityScore > 0,
    };
  }
}

// ============================================================================
// Public API
// ============================================================================

export const AB_BATCH_1_ENGINES = {
  ThreeActStructure,
  HeroJourney12Stages,
  SaveTheCat15Beats,
  StoryGrid5Commandments,
  SnowflakeMethod10Steps,
  ScenePurpose,
  MRUDetector,
  SceneSequelBalance,
  IncitingIncidentLocator,
  MidpointDetector,
} as const;
