# CL Workflow — Step Orchestration Engine

**V4916-V4945** | **30 engines / 80 tests / 100% pass / 97%+ coverage**

## Overview

CL provides a complete workflow orchestration layer: engine + step executor +
registry + transition guards + error handling + retry policy + compensation +
saga coordination + timeout enforcement, plus advanced primitives (branch /
parallel / join / conditional / loop / sub-workflow / wait / signal / state
machine), plus integration (scheduler / observer / metrics / audit / recovery /
visualizer / serializer / versioning / indices).

## Engines

### Batch 1/3 — Core (WorkflowCore.ts)
- `WorkflowEngine` — step lifecycle and registry
- `StepExecutor` — runs steps with error catching
- `StepRegistry` — step type factories
- `TransitionGuard` — predicate-based transition guards
- `ErrorHandler` — typed error routing with default
- `RetryPolicy` — exponential backoff retry
- `CompensationEngine` — reverse-order rollback
- `SagaCoordinator` — saga pattern with compensation
- `TimeoutEnforcer` — deadline tracking + `withTimeout` helper
- `WorkflowCoreIndex` — Batch 1/3 index

### Batch 2/3 — Advanced (WorkflowAdvanced.ts)
- `BranchStep` — named branch dispatch
- `ParallelStep` — concurrent task execution
- `JoinStep` — barrier synchronization
- `ConditionalStep` — predicate evaluation + then/else
- `LoopStep` — bounded iteration (sync + async)
- `SubWorkflow` — nested workflow invocation
- `WaitStep` — time + predicate + signal waits
- `SignalStep` — pub/sub signal bus with history
- `WorkflowStateMachine` — state transition rules
- `WorkflowAdvancedIndex` — Batch 2/3 index

### Batch 3/3 — Integration (WorkflowIntegration.ts)
- `WorkflowScheduler` — time-ordered task queue
- `WorkflowObserver` — event log with type filter
- `WorkflowMetrics` — runs/failures/duration stats
- `WorkflowAudit` — actor/action event trail
- `WorkflowRecovery` — checkpoint + restore
- `WorkflowVisualizer` — DOT graph export
- `WorkflowSerializer` — JSON + fingerprint
- `WorkflowVersioning` — semantic version tracking
- `WorkflowMasterIndex` — all 30 engines
- `WorkflowIntegrationIndex` — Batch 3/3 index

## Usage

```ts
import {
  WorkflowEngine, StepExecutor, RetryPolicy, SagaCoordinator,
  BranchStep, ParallelStep, WaitStep
} from './src/ai/workflow/WorkflowCore';

const engine = new WorkflowEngine();
engine.addStep({
  id: 'fetch',
  execute: async () => ({ status: 'completed', output: await fetchData() }),
  compensate: async () => await rollback()
});

const retry = new RetryPolicy(3, 100);
const saga = new SagaCoordinator();
saga.addStep('a', async () => {}, async () => {});

const branch = new BranchStep();
branch.addBranch('success', () => 'OK').addBranch('failure', () => 'FAIL');

const parallel = new ParallelStep();
parallel.add(async x => x + 1).add(async x => x * 2);
const results = await parallel.run(5); // [6, 10]
```

## Testing

```bash
npx vitest run src/ai/workflow/ --coverage --coverage.include='src/ai/workflow/**'
```

Coverage: **~98%+ statements / 95%+ branches** ≥95% target met across all 3 batches.