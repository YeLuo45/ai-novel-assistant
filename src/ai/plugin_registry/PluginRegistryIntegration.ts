/**
 * PluginRegistryIntegration.ts — Direction BZ, V4576-V4585 (Batch 3/3 收口)
 * Plugin Registry: 集成 + 收口
 */

import { PluginPublisher } from './PluginRegistryCore';

export class PluginPipeline { steps: string[] = ['validate', 'sign', 'publish', 'distribute', 'track']; isComplete(step: string): boolean { return this.steps[this.steps.length - 1] === step; } next(step: string): string { const i = this.steps.indexOf(step); return i >= 0 && i < this.steps.length - 1 ? this.steps[i + 1] : 'done'; } }
export class PluginDirector { decide(state: { validated: boolean; published: boolean }): string { if (!state.validated) return 'validate'; if (!state.published) return 'publish'; return 'track'; } }
export class PluginReport { generate(stats: { total: number; published: number; installed: number }): string { return `${stats.total} 插件, ${stats.published} 发布, ${stats.installed} 安装`; } hasReport(s: string): boolean { return s.includes('插件'); } }
export class PluginLibrary { private _publisher = new PluginPublisher(); publish(name: string, version: string): void { this._publisher.publish({ name, version }); } count(): number { return this._publisher.count(); } }
export class PluginValidator { validate(plugin: { name: string; version: string; signature: string }): { valid: boolean } { return { valid: plugin.name.length > 0 && /^\d+\.\d+\.\d+$/.test(plugin.version) && plugin.signature.length > 0 }; } isValid(r: { valid: boolean }): boolean { return r.valid; } }
export class PluginTools { tools: string[] = ['vsce', 'npm-publish', 'git-tag', 'GitHub-Release']; isAvailable(t: string): boolean { return this.tools.includes(t); } count(): number { return this.tools.length; } }
export class PluginQualityGate { gate(plugin: { downloads: number; rating: number }): boolean { return plugin.downloads > 10 && plugin.rating >= 4; } }
export class PluginADirector { decide(state: { hasUpdates: boolean; hasIssues: boolean }): string { if (state.hasUpdates) return 'update'; if (state.hasIssues) return 'resolve'; return 'monitor'; } }
export class PluginAnalytics { compute(stats: { downloads: number; rating: number; count: number }): { avgDownloads: number; avgRating: number } { return { avgDownloads: stats.count > 0 ? stats.downloads / stats.count : 0, avgRating: stats.rating }; } isHealthy(r: { avgRating: number }): boolean { return r.avgRating >= 4; } }
export class PluginRegistryMasterIndex { list(): string[] { return ['PluginManifest', 'PluginPublisher', 'PluginVersioning', 'PluginSearch', 'PluginRating', 'PluginDownloader', 'PluginSignatureVerifier', 'PluginCompatibility', 'PluginLocalCache', 'PluginChecksum', 'PluginReviews', 'PluginScreenshots', 'PluginChangelog', 'PluginReadmeParser', 'PluginTagging', 'PluginStatistics', 'PluginRecommendation', 'PluginCollection', 'PluginEditorConfig', 'PluginSchemaValidator', 'PluginPipeline', 'PluginDirector', 'PluginReport', 'PluginLibrary', 'PluginValidator', 'PluginTools', 'PluginQualityGate', 'PluginADirector', 'PluginAnalytics', 'PluginRegistryMasterIndex']; } count(): number { return this.list().length; } }
export const BZ_BATCH_3_ENGINES = { PluginPipeline, PluginDirector, PluginReport, PluginLibrary, PluginValidator, PluginTools, PluginQualityGate, PluginADirector, PluginAnalytics, PluginRegistryMasterIndex } as const;