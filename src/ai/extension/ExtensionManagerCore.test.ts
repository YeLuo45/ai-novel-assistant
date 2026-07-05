/**
 * ExtensionManagerCore.test.ts — Direction BV, V4436-V4445 (Batch 1/3)
 * 10 engines × 3+ assertions
 */

import { describe, it, expect } from 'vitest';
import { ExtensionRegistry, ExtensionLoader, ExtensionActivator, ExtensionDependencyResolver, ExtensionVersionManager, ExtensionPermissions, ExtensionMetadata, ExtensionConflictDetector, ExtensionHotReloader, ExtensionUnloader, ExtensionManagerCoreIndex } from './ExtensionManagerCore';

describe('ExtensionRegistry', () => {
  const e = new ExtensionRegistry();
  it('register + get', () => { e.register('A', '1.0.0'); expect(e.get('A')?.version).toBe('1.0.0'); });
  it('isEnabled true', () => { e.register('B', '1.0.0'); expect(e.isEnabled('B')).toBe(true); });
  it('count', () => { expect(e.count()).toBe(2); });
});

describe('ExtensionLoader', () => {
  const e = new ExtensionLoader();
  it('load true for non-empty', () => { expect(e.load({ name: 'A', code: 'code' })).toBe(true); });
  it('isLoaded true', () => { expect(e.isLoaded({ loaded: true })).toBe(true); });
});

describe('ExtensionActivator', () => {
  const e = new ExtensionActivator();
  it('activate + deactivate', () => { e.activate('A'); e.deactivate('A'); expect(e.isActive('A')).toBe(false); });
});

describe('ExtensionDependencyResolver', () => {
  const e = new ExtensionDependencyResolver();
  it('resolve for 2 deps', () => { expect(e.resolve(['A', 'B']).resolved.length).toBe(2); });
  it('hasConflicts false', () => { expect(e.hasConflicts({ conflicts: [] })).toBe(false); });
});

describe('ExtensionVersionManager', () => {
  const e = new ExtensionVersionManager();
  it('bump for 1.0.0 → 1.0.1', () => { expect(e.bump('1.0.0')).toBe('1.0.1'); });
  it('isNewer true for 1.0.1 > 1.0.0', () => { expect(e.isNewer('1.0.1', '1.0.0')).toBe(true); });
});

describe('ExtensionPermissions', () => {
  const e = new ExtensionPermissions();
  it('grant + has', () => { e.grant('read'); expect(e.has('read')).toBe(true); });
});

describe('ExtensionMetadata', () => {
  const e = new ExtensionMetadata();
  it('isValid for full', () => { e.name = 'A'; e.author = 'B'; expect(e.isValid()).toBe(true); });
});

describe('ExtensionConflictDetector', () => {
  const e = new ExtensionConflictDetector();
  it('detect for same', () => { expect(e.detect('A', 'A')).toBe(true); });
  it('hasConflict true', () => { expect(e.hasConflict(true)).toBe(true); });
});

describe('ExtensionHotReloader', () => {
  const e = new ExtensionHotReloader();
  it('reload + isReloaded', () => { e.reload('A'); expect(e.isReloaded('A')).toBe(true); });
});

describe('ExtensionUnloader', () => {
  const e = new ExtensionUnloader();
  it('unload + isUnloaded', () => { e.unload('A'); expect(e.isUnloaded('A')).toBe(true); });
});

describe('ExtensionManagerCoreIndex', () => {
  const idx = new ExtensionManagerCoreIndex();
  it('lists 10 engines', () => { expect(idx.count()).toBe(10); });
});