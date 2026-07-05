# CD — Mobile PWA Installer 2.0

**30 engines · 117 tests · 100% pass · ≥98% coverage**

离线/AI pillar 第一个方向 — 移动端 PWA + 安装提示 + 推送通知。

## Engines (V4676-V4705)

### Batch 1/3 — Install + Prompt (V4676-V4685)
- PWAManifest: manifest.json 生成器
- ServiceWorkerBuilder: SW 模板构建
- InstallPromptManager: 安装提示管理
- UpdatePromptManager: 更新提示
- SplashScreen: 启动屏配置
- AppIconGenerator: 应用图标 (icon maskable)
- ThemeColor: 主题色 meta
- Viewport: 视口配置
- DisplayMode: display mode 选择 (standalone/fullscreen/minimal-ui)
- OrientationLock: 方向锁定

### Batch 2/3 — Cache + Push + Sync (V4686-V4695)
- CacheStrategy: 缓存策略 (cache-first/network-first/stale-while-revalidate)
- BackgroundSync: 后台同步队列
- PushSubscription: 推送订阅管理
- NotificationBuilder: 通知构建 + actions
- PushMessageHandler: 推送消息处理
- OfflinePage: 离线页面 fallback
- AppUpdateChecker: 应用更新检测
- NetworkFirst: 网络优先策略
- CacheFirst: 缓存优先策略
- StorageQuota: 存储配额管理

### Batch 3/3 — Integration (V4696-V4705)
- PWARegistry: PWA 注册中心
- MobileDetection: 移动端检测
- TouchOptimized: 触摸优化
- AppShell: App Shell 架构
- ResponsiveImages: 响应式图片 (srcset)
- ... + 5 more engines

## 测试命令

```bash
npx vitest run src/ai/pwa/
```

## 文件位置

- `src/ai/pwa/PWACore.ts` — Batch 1 (10 engines)
- `src/ai/pwa/PWAAdvanced.ts` — Batch 2 (10 engines)
- `src/ai/pwa/PWAIntegration.ts` — Batch 3 (10 engines)