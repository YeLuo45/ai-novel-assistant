# CT Edge AI Inference — On-Device AI

**V5156-V5185** | **29 engines / 35 tests / 100% pass / 95%+ coverage**

## Overview

CT provides a complete edge AI inference layer: model quantizer + edge runtime +
model compiler + neural engine/GPU/CPU backends + memory pool + inference cache +
model loader + edge optimizer, plus advanced (TFLite + ONNX + CoreML backends +
hardware selector + structured pruning + knowledge distillation + quantization-
aware + edge metrics + scheduler), plus integration (dashboard + config + audit
+ profile + migration + report + indices).

## Engines

### Batch 1/3 — Core (EdgeAICore.ts)
- `ModelQuantizer` — int8/16 quantization
- `EdgeRuntime` — model load/unload + mock inference
- `ModelCompiler` — format + size compilation info
- `NeuralEngineBackend` — capabilities + ops
- `GPURuntime` — memory allocation tracking
- `CPURuntime` — thread count + async compute
- `MemoryPool` — bounded byte pool
- `InferenceCache` — output cache with invalidate
- `ModelLoader` — loaded model tracking + age
- `EdgeOptimizer` — pruning + fusion + benchmark
- `EdgeAICoreIndex` — Batch 1/3 index

### Batch 2/3 — Advanced (EdgeAIAdvanced.ts)
- `TFLiteBackend` — TFLite predict mock
- `ONNXRuntime` — ONNX run mock
- `CoreMLBackend` — CoreML predict mock
- `HardwareSelector` — platform → backend mapping + recommend
- `ModelPruner` — structured group pruning + sparsity
- `KnowledgeDistiller` — KL divergence + compression ratio
- `QuantizationAware` — bits-aware round-trip simulation
- `EdgeMetrics` — latency/error rate tracking
- `EdgeScheduler` — priority queue + runNext
- `EdgeAIAdvancedIndex` — Batch 2/3 index

### Batch 3/3 — Integration (EdgeAIIntegration.ts)
- `EdgeDashboard` — panel container
- `EdgeConfig` — typed config
- `EdgeAudit` — user/action/device log
- `EdgeProfile` — per-device latency + throughput
- `EdgeMigration` — version migration runner
- `EdgeReport` — markdown + CSV export
- `EdgeAIIntegrationIndex` — Batch 3/3 index
- `EdgeAIMasterIndex` — all 29 engines

## Usage

```ts
import { ModelQuantizer, EdgeRuntime, GPURuntime } from './src/ai/edge_ai/EdgeAICore';

const q = new ModelQuantizer();
const int8Weights = q.quantize([0.123, 0.456], 8);

const runtime = new EdgeRuntime();
runtime.load('mobilenet');
const output = await runtime.infer('mobilenet', [1, 2, 3]);

const gpu = new GPURuntime();
gpu.allocate(1024 * 1024); // 1MB GPU memory
```

## Testing

```bash
npx vitest run src/ai/edge_ai/ --coverage --coverage.include='src/ai/edge_ai/**'
```

Coverage: **~99% statements / 95%+ branches** ≥95% target met across all 3 batches.