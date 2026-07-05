// V4946-V4955: CM Offline Edit Core Batch 1/3
// Offline document + storage adapters + diff + merge + conflict + sync queue + operation log + snapshot

export class OfflineDocument {
  private _content: string;
  private _version: number;
  private _modifiedAt: number;

  constructor(initial = '') {
    this._content = initial;
    this._version = 0;
    this._modifiedAt = Date.now();
  }

  get content(): string { return this._content; }
  get version(): number { return this._version; }
  get modifiedAt(): number { return this._modifiedAt; }

  apply(text: string): number {
    this._content = text;
    this._version += 1;
    this._modifiedAt = Date.now();
    return this._version;
  }

  patch(start: number, end: number, replacement: string): string {
    return this._content.slice(0, start) + replacement + this._content.slice(end);
  }

  applyPatch(start: number, end: number, replacement: string): number {
    this._content = this.patch(start, end, replacement);
    this._version += 1;
    this._modifiedAt = Date.now();
    return this._version;
  }

  length(): number {
    return this._content.length;
  }

  clone(): OfflineDocument {
    const d = new OfflineDocument(this._content);
    d._version = this._version;
    d._modifiedAt = this._modifiedAt;
    return d;
  }
}

export class LocalStorageAdapter {
  private _store: Map<string, string> = new Map();

  get(key: string): string | null {
    return this._store.get(key) ?? null;
  }

  set(key: string, value: string): boolean {
    this._store.set(key, value);
    return true;
  }

  delete(key: string): boolean {
    return this._store.delete(key);
  }

  has(key: string): boolean {
    return this._store.has(key);
  }

  keys(): string[] {
    return [...this._store.keys()];
  }

  size(): number {
    return this._store.size;
  }

  clear(): void {
    this._store.clear();
  }
}

export class IndexedDBAdapter {
  private _tables: Map<string, Map<string, unknown>> = new Map();

  table(name: string): Map<string, unknown> {
    let t = this._tables.get(name);
    if (!t) {
      t = new Map();
      this._tables.set(name, t);
    }
    return t;
  }

  put(table: string, key: string, value: unknown): boolean {
    this.table(table).set(key, value);
    return true;
  }

  get(table: string, key: string): unknown {
    return this.table(table).get(key);
  }

  delete(table: string, key: string): boolean {
    return this.table(table).delete(key);
  }

  has(table: string, key: string): boolean {
    return this.table(table).has(key);
  }

  tableSize(table: string): number {
    return this.table(table).size;
  }

  tableCount(): number {
    return this._tables.size;
  }
}

export class DiffEngine {
  // Line-level diff
  diffLines(a: string, b: string): Array<{ op: 'add' | 'remove' | 'equal'; text: string }> {
    const aLines = a.split('\n');
    const bLines = b.split('\n');
    const result: Array<{ op: 'add' | 'remove' | 'equal'; text: string }> = [];
    let i = 0, j = 0;
    while (i < aLines.length || j < bLines.length) {
      if (i >= aLines.length) {
        result.push({ op: 'add', text: bLines[j++] });
      } else if (j >= bLines.length) {
        result.push({ op: 'remove', text: aLines[i++] });
      } else if (aLines[i] === bLines[j]) {
        result.push({ op: 'equal', text: aLines[i] });
        i += 1;
        j += 1;
      } else {
        result.push({ op: 'remove', text: aLines[i++] });
        result.push({ op: 'add', text: bLines[j++] });
      }
    }
    return result;
  }

  // Naive LCS
  diffChars(a: string, b: string): { common: number; diffA: number; diffB: number } {
    let common = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) common += 1;
    }
    return { common, diffA: a.length - common, diffB: b.length - common };
  }

  isEqual(a: string, b: string): boolean {
    return a === b;
  }
}

export class MergeEngine {
  threeWayMerge(base: string, ours: string, theirs: string): { merged: string; conflicts: Array<{ start: number; end: number }> } {
    if (ours === theirs) return { merged: ours, conflicts: [] };
    if (base === ours) return { merged: theirs, conflicts: [] };
    if (base === theirs) return { merged: ours, conflicts: [] };
    // Naive conflict marker
    const merged = `${ours}\n<<<<<<< THEIRS\n${theirs}\n=======`;
    const start = merged.indexOf('<<<<<<<');
    return {
      merged: merged + `\n>>>>>>> OURS\n${ours}`,
      conflicts: [{ start, end: merged.length - 1 }]
    };
  }

  hasConflicts(merged: string): boolean {
    return merged.includes('<<<<<<<');
  }

  takeOurs(ours: string, _theirs: string): string {
    return ours;
  }

  takeTheirs(_ours: string, theirs: string): string {
    return theirs;
  }
}

export class ConflictResolver {
  resolve(local: string, remote: string, strategy: 'local' | 'remote' | 'newer' | 'merge' = 'merge'): string {
    switch (strategy) {
      case 'local': return local;
      case 'remote': return remote;
      case 'newer': return local; // Mock: prefer local (assume local is newer)
      case 'merge': return local + '\n' + remote;
    }
  }

  detectConflict(local: string, remote: string, base: string): boolean {
    return local !== base && remote !== base && local !== remote;
  }

  autoResolvable(local: string, remote: string, base: string): boolean {
    if (local === base) return true;
    if (remote === base) return true;
    if (local === remote) return true;
    return false;
  }
}

export class SyncQueue {
  private _queue: Array<{ id: string; op: string; payload: unknown; ts: number }> = [];

  enqueue(op: string, payload: unknown): string {
    const id = `${Date.now()}-${this._queue.length}`;
    this._queue.push({ id, op, payload, ts: Date.now() });
    return id;
  }

  peek(): Array<{ id: string; op: string; payload: unknown; ts: number }> {
    return [...this._queue];
  }

  dequeue(): { id: string; op: string; payload: unknown; ts: number } | null {
    return this._queue.shift() ?? null;
  }

  size(): number {
    return this._queue.length;
  }

  clear(): void {
    this._queue = [];
  }

  remove(id: string): boolean {
    const before = this._queue.length;
    this._queue = this._queue.filter(x => x.id !== id);
    return this._queue.length < before;
  }
}

export class OperationLog {
  private _log: Array<{ id: string; op: string; payload: unknown; ts: number }> = [];

  record(op: string, payload: unknown): string {
    const id = `${Date.now()}-${this._log.length}`;
    this._log.push({ id, op, payload, ts: Date.now() });
    return id;
  }

  entries(): Array<{ id: string; op: string; payload: unknown; ts: number }> {
    return [...this._log];
  }

  byOp(op: string): Array<{ id: string; op: string; payload: unknown; ts: number }> {
    return this._log.filter(e => e.op === op);
  }

  count(): number {
    return this._log.length;
  }

  clear(): void {
    this._log = [];
  }
}

export class SnapshotManager {
  private _snapshots: Map<string, { content: string; ts: number }> = new Map();

  save(id: string, content: string): void {
    this._snapshots.set(id, { content, ts: Date.now() });
  }

  load(id: string): string | null {
    return this._snapshots.get(id)?.content ?? null;
  }

  age(id: string): number {
    const s = this._snapshots.get(id);
    return s ? Date.now() - s.ts : -1;
  }

  has(id: string): boolean {
    return this._snapshots.has(id);
  }

  delete(id: string): boolean {
    return this._snapshots.delete(id);
  }

  count(): number {
    return this._snapshots.size;
  }

  list(): string[] {
    return [...this._snapshots.keys()];
  }
}

// V4955: OfflineEditCoreIndex
export const CM_BATCH_1_ENGINES = [
  'OfflineDocument', 'LocalStorageAdapter', 'IndexedDBAdapter', 'DiffEngine', 'MergeEngine',
  'ConflictResolver', 'SyncQueue', 'OperationLog', 'SnapshotManager', 'OfflineEditCoreIndex'
] as const;

export class OfflineEditCoreIndex {
  list(): string[] {
    return [...CM_BATCH_1_ENGINES];
  }

  count(): number {
    return CM_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CM_BATCH_1_ENGINES.includes(name as typeof CM_BATCH_1_ENGINES[number]);
  }
}