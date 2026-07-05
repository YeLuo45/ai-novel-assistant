// Round 8 Direction CD — Mobile PWA Installer 2.0 Batch 1/3 test
// V4676-V4685: 10 engines

import { describe, it, expect } from 'vitest';
import {
  InstallPromptManager, BeforeInstallPromptCapture, InstallCriteriaEvaluator,
  ManifestValidator, ServiceWorkerRegistrar, UpdatePromptManager,
  AppInstalledDetector, InstallBannerConfig, InstallCooldownTimer, InstallFunnelTracker,
  PWACoreIndex, PWA_BATCH_1_ENGINES,
} from './PWACore';

describe('V4676 InstallPromptManager', () => {
  it('capturePrompt stores event', () => {
    const m = new InstallPromptManager();
    m.capturePrompt({ preventDefault: () => {} });
    expect(m.hasPrompt()).toBe(true);
  });

  it('prompt returns event when no prompt captured', async () => {
    const m = new InstallPromptManager();
    const ev = await m.prompt();
    expect(ev.userChoice).toBe('dismissed');
  });

  it('markInstalled and isInstalled', () => {
    const m = new InstallPromptManager();
    expect(m.isInstalled()).toBe(false);
    m.markInstalled();
    expect(m.isInstalled()).toBe(true);
  });

  it('acceptedCount and dismissedCount', async () => {
    const m = new InstallPromptManager();
    await m.prompt(); // dismissed
    await m.prompt(); // dismissed
    expect(m.acceptedCount()).toBe(0);
    expect(m.dismissedCount()).toBe(2);
  });

  it('reset clears all', () => {
    const m = new InstallPromptManager();
    m.markInstalled();
    m.reset();
    expect(m.isInstalled()).toBe(false);
  });
});

describe('V4677 BeforeInstallPromptCapture', () => {
  it('capture marks captured', () => {
    const c = new BeforeInstallPromptCapture();
    expect(c.isCaptured()).toBe(false);
    c.capture({ preventDefault: () => {} });
    expect(c.isCaptured()).toBe(true);
  });

  it('platform is set', () => {
    const c = new BeforeInstallPromptCapture();
    c.capture({}, 'android');
    expect(c.platform()).toBe('android');
  });

  it('age returns elapsed since capture', () => {
    const c = new BeforeInstallPromptCapture();
    c.capture({});
    expect(c.age()).toBeGreaterThanOrEqual(0);
  });

  it('clear resets', () => {
    const c = new BeforeInstallPromptCapture();
    c.capture({});
    c.clear();
    expect(c.isCaptured()).toBe(false);
  });
});

describe('V4678 InstallCriteriaEvaluator', () => {
  it('eligible with all criteria met', () => {
    const e = new InstallCriteriaEvaluator();
    const r = e.evaluate({
      isStandalone: false, hasManifest: true, hasServiceWorker: true,
      isHttps: true, visitCount: 5, lastDismissedDaysAgo: 14,
    });
    expect(r.eligible).toBe(true);
    expect(r.score).toBe(100);
  });

  it('not eligible standalone', () => {
    const e = new InstallCriteriaEvaluator();
    const r = e.evaluate({
      isStandalone: true, hasManifest: true, hasServiceWorker: true,
      isHttps: true, visitCount: 5, lastDismissedDaysAgo: 14,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.some(x => x.includes('standalone'))).toBe(true);
  });

  it('partial score below threshold', () => {
    const e = new InstallCriteriaEvaluator();
    const r = e.evaluate({
      isStandalone: false, hasManifest: false, hasServiceWorker: false,
      isHttps: false, visitCount: 0, lastDismissedDaysAgo: 0,
    });
    expect(r.eligible).toBe(false);
    expect(r.reasons.length).toBeGreaterThan(0);
  });
});

describe('V4679 ManifestValidator', () => {
  it('valid manifest', () => {
    const v = new ManifestValidator();
    const r = v.validate({
      name: 'Test App',
      short_name: 'Test',
      start_url: '/',
      display: 'standalone',
      icons: [{ src: '/icon.png', sizes: '192x192' }, { src: '/icon-512.png', sizes: '512x512' }],
      theme_color: '#000000',
    });
    expect(r.valid).toBe(true);
  });

  it('missing name and short_name', () => {
    const v = new ManifestValidator();
    const r = v.validate({ start_url: '/', display: 'standalone' });
    expect(r.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('invalid display mode', () => {
    const v = new ManifestValidator();
    const r = v.validate({
      name: 'A', start_url: '/', display: 'weird-mode',
      icons: [{ src: '/i.png', sizes: '192x192' }],
    });
    expect(r.errors.some(e => e.includes('display'))).toBe(true);
  });

  it('warning for missing icons', () => {
    const v = new ManifestValidator();
    const r = v.validate({ name: 'A', start_url: '/', display: 'standalone' });
    expect(r.errors.some(e => e.includes('icons'))).toBe(true);
  });
});

describe('V4680 ServiceWorkerRegistrar', () => {
  it('register and get', () => {
    const r = new ServiceWorkerRegistrar();
    r.register('/', '/sw.js');
    expect(r.get('/')?.scriptURL).toBe('/sw.js');
  });

  it('updateState', () => {
    const r = new ServiceWorkerRegistrar();
    r.register('/', '/sw.js', 'installing');
    r.updateState('/', 'activated');
    expect(r.isActivated('/')).toBe(true);
  });

  it('unregister removes', () => {
    const r = new ServiceWorkerRegistrar();
    r.register('/', '/sw.js');
    expect(r.unregister('/')).toBe(true);
    expect(r.count()).toBe(0);
  });

  it('all returns array', () => {
    const r = new ServiceWorkerRegistrar();
    r.register('/', '/sw.js');
    r.register('/admin', '/sw-admin.js');
    expect(r.all().length).toBe(2);
  });
});

describe('V4681 UpdatePromptManager', () => {
  it('setWaitingWorker and hasUpdate', () => {
    const m = new UpdatePromptManager();
    expect(m.hasUpdate()).toBe(false);
    m.setWaitingWorker({ postMessage: () => {} });
    expect(m.hasUpdate()).toBe(true);
  });

  it('applyUpdate posts message and clears', async () => {
    const m = new UpdatePromptManager();
    let posted: any = null;
    m.setWaitingWorker({ postMessage: (msg: any) => { posted = msg; } });
    expect(await m.applyUpdate()).toBe(true);
    expect(posted.type).toBe('SKIP_WAITING');
    expect(m.hasUpdate()).toBe(false);
  });

  it('applyUpdate returns false when no worker', async () => {
    const m = new UpdatePromptManager();
    expect(await m.applyUpdate()).toBe(false);
  });

  it('timeWaitingMs tracks elapsed', () => {
    const m = new UpdatePromptManager();
    m.setWaitingWorker({});
    expect(m.timeWaitingMs()).toBeGreaterThanOrEqual(0);
  });
});

describe('V4682 AppInstalledDetector', () => {
  it('detect via media-query', () => {
    const d = new AppInstalledDetector();
    expect(d.detect('media-query')).toBe(true);
    expect(d.isInstalled()).toBe(true);
    expect(d.method()).toBe('media-query');
  });

  it('reset clears', () => {
    const d = new AppInstalledDetector();
    d.detect('navigator');
    d.reset();
    expect(d.isInstalled()).toBe(false);
  });
});

describe('V4683 InstallBannerConfig', () => {
  it('addVariant and pickVariant', () => {
    const c = new InstallBannerConfig();
    c.addVariant({ id: 'a', headline: 'A', body: 'a', ctaText: 'Install', weight: 1 });
    const v = c.pickVariant(0.5);
    expect(v).toBeDefined();
  });

  it('pickVariant returns undefined when empty', () => {
    const c = new InstallBannerConfig();
    expect(c.pickVariant()).toBeUndefined();
  });

  it('markShown and hasBeenShown', () => {
    const c = new InstallBannerConfig();
    expect(c.hasBeenShown('a')).toBe(false);
    c.markShown('a');
    expect(c.hasBeenShown('a')).toBe(true);
  });

  it('variants and size', () => {
    const c = new InstallBannerConfig();
    c.addVariant({ id: 'a', headline: '', body: '', ctaText: '', weight: 1 });
    c.addVariant({ id: 'b', headline: '', body: '', ctaText: '', weight: 2 });
    expect(c.size()).toBe(2);
  });
});

describe('V4684 InstallCooldownTimer', () => {
  it('canPrompt initially', () => {
    const t = new InstallCooldownTimer();
    expect(t.canPrompt()).toBe(true);
  });

  it('cannot prompt during cooldown', () => {
    const t = new InstallCooldownTimer(1000);
    t.dismiss();
    expect(t.canPrompt()).toBe(false);
    expect(t.remainingMs()).toBeGreaterThan(0);
  });

  it('can prompt after cooldown', () => {
    return new Promise<void>(resolve => {
      const t = new InstallCooldownTimer(50);
      t.dismiss();
      setTimeout(() => {
        expect(t.canPrompt()).toBe(true);
        resolve();
      }, 100);
    });
  });

  it('reset clears', () => {
    const t = new InstallCooldownTimer();
    t.dismiss();
    t.reset();
    expect(t.canPrompt()).toBe(true);
  });
});

describe('V4685 InstallFunnelTracker', () => {
  it('track and count', () => {
    const f = new InstallFunnelTracker();
    f.track('seen');
    f.track('seen');
    f.track('clicked');
    expect(f.count('seen')).toBe(2);
    expect(f.count('clicked')).toBe(1);
  });

  it('conversionRate = installed/seen', () => {
    const f = new InstallFunnelTracker();
    f.track('seen'); f.track('seen'); f.track('seen');
    f.track('installed');
    expect(f.conversionRate()).toBeCloseTo(1 / 3);
  });

  it('ctr and acceptanceRate', () => {
    const f = new InstallFunnelTracker();
    f.track('seen'); f.track('seen');
    f.track('clicked'); f.track('clicked');
    f.track('accepted');
    expect(f.ctr()).toBe(1);
    expect(f.acceptanceRate()).toBe(0.5);
  });

  it('reset clears', () => {
    const f = new InstallFunnelTracker();
    f.track('seen');
    f.reset();
    expect(f.count('seen')).toBe(0);
  });
});

describe('PWACoreIndex', () => {
  it('list includes 11 entries', () => {
    const idx = new PWACoreIndex();
    expect(idx.list().length).toBe(11);
    expect(idx.count()).toBe(11);
  });

  it('has() checks presence', () => {
    const idx = new PWACoreIndex();
    expect(idx.has('InstallPromptManager')).toBe(true);
    expect(idx.has('PWACoreIndex')).toBe(true);
  });

  it('PWA_BATCH_1_ENGINES has 10 entries', () => {
    expect(PWA_BATCH_1_ENGINES.length).toBe(10);
  });
});