/**
 * ExtensionManagerIntegration.ts — Direction BV, V4456-V4465 (Batch 3/3 收口)
 * Extension Manager: 集成 + 收口
 */

import { ExtensionRegistry } from './ExtensionManagerCore';

export class ExtensionPipeline { steps: string[] = ['register', 'load', 'activate', 'monitor', 'unload']; isComplete(step: string): boolean { return this.steps[this.steps.length - 1] === step; } next(step: string): string { const i = this.steps.indexOf(step); return i >= 0 && i < this.steps.length - 1 ? this.steps[i + 1] : 'done'; } }
export class ExtensionDirector { decide(state: { registered: boolean; activated: boolean }): string { if (!state.registered) return 'register'; if (!state.activated) return 'activate'; return 'monitor'; } }
export class ExtensionReport { generate(stats: { total: number; active: number }): string { return `共 ${stats.total} 扩展, ${stats.active} 活跃`; } hasReport(s: string): boolean { return s.includes('扩展'); } }
export class ExtensionLibrary { private _registry = new ExtensionRegistry(); save(name: string, version: string): void { this._registry.register(name, version); } count(): number { return this._registry.count(); } }
export class ExtensionValidator { validate(ext: { name: string; version: string }): { valid: boolean } { return { valid: ext.name.length > 0 && /^\d+\.\d+\.\d+$/.test(ext.version) }; } isValid(r: { valid: boolean }): boolean { return r.valid; } }
export class ExtensionTools { tools: string[] = ['VSCode', 'Webpack', 'Rollup', 'Vite']; isAvailable(t: string): boolean { return this.tools.includes(t); } count(): number { return this.tools.length; } }
export class ExtensionQualityGate { gate(ext: { name: string; version: string }): boolean { return ext.name.length > 0 && ext.version.length > 0; } }
export class ExtensionADirector { decide(state: { hasIssues: boolean; resolved: boolean }): string { if (state.hasIssues) return 'resolve'; if (!state.resolved) return 'resolve'; return 'finalize'; } }
export class ExtensionMonitor { private _status = new Map<string, string>(); set(name: string, status: string): void { this._status.set(name, status); } get(name: string): string | undefined { return this._status.get(name); } count(): number { return this._status.size; } }
export class ExtensionManagerMasterIndex { list(): string[] { return ['ExtensionRegistry', 'ExtensionLoader', 'ExtensionActivator', 'ExtensionDependencyResolver', 'ExtensionVersionManager', 'ExtensionPermissions', 'ExtensionMetadata', 'ExtensionConflictDetector', 'ExtensionHotReloader', 'ExtensionUnloader', 'ExtensionMarketplace', 'ExtensionInstaller', 'ExtensionUninstaller', 'ExtensionUpdater', 'ExtensionBackup', 'ExtensionSandbox', 'ExtensionAPIBridge', 'ExtensionEventBus', 'ExtensionStateManager', 'ExtensionLogger', 'ExtensionPipeline', 'ExtensionDirector', 'ExtensionReport', 'ExtensionLibrary', 'ExtensionValidator', 'ExtensionTools', 'ExtensionQualityGate', 'ExtensionADirector', 'ExtensionMonitor', 'ExtensionManagerMasterIndex']; } count(): number { return this.list().length; } }
export const BV_BATCH_3_ENGINES = { ExtensionPipeline, ExtensionDirector, ExtensionReport, ExtensionLibrary, ExtensionValidator, ExtensionTools, ExtensionQualityGate, ExtensionADirector, ExtensionMonitor, ExtensionManagerMasterIndex } as const;