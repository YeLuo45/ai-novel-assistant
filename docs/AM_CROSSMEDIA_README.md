# Direction AM — Cross-Media Adaptation

**V3466-V3495 · 30 engines · 57 tests · 100% pass · 98.94% coverage**

小说→剧本→漫画→游戏 + 9 种媒介适配 + IP 扩展规划。

## 灵感来源

IP 衍生 / 跨媒体运营 / 漫威 DC 漫画影视化经验 / 游戏改编方法论

## 30 engines 分组

### 剧本改编 (9)
- **ScriptFormatter** — 剧本格式化（[SCENE] marker + hasActionLines）
- **SceneToScriptConverter** — 场景转剧本（setting + action + dialogues）
- **DialogueToSpeechConverter** — 对话转台词（4 emotion + batchConvert）
- **NarrativeToPanelConverter** — 叙事转分镜（panels + duration）
- **PanelLayoutDesigner** — 分镜布局（2x2/3x2/3x3 + size small/medium/large）
- **VoiceBubblePlacer** — 对话气泡（4 corner + isValidPlacement）
- **EffectSFXDesigner** — 音效设计（5 sfx: 战斗/爆炸/脚步/风/水）
- **GameSceneConverter** — 游戏场景（location + characters + actions + objects）
- **ChoiceBranchDesigner** — 选择分支（point + options + consequence）

### 媒体特定 (9)
- **AnimeEpisodeDesigner** — 动画集设计（24min + scenes 5-20）
- **TVDramaEpisodeSplitter** — 电视剧分集（45min × 300wpm）
- **MovieScreenplayAdapter** — 电影剧本（3 act × 40 scenes）
- **WebComicPanelDesigner** — 网络漫画（scroll/grid + height）
- **AudiobookChapterDesigner** — 有声书（200wpm + narratorNotes）
- **PodcastScriptWriter** — 播客脚本（intro/main/outro）
- **GameQuestDesigner** — 游戏任务（4 step workflow）
- **RPGDialogueWriter** — RPG 对白（4 state: greeting/quest/trade/farewell）
- **VisualNovelScriptWriter** — 视觉小说（scene + character + emotion + bg）

### 集成 (9)
- **MediaAdapter** — 媒体适配器（script/panel/dialogue 3 format）
- **FormatConverter** — 格式转换（JSON + Markdown + YAML）
- **CharacterAdaptor** — 角色适配（4 medium: anime/drama/game/novel）
- **StoryArcAdapter** — 故事弧适配（3 medium × 4 arc）
- **IPExpansionPlanner** — IP 扩展规划（plan + recommendExpansion）
- **CrossMediaConsistency** — 一致性（addFact + isConsistent + hasConflict）
- **MediaMetricsTracker** — 指标追踪（track + get + bestPerforming）
- **ReleaseStrategyPlanner** — 发布策略（plan + hasGap 90+）
- **IPValueMaximizer** — IP 价值（6 media × baseValue + totalValue）

### 收口 (3)
- **ScriptAdaptationIndex** — 9 engines 收口
- **MediaSpecificIndex** — 9 engines 收口
- **CrossMediaIndexFinal** — 28 engines 收口

## 使用方式

```ts
import { ScriptFormatter, SceneToScriptConverter, NarrativeToPanelConverter } from './src/ai/crossmedia/ScriptAdaptation';
import { AnimeEpisodeDesigner, TVDramaEpisodeSplitter, PodcastScriptWriter } from './src/ai/crossmedia/MediaSpecific';
import { MediaAdapter, IPExpansionPlanner, IPValueMaximizer } from './src/ai/crossmedia/CrossMediaIntegration';

const formatter = new ScriptFormatter();
const script = formatter.formatToScript('场景一。场景二。');
// [SCENE] 场景一
// [SCENE] 场景二

const anime = new AnimeEpisodeDesigner();
const ep = anime.design(1, '场景内容...');
// { episode: 1, duration: 24, scenes: 5, hook: '场景内容' }

const ip = new IPExpansionPlanner();
console.log(ip.recommendExpansion('novel'));
// ['novel', '漫画', '动画', '游戏', '周边']

const value = new IPValueMaximizer();
console.log(value.totalValue(['novel', 'anime', 'game']));
// 100 + 200 + 300 = 600
```

## 测试命令

```bash
npx vitest run src/ai/crossmedia/ --coverage --coverage.include='src/ai/crossmedia/**'
```

## 文件位置

- `src/ai/crossmedia/ScriptAdaptation.ts` — 剧本改编
- `src/ai/crossmedia/MediaSpecific.ts` — 媒体特定工具
- `src/ai/crossmedia/CrossMediaIntegration.ts` — 集成 + 收口
