# Direction BG — Comic Script Engine

**V4066-V4095 · 30 engines · 55 tests · 100% pass · ≥98% coverage**

漫画脚本引擎 + 面板布局 + 对话 + 音效 + 集成。

## 灵感来源

漫画脚本 (Marvel Method) / 日漫分镜 / 美漫脚本

## 30 engines

### Comic Script Core (9)
- PanelLayoutEngine / SpeechBubblePlacer / ComicDialogueWriter / ComicSceneDivider / ComicActionLineWriter / ComicSoundEffectGenerator / ComicPanel / ComicPageBuilder / ComicScriptFormatter

### Comic Script Advanced (9)
- ComicInkStyleAdvisor / ComicPanelDescriber / ComicTransitionAdviser / ComicColorPalette / ComicCoverDesigner / ComicPageCounter / ComicReadingDirection / ComicArtStyle / ComicVolumeBinder

### Comic Script Integration (9)
- ComicPipeline / ComicDirector / ComicReport / ComicLibrary / ComicValidator / ComicTools / ComicQualityGate / ComicExport / ComicADirector2

### 收口
- ComicScriptCoreIndex / ComicScriptAdvancedIndex / ComicMasterIndex

## 测试

```bash
npx vitest run src/ai/comic/
```