/**
 * protocol/ABTesting.ts (V2516-V2520) - 5 engines
 *
 * - V2516 Experiment: 实验定义
 * - V2517 Variant: 实验变体
 * - V2518 BucketAssigner: 桶分配（hash）
 * - V2519 ExperimentRunner: 运行 + 收集结果
 * - V2520 SignificanceTest: 统计显著性
 */

// =============================================================================
// V2517: Variant
// =============================================================================

export interface Variant {
  variantId: string
  name: string
  weight: number  // 流量权重（整数比）
  payload: Record<string, unknown>
}

// =============================================================================
// V2516: Experiment
// =============================================================================

export interface Experiment {
  experimentId: string
  name: string
  description: string
  variants: Variant[]
  startTime: number
  endTime?: number
  status: 'draft' | 'running' | 'paused' | 'completed'
  /** 显著性阈值（p-value） */
  significanceLevel: number
  /** 最小样本量 */
  minSampleSize: number
}

export function validateExperiment(exp: Experiment): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (exp.variants.length < 2) errors.push('need at least 2 variants')
  const totalWeight = exp.variants.reduce((a, v) => a + v.weight, 0)
  if (totalWeight <= 0) errors.push('total weight must be > 0')
  if (exp.significanceLevel <= 0 || exp.significanceLevel >= 1) {
    errors.push('significanceLevel must be in (0, 1)')
  }
  if (exp.minSampleSize < 1) errors.push('minSampleSize must be >= 1')
  return { valid: errors.length === 0, errors }
}

// =============================================================================
// V2518: BucketAssigner
// =============================================================================

export class BucketAssigner {
  /** 用 userId + experimentId 哈希分桶（保证一致性） */
  assign(userId: string, experimentId: string, variants: Variant[]): Variant {
    const totalWeight = variants.reduce((a, v) => a + v.weight, 0)
    const bucket = this._hashBucket(userId, experimentId, totalWeight)
    let acc = 0
    for (const v of variants) {
      acc += v.weight
      if (bucket < acc) return v
    }
    return variants[variants.length - 1]
  }

  /** 模拟 N 次分配并统计分布 */
  simulateDistribution(userIds: string[], experimentId: string, variants: Variant[]): Map<string, number> {
    const counts = new Map<string, number>()
    for (const v of variants) counts.set(v.variantId, 0)
    for (const u of userIds) {
      const v = this.assign(u, experimentId, variants)
      counts.set(v.variantId, (counts.get(v.variantId) ?? 0) + 1)
    }
    return counts
  }

  /** 简单字符串 hash（不依赖 Node crypto，跨平台可用） */
  private _hashBucket(userId: string, experimentId: string, modulo: number): number {
    if (modulo <= 0) return 0
    const s = `${userId}:${experimentId}`
    let h = 2166136261  // FNV offset basis
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = (h * 16777619) >>> 0  // FNV prime
    }
    return h % modulo
  }
}

// =============================================================================
// V2519: ExperimentRunner
// =============================================================================

export interface ExperimentAssignment {
  userId: string
  experimentId: string
  variantId: string
  assignedAt: number
}

export interface ExperimentResult {
  variantId: string
  exposures: number   // 看到该 variant 的次数
  conversions: number // 转化次数
  conversionRate: number
}

export class ExperimentRunner {
  private _assignments: ExperimentAssignment[] = []
  private _exposures: Map<string, Set<string>> = new Map()  // variantId -> set of userIds
  private _conversions: Map<string, Set<string>> = new Map() // variantId -> set of userIds
  private _assigner: BucketAssigner
  private _experiment: Experiment

  constructor(experiment: Experiment) {
    this._experiment = experiment
    this._assigner = new BucketAssigner()
  }

  /** 分配 user（首次）或取已分配的 */
  assign(userId: string): ExperimentAssignment {
    const existing = this._assignments.find(a => a.userId === userId && a.experimentId === this._experiment.experimentId)
    if (existing) return existing
    const variant = this._assigner.assign(userId, this._experiment.experimentId, this._experiment.variants)
    const a: ExperimentAssignment = {
      userId,
      experimentId: this._experiment.experimentId,
      variantId: variant.variantId,
      assignedAt: Date.now(),
    }
    this._assignments.push(a)
    return a
  }

  /** 记录曝光 */
  recordExposure(userId: string): void {
    const a = this.assign(userId)
    if (!this._exposures.has(a.variantId)) this._exposures.set(a.variantId, new Set())
    this._exposures.get(a.variantId)!.add(userId)
  }

  /** 记录转化 */
  recordConversion(userId: string): void {
    const a = this.assign(userId)
    if (!this._conversions.has(a.variantId)) this._conversions.set(a.variantId, new Set())
    this._conversions.get(a.variantId)!.add(userId)
  }

  /** 收结果 */
  results(): ExperimentResult[] {
    return this._experiment.variants.map(v => {
      const exposures = this._exposures.get(v.variantId)?.size ?? 0
      const conversions = this._conversions.get(v.variantId)?.size ?? 0
      return {
        variantId: v.variantId,
        exposures,
        conversions,
        conversionRate: exposures > 0 ? conversions / exposures : 0,
      }
    })
  }

  assignmentCount(): number {
    return this._assignments.length
  }
}

// =============================================================================
// V2520: SignificanceTest
// =============================================================================

export interface SignificanceResult {
  pValue: number
  isSignificant: boolean
  winner?: string
  loser?: string
  effect: number
  method: string
}

/** Z-test for proportions（简化版） */
export function zTestProportions(
  controlExposures: number,
  controlConversions: number,
  variantExposures: number,
  variantConversions: number,
  significanceLevel: number = 0.05,
): SignificanceResult {
  if (controlExposures === 0 || variantExposures === 0) {
    return { pValue: 1, isSignificant: false, effect: 0, method: 'z-test' }
  }
  const p1 = controlConversions / controlExposures
  const p2 = variantConversions / variantExposures
  const pPool = (controlConversions + variantConversions) / (controlExposures + variantExposures)
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlExposures + 1 / variantExposures))
  if (se === 0) {
    return { pValue: 1, isSignificant: false, effect: p2 - p1, method: 'z-test' }
  }
  const z = (p2 - p1) / se
  // 简化 p-value: 2 * (1 - Phi(|z|))
  // Phi 近似
  const pValue = 2 * (1 - _normalCdf(Math.abs(z)))
  const isSignificant = pValue < significanceLevel
  return {
    pValue,
    isSignificant,
    winner: p2 > p1 ? 'variant' : 'control',
    loser: p2 > p1 ? 'control' : 'variant',
    effect: p2 - p1,
    method: 'z-test',
  }
}

/** 标准正态 CDF 近似（Abramowitz & Stegun 7.1.26） */
function _normalCdf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * absX)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)
  return 0.5 * (1.0 + sign * y)
}
