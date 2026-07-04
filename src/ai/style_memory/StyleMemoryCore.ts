/**
 * StyleMemoryCore.ts — Direction BA, V3886-V3895 (Batch 1/3)
 * Co-Author Style Memory: 风格记忆核心
 */

export interface StyleSample { text: string; timestamp: number; context?: string; }

export class StyleMemory { private _samples: StyleSample[] = []; add(text: string, context: string = ''): void { this._samples.push({ text, timestamp: Date.now(), context }); } getAll(): StyleSample[] { return [...this._samples]; } size(): number { return this._samples.length; } recent(n: number = 5): StyleSample[] { return this._samples.slice(-n); } }

export class StyleProfileExtractor { extract(samples: StyleSample[]): { avgLen: number; vocabSize: number; formality: number } { if (samples.length === 0) return { avgLen: 0, vocabSize: 0, formality: 0.5 }; const totalLen = samples.reduce((s, sa) => s + sa.text.length, 0); const avgLen = totalLen / samples.length; const words = new Set(samples.flatMap((sa) => sa.text.split(/\s+/))); const formality = samples.filter((sa) => /先生|女士/.test(sa.text)).length / samples.length; return { avgLen, vocabSize: words.size, formality }; } isValid(p: { avgLen: number }): boolean { return p.avgLen > 0; } }

export class StyleMemoryRetriever { retrieve(memory: StyleMemory, query: string): StyleSample[] { return memory.getAll().filter((s) => s.context === query || s.text.includes(query)).slice(0, 3); } hasMatches(samples: StyleSample[]): boolean { return samples.length > 0; } }

export class StyleMemoryConsolidator { consolidate(memory: StyleMemory): StyleMemory { const samples = memory.getAll(); const unique = Array.from(new Set(samples.map((s) => s.text))).map((text) => samples.find((s) => s.text === text)!); const newMemory = new StyleMemory(); for (const s of unique) newMemory.add(s.text, s.context); return newMemory; } reduced(memory: StyleMemory, consolidated: StyleMemory): number { return memory.size() - consolidated.size(); } }

export class StyleMemoryPersistence { private _storage = new Map<string, StyleMemory>(); save(key: string, memory: StyleMemory): void { this._storage.set(key, memory); } load(key: string): StyleMemory | null { return this._storage.get(key) || null; } count(): number { return this._storage.size; } }

export class StyleMemorySimilarity { similarity(a: string, b: string): number { return a === b ? 1 : a.length === b.length ? 0.8 : 0.3; } isSimilar(a: string, b: string, threshold = 0.7): boolean { return this.similarity(a, b) >= threshold; } }

export class StyleMemoryRecencyScorer { score(sample: StyleSample): number { const ageDays = (Date.now() - sample.timestamp) / 86400000; return Math.max(0, 1 - ageDays / 30); } isRecent(sample: StyleSample, threshold = 0.5): boolean { return this.score(sample) >= threshold; } }

export class StyleMemoryFrequencyTracker { private _freq = new Map<string, number>(); record(pattern: string): void { this._freq.set(pattern, (this._freq.get(pattern) || 0) + 1); } top(n: number = 5): { pattern: string; count: number }[] { return Array.from(this._freq.entries()).map(([pattern, count]) => ({ pattern, count })).sort((a, b) => b.count - a.count).slice(0, n); } }

export class StyleMemoryEvolution { private _history: { version: number; memory: StyleMemory }[] = []; save(version: number, memory: StyleMemory): void { this._history.push({ version, memory }); } getVersion(v: number): StyleMemory | null { return this._history.find((h) => h.version === v)?.memory || null; } versions(): number { return this._history.length; } }

export class StyleMemoryExporter { export(memory: StyleMemory): string { return memory.getAll().map((s) => `[${s.context}] ${s.text}`).join('\n'); } isValid(s: string): boolean { return s.length > 0; } }

export class StyleMemoryCoreIndex { list(): string[] { return ['StyleMemory', 'StyleProfileExtractor', 'StyleMemoryRetriever', 'StyleMemoryConsolidator', 'StyleMemoryPersistence', 'StyleMemorySimilarity', 'StyleMemoryRecencyScorer', 'StyleMemoryFrequencyTracker', 'StyleMemoryEvolution', 'StyleMemoryExporter']; } count(): number { return this.list().length; } }
export const BA_BATCH_1_ENGINES = { StyleMemory, StyleProfileExtractor, StyleMemoryRetriever, StyleMemoryConsolidator, StyleMemoryPersistence, StyleMemorySimilarity, StyleMemoryRecencyScorer, StyleMemoryFrequencyTracker, StyleMemoryEvolution, StyleMemoryExporter, StyleMemoryCoreIndex } as const;