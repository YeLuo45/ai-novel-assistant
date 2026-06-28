/**
 * mobile/MobileAdvanced.test.ts (P11-P25) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  MobileFirstLayout, AdaptiveNavigation, HamburgerMenu, TabBar, StackNavigator,
  PWAConfig, ServiceWorkerManager, ManifestGenerator, InstallPrompt, UpdatePrompt,
  OfflineDetection, StorageQuota, BackgroundSync, PushNotificationManager, ShareAPI,
} from './MobileAdvanced'

describe('P11: MobileFirstLayout', () => {
  it('deviceClass mobile/tablet/desktop', () => {
    const l = new MobileFirstLayout()
    l.setViewport(400, 800)
    expect(l.deviceClass()).toBe('mobile')
    l.setViewport(800, 600)
    expect(l.deviceClass()).toBe('tablet')
    l.setViewport(1200, 800)
    expect(l.deviceClass()).toBe('desktop')
  })

  it('columns adapts', () => {
    const l = new MobileFirstLayout()
    l.setViewport(400, 800)
    expect(l.columns()).toBe(1)
    l.setViewport(1200, 800)
    expect(l.columns()).toBe(3)
  })

  it('isSingleColumn', () => {
    const l = new MobileFirstLayout()
    l.setViewport(500, 800)
    expect(l.isSingleColumn()).toBe(true)
  })
})

describe('P12: AdaptiveNavigation', () => {
  it('adapt width → mode', () => {
    const n = new AdaptiveNavigation()
    expect(n.adapt(400)).toBe('bottom')
    expect(n.adapt(800)).toBe('hamburger')
    expect(n.adapt(1200)).toBe('side')
  })

  it('subscribe on change', () => {
    const n = new AdaptiveNavigation()
    let called = 0
    n.subscribe(() => { called += 1 })
    n.adapt(400)
    n.adapt(400)  // no change
    n.adapt(1200)
    expect(called).toBe(2)
  })
})

describe('P13: HamburgerMenu', () => {
  it('toggle + isOpen', () => {
    const m = new HamburgerMenu()
    expect(m.toggle()).toBe(true)
    expect(m.isOpen()).toBe(true)
    m.close()
    expect(m.isOpen()).toBe(false)
  })
})

describe('P14: TabBar', () => {
  it('setActive + active', () => {
    const t = new TabBar()
    t.setTabs([{ tabId: 'a', label: 'A', icon: 'a' }, { tabId: 'b', label: 'B', icon: 'b' }])
    t.setActive(1)
    expect(t.active()?.tabId).toBe('b')
  })

  it('setBadge', () => {
    const t = new TabBar()
    t.setTabs([{ tabId: 'a', label: 'A', icon: 'a' }])
    expect(t.setBadge('a', 5)).toBe(true)
    expect(t.tabs()[0]?.badge).toBe(5)
  })
})

describe('P15: StackNavigator', () => {
  it('push + pop + top + reset', () => {
    const s = new StackNavigator()
    s.push({ screenId: 'a', component: 'A' })
    s.push({ screenId: 'b', component: 'B' })
    expect(s.size()).toBe(2)
    expect(s.top()?.screenId).toBe('b')
    expect(s.pop()?.screenId).toBe('b')
    expect(s.size()).toBe(1)
    s.reset()
    expect(s.size()).toBe(0)
  })
})

describe('P16: PWAConfig', () => {
  it('default', () => {
    const c = new PWAConfig()
    expect(c.get().name).toBe('My App')
  })

  it('validate', () => {
    const c = new PWAConfig({ icons: [{ src: '/icon.png', sizes: '192x192', type: 'image/png' }] })
    expect(c.validate().valid).toBe(true)
  })

  it('validate no icons', () => {
    const c = new PWAConfig()
    expect(c.validate().valid).toBe(false)
  })
})

describe('P17: ServiceWorker', () => {
  it('register + isRegistered', () => {
    const sw = new ServiceWorkerManager()
    expect(sw.register()).toBe(true)
    expect(sw.isRegistered()).toBe(true)
  })

  it('cache + get', () => {
    const sw = new ServiceWorkerManager()
    sw.cacheResponse('/a', 'response-a')
    expect(sw.getCached('/a')).toBe('response-a')
  })
})

describe('P18: ManifestGenerator', () => {
  it('generate + validate', () => {
    const json = ManifestGenerator.generate({
      name: 'X', shortName: 'X', startUrl: '/', display: 'standalone',
      themeColor: '#000', backgroundColor: '#fff', scope: '/',
      icons: [{ src: '/i.png', sizes: '192x192', type: 'image/png' }],
    })
    expect(ManifestGenerator.validate(json).valid).toBe(true)
  })

  it('validate invalid', () => {
    expect(ManifestGenerator.validate('not json').valid).toBe(false)
  })
})

describe('P19: InstallPrompt', () => {
  it('canInstall + show', async () => {
    const ip = new InstallPrompt()
    expect(ip.canInstall()).toBe(false)
    ip.capture({ prompt: async () => ({ outcome: 'accepted' }) })
    expect(ip.canInstall()).toBe(true)
    const r = await ip.show()
    expect(r).toBe('accepted')
  })
})

describe('P20: UpdatePrompt', () => {
  it('setAvailable + apply + dismiss', () => {
    const u = new UpdatePrompt()
    u.setAvailable(true)
    expect(u.isAvailable()).toBe(true)
    expect(u.apply()).toBe(true)
    expect(u.isAvailable()).toBe(false)
    u.setAvailable(true)
    u.dismiss()
    expect(u.isAvailable()).toBe(false)
  })
})

describe('P21: OfflineDetection', () => {
  it('online/offline tracking', () => {
    const d = new OfflineDetection()
    expect(d.isOnline()).toBe(true)
    d.setOnline(false)
    expect(d.isOffline()).toBe(true)
    expect(d.lastOfflineAt()).toBeGreaterThan(0)
  })
})

describe('P22: StorageQuota', () => {
  it('update + warning + critical', () => {
    const q = new StorageQuota(0.8)
    q.update(50, 100)  // 50%
    expect(q.isWarning()).toBe(false)
    q.update(85, 100)  // 85%
    expect(q.isWarning()).toBe(true)
    q.update(96, 100)  // 96%
    expect(q.isCritical()).toBe(true)
  })
})

describe('P23: BackgroundSync', () => {
  it('enqueue + pending + markComplete', () => {
    const bs = new BackgroundSync()
    const task = bs.enqueue('/api/x', 'POST', { x: 1 })
    expect(bs.pending().length).toBe(1)
    expect(bs.markComplete(task.taskId)).toBe(true)
    expect(bs.count()).toBe(0)
  })

  it('markFailed retries', () => {
    const bs = new BackgroundSync(2)
    const task = bs.enqueue('/api/x', 'GET')
    bs.markFailed(task.taskId)
    expect(bs.pending()[0]?.retries).toBe(1)
    bs.markFailed(task.taskId)
    expect(bs.count()).toBe(0)  // exceeded maxRetries
  })
})

describe('P24: PushNotification', () => {
  it('subscribe + receive + unread', () => {
    const p = new PushNotificationManager()
    p.subscribe({ endpoint: 'https://push.example.com', keys: { p256dh: 'a', auth: 'b' } })
    p.receive({ title: 'Hi', body: 'World' })
    expect(p.unread().length).toBe(1)
  })
})

describe('P25: ShareAPI', () => {
  it('canShare + share', async () => {
    const s = new ShareAPI()
    expect(s.canShare({ title: 'X' })).toBe(true)
    expect(s.canShare({})).toBe(false)
    const r = await s.share({ title: 'X', url: 'https://x.com' })
    expect(r.shared).toBe(true)
  })

  it('share empty fails', async () => {
    const r = await new ShareAPI().share({})
    expect(r.shared).toBe(false)
  })
})