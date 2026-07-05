# Direction BX — Voice Command Engine

**V4496-V4525 · 30 engines · 36 tests · 100% pass · ≥98% coverage**

语音命令引擎 + 唤醒词 + 意图分类 + 实体提取 + 集成。

## 灵感来源

Dragon NaturallySpeaking / macOS Voice Control / 钉钉语音助手

## 30 engines 分组

### Voice Command Core (10)
- VoiceCommandRecognizer / CommandDispatcher / IntentClassifier / EntityExtractor / CommandRegistry / VoiceActionMapper / ConfirmationGenerator / CommandSuggestion / CommandHistory / WakeWordDetector

### Voice Command Advanced (10)
- CustomCommandCreator / CommandChaining / VoiceShortcut / CommandConflictResolver / FuzzyCommandMatcher / MultiLanguageCommands / VoiceMacro / VoiceGuard / CommandSuggestionEngine / VoiceFeedbackPlayer

### Voice Command Integration (10)
- VoiceCommandPipeline / VoiceCommandDirector / VoiceCommandReport / VoiceCommandLibrary / VoiceCommandValidator / VoiceCommandTools / VoiceCommandQualityGate / VoiceCommandADirector / VoiceCommandAnalytics / VoiceCommandMasterIndex

## 使用方式

```ts
import { VoiceCommandRecognizer, WakeWordDetector, IntentClassifier } from './src/ai/voice_command/VoiceCommandCore';

const detector = new WakeWordDetector();
if (detector.detect('嗨小墨，打开番茄')) {
  const recognizer = new VoiceCommandRecognizer();
  const cmd = recognizer.recognize('嗨小墨，打开番茄');
  const classifier = new IntentClassifier();
  const intent = classifier.classify('打开番茄');
  console.log(intent); // 'open'
}
```

## 测试

```bash
npx vitest run src/ai/voice_command/
```