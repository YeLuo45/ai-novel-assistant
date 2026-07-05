/**
 * ExtensionManagerCore.ts — Direction BV, V4436-V4445 (Batch 1/3)
 * Extension Manager: 扩展管理器核心
 */

export class ExtensionRegistry { private _extensions = new Map<string, { name: string; version: string; enabled: boolean }>(); register(name: string, version: string): void { this._extensions.set(name, { name, version, enabled: true }); } get(name: string): { name: string; version: string; enabled: boolean } | null { return this._extensions.get(name) || null; } isEnabled(name: string): boolean { return this._extensions.get(name)?.enabled || false; } count(): number { return this._extensions.size; } }
export class ExtensionLoader { load(extension: { name: string; code: string }): boolean { return extension.code.length > 0; } isLoaded(extension: { loaded: boolean }): boolean { return extension.loaded; } }
export class ExtensionActivator { activate(name: string): void {} deactivate(name: string): void {} isActive(name: string): boolean { return false; } }
export class ExtensionDependencyResolver { resolve(deps: string[]): { resolved: string[]; conflicts: string[] } { return { resolved: deps, conflicts: [] }; } hasConflicts(r: { conflicts: string[] }): boolean { return r.conflicts.length > 0; } }
export class ExtensionVersionManager { bump(version: string): string { const parts = version.split('.'); parts[2] = String(Number(parts[2] || 0) + 1); return parts.join('.'); } isNewer(a: string, b: string): boolean { return a > b; } }
export class ExtensionPermissions { permissions: string[] = []; grant(p: string): void { this.permissions.push(p); } has(p: string): boolean { return this.permissions.includes(p); } }
export class ExtensionMetadata { name: string = ''; author: string = ''; version: string = '1.0.0'; description: string = ''; isValid(): boolean { return this.name.length > 0 && this.author.length > 0; } }
export class ExtensionConflictDetector { detect(a: string, b: string): boolean { return a === b; } hasConflict(d: boolean): boolean { return d; } }
export class ExtensionHotReloader { reload(name: string): void {} isReloaded(name: string): boolean { return true; } }
export class ExtensionUnloader { unload(name: string): void {} isUnloaded(name: string): boolean { return true; } }
export class ExtensionManagerCoreIndex { list(): string[] { return ['ExtensionRegistry', 'ExtensionLoader', 'ExtensionActivator', 'ExtensionDependencyResolver', 'ExtensionVersionManager', 'ExtensionPermissions', 'ExtensionMetadata', 'ExtensionConflictDetector', 'ExtensionHotReloader', 'ExtensionUnloader']; } count(): number { return this.list().length; } }
export const BV_BATCH_1_ENGINES = { ExtensionRegistry, ExtensionLoader, ExtensionActivator, ExtensionDependencyResolver, ExtensionVersionManager, ExtensionPermissions, ExtensionMetadata, ExtensionConflictDetector, ExtensionHotReloader, ExtensionUnloader, ExtensionManagerCoreIndex } as const;