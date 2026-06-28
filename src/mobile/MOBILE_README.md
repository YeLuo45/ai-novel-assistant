# Mobile & PWA (V3) — Direction P

**Version**: 1.0.0
**Engines**: V2776-V2805 (30 engines, 6 batches)
**Tests**: 76 tests, 100% pass

## 目标

移动端体验 + PWA：响应式布局、手势导航、底部抽屉、Service Worker、Manifest、离线存储、Push、Share。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| P1-P10 | `Responsive.ts` | BreakpointSystem (6 断点) + ResponsiveContainer + MediaQuery + ContainerQuery + FlexibleGrid (12 列) + TouchGestureDetector (8 手势) + SwipeNavigation + PullToRefresh + BottomSheet (4 状态) + SafeArea (iOS/Android/web) |
| P11-P25 | `MobileAdvanced.ts` | MobileFirstLayout + AdaptiveNavigation (5 模式) + HamburgerMenu + TabBar + StackNavigator + PWAConfig + ServiceWorkerManager + ManifestGenerator + InstallPrompt + UpdatePrompt + OfflineDetection + StorageQuota + BackgroundSync + PushNotificationManager + ShareAPI |
| P26 | `index.ts` + `demo/mobile-pwa-demo.ts` | 15 端到端断言 |
| P27 | `__tests__/mobile-pwa-integration.test.ts` | 8 集成测试 |
| P28 | `MOBILE_README.md` | 本文档 |
| P29 | 主 README 更新 | 验证命令 |
| P30 | 收口 commit + push | |

## 核心 API 示例

### 1. Responsive

```ts
import { BreakpointSystem, ResponsiveContainer, FlexibleGrid } from '@/mobile'

const bs = new BreakpointSystem()
bs.detect(800)  // 'md'

const rc = new ResponsiveContainer()
rc.update(800, 600)
rc.isMobile()  // false (width >= 640)

const grid = new FlexibleGrid(12, 16, 1200)
grid.columnWidth()  // 92
grid.spanWidth(6)   // 632
```

### 2. Touch Gestures

```ts
import { TouchGestureDetector, SwipeNavigation, PullToRefresh } from '@/mobile'

const tgd = new TouchGestureDetector()
tgd.analyze([{ x: 100, y: 100, timestamp: t }, { x: 50, y: 100, timestamp: t + 100 }])
// → 'swipe-left'

const sn = new SwipeNavigation()
sn.setRoutes([...])
sn.next()  // → next route
```

### 3. Mobile Layout

```ts
import { MobileFirstLayout, AdaptiveNavigation, TabBar, StackNavigator } from '@/mobile'

const mfl = new MobileFirstLayout()
mfl.setViewport(800, 600)
mfl.columns()  // 2 (tablet)
mfl.baseFontSize()  // 15

const an = new AdaptiveNavigation()
an.adapt(400)  // 'bottom' (mobile)
an.adapt(1200) // 'side' (desktop)

const stack = new StackNavigator()
stack.push({ screenId: 'home', component: 'Home' })
stack.push({ screenId: 'editor', component: 'Editor' })
```

### 4. PWA

```ts
import { PWAConfig, ServiceWorkerManager, ManifestGenerator, InstallPrompt } from '@/mobile'

const pwa = new PWAConfig({
  name: 'AI Novel',
  shortName: 'AIN',
  icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }],
})
const json = ManifestGenerator.generate(pwa.get())

const sw = new ServiceWorkerManager()
sw.register()
sw.cacheResponse('/', '<html>app</html>')

const ip = new InstallPrompt()
ip.capture({ prompt: async () => ({ outcome: 'accepted' }) })
await ip.show()  // 'accepted'
```

### 5. Native APIs

```ts
import { OfflineDetection, StorageQuota, BackgroundSync, PushNotificationManager, ShareAPI } from '@/mobile'

const od = new OfflineDetection()
od.setOnline(false)
od.isOffline()  // true

const quota = new StorageQuota(0.8)
quota.update(50_000_000, 100_000_000)
quota.isWarning()  // false (50% < 80%)

const bg = new BackgroundSync(3)
bg.enqueue('/api/sync', 'POST', { data: 'x' })

const push = new PushNotificationManager()
push.subscribe({ endpoint: '...', keys: {...} })
push.receive({ title: 'Test', body: 'Hi' })

const share = new ShareAPI()
await share.share({ title: 'X', url: 'https://x.com' })
```

## 验证命令

```bash
npx vitest run src/mobile/  # 76 passed
npx vitest run src/mobile/demo/mobile-pwa-demo.test.ts
npx vitest run src/mobile/__tests__/mobile-pwa-integration.test.ts
```

## 灵感

- Tailwind CSS breakpoints
- Material Design responsive layout
- iOS Human Interface Guidelines (Safe Area)
- Android Material You
- PWA Builder / Workbox
- Web App Manifest spec
- Push API spec
- Web Share API

## 累计

- Direction A-P: **490 engines / 5,573 tests** (A-G 1024 + H 50 + I 126 + J 75 + K 82 + L 51 + M 92 + N 95 + O 67 + P 76)
- 17 commits pushed
- 灵感: Tailwind + Material Design + iOS HIG + Workbox + PWA spec