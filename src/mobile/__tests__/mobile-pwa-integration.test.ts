/**
 * mobile/__tests__/mobile-pwa-integration.test.ts (P27)
 */

import { describe, it, expect } from 'vitest'
import {
  BreakpointSystem, ResponsiveContainer, MediaQuery, FlexibleGrid,
  TouchGestureDetector, SwipeNavigation, BottomSheet, SafeArea,
  MobileFirstLayout, AdaptiveNavigation, TabBar, StackNavigator,
  PWAConfig, ServiceWorkerManager, ManifestGenerator, InstallPrompt, UpdatePrompt,
  OfflineDetection, StorageQuota, BackgroundSync, PushNotificationManager, ShareAPI,
} from '../index'

describe('Mobile & PWA — end-to-end', () => {
  it('responsive flow: detect → adapt → layout', () => {
    const bs = new BreakpointSystem()
    bs.detect(800)
    const mfl = new MobileFirstLayout()
    mfl.setViewport(800, 600)
    expect(bs.current()).toBe('md')
    expect(mfl.deviceClass()).toBe('tablet')
  })

  it('touch flow: detect → swipe → pull', () => {
    const tgd = new TouchGestureDetector()
    const t = Date.now()
    expect(tgd.analyze([
      { x: 100, y: 100, timestamp: t },
      { x: 50, y: 100, timestamp: t + 100 },
    ])).toBe('swipe-left')

    const sn = new SwipeNavigation()
    sn.setRoutes([{ routeId: 'a', title: 'A', component: 'A' }, { routeId: 'b', title: 'B', component: 'B' }])
    expect(sn.next()?.routeId).toBe('b')

    const bs2 = new BottomSheet()
    bs2.open()
    expect(bs2.isOpen()).toBe(true)
  })

  it('PWA flow: configure → manifest → register → install', () => {
    const pwa = new PWAConfig({ icons: [{ src: '/i.png', sizes: '192x192', type: 'image/png' }] })
    expect(pwa.validate().valid).toBe(true)
    const json = ManifestGenerator.generate(pwa.get())
    expect(ManifestGenerator.validate(json).valid).toBe(true)
    const sw = new ServiceWorkerManager()
    sw.register()
    expect(sw.isRegistered()).toBe(true)
    const ip = new InstallPrompt()
    ip.capture({ prompt: async () => ({ outcome: 'accepted' }) })
    expect(ip.canInstall()).toBe(true)
  })

  it('offline + storage + sync', () => {
    const od = new OfflineDetection()
    od.setOnline(false)
    expect(od.isOffline()).toBe(true)

    const quota = new StorageQuota()
    quota.update(50_000_000, 100_000_000)
    expect(quota.estimate()?.percent).toBe(0.5)

    const bg = new BackgroundSync()
    const task = bg.enqueue('/api/x', 'GET')
    expect(bg.count()).toBe(1)
    bg.markComplete(task.taskId)
    expect(bg.count()).toBe(0)
  })

  it('push notification + share', () => {
    const p = new PushNotificationManager()
    p.subscribe({ endpoint: 'https://push', keys: { p256dh: 'a', auth: 'b' } })
    p.receive({ title: 'A', body: 'B' })
    expect(p.unread().length).toBe(1)
    p.markRead(p.unread()[0]!.id)
    expect(p.unread().length).toBe(0)

    const s = new ShareAPI()
    expect(s.canShare({ title: 'X' })).toBe(true)
  })

  it('adaptive navigation: bottom → hamburger → side', () => {
    const an = new AdaptiveNavigation()
    expect(an.adapt(400)).toBe('bottom')
    expect(an.adapt(800)).toBe('hamburger')
    expect(an.adapt(1200)).toBe('side')
  })

  it('stack navigator: push + pop + reset', () => {
    const sn = new StackNavigator()
    sn.push({ screenId: 'a', component: 'A' })
    sn.push({ screenId: 'b', component: 'B' })
    expect(sn.size()).toBe(2)
    sn.pop()
    expect(sn.size()).toBe(1)
    sn.reset()
    expect(sn.size()).toBe(0)
  })

  it('safe area platform defaults', () => {
    const sa = new SafeArea()
    sa.setPlatformDefaults('ios')
    expect(sa.top()).toBeGreaterThan(0)
    expect(sa.bottom()).toBeGreaterThan(0)
  })
})