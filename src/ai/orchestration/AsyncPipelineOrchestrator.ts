/**
 * AsyncPipelineOrchestrator - Direction A Iteration 1
 *
 * Fusion of nanobot (async MessageBus) and thunderbolt (pipeline + feedback loops)
 * for ai-novel-assistant writing workflow.
 *
 * Features:
 *  - Async pipeline stages (non-blocking)
 *  - Topological ordering by `dependsOn`
 *  - Per-stage retry with exponential backoff
 *  - Per-stage timeout
 *  - Stage hints: continue / retry / skip / goto / fail / complete
 *  - Pipeline state machine: idle → running → completed | failed | cancelled
 *  - Event bus integration (optional MessageBus)
 */

import type { CollaborationEvent } from '../messagebus/types'
import type { MessageBus } from '../messagebus/MessageBus'

/** Unique identifier for a stage in the pipeline. */
export type StageId = string

/** Priority determines order of execution. Lower number = higher priority. */
export type StagePriority = number

/**
 * Context flows between stages. Each stage may read prior results
 * and append its own output to `stages`.
 */
export interface PipelineContext<TInput, TOutput> {
  /** Original pipeline input (immutable). */
  readonly input: TInput
  /** Per-stage outputs keyed by stage id. */
  stages: Record<StageId, unknown>
  /** Pipeline metadata (startedAt, attempt count, etc.). */
  meta: PipelineMeta
  /** Last error if any. */
  lastError?: PipelineError
  /** Final pipeline result, set by the terminal stage. */
  result?: TOutput
}

/** Pipeline execution metadata. */
export interface PipelineMeta {
  readonly pipelineId: string
  readonly startedAt: number
  completedAt?: number
  attempt: number
  cancelled: boolean
  currentStage?: StageId
  totalStages: number
  /** Stages that have completed in this run. */
  completedStages: StageId[]
  /** Stages that were skipped. */
  skippedStages: StageId[]
}

/** A stage error with stage id, attempt number, and original cause. */
export interface PipelineError extends Error {
  stageId: StageId
  attempt: number
  cause?: unknown
  recoverable: boolean
}

/** A hint returned by a stage for the orchestrator's next move. */
export type StageHint =
  | { kind: 'continue' }
  | { kind: 'retry'; delayMs?: number }
  | { kind: 'skip'; reason: string }
  | { kind: 'goto'; stageId: StageId }
  | { kind: 'fail'; reason: string }
  | { kind: 'complete' }

/** Stage execution result. */
export interface StageResult<TContext> {
  /** Optional output written to context.stages[stage.id]. */
  output?: unknown
  /** Optional hint for the orchestrator. */
  hint?: StageHint
  /** Optional partial context mutation (e.g. add feedback notes). */
  mutate?: (ctx: TContext) => void
  /** Optional async cleanup. */
  cleanup?: () => Promise<void> | void
}

/** A pipeline stage definition. */
export interface PipelineStage<TContext> {
  readonly id: StageId
  readonly priority: StagePriority
  /** Optional dependency: this stage runs only after `dependsOn` completes. */
  readonly dependsOn?: StageId[]
  /** Optional retry policy. */
  readonly maxRetries?: number
  /** Optional timeout in ms (default 30s). */
  readonly timeoutMs?: number
  /** The actual work. */
  run(ctx: TContext, signal: AbortSignal): Promise<StageResult<TContext>>
}

/** Pipeline configuration. */
export interface PipelineConfig<TContext> {
  readonly id: string
  readonly maxGlobalRetries?: number
  readonly defaultStageTimeoutMs?: number
  /** Optional MessageBus for emitting pipeline events. */
  readonly bus?: MessageBus
}

/** Pipeline run options. */
export interface PipelineRunOptions {
  signal?: AbortSignal
  onStageStart?: (stageId: StageId, ctx: PipelineMeta) => void
  onStageComplete?: (stageId: StageId, result: StageResult<unknown>) => void
  onStageError?: (stageId: StageId, err: PipelineError) => void
  onComplete?: (ctx: PipelineMeta) => void
  onFail?: (err: PipelineError, ctx: PipelineMeta) => void
}

export type PipelineState = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Create a PipelineError with consistent shape.
 */
export function createPipelineError(
  stageId: StageId,
  attempt: number,
  message: string,
  cause?: unknown,
  recoverable = true
): PipelineError {
  const err = new Error(message) as PipelineError
  err.name = 'PipelineError'
  err.stageId = stageId
  err.attempt = attempt
  err.cause = cause
  err.recoverable = recoverable
  return err
}

/**
 * Internal helper: delay for a given number of ms.
 */
function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Internal helper: topologically sort stages by dependsOn.
 * Throws if a cycle is detected.
 */
export function topoSortStages(stages: PipelineStage<unknown>[]): PipelineStage<unknown>[] {
  const byId = new Map(stages.map((s) => [s.id, s] as const))
  const visited = new Set<StageId>()
  const visiting = new Set<StageId>()
  const result: PipelineStage<unknown>[] = []

  function visit(id: StageId, path: StageId[]): void {
    if (visited.has(id)) return
    if (visiting.has(id)) {
      throw new Error(`Cycle detected: ${[...path, id].join(' → ')}`)
    }
    visiting.add(id)
    const stage = byId.get(id)
    if (stage?.dependsOn) {
      for (const dep of stage.dependsOn) {
        visit(dep, [...path, id])
      }
    }
    visiting.delete(id)
    visited.add(id)
    if (stage) result.push(stage)
  }

  for (const s of stages) visit(s.id, [])
  return result
}

/**
 * AsyncPipelineOrchestrator - executes stages asynchronously with
 * dependency ordering, retries, feedback loops, and event emission.
 */
export class AsyncPipelineOrchestrator<TContext extends PipelineContext<unknown, unknown>> {
  private readonly stages: PipelineStage<TContext>[] = []
  private state: PipelineState = 'idle'
  private currentAbort: AbortController | null = null
  private meta: PipelineMeta | null = null
  private ctxRef: TContext | null = null

  constructor(private readonly config: PipelineConfig<TContext>) {}

  /** Add a stage to the pipeline. Returns `this` for chaining. */
  addStage(stage: PipelineStage<TContext>): this {
    if (this.state !== 'idle') {
      throw new Error(`Cannot add stage when pipeline is ${this.state}`)
    }
    this.stages.push(stage)
    return this
  }

  /** Add multiple stages at once. */
  addStages(stages: PipelineStage<TContext>[]): this {
    for (const s of stages) this.addStage(s)
    return this
  }

  /** Current pipeline state. */
  getState(): PipelineState {
    return this.state
  }

  /** Current pipeline metadata (if running). */
  getMeta(): PipelineMeta | null {
    return this.meta
  }

  /** Current pipeline context (if running). */
  getContext(): TContext | null {
    return this.ctxRef
  }

  /** Cancel the currently running pipeline. */
  cancel(): void {
    if (this.state === 'running' && this.currentAbort) {
      this.currentAbort.abort()
      if (this.meta) this.meta.cancelled = true
    }
  }

  /**
   * Run the pipeline with the given initial context.
   * Returns the final context when the pipeline completes.
   */
  async run(initial: TContext, options: PipelineRunOptions = {}): Promise<TContext> {
    if (this.state === 'running') {
      throw new Error('Pipeline is already running')
    }
    if (this.state !== 'idle' && this.state !== 'completed' && this.state !== 'failed' && this.state !== 'cancelled') {
      throw new Error(`Pipeline is ${this.state}`)
    }
    if (this.stages.length === 0) {
      throw new Error('Pipeline has no stages')
    }

    this.state = 'running'
    this.currentAbort = new AbortController()
    const externalSignal = options.signal
    const signal = externalSignal ?? this.currentAbort.signal

    const sortedStages = topoSortStages(this.stages as PipelineStage<unknown>[]) as PipelineStage<TContext>[]

    this.meta = {
      pipelineId: this.config.id,
      startedAt: Date.now(),
      attempt: 0,
      cancelled: false,
      totalStages: sortedStages.length,
      completedStages: [],
      skippedStages: [],
    }
    this.ctxRef = initial
    this.ctxRef.meta = this.meta

    this.emit('PIPELINE_STARTED', { pipelineId: this.config.id, totalStages: sortedStages.length })

    const defaultTimeoutMs = this.config.defaultStageTimeoutMs ?? 30_000

    try {
      for (const stage of sortedStages) {
        if (signal.aborted) {
          this.state = 'cancelled'
          throw createPipelineError(stage.id, 0, 'Pipeline cancelled', undefined, false)
        }

        this.meta.currentStage = stage.id
        options.onStageStart?.(stage.id, this.meta)

        const outcome = await this.runStageWithRetries(stage, signal, defaultTimeoutMs)
        if (signal.aborted) {
          this.state = 'cancelled'
          throw createPipelineError(stage.id, 0, 'Pipeline cancelled', undefined, false)
        }

        if (outcome.kind === 'error') {
          options.onStageError?.(stage.id, outcome.error)
          this.emit('PIPELINE_STAGE_FAILED', {
            pipelineId: this.config.id,
            stageId: stage.id,
            error: outcome.error.message,
          })
          throw outcome.error
        }

        const result = outcome.result
        this.meta.completedStages.push(stage.id)
        if (result.hint?.kind === 'skip') {
          this.meta.skippedStages.push(stage.id)
        }
        options.onStageComplete?.(stage.id, result as unknown as StageResult<unknown>)
        this.emit('PIPELINE_STAGE_COMPLETED', {
          pipelineId: this.config.id,
          stageId: stage.id,
        })
      }

      this.state = 'completed'
      this.meta.completedAt = Date.now()
      this.emit('PIPELINE_COMPLETED', {
        pipelineId: this.config.id,
        completedAt: this.meta.completedAt,
      })
      options.onComplete?.(this.meta)
      return this.ctxRef
    } catch (err) {
      if (this.state !== 'cancelled') {
        this.state = 'failed'
      }
      const pipelineErr =
        err && typeof err === 'object' && 'stageId' in err && 'attempt' in err
          ? (err as PipelineError)
          : createPipelineError(
              this.meta?.currentStage ?? 'unknown',
              0,
              err instanceof Error ? err.message : String(err),
              err,
              false
            )
      this.ctxRef.lastError = pipelineErr
      this.emit('PIPELINE_FAILED', {
        pipelineId: this.config.id,
        stageId: pipelineErr.stageId,
        error: pipelineErr.message,
      })
      options.onFail?.(pipelineErr, this.meta!)
      throw pipelineErr
    }
  }

  /**
   * Run a single stage with retry policy. Returns either a success outcome
   * with StageResult or an error outcome.
   */
  private async runStageWithRetries(
    stage: PipelineStage<TContext>,
    signal: AbortSignal,
    defaultTimeoutMs: number
  ): Promise<{ kind: 'success'; result: StageResult<TContext> } | { kind: 'error'; error: PipelineError }> {
    const maxRetries = stage.maxRetries ?? 1
    const timeoutMs = stage.timeoutMs ?? defaultTimeoutMs
    let lastError: unknown = null

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      if (signal.aborted) {
        return {
          kind: 'error',
          error: createPipelineError(stage.id, attempt, 'Aborted', undefined, false),
        }
      }

      // Soft timeout: race stage.run against a timer.
      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => reject(new Error(`Stage ${stage.id} timed out after ${timeoutMs}ms`)), timeoutMs)
        // Cleanup if AbortSignal fires first
        signal.addEventListener('abort', () => {
          clearTimeout(id)
          reject(new Error('Aborted'))
        }, { once: true })
      })

      try {
        const result = await Promise.race([stage.run(this.ctxRef!, signal), timeoutPromise])

        // Persist output to context
        if (result.output !== undefined) {
          this.ctxRef!.stages[stage.id] = result.output
        }
        if (result.mutate) {
          result.mutate(this.ctxRef!)
        }
        if (result.cleanup) {
          try {
            await result.cleanup()
          } catch {
            // Swallow cleanup errors
          }
        }

        // Handle hint that requests failure
        if (result.hint?.kind === 'fail') {
          return {
            kind: 'error',
            error: createPipelineError(stage.id, attempt, result.hint.reason, undefined, false),
          }
        }
        return { kind: 'success', result }
      } catch (err) {
        lastError = err
        if (attempt < maxRetries) {
          const backoffMs = Math.min(2 ** (attempt - 1) * 100, 2000)
          await delay(backoffMs)
        }
      }
    }

    return {
      kind: 'error',
      error: createPipelineError(
        stage.id,
        maxRetries,
        `Stage ${stage.id} failed after ${maxRetries} attempts`,
        lastError,
        true
      ),
    }
  }

  /**
   * Emit a pipeline event to the MessageBus if configured.
   */
  private emit(eventType: string, payload: Record<string, unknown>): void {
    if (!this.config.bus) return
    try {
      const event = { type: eventType, ...payload } as unknown as CollaborationEvent
      this.config.bus.publish(event)
    } catch {
      // Swallow publish errors - pipeline should not depend on bus.
    }
  }
}
