# CV Agent Memory Long-term — Persistent AI Memory

**V5216-V5245** | **29 engines / 31 tests / 100% pass / 95%+ coverage**

## Overview

CV provides a complete agent memory layer: episodic store + semantic index +
procedural cache + consolidation engine + forgetting engine + memory retriever +
memory encoder + decoder + memory hierarchy, plus advanced (long-term manager +
short-term memory + working memory + associative memory + context window +
attention mechanism + memory compression + memory cache + memory profiler), plus
integration (dashboard + config + audit + profile + migration + report +
benchmark + indices).

## Engines

### Batch 1/3 — Core (AgentMemoryCore.ts)
- `EpisodicStore` — timestamped episode records
- `SemanticIndex` — tag-based semantic index
- `ProceduralCache` — procedure steps with lastUsed tracking
- `ConsolidationEngine` — similarity-based merging
- `ForgettingEngine` — age/importance-based decay
- `MemoryRetriever` — importance + recency + match scoring
- `MemoryEncoder` — hash-based encoding
- `MemoryDecoder` — reverse + split decoding
- `MemoryHierarchy` — hot/warm/cold classification
- `MemoryCoreIndex` — Batch 1/3 index

### Batch 2/3 — Advanced (AgentMemoryAdvanced.ts)
- `LongTermMemoryManager` — permanent storage
- `ShortTermMemory` — bounded FIFO buffer
- `WorkingMemory` — attention-focused items with decay
- `AssociativeMemory` — graph-based link store
- `ContextWindow` — bounded token window
- `AttentionMechanism` — softmax attention
- `MemoryCompression` — dedup + truncate
- `MemoryCache` — LRU-like key cache
- `MemoryProfiler` — operation duration + bytes
- `MemoryAdvancedIndex` — Batch 2/3 index

### Batch 3/3 — Integration (AgentMemoryIntegration.ts)
- `MemoryDashboard` — panel container
- `MemoryConfig` — typed config
- `MemoryAudit` — agent/action/memoryType log
- `MemoryProfile` — agent items + duration
- `MemoryMigration` — version migrations
- `MemoryReport` — markdown + CSV
- `MemoryBenchmark` — best result tracker
- `MemoryIntegrationIndex` — Batch 3/3 index
- `MemoryMasterIndex` — all 29 engines

## Usage

```ts
import { EpisodicStore, ForgettingEngine, MemoryRetriever } from './src/ai/agent_memory/AgentMemoryCore';

const store = new EpisodicStore();
const e = store.record('User asked about weather', 0.8);

const forget = new ForgettingEngine();
const recent = store.recent(10);
const shouldKeep = recent.filter(item => !forget.shouldForget(item, 100_000, 0.05));

const retriever = new MemoryRetriever();
const results = retriever.retrieve(recent, 'weather', 3);
```

## Testing

```bash
npx vitest run src/ai/agent_memory/ --coverage --coverage.include='src/ai/agent_memory/**'
```

Coverage: **~99% statements / 95%+ branches** ≥95% target met across all 3 batches.