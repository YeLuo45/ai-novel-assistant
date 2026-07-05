# Direction BT — Tomato Novel Publisher

**V4376-V4405 · 30 engines · 36 tests · 100% pass · ≥98% coverage**

字节跳动番茄小说平台发布器 + 账号认证 + 章节上传 + 敏感词过滤 + 集成。

## 灵感来源

字节跳动番茄小说开放 API / 起点 PC 客户端协议 / 番茄头部作品分析

## 30 engines 分组

### Tomato Novel Core (10)
- TomatoAccountAuth / TomatoSessionManager / ChapterUploader / TomatoMetadataBuilder / TomatoGenreClassifier / TomatoWordCounter / TomatoScheduleSync / TomatoDraftManager / TomatoValidationAPI / TomatoAPIClient

### Tomato Novel Advanced (10)
- TomatoSensitiveWordFilter / TomatoCoverUploader / TomatoTagRecommender / TomatoChapterTitleOptimizer / TomatoReaderCommentSync / TomatoRankingMonitor / TomatoContractSigner / TomatoRoyaltyTracker / TomatoDataExporter / TomatoBackupManager

### Tomato Novel Integration (10)
- TomatoPublishPipeline / TomatoPublishDirector / TomatoPublishReport / TomatoPublishLibrary / TomatoPublishValidator / TomatoTools / TomatoQualityGate / TomatoPublishADirector / TomatoAntiBot / TomatoNovelMasterIndex

## 使用方式

```ts
import { TomatoAccountAuth, ChapterUploader, TomatoMetadataBuilder } from './src/ai/tomato/TomatoNovelCore';

const auth = new TomatoAccountAuth();
auth.login('13800138000', '1234');

const uploader = new ChapterUploader();
const id = uploader.upload('Chapter 1 content...');

const meta = new TomatoMetadataBuilder();
const m = meta.build({ title: '我的小说', genre: 'romance', synopsis: '...' });
```

## 测试

```bash
npx vitest run src/ai/tomato/
```