/**
 * TMEngineCore.ts — Direction BC, V3946-V3955 (Batch 1/3)
 * Translation Memory Engine: TM 核心
 */

export interface TMEntry { source: string; target: string; quality: number; context?: string; domain?: string; }

export class TMStore { private _entries: TMEntry[] = []; add(entry: TMEntry): void { this._entries.push(entry); } getAll(): TMEntry[] { return [...this._entries]; } find(source: string): TMEntry | null { return this._entries.find((e) => e.source === source) || null; } findFuzzy(source: string, threshold = 0.8): TMEntry | null { let best: TMEntry | null = null; let bestScore = 0; for (const e of this._entries) { const score = this._similarity(source, e.source); if (score > bestScore && score >= threshold) { bestScore = score; best = e; } } return best; } private _similarity(a: string, b: string): number { if (a === b) return 1; const longer = a.length > b.length ? a : b; return longer.length === 0 ? 1 : (longer.length - this._editDistance(a, b)) / longer.length; } private _editDistance(a: string, b: string): number { const matrix: number[][] = []; for (let i = 0; i <= b.length; i++) matrix[i] = [i]; for (let j = 0; j <= a.length; j++) matrix[0][j] = j; for (let i = 1; i <= b.length; i++) { for (let j = 1; j <= a.length; j++) { if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1]; else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1); } } return matrix[b.length][a.length]; } size(): number { return this._entries.length; } }

export class TMIndexer { index(store: TMStore): { source: string; target: string }[] { return store.getAll().map((e) => ({ source: e.source, target: e.target })); } isIndexed(store: TMStore): boolean { return store.size() > 0; } }

export class TMQuery { query(store: TMStore, source: string): { entry: TMEntry | null; score: number } { const exact = store.find(source); if (exact) return { entry: exact, score: 1 }; const fuzzy = store.findFuzzy(source, 0.7); return { entry: fuzzy, score: fuzzy ? 0.85 : 0 }; } isExact(r: { score: number }): boolean { return r.score === 1; } }

export class TMSegmenter { segment(text: string, maxLen: number = 50): string[] { const segments: string[] = []; let current = ''; for (const char of text) { current += char; if (current.length >= maxLen && /[。.!?！？]/.test(char)) { segments.push(current); current = ''; } } if (current) segments.push(current); return segments; } isValid(segments: string[]): boolean { return segments.length > 0; } }

export class TMAlignment { align(sourceSegments: string[], targetSegments: string[]): { source: string; target: string }[] { const min = Math.min(sourceSegments.length, targetSegments.length); const pairs: { source: string; target: string }[] = []; for (let i = 0; i < min; i++) pairs.push({ source: sourceSegments[i], target: targetSegments[i] }); return pairs; } isAligned(pairs: { source: string; target: string }[]): boolean { return pairs.length > 0; } }

export class TMQuality { quality(entry: TMEntry): number { const lenScore = Math.min(1, entry.source.length / 50); return entry.quality * 0.7 + lenScore * 0.3; } isHighQuality(q: number, threshold = 0.7): boolean { return q >= threshold; } }

export class TMContext { addContext(entry: TMEntry, context: string): void { entry.context = context; } hasContext(entry: TMEntry): boolean { return entry.context !== undefined && entry.context.length > 0; } }

export class TMUpdate { update(store: TMStore, oldSource: string, newEntry: TMEntry): void { const old = store.find(oldSource); if (old) { old.target = newEntry.target; old.quality = newEntry.quality; } else { store.add(newEntry); } } isUpdated(store: TMStore, source: string): boolean { return store.find(source) !== null; } }

export class TMExport { exportJSON(store: TMStore): string { return JSON.stringify(store.getAll()); } isValidJSON(s: string): boolean { return s.startsWith('['); } }

export class TMImport { importJSON(store: TMStore, json: string): void { const entries = JSON.parse(json) as TMEntry[]; for (const e of entries) store.add(e); } isValid(s: string): boolean { return s.startsWith('['); } }

export class TMCoreIndex { list(): string[] { return ['TMStore', 'TMIndexer', 'TMQuery', 'TMSegmenter', 'TMAlignment', 'TMQuality', 'TMContext', 'TMUpdate', 'TMExport', 'TMImport']; } count(): number { return this.list().length; } }
export const BC_BATCH_1_ENGINES = { TMStore, TMIndexer, TMQuery, TMSegmenter, TMAlignment, TMQuality, TMContext, TMUpdate, TMExport, TMImport, TMCoreIndex } as const;