/**
 * mobile/demo/mobile-pwa-demo.ts (P26)
 */

import {
  BreakpointSystem, ResponsiveContainer, MediaQuery, ContainerQuery, FlexibleGrid,
  TouchGestureDetector, SwipeNavigation, PullToRefresh, BottomSheet, SafeArea,
  MobileFirstLayout, AdaptiveNavigation, HamburgerMenu, TabBar, StackNavigator,
  PWAConfig, ServiceWorkerManager, ManifestGenerator, InstallPrompt, UpdatePrompt,
  OfflineDetection, StorageQuota, BackgroundSync, PushNotificationManager, ShareAPI,
} from '../index'

export interface DemoResult {
  breakpoint: string
  isMobile: boolean
  deviceClass: string
  navMode: string
  hamburgerOpen: boolean
  activeTab: number
  stackSize: number
  pwaValid: boolean
  swRegistered: boolean
  installReady: boolean
  online: boolean
  quotaPercent: number
  pendingTasks: number
  pushCount: number
  shareSupported: boolean
}

export function runMobilePWADemo(): DemoResult {
  // 1. Viewport + breakpoints
  const bs = new BreakpointSystem()
  bs.detect(800)
  const rc = new ResponsiveContainer()
  rc.update(800, 600)
  const mq = new MediaQuery()
  mq.set('prefers-dark', true)
  const cq = new ContainerQuery()
  cq.setSize(800, 600)
  cq.defineQuery('wide', (s) => s.width > 600)
  const grid = new FlexibleGrid(12, 16, 800)

  // 2. Touch
  const tgd = new TouchGestureDetector()
  tgd.analyze([{ x: 100, y: 100, timestamp: Date.now() }])
  const sn = new SwipeNavigation()
  sn.setRoutes([
    { routeId: 'home', title: 'Home', component: 'Home' },
    { routeId: 'editor', title: 'Editor', component: 'Editor' },
  ])
  sn.next()
  const ptr = new PullToRefresh(80, () => {})
  ptr.startPull()
  ptr.updatePull(100)
  const bs2 = new BottomSheet()
  bs2.open()
  const sa = new SafeArea()
  sa.setPlatformDefaults('ios')

  // 3. Layout
  const mfl = new MobileFirstLayout()
  mfl.setViewport(800, 600)
  const an = new AdaptiveNavigation()
  an.adapt(800)
  const hm = new HamburgerMenu()
  hm.open()
  const tab = new TabBar()
  tab.setTabs([
    { tabId: 'home', label: 'Home', icon: 'h' },
    { tabId: 'editor', label: 'Editor', icon: 'e' },
  ])
  tab.setActive(1)
  const stack = new StackNavigator()
  stack.push({ screenId: 'home', component: 'Home' })
  stack.push({ screenId: 'editor', component: 'Editor' })

  // 4. PWA
  const pwa = new PWAConfig({
    name: 'AI Novel',
    shortName: 'AIN',
    icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }],
  })
  const sw = new ServiceWorkerManager()
  sw.register()
  sw.cacheResponse('/', '<html>app</html>')
  const manifest = ManifestGenerator.generate(pwa.get())
  const manifestValid = ManifestGenerator.validate(manifest).valid
  const ip = new InstallPrompt()
  ip.capture({ prompt: async () => ({ outcome: 'accepted' }) })
  const up = new UpdatePrompt()
  up.setAvailable(false)

  // 5. Offline + Storage + Sync + Push + Share
  const od = new OfflineDetection()
  od.setOnline(true)
  const quota = new StorageQuota(0.8)
  quota.update(50_000_000, 100_000_000)
  const bg = new BackgroundSync(3)
  bg.enqueue('/api/sync', 'POST', { data: 'x' })
  const push = new PushNotificationManager()
  push.subscribe({ endpoint: 'https://push.example.com', keys: { p256dh: 'a', auth: 'b' } })
  push.receive({ title: 'Test', body: 'Hi' })
  const share = new ShareAPI()
  share.canShare({ title: 'X' })

  return {
    breakpoint: bs.current(),
    isMobile: rc.isMobile(),
    deviceClass: mfl.deviceClass(),
    navMode: an.currentMode(),
    hamburgerOpen: hm.isOpen(),
    activeTab: tab.activeIndex(),
    stackSize: stack.size(),
    pwaValid: pwa.validate().valid && manifestValid,
    swRegistered: sw.isRegistered(),
    installReady: ip.canInstall(),
    online: od.isOnline(),
    quotaPercent: quota.estimate()?.percent ?? 0,
    pendingTasks: bg.count(),
    pushCount: push.all().length,
    shareSupported: share.isSupported(),
  }
}