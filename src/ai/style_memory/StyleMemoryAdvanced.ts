/**
 * StyleMemoryAdvanced.ts — Direction BA, V3896-V3905 (Batch 2/3)
 * Co-Author Style Memory: 高级工具
 */

import { StyleMemory } from './StyleMemoryCore';

export class StyleMemorySize { size(memory: StyleMemory): number { return memory.size(); } isLarge(memory: StyleMemory, threshold = 100): boolean { return memory.size() > threshold; } }
export class StyleMemoryCompression { compress(memory: StyleMemory): number { const size = memory.size(); for (let i = 0; i < size / 2; i++) { const samples = memory.getAll(); if (samples.length < 2) break; memory = new StyleMemory(); samples.slice(2).forEach((s) => memory.add(s.text, s.context)); } return memory.size(); } }
export class StyleMemoryQuality { score(memory: StyleMemory): number { const samples = memory.getAll(); if (samples.length === 0) return 0; const avgLen = samples.reduce((s, sa) => s + sa.text.length, 0) / samples.length; return Math.min(1, avgLen / 100); } isQuality(score: number, threshold = 0.5): boolean { return score >= threshold; } }
export class StyleMemoryConflictResolver { resolve(a: StyleMemory, b: StyleMemory): StyleMemory { const merged = new StyleMemory(); a.getAll().forEach((s) => merged.add(s.text, s.context)); b.getAll().forEach((s) => merged.add(s.text, s.context)); return merged; } hasConflict(a: StyleMemory, b: StyleMemory): boolean { return a.size() > 0 && b.size() > 0; } }
export class StyleMemoryVersioning { private _versions = new Map<string, number>(); bump(key: string): number { const v = (this._versions.get(key) || 0) + 1; this._versions.set(key, v); return v; } get(key: string): number { return this._versions.get(key) || 0; } }
export class StyleMemoryPrivacy { anonymize(text: string): string { return text.replace(/[\u4e00-\u9fa5]{2,4}(先生|女士)/g, '***'); } isAnonymized(text: string): boolean { return text.includes('***'); } }
export class StyleMemoryTag { tag: string = ''; hasTag(s: string): boolean { return s.includes(this.tag); } }
export class StyleMemoryClusterer { cluster(memory: StyleMemory): Map<string, string[]> { const map = new Map<string, string[]>(); memory.getAll().forEach((s) => { const key = s.context || 'default'; if (!map.has(key)) map.set(key, []); map.get(key)!.push(s.text); }); return map; } clusterCount(memory: StyleMemory): number { return this.cluster(memory).size; } }
export class StyleMemoryBackup { private _backups = new Map<string, StyleMemory>(); backup(key: string, memory: StyleMemory): void { this._backups.set(key, memory); } restore(key: string): StyleMemory | null { return this._backups.get(key) || null; } count(): number { return this._backups.size; } }
export class StyleMemoryAdvancedIndex { list(): string[] { return ['StyleMemorySize', 'StyleMemoryCompression', 'StyleMemoryQuality', 'StyleMemoryConflictResolver', 'StyleMemoryVersioning', 'StyleMemoryPrivacy', 'StyleMemoryTag', 'StyleMemoryClusterer', 'StyleMemoryBackup']; } count(): number { return this.list().length; } }
export const BA_BATCH_2_ENGINES = { StyleMemorySize, StyleMemoryCompression, StyleMemoryQuality, StyleMemoryConflictResolver, StyleMemoryVersioning, StyleMemoryPrivacy, StyleMemoryTag, StyleMemoryClusterer, StyleMemoryBackup, StyleMemoryAdvancedIndex } as const;