/**
 * V2097 Direction A Iteration 12/30 Round 6: IterativeRefinement
 *
 * Iterative self-refinement loop — runs a refinement pass against an input
 * until a quality threshold is met, an exit condition fires, or the
 * configured number of passes is exhausted.
 *
 * Inspired by:
 * - generic-agent-design: self-evolution iteration
 * - chatdev-design: iterative phase with quality gate
 * - claude-code-design: refinement loop with bounded budget
 */

export interface RefinementConfig {
  /** Maximum number of refinement passes. */
  maxPasses: number;
  /** Quality score in [0, 1] at which refinement should stop. */
  targetQuality: number;
  /** Quality must not regress by more than this much between passes. */
  minImprovement: number;
  /** Optional labels / tags for logging. */
  label?: string;
  /** Time provider for tests. */
  now?: () => number;
}

export interface RefinementPass<T> {
  index: number;
  input: T;
  output: T;
  quality: number;
  durationMs: number;
  timestamp: number;
}

export interface RefinementResult<T> {
  passes: RefinementPass<T>[];
  finalOutput: T;
  finalQuality: number;
  stoppedReason: 'target' | 'max-passes' | 'no-improvement' | 'callback-halt';
  totalDurationMs: number;
}

export interface RefinementOptions<T> {
  /** User-supplied refinement callback. Returns the refined output and its quality. */
  refine: (input: T, passIndex: number) => { output: T; quality: number };
  /** Initial input. */
  initial: T;
  /** Optional halt callback invoked after each pass. Return true to stop early. */
  shouldHalt?: (pass: RefinementPass<T>) => boolean;
  /** Optional progress callback. */
  onPass?: (pass: RefinementPass<T>) => void;
}

/**
 * Validate the refinement config. Throws on invalid input.
 */
export function validateRefinementConfig(config: RefinementConfig): void {
  if (!Number.isFinite(config.maxPasses) || config.maxPasses < 1) {
    throw new Error(`maxPasses must be a positive integer, got ${config.maxPasses}`);
  }
  if (
    !Number.isFinite(config.targetQuality) ||
    config.targetQuality < 0 ||
    config.targetQuality > 1
  ) {
    throw new Error(
      `targetQuality must be a finite number in [0, 1], got ${config.targetQuality}`
    );
  }
  if (
    !Number.isFinite(config.minImprovement) ||
    config.minImprovement < 0
  ) {
    throw new Error(`minImprovement must be a finite non-negative number`);
  }
}

/**
 * Run iterative refinement. Stops at the first of:
 *  - quality reaches `targetQuality`
 *  - `maxPasses` is reached
 *  - improvement between passes is below `minImprovement`
 *  - `shouldHalt` returns true
 */
export function runIterativeRefinement<T>(
  config: RefinementConfig,
  options: RefinementOptions<T>
): RefinementResult<T> {
  validateRefinementConfig(config);
  const now = config.now ?? (() => Date.now());
  const start = now();

  const passes: RefinementPass<T>[] = [];
  let input = options.initial;
  let lastQuality = 0;
  let stoppedReason: RefinementResult<T>['stoppedReason'] = 'max-passes';

  for (let i = 0; i < config.maxPasses; i++) {
    const passStart = now();
    const { output, quality } = options.refine(input, i + 1);
    const passEnd = now();

    const pass: RefinementPass<T> = {
      index: i + 1,
      input,
      output,
      quality,
      durationMs: passEnd - passStart,
      timestamp: passEnd,
    };
    passes.push(pass);
    options.onPass?.(pass);

    if (quality >= config.targetQuality) {
      stoppedReason = 'target';
      input = output;
      lastQuality = quality;
      break;
    }

    if (passes.length >= 2) {
      const prev = passes[passes.length - 2];
      const improvement = quality - prev.quality;
      if (improvement < config.minImprovement) {
        stoppedReason = 'no-improvement';
        input = output;
        lastQuality = quality;
        break;
      }
    }

    if (options.shouldHalt && options.shouldHalt(pass)) {
      stoppedReason = 'callback-halt';
      input = output;
      lastQuality = quality;
      break;
    }

    input = output;
    lastQuality = quality;
  }

  const totalDurationMs = now() - start;
  return {
    passes,
    finalOutput: input,
    finalQuality: lastQuality,
    stoppedReason,
    totalDurationMs,
  };
}

/** Compute the improvement series (quality delta between consecutive passes). */
export function improvementSeries<T>(result: RefinementResult<T>): number[] {
  const out: number[] = [];
  for (let i = 1; i < result.passes.length; i++) {
    out.push(result.passes[i].quality - result.passes[i - 1].quality);
  }
  return out;
}

/** Find the pass index that achieved the highest quality (-1 if none). */
export function bestPassIndex<T>(result: RefinementResult<T>): number {
  let bestIdx = -1;
  let bestQ = -Infinity;
  for (let i = 0; i < result.passes.length; i++) {
    if (result.passes[i].quality > bestQ) {
      bestQ = result.passes[i].quality;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/** Return a snapshot of a single refinement pass for logging. */
export function passSnapshot<T>(pass: RefinementPass<T>): {
  index: number;
  quality: number;
  durationMs: number;
  timestamp: number;
} {
  return {
    index: pass.index,
    quality: pass.quality,
    durationMs: pass.durationMs,
    timestamp: pass.timestamp,
  };
}

/** Determine if a refinement run "converged" (target met OR diminishing returns). */
export function didConverge<T>(result: RefinementResult<T>): boolean {
  return result.stoppedReason === 'target' || result.stoppedReason === 'no-improvement';
}
