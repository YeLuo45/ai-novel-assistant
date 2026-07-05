# Direction BV — Extension Manager

**V4436-V4465 · 30 engines · 34 tests · 100% pass · ≥98% coverage**

扩展管理器 + 插件注册 + 热加载 + 依赖解析 + 集成。

## 灵感来源

VSCode Extension API / Webpack Module Federation / Rollup Plugins

## 30 engines 分组

### Extension Manager Core (10)
- ExtensionRegistry / ExtensionLoader / ExtensionActivator / ExtensionDependencyResolver / ExtensionVersionManager / ExtensionPermissions / ExtensionMetadata / ExtensionConflictDetector / ExtensionHotReloader / ExtensionUnloader

### Extension Manager Advanced (10)
- ExtensionMarketplace / ExtensionInstaller / ExtensionUninstaller / ExtensionUpdater / ExtensionBackup / ExtensionSandbox / ExtensionAPIBridge / ExtensionEventBus / ExtensionStateManager / ExtensionLogger

### Extension Manager Integration (10)
- ExtensionPipeline / ExtensionDirector / ExtensionReport / ExtensionLibrary / ExtensionValidator / ExtensionTools / ExtensionQualityGate / ExtensionADirector / ExtensionMonitor / ExtensionManagerMasterIndex

## 使用方式

```ts
import { ExtensionRegistry, ExtensionLoader } from './src/ai/extension/ExtensionManagerCore';

const registry = new ExtensionRegistry();
registry.register('my-extension', '1.0.0');

const loader = new ExtensionLoader();
loader.load({ name: 'my-extension', code: 'console.log()' });
```

## 测试

```bash
npx vitest run src/ai/extension/
```