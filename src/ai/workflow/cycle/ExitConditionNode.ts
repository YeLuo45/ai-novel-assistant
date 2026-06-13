/**
 * V2090 Direction A Iteration 5/30 Round 6: ExitConditionNode
 *
 * Workflow loop exit condition node. Determines when an iteration loop
 * should terminate based on quality / threshold / diff / count metrics.
 *
 * Inspired by:
 * - chatdev-design: ExitCondition evaluation in iterative refinement loops
 * - thunderbolt-design: feedback convergence detection via diff threshold
 * - nanobot-design: composite gating of asynchronous worker retries
 *
 * Five condition kinds:
 * - 'quality'   : quality >= qualityThreshold
 * - 'threshold' : quality > qualityThreshold (strict greater)
 * - 'diff'      : |diffMagnitude| <= diffThreshold (convergence)
 * - 'count'     : iterationCount >= maxCount
 * - 'composite' : arbitrary boolean tree over sub-conditions
 */

export type ConditionType =
  | 'quality'
  | 'threshold'
  | 'diff'
  | 'count'
  | 'composite';

/** Logical operator used inside a composite node. */
export type CompositeLogic = 'AND' | 'OR';

/** Per-kind threshold configuration. */
export interface ConditionParams {
  /** Minimum acceptable quality (0..1). */
  qualityThreshold?: number;
  /** Maximum allowed |diffMagnitude| before exit. */
  diffThreshold?: number;
  /** Maximum iteration count before forced exit. */
  maxCount?: number;
  /** Sub-conditions for 'composite' kind. */
  children?: ExitConditionNode[];
  /** Boolean operator across children (default AND). */
  logic?: CompositeLogic;
}

/** Runtime metrics used to evaluate the condition. */
export interface LoopMetrics {
  quality: number;
  diffMagnitude: number;
  iterationCount: number;
}

/** Discriminated union describing every supported condition shape. */
export interface ExitConditionNode {
  id: string;
  type: ConditionType;
  params: ConditionParams;
  /** Optional human-readable label for diagnostics. */
  label?: string;
}

/** Result of validation: ok=true, or ok=false with an error list. */
export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/* ------------------------------------------------------------------------- */
/* Defaults & helpers                                                         */
/* ------------------------------------------------------------------------- */

let _idCounter = 0;

/** Produce a fresh unique node id without requiring crypto. */
export function nextConditionId(prefix: string = 'cond'): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter}`;
}

/** Reset the id counter (test helper). */
export function resetConditionIdCounter(): void {
  _idCounter = 0;
}

/** Clamp a number to the inclusive [lo, hi] range. */
export function clamp(value: number, lo: number, hi: number): number {
  if (Number.isNaN(value)) return lo;
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

/** Normalize metrics so missing fields become finite defaults. */
export function normalizeMetrics(metrics: Partial<LoopMetrics> | undefined): LoopMetrics {
  return {
    quality: typeof metrics?.quality === 'number' ? metrics.quality : 0,
    diffMagnitude:
      typeof metrics?.diffMagnitude === 'number' ? metrics.diffMagnitude : 0,
    iterationCount:
      typeof metrics?.iterationCount === 'number' ? metrics.iterationCount : 0,
  };
}

/* ------------------------------------------------------------------------- */
/* Construction                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Create a new ExitConditionNode. Throws on invalid params.
 */
export function createExitCondition(
  type: ConditionType,
  params: ConditionParams,
  options: { id?: string; label?: string } = {}
): ExitConditionNode {
  if (!isKnownType(type)) {
    throw new Error(`createExitCondition: unknown condition type "${type}"`);
  }
  const node: ExitConditionNode = {
    id: options.id ?? nextConditionId(type),
    type,
    params: { ...params },
  };
  if (options.label !== undefined) node.label = options.label;
  // Validate eagerly so callers fail fast.
  const v = validateConditions(node);
  if (!v.ok) {
    throw new Error(`createExitCondition: invalid params: ${v.errors.join('; ')}`);
  }
  return node;
}

/** Type guard for known ConditionType values. */
export function isKnownType(type: string): type is ConditionType {
  return (
    type === 'quality' ||
    type === 'threshold' ||
    type === 'diff' ||
    type === 'count' ||
    type === 'composite'
  );
}

/* ------------------------------------------------------------------------- */
/* Evaluation                                                                  */
/* ------------------------------------------------------------------------- */

/** Validate the optional `logic` field on composite params. */
function isKnownLogic(logic: unknown): logic is CompositeLogic {
  return logic === 'AND' || logic === 'OR';
}

/**
 * Evaluate whether the loop should exit given current metrics.
 * Composite nodes recurse into children using the logic operator
 * (default AND).  NOT is honoured through node.label === 'not'.
 *
 * Always uses evaluateWithLabel internally so nested NOT semantics
 * work correctly even inside andConditions / orConditions.
 */
export function evaluate(node: ExitConditionNode, metrics: LoopMetrics): boolean {
  const m = normalizeMetrics(metrics);
  switch (node.type) {
    case 'quality':
      // Inclusive bound: quality meets or exceeds threshold.
      return m.quality >= (node.params.qualityThreshold ?? 0);
    case 'threshold':
      // Strict bound: quality exceeds threshold.
      return m.quality > (node.params.qualityThreshold ?? 0);
    case 'diff':
      // Convergence: absolute diff must fall within threshold.
      return Math.abs(m.diffMagnitude) <= (node.params.diffThreshold ?? 0);
    case 'count':
      return m.iterationCount >= (node.params.maxCount ?? 0);
    case 'composite': {
      const children = node.params.children ?? [];
      const logic: CompositeLogic = isKnownLogic(node.params.logic)
        ? node.params.logic
        : 'AND';
      // Empty composite is vacuously true under AND, false under OR.
      if (children.length === 0) return logic === 'AND';
      if (logic === 'AND') {
        for (const child of children) {
          if (!evaluateWithLabel(child, m)) return false;
        }
        return true;
      }
      // OR
      for (const child of children) {
        if (evaluateWithLabel(child, m)) return true;
      }
      return false;
    }
  }
}

/** Pure helper: AND of two evaluated nodes against the same metrics. */
export function andConditions(
  a: ExitConditionNode,
  b: ExitConditionNode
): ExitConditionNode {
  return createExitCondition('composite', {
    children: [a, b],
    logic: 'AND',
  });
}

/** Pure helper: OR of two evaluated nodes against the same metrics. */
export function orConditions(
  a: ExitConditionNode,
  b: ExitConditionNode
): ExitConditionNode {
  return createExitCondition('composite', {
    children: [a, b],
    logic: 'OR',
  });
}

/**
 * Pure helper: NOT of a single node.  Implemented as a composite with
 * a single child and the marker label 'not' so evaluateWithLabel
 * inverts the boolean result.
 */
export function notCondition(a: ExitConditionNode): ExitConditionNode {
  return createExitCondition('composite', {
    children: [a],
    logic: 'AND',
  }, { label: 'not' });
}

/**
 * Evaluate a node honouring the 'not' marker label.  Used to give
 * notCondition correct semantics even when composed inside andConditions
 * or orConditions.
 */
export function evaluateWithLabel(
  node: ExitConditionNode,
  metrics: LoopMetrics
): boolean {
  const raw = evaluate(node, metrics);
  if (node.label === 'not') return !raw;
  return raw;
}

/* ------------------------------------------------------------------------- */
/* Validation                                                                 */
/* ------------------------------------------------------------------------- */

/** True iff the supplied value is a finite number. */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validate an exit condition node's configuration. Returns a
 * ValidationResult listing every detected problem.
 */
export function validateConditions(node: ExitConditionNode): ValidationResult {
  const errors: string[] = [];

  if (!node || typeof node !== 'object') {
    return { ok: false, errors: ['node must be an object'] };
  }
  if (typeof node.id !== 'string' || node.id.length === 0) {
    errors.push('node.id must be a non-empty string');
  }
  if (!isKnownType(node.type)) {
    errors.push(`node.type "${node.type}" is not a known condition type`);
    // No point continuing - we cannot validate params against an unknown type.
    return { ok: false, errors };
  }
  if (!node.params || typeof node.params !== 'object') {
    errors.push('node.params must be an object');
    return { ok: false, errors };
  }

  switch (node.type) {
    case 'quality':
    case 'threshold':
      if (!isFiniteNumber(node.params.qualityThreshold)) {
        errors.push(`${node.type}: qualityThreshold must be a finite number`);
      } else if (
        node.params.qualityThreshold < 0 ||
        node.params.qualityThreshold > 1
      ) {
        errors.push(`${node.type}: qualityThreshold must be within [0, 1]`);
      }
      break;
    case 'diff':
      if (!isFiniteNumber(node.params.diffThreshold)) {
        errors.push('diff: diffThreshold must be a finite number');
      } else if (node.params.diffThreshold < 0) {
        errors.push('diff: diffThreshold must be >= 0');
      }
      break;
    case 'count':
      if (!isFiniteNumber(node.params.maxCount)) {
        errors.push('count: maxCount must be a finite number');
      } else if (node.params.maxCount < 0) {
        errors.push('count: maxCount must be >= 0');
      }
      break;
    case 'composite':
      if (!Array.isArray(node.params.children)) {
        errors.push('composite: children must be an array');
      } else {
        for (let i = 0; i < node.params.children.length; i++) {
          const child = node.params.children[i];
          const cv = validateConditions(child);
          if (!cv.ok) {
            errors.push(`composite.children[${i}]: ${cv.errors.join('; ')}`);
          }
        }
      }
      if (
        node.params.logic !== undefined &&
        !isKnownLogic(node.params.logic)
      ) {
        errors.push('composite: logic must be "AND" or "OR" if provided');
      }
      break;
  }

  return { ok: errors.length === 0, errors };
}

/* ------------------------------------------------------------------------- */
/* Inspection                                                                 */
/* ------------------------------------------------------------------------- */

/** Compute the total number of (transitive) nodes in a composite tree. */
export function conditionSize(node: ExitConditionNode): number {
  if (node.type === 'composite') {
    const children = node.params.children ?? [];
    let total = 1;
    for (const child of children) total += conditionSize(child);
    return total;
  }
  return 1;
}

/** Collect all node ids in pre-order traversal. */
export function collectIds(node: ExitConditionNode): string[] {
  const out: string[] = [node.id];
  if (node.type === 'composite') {
    for (const child of node.params.children ?? []) {
      out.push(...collectIds(child));
    }
  }
  return out;
}

/** Pretty-print a node for debug logs. */
export function describeCondition(node: ExitConditionNode, depth: number = 0): string {
  const pad = '  '.repeat(depth);
  const head = `${pad}${node.type}#${node.id}`;
  if (node.type === 'composite') {
    const children = node.params.children ?? [];
    if (children.length === 0) return `${head} []`;
    const childDescs = children
      .map((c) => describeCondition(c, depth + 1))
      .join('\n');
    return `${head}\n${childDescs}`;
  }
  const t = node.type;
  if (t === 'quality' || t === 'threshold') {
    return `${head} q>=${node.params.qualityThreshold}`;
  }
  if (t === 'diff') return `${head} |d|<=${node.params.diffThreshold}`;
  return `${head} count>=${node.params.maxCount}`;
}
