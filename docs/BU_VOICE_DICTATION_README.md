# Direction BU — Voice Dictation Engine

**V4406-V4435 · 30 engines · 35 tests · 100% pass · ≥98% coverage**

语音听写引擎 + Web Speech API + Whisper + 实时转录 + 集成。

## 灵感来源

Web Speech API / OpenAI Whisper / iFlytek 听写

## 30 engines 分组

### Voice Dictation Core (10)
- WebSpeechRecognizer / WhisperTranscriber / AudioRecorder / AudioEncoder / RealtimeTranscriber / BatchTranscriber / LanguageDetector / PunctuationRestorer / SpeakerDiarization / VoiceActivityDetector

### Voice Dictation Advanced (10)
- WhisperPromptOptimizer / DictationCorrector / DictationPunctuation / DictationParagraph / DictationFormatter / DictationSpeedAdjuster / DictationNoiseFilter / DictationConfidence / DictationHistory / DictationExport

### Voice Dictation Integration (10)
- DictationPipeline / DictationDirector / DictationReport / DictationLibrary / DictationValidator / DictationTools / DictationQualityGate / DictationADirector / DictationCache / VoiceDictationMasterIndex

## 使用方式

```ts
import { RealtimeTranscriber, DictationCorrector, DictationExport } from './src/ai/voice/VoiceDictationCore';

const transcriber = new RealtimeTranscriber();
const text = transcriber.transcribe(['hello', 'world']);

const corrector = new DictationCorrector();
const corrected = corrector.correct(text, ['word1']);

const exporter = new DictationExport();
exporter.export(corrected, 'md');
```

## 测试

```bash
npx vitest run src/ai/voice/
```