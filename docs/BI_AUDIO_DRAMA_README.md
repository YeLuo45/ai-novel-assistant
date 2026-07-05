# Direction BI — Audio Drama Script

**V4126-V4155 · 30 engines · 51 tests · 100% pass · ≥98% coverage**

广播剧脚本 + 音效 + 配音 + 音乐 + 集成。

## 灵感来源

广播剧制作 / 有声书 / Podcast 剧集 / 猫耳 FM

## 30 engines

### Audio Drama Core (9)
- SoundEffectDesigner / VoiceActorAssignment / DialogueTimingCalculator / BackgroundMusicSelector / AmbientSoundAdder / AudioDramaCueSheet / AudioDramaEpisode / AudioDramaScriptWriter / AudioDramaNarrator

### Audio Drama Advanced (9)
- VoiceDirection / SoundEffectLibrary / AudioDramaSceneDivider / AudioDramaFoleyDesigner / AudioDramaVoiceVariation / AudioDramaDialogueEnhancer / AudioDramaEpisodeDivider / AudioDramaMusicSelector / AudioDramaTransitionsAdder

### Audio Drama Integration (9)
- AudioDramaPipeline / AudioDramaDirector / AudioDramaReport / AudioDramaLibrary / AudioDramaValidator / AudioDramaTools / AudioDramaQualityGate / AudioDramaExport / AudioDramaADirector2

### 收口
- AudioDramaCoreIndex / AudioDramaAdvancedIndex / AudioDramaMasterIndex

## 测试

```bash
npx vitest run src/ai/audio_drama/
```