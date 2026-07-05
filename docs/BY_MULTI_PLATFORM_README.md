# Direction BY — Multi-Platform Publisher

**V4526-V4555 · 30 engines · 39 tests · 100% pass · ≥98% coverage**

多平台发布器 + 统一适配 + 并发上传 + 收益聚合 + 集成。

## 灵感来源

EpubPub / Vellum / Reedsy / 起点 / 番茄 / 微信读书

## 30 engines 分组

### Multi-Platform Core (10)
- PlatformAccountManager / PlatformSelector / UnifiedContentAdapter / PlatformValidator / ConcurrentUploader / PlatformSyncStatus / PlatformMetadataConverter / PlatformCoverAdapter / PlatformRetryManager / PlatformBatchScheduler

### Multi-Platform Advanced (10)
- PlatformDiffEngine / PlatformUnifiedDashboard / PlatformAlertSystem / PlatformConflictResolver / PlatformRevenueAggregator / PlatformAnalyticsAggregator / PlatformWebhookReceiver / PlatformRateLimiter / PlatformCache / PlatformABTesting

### Multi-Platform Integration (10)
- MultiPlatformPipeline / MultiPlatformDirector / MultiPlatformReport / MultiPlatformLibrary / MultiPlatformValidator / MultiPlatformTools / MultiPlatformQualityGate / MultiPlatformADirector / MultiPlatformScheduler / MultiPlatformMasterIndex

## 使用方式

```ts
import { PlatformAccountManager, PlatformSelector, UnifiedContentAdapter } from './src/ai/multi_platform/MultiPlatformCore';

const accounts = new PlatformAccountManager();
accounts.add('tomato', 'token123');
accounts.add('qidian', 'token456');

const selector = new PlatformSelector();
const platform = selector.select({ genre: 'romance' });

const adapter = new UnifiedContentAdapter();
const unified = adapter.adapt({ title: 'A', content: 'B', chapters: [] }, platform);
```

## 测试

```bash
npx vitest run src/ai/multi_platform/
```