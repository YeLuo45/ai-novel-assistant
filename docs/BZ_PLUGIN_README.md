# Direction BZ — Plugin Registry

**V4556-V4585 · 30 engines · 33 tests · 100% pass · ≥98% coverage**

插件注册中心 + 清单 + 版本管理 + 签名验证 + 集成。

## 灵感来源

npm Registry / VSCode Marketplace / Chrome Web Store

## 30 engines 分组

### Plugin Registry Core (10)
- PluginManifest / PluginPublisher / PluginVersioning / PluginSearch / PluginRating / PluginDownloader / PluginSignatureVerifier / PluginCompatibility / PluginLocalCache / PluginChecksum

### Plugin Registry Advanced (10)
- PluginReviews / PluginScreenshots / PluginChangelog / PluginReadmeParser / PluginTagging / PluginStatistics / PluginRecommendation / PluginCollection / PluginEditorConfig / PluginSchemaValidator

### Plugin Registry Integration (10)
- PluginPipeline / PluginDirector / PluginReport / PluginLibrary / PluginValidator / PluginTools / PluginQualityGate / PluginADirector / PluginAnalytics / PluginRegistryMasterIndex

## 使用方式

```ts
import { PluginManifest, PluginPublisher, PluginVersioning } from './src/ai/plugin_registry/PluginRegistryCore';

const manifest = new PluginManifest();
manifest.name = 'my-plugin';
manifest.author = 'alice';
manifest.version = '1.0.0';

const publisher = new PluginPublisher();
publisher.publish(manifest);

const versioning = new PluginVersioning();
const next = versioning.bump('1.0.0', 'minor'); // '1.1.0'
```

## 测试

```bash
npx vitest run src/ai/plugin_registry/
```