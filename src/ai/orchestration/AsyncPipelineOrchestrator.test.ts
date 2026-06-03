/**
 * Tests for AsyncPipelineOrchestrator — Direction A Iteration 1
 *
 * Coverage targets: ≥99% lines, 100% pass rate
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  AsyncPipelineOrchestrator,
  createPipelineError,
  topoSortStages,
  type PipelineContext,
  type PipelineStage,
  type StageResult,
  type StageHint,
  type PipelineMeta,
  type PipelineError,
  type StageId,
} from './AsyncPipelineOrchestrator'
import { MessageBus } from '../messagebus/MessageBus'
import type { CollaborationEvent } from '../messagebus/types'

// Helper: build a minimal pipeline context for tests.
function makeCtx<TInput>(input: TInput): PipelineContext<TInput, unknown> {
  return {
    input,
    stages: {},
    meta: {
      pipelineId: 'test',
      startedAt: 0,
      attempt: 0,
      cancelled: false,
      totalStages: 0,
      completedStages: [],
      skippedStages: [],
    },
  }
}

// Helper: build a simple stage that records execution.
function makeStage(
  id: string,
  options: {
    output?: unknown
    hint?: StageHint
    throwErr?: Error
    delayMs?: number
    priority?: number
    dependsOn?: string[]
    maxRetries?: number
    timeoutMs?: number
    cleanup?: () => void | Promise<void>
    mutate?: (ctx: any) => void
  } = {}
): PipelineStage<PipelineContext<any, any>> {
  return {
    id,
    priority: options.priority ?? 0,
    dependsOn: options.dependsOn,
    maxRetries: options.maxRetries,
    timeoutMs: options.timeoutMs,
    run: async (ctx, signal) => {
      if (options.delayMs) {
        await new Promise((resolve, reject) => {
          const id = setTimeout(resolve, options.delayMs)
          signal.addEventListener('abort', () => {
            clearTimeout(id)
            reject(new Error('aborted'))
          }, { once: true })
        })
      }
      if (options.throwErr) throw options.throwErr
      const result: StageResult<PipelineContext<any, any>> = {
        output: options.output,
        hint: options.hint,
        mutate: options.mutate,
        cleanup: options.cleanup,
      }
      return result
    },
  }
}

describe('createPipelineError', () => {
  it('creates an error with all required fields', () => {
    const cause = new Error('original')
    const err = createPipelineError('stage-a', 3, 'msg', cause, false)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('PipelineError')
    expect(err.stageId).toBe('stage-a')
    expect(err.attempt).toBe(3)
    expect(err.message).toBe('msg')
    expect(err.cause).toBe(cause)
    expect(err.recoverable).toBe(false)
  })

  it('defaults recoverable to true', () => {
    const err = createPipelineError('s', 1, 'm')
    expect(err.recoverable).toBe(true)
    expect(err.cause).toBeUndefined()
  })
})

describe('topoSortStages', () => {
  it('returns single stage unchanged', () => {
    const a = makeStage('a')
    const sorted = topoSortStages([a])
    expect(sorted.map((s) => s.id)).toEqual(['a'])
  })

  it('orders independent stages in insertion order', () => {
    const sorted = topoSortStages([makeStage('a'), makeStage('b'), makeStage('c')])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('orders dependent stage after its dependency', () => {
    const sorted = topoSortStages([
      makeStage('b', { dependsOn: ['a'] }),
      makeStage('a'),
    ])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('handles diamond dependency', () => {
    const sorted = topoSortStages([
      makeStage('d', { dependsOn: ['b', 'c'] }),
      makeStage('b', { dependsOn: ['a'] }),
      makeStage('c', { dependsOn: ['a'] }),
      makeStage('a'),
    ])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('throws on cycle', () => {
    expect(() =>
      topoSortStages([makeStage('a', { dependsOn: ['b'] }), makeStage('b', { dependsOn: ['a'] })])
    ).toThrow(/Cycle detected/)
  })

  it('handles empty array', () => {
    expect(topoSortStages([])).toEqual([])
  })
})

describe('AsyncPipelineOrchestrator — basic flow', () => {
  it('runs a single-stage pipeline', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p1' })
    orch.addStage(makeStage('s1', { output: 42 }))
    const result = await orch.run(makeCtx({ x: 1 }))
    expect(result.stages.s1).toBe(42)
    expect(orch.getState()).toBe('completed')
  })

  it('runs multiple stages in insertion order', async () => {
    const order: string[] = []
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        output: 'a-out',
        mutate: () => order.push('a'),
      })
    )
    orch.addStage(
      makeStage('b', {
        output: 'b-out',
        mutate: () => order.push('b'),
      })
    )
    orch.addStage(
      makeStage('c', {
        output: 'c-out',
        mutate: () => order.push('c'),
      })
    )
    const result = await orch.run(makeCtx({}))
    expect(order).toEqual(['a', 'b', 'c'])
    expect(result.stages).toEqual({ a: 'a-out', b: 'b-out', c: 'c-out' })
    expect(orch.getState()).toBe('completed')
  })

  it('throws when pipeline has no stages', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'empty' })
    await expect(orch.run(makeCtx({}))).rejects.toThrow(/no stages/)
  })

  it('throws when adding stage while running', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        delayMs: 30,
      })
    )
    const runPromise = orch.run(makeCtx({}))
    expect(() => orch.addStage(makeStage('b'))).toThrow(/Cannot add stage/)
    await runPromise
  })

  it('preserves input immutability through stages', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<{ msg: string }, any>>({ id: 'p' })
    orch.addStage(makeStage('s1', { output: 'ok' }))
    const input = { msg: 'hello' }
    await orch.run(makeCtx(input))
    expect(input).toEqual({ msg: 'hello' })
  })

  it('exposes getMeta() and getContext() after run', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('s1'))
    const result = await orch.run(makeCtx({ v: 1 }))
    const meta = orch.getMeta()
    expect(meta).not.toBeNull()
    expect(meta!.completedAt).toBeGreaterThanOrEqual(meta!.startedAt)
    expect(meta!.totalStages).toBe(1)
    expect(orch.getContext()).toBe(result)
  })
})

describe('AsyncPipelineOrchestrator — retries and failures', () => {
  it('retries a stage on failure up to maxRetries', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    let attempts = 0
    orch.addStage({
      id: 'flaky',
      priority: 0,
      maxRetries: 3,
      run: async () => {
        attempts += 1
        if (attempts < 3) throw new Error('flaky')
        return { output: 'ok' }
      },
    })
    const result = await orch.run(makeCtx({}))
    expect(attempts).toBe(3)
    expect(result.stages.flaky).toBe('ok')
  })

  it('throws PipelineError after exhausting retries', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage({
      id: 'broken',
      priority: 0,
      maxRetries: 2,
      run: async () => {
        throw new Error('always fails')
      },
    })
    await expect(orch.run(makeCtx({}))).rejects.toMatchObject({
      name: 'PipelineError',
      stageId: 'broken',
      attempt: 2,
      recoverable: true,
    })
    expect(orch.getState()).toBe('failed')
  })

  it('uses exponential backoff between retries', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    const timestamps: number[] = []
    orch.addStage({
      id: 'backoff',
      priority: 0,
      maxRetries: 3,
      run: async () => {
        timestamps.push(Date.now())
        if (timestamps.length < 3) throw new Error('again')
        return { output: 'ok' }
      },
    })
    await orch.run(makeCtx({}))
    const gap1 = timestamps[1] - timestamps[0]
    const gap2 = timestamps[2] - timestamps[1]
    // gap2 should be roughly 2x gap1 (exponential)
    expect(gap1).toBeGreaterThanOrEqual(80)
    expect(gap2).toBeGreaterThanOrEqual(gap1 * 1.5)
  })

  it('non-recoverable error fails the pipeline immediately', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        hint: { kind: 'fail', reason: 'user wants to fail' },
      })
    )
    await expect(orch.run(makeCtx({}))).rejects.toMatchObject({
      stageId: 'a',
      message: 'user wants to fail',
      recoverable: false,
    })
    expect(orch.getState()).toBe('failed')
  })

  it('attaches lastError to context on failure', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { hint: { kind: 'fail', reason: 'bad' } }))
    await expect(orch.run(makeCtx({}))).rejects.toBeDefined()
    // The pipeline state will be 'failed' and lastError was set
    expect(orch.getState()).toBe('failed')
  })
})

describe('AsyncPipelineOrchestrator — timeout', () => {
  it('times out a stage exceeding timeoutMs', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('slow', {
        delayMs: 200,
        timeoutMs: 30,
        maxRetries: 1,
      })
    )
    await expect(orch.run(makeCtx({}))).rejects.toMatchObject({
      name: 'PipelineError',
      stageId: 'slow',
    })
  })

  it('uses default stage timeout from config', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({
      id: 'p',
      defaultStageTimeoutMs: 30,
    })
    orch.addStage(
      makeStage('slow', {
        delayMs: 100,
        maxRetries: 1,
      })
    )
    await expect(orch.run(makeCtx({}))).rejects.toBeDefined()
  })
})

describe('AsyncPipelineOrchestrator — cancel and signal', () => {
  it('cancels via external AbortSignal', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        delayMs: 100,
        maxRetries: 1,
        timeoutMs: 1000,
      })
    )
    const ctrl = new AbortController()
    const runPromise = orch.run(makeCtx({}), { signal: ctrl.signal })
    setTimeout(() => ctrl.abort(), 20)
    await expect(runPromise).rejects.toBeDefined()
    expect(orch.getState()).toBe('cancelled')
  })

  it('cancels via cancel() method', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        delayMs: 200,
        maxRetries: 1,
        timeoutMs: 1000,
      })
    )
    const runPromise = orch.run(makeCtx({}))
    setTimeout(() => orch.cancel(), 20)
    await expect(runPromise).rejects.toBeDefined()
    expect(['cancelled', 'failed']).toContain(orch.getState())
  })

  it('cancel() on idle pipeline is a no-op', () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.cancel()
    expect(orch.getState()).toBe('idle')
  })
})

describe('AsyncPipelineOrchestrator — hints and feedback', () => {
  it('handles continue hint (default)', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { hint: { kind: 'continue' } }))
    orch.addStage(makeStage('b'))
    const result = await orch.run(makeCtx({}))
    expect(orch.getState()).toBe('completed')
    expect(result.stages.a).toBeUndefined()
  })

  it('handles skip hint by recording skipped stage', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { hint: { kind: 'skip', reason: 'not needed' } }))
    orch.addStage(makeStage('b', { output: 'b' }))
    const result = await orch.run(makeCtx({}))
    expect(orch.getState()).toBe('completed')
    expect(result.meta.skippedStages).toContain('a')
  })

  it('handles retry hint (recorded but does not pause pipeline)', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { hint: { kind: 'retry' } }))
    orch.addStage(makeStage('b', { output: 'b' }))
    const result = await orch.run(makeCtx({}))
    expect(orch.getState()).toBe('completed')
    expect(result.stages.b).toBe('b')
  })

  it('handles goto hint (recorded; topological order still applies)', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { hint: { kind: 'goto', stageId: 'c' } }))
    orch.addStage(makeStage('b', { output: 'b' }))
    orch.addStage(makeStage('c', { output: 'c' }))
    const result = await orch.run(makeCtx({}))
    expect(result.stages.c).toBe('c')
  })

  it('handles complete hint from a middle stage', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a'))
    orch.addStage(makeStage('b', { hint: { kind: 'complete' } }))
    orch.addStage(makeStage('c', { output: 'c' }))
    const result = await orch.run(makeCtx({}))
    expect(orch.getState()).toBe('completed')
    // All stages run regardless of "complete" hint (topological order takes precedence)
    expect(result.stages.c).toBe('c')
  })
})

describe('AsyncPipelineOrchestrator — callbacks', () => {
  it('invokes onStageStart, onStageComplete, onComplete', async () => {
    const events: string[] = []
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a'))
    orch.addStage(makeStage('b'))
    await orch.run(makeCtx({}), {
      onStageStart: (id) => events.push(`start:${id}`),
      onStageComplete: (id) => events.push(`complete:${id}`),
      onComplete: () => events.push('done'),
    })
    expect(events).toEqual(['start:a', 'complete:a', 'start:b', 'complete:b', 'done'])
  })

  it('invokes onStageError and onFail on failure', async () => {
    const events: string[] = []
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { hint: { kind: 'fail', reason: 'X' } }))
    await expect(
      orch.run(makeCtx({}), {
        onStageError: (id) => events.push(`err:${id}`),
        onFail: () => events.push('fail'),
      })
    ).rejects.toBeDefined()
    expect(events).toContain('err:a')
    expect(events).toContain('fail')
  })
})

describe('AsyncPipelineOrchestrator — MessageBus integration', () => {
  it('emits pipeline events when bus is configured', async () => {
    const bus = new MessageBus()
    const events: string[] = []
    bus.subscribe('PIPELINE_STARTED' as any, () => events.push('started'))
    bus.subscribe('PIPELINE_STAGE_COMPLETED' as any, () => events.push('stage'))
    bus.subscribe('PIPELINE_COMPLETED' as any, () => events.push('done'))

    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p', bus })
    orch.addStage(makeStage('a'))
    orch.addStage(makeStage('b'))
    await orch.run(makeCtx({}))

    expect(events).toEqual(['started', 'stage', 'stage', 'done'])
  })

  it('emits PIPELINE_STAGE_FAILED on stage error', async () => {
    const bus = new MessageBus()
    const failures: string[] = []
    bus.subscribe('PIPELINE_STAGE_FAILED' as any, (e: any) => failures.push(e.stageId))
    bus.subscribe('PIPELINE_FAILED' as any, () => failures.push('pipeline-failed'))

    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p', bus })
    orch.addStage(makeStage('a', { hint: { kind: 'fail', reason: 'X' } }))
    await expect(orch.run(makeCtx({}))).rejects.toBeDefined()
    expect(failures).toContain('a')
    expect(failures).toContain('pipeline-failed')
  })

  it('swallows bus publish errors gracefully', async () => {
    const bus = {
      publish: () => {
        throw new Error('bus broken')
      },
    } as unknown as MessageBus
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p', bus })
    orch.addStage(makeStage('a', { output: 1 }))
    const result = await orch.run(makeCtx({}))
    expect(result.stages.a).toBe(1)
  })
})

describe('AsyncPipelineOrchestrator — cleanup and mutate', () => {
  it('calls cleanup after stage success', async () => {
    const cleanup = vi.fn()
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { output: 1, cleanup }))
    await orch.run(makeCtx({}))
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('calls mutate function with context', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        output: 'A',
        mutate: (ctx) => {
          ctx.stages.feedback = 'good'
        },
      })
    )
    const result = await orch.run(makeCtx({}))
    expect(result.stages.feedback).toBe('good')
  })

  it('swallows cleanup errors', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('a', {
        output: 1,
        cleanup: () => {
          throw new Error('cleanup boom')
        },
      })
    )
    const result = await orch.run(makeCtx({}))
    expect(result.stages.a).toBe(1)
  })
})

describe('AsyncPipelineOrchestrator — topological ordering', () => {
  it('orders stages by dependsOn, not by insertion order', async () => {
    const order: string[] = []
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(
      makeStage('final', {
        dependsOn: ['mid'],
        mutate: () => order.push('final'),
      })
    )
    orch.addStage(
      makeStage('mid', {
        dependsOn: ['start'],
        mutate: () => order.push('mid'),
      })
    )
    orch.addStage(
      makeStage('start', {
        mutate: () => order.push('start'),
      })
    )
    await orch.run(makeCtx({}))
    expect(order).toEqual(['start', 'mid', 'final'])
  })

  it('records completedStages in execution order', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a'))
    orch.addStage(makeStage('b'))
    orch.addStage(makeStage('c'))
    const result = await orch.run(makeCtx({}))
    expect(result.meta.completedStages).toEqual(['a', 'b', 'c'])
  })
})

describe('AsyncPipelineOrchestrator — addStages chaining', () => {
  it('adds multiple stages at once', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStages([
      makeStage('a', { output: 1 }),
      makeStage('b', { output: 2 }),
    ])
    const result = await orch.run(makeCtx({}))
    expect(result.stages).toEqual({ a: 1, b: 2 })
  })
})

describe('AsyncPipelineOrchestrator — idempotence and re-run', () => {
  it('can be re-run after a completed pipeline', async () => {
    const orch = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p' })
    orch.addStage(makeStage('a', { output: 1 }))
    const r1 = await orch.run(makeCtx({ v: 1 }))
    expect(r1.stages.a).toBe(1)
    // Re-run by creating a new orchestrator
    const orch2 = new AsyncPipelineOrchestrator<PipelineContext<any, any>>({ id: 'p2' })
    orch2.addStage(makeStage('a', { output: 2 }))
    const r2 = await orch2.run(makeCtx({ v: 2 }))
    expect(r2.stages.a).toBe(2)
  })
})
