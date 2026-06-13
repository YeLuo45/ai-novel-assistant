/**
 * V2100 Direction A Iteration 15/30 Round 6: CycleMemory
 *
 * Cycle execution memory — key-value store with versioning, namespace
 * isolation, capacity limits, and merging support for cross-cycle state.
 *
 * Inspired by:
 * - nanobot-design: dream memory + cross-iteration retention
 * - generic-agent-design: L3 long-term memory layer
 * - ruflo-design: federation context state
 */

export interface CycleMemoryConfig {
  maxEntries?: number;
  namespace?: string;
}

export interface CycleMemory {
  store: Map<string, MemoryEntry>;
  config: Required<CycleMemoryConfig>;
  version: number;
}

export interface MemoryEntry {
  key: string;
  value: unknown;
  version: number;
  updatedAt: number;
}

/**
 * Create a cycle memory instance.
 */
export function createCycleMemory(
  config: CycleMemoryConfig = {},
  now?: () => number
): CycleMemory {
  const maxEntries = config.maxEntries ?? 1024;
  if (!Number.isFinite(maxEntries) || maxEntries < 1) {
    throw new Error(`maxEntries must be a positive integer, got ${maxEntries}`);
  }
  return {
    store: new Map<string, MemoryEntry>(),
    config: {
      maxEntries,
      namespace: config.namespace ?? 'default',
    },
    version: 1,
    _now: now,
  } as CycleMemory & { _now: (() => number) | undefined };
}

/** Store a value under `key`. Throws when capacity is exceeded and key is new. */
export function remember<T>(
  memory: CycleMemory,
  key: string,
  value: T,
  now: () => number = () => Date.now()
): void {
  if (!key) throw new Error('key must be a non-empty string');
  const isNew = !memory.store.has(key);
  if (isNew && memory.store.size >= memory.config.maxEntries) {
    throw new Error(
      `CycleMemory capacity exceeded: ${memory.store.size} >= ${memory.config.maxEntries}`
    );
  }
  memory.version += 1;
  memory.store.set(key, {
    key,
    value,
    version: memory.version,
    updatedAt: now(),
  });
}

/** Retrieve a value by key. Returns undefined when missing. */
export function recall<T = unknown>(memory: CycleMemory, key: string): T | undefined {
  const entry = memory.store.get(key);
  if (!entry) return undefined;
  return entry.value as T;
}

/** Delete a value. Returns true if the key was present. */
export function forget(memory: CycleMemory, key: string): boolean {
  const existed = memory.store.delete(key);
  if (existed) memory.version += 1;
  return existed;
}

/** Return all keys in insertion order. */
export function listKeys(memory: CycleMemory): string[] {
  return Array.from(memory.store.keys());
}

/** Current version (monotonic counter that increments on every mutation). */
export function getVersion(memory: CycleMemory): number {
  return memory.version;
}

/** Return a defensive snapshot of the entire memory. */
export function snapshot(memory: CycleMemory): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [k, entry] of memory.store) {
    out.set(k, entry.value);
  }
  return out;
}

/**
 * Merge `source` into `target`. New keys are added; existing keys are
 * overwritten by the source value. Capacity is checked before any writes.
 */
export function mergeMemory(target: CycleMemory, source: CycleMemory): number {
  const newKeys = listKeys(source).filter((k) => !target.store.has(k));
  if (target.store.size + newKeys.length > target.config.maxEntries) {
    throw new Error(
      `mergeMemory would exceed target capacity: ${target.store.size} + ${newKeys.length} > ${target.config.maxEntries}`
    );
  }
  let merged = 0;
  for (const key of listKeys(source)) {
    // listKeys only returns keys present in source.store, so sourceEntry is
    // guaranteed to be defined. The original `if (!sourceEntry) continue;`
    // branch was dead code and has been removed to keep branch coverage at 100%.
    const sourceEntry = source.store.get(key) as MemoryEntry;
    const value = sourceEntry.value;
    if (target.store.has(key)) {
      // Overwrite path: preserve target's entry but refresh value, version, timestamp.
      const existing = target.store.get(key)!;
      existing.value = value;
      existing.version = sourceEntry.version;
      existing.updatedAt = sourceEntry.updatedAt;
    } else {
      target.store.set(key, {
        key,
        value,
        version: sourceEntry.version,
        updatedAt: sourceEntry.updatedAt,
      });
      merged += 1;
    }
    target.version += 1;
  }
  return merged;
}

/** Returns the number of entries in the memory. */
export function size(memory: CycleMemory): number {
  return memory.store.size;
}

/** Returns true if the memory has no entries. */
export function isEmpty(memory: CycleMemory): boolean {
  return memory.store.size === 0;
}

/** Wipe all entries and bump version. */
export function clear(memory: CycleMemory): number {
  const n = memory.store.size;
  memory.store.clear();
  memory.version += 1;
  return n;
}

/** Get the metadata (key + version + timestamp) for a stored entry. */
export function getEntryMeta(
  memory: CycleMemory,
  key: string
): { key: string; version: number; updatedAt: number } | undefined {
  const e = memory.store.get(key);
  if (!e) return undefined;
  return { key: e.key, version: e.version, updatedAt: e.updatedAt };
}
