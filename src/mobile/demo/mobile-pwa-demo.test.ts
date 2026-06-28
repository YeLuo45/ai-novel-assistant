/**
 * mobile/demo/mobile-pwa-demo.test.ts (P26)
 */

import { describe, it, expect } from 'vitest'
import { runMobilePWADemo } from './mobile-pwa-demo'

describe('mobile-pwa-demo', () => {
  it('breakpoint md', () => expect(runMobilePWADemo().breakpoint).toBe('md'))
  it('isMobile false at 800', () => expect(runMobilePWADemo().isMobile).toBe(false))
  it('deviceClass tablet', () => expect(runMobilePWADemo().deviceClass).toBe('tablet'))
  it('navMode hamburger at 800', () => expect(runMobilePWADemo().navMode).toBe('hamburger'))
  it('hamburger open', () => expect(runMobilePWADemo().hamburgerOpen).toBe(true))
  it('activeTab 1 (editor)', () => expect(runMobilePWADemo().activeTab).toBe(1))
  it('stackSize 2', () => expect(runMobilePWADemo().stackSize).toBe(2))
  it('pwa valid', () => expect(runMobilePWADemo().pwaValid).toBe(true))
  it('sw registered', () => expect(runMobilePWADemo().swRegistered).toBe(true))
  it('install ready', () => expect(runMobilePWADemo().installReady).toBe(true))
  it('online true', () => expect(runMobilePWADemo().online).toBe(true))
  it('quota 50%', () => expect(runMobilePWADemo().quotaPercent).toBe(0.5))
  it('1 pending task', () => expect(runMobilePWADemo().pendingTasks).toBe(1))
  it('1 push', () => expect(runMobilePWADemo().pushCount).toBe(1))
  it('share supported', () => expect(runMobilePWADemo().shareSupported).toBe(true))
})