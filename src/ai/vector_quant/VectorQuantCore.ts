// V5036-V5045: CP Vector Quantization v2 Core Batch 1/3
// Vector quantizer + product/scalar/residual + codebook + encoder/decoder + distance + similarity search

export class VectorQuantizer {
  quantize(value: number, levels = 256): number {
    const step = 1 / levels;
    return Math.round(value / step) * step;
  }

  dequantize(quantized: number, levels = 256): number {
    return quantized; // Identity for symmetric quant
  }

  quantizeVector(v: number[], levels = 256): number[] {
    return v.map(x => this.quantize(x, levels));
  }

  dequantizeVector(v: number[], levels = 256): number[] {
    return v.map(x => this.dequantize(x, levels));
  }

  bitsPerValue(levels: number): number {
    return Math.log2(levels);
  }
}

export class ProductQuantizer {
  private _subspaceDim: number;
  private _numCentroids: number;

  constructor(subspaceDim = 4, numCentroids = 256) {
    this._subspaceDim = subspaceDim;
    this._numCentroids = numCentroids;
  }

  split(v: number[]): number[][] {
    const subspaces: number[][] = [];
    for (let i = 0; i < v.length; i += this._subspaceDim) {
      subspaces.push(v.slice(i, i + this._subspaceDim));
    }
    return subspaces;
  }

  assignCentroid(subspace: number[]): number {
    let hash = 0;
    for (const x of subspace) hash = ((hash * 31) + Math.floor(x * 1000)) >>> 0;
    return hash % this._numCentroids;
  }

  encode(v: number[]): number[] {
    return this.split(v).map(s => this.assignCentroid(s));
  }

  subspaceDim(): number { return this._subspaceDim; }
  numCentroids(): number { return this._numCentroids; }
}

export class ScalarQuantizer {
  private _min: number = 0;
  private _max: number = 1;
  private _levels: number;

  constructor(levels = 256) {
    this._levels = levels;
  }

  calibrate(samples: number[][]): void {
    let mn = Infinity, mx = -Infinity;
    for (const v of samples) for (const x of v) {
      if (x < mn) mn = x;
      if (x > mx) mx = x;
    }
    this._min = mn;
    this._max = mx;
  }

  quantize(value: number): number {
    if (this._max === this._min) return 0;
    const ratio = (value - this._min) / (this._max - this._min);
    return Math.max(0, Math.min(this._levels - 1, Math.round(ratio * (this._levels - 1))));
  }

  dequantize(level: number): number {
    return this._min + (level / (this._levels - 1)) * (this._max - this._min);
  }

  min(): number { return this._min; }
  max(): number { return this._max; }
  levels(): number { return this._levels; }
}

export class ResidualQuantizer {
  private _stages: number;

  constructor(stages = 3) {
    this._stages = stages;
  }

  encode(v: number[]): number[] {
    // Each stage quantizes the residual from the previous stage
    const codes: number[] = [];
    let residual = [...v];
    for (let s = 0; s < this._stages; s++) {
      const code = residual.map(x => Math.round(x * 8));
      codes.push(...code);
      // Approximate residual: subtract quantized value
      residual = residual.map((x, i) => x - code[i] / 8);
    }
    return codes;
  }

  stages(): number { return this._stages; }
}

export class QuantizationCodebook {
  private _entries: Map<string, number[]> = new Map();

  add(key: string, vector: number[]): this {
    this._entries.set(key, [...vector]);
    return this;
  }

  get(key: string): number[] | null {
    return this._entries.get(key) ?? null;
  }

  has(key: string): boolean {
    return this._entries.has(key);
  }

  delete(key: string): boolean {
    return this._entries.delete(key);
  }

  size(): number { return this._entries.size; }
  keys(): string[] { return [...this._entries.keys()]; }
}

export class QuantizationEncoder {
  encode(vector: number[], precision = 4): string {
    return vector.map(x => x.toFixed(precision)).join(',');
  }

  decode(s: string): number[] {
    if (!s) return [];
    return s.split(',').map(x => parseFloat(x));
  }

  encodedSize(vector: number[], precision = 4): number {
    return this.encode(vector, precision).length;
  }
}

export class QuantizationDecoder {
  decodeBytes(bytes: Uint8Array, dim: number): number[] {
    const v: number[] = [];
    for (let i = 0; i < bytes.length && v.length < dim; i++) {
      v.push((bytes[i] - 128) / 128);
    }
    while (v.length < dim) v.push(0);
    return v;
  }

  encodeBytes(vector: number[]): Uint8Array {
    const bytes = new Uint8Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
      bytes[i] = Math.max(0, Math.min(255, Math.round(vector[i] * 128 + 128)));
    }
    return bytes;
  }
}

export class DistanceMetric {
  euclidean(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) sum += (a[i] - b[i]) ** 2;
    return Math.sqrt(sum);
  }

  cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
  }

  manhattan(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) sum += Math.abs(a[i] - b[i]);
    return sum;
  }

  dot(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) sum += a[i] * b[i];
    return sum;
  }
}

export class SimilaritySearch {
  private _vectors: Map<string, number[]> = new Map();
  private _metric: DistanceMetric;

  constructor() {
    this._metric = new DistanceMetric();
  }

  add(id: string, vector: number[]): this {
    this._vectors.set(id, [...vector]);
    return this;
  }

  search(query: number[], k: number, metric: 'euclidean' | 'cosine' | 'manhattan' | 'dot' = 'cosine'): Array<{ id: string; score: number }> {
    const results: Array<{ id: string; score: number }> = [];
    for (const [id, vec] of this._vectors.entries()) {
      let score = 0;
      if (metric === 'euclidean') score = -this._metric.euclidean(query, vec);
      else if (metric === 'cosine') score = this._metric.cosine(query, vec);
      else if (metric === 'manhattan') score = -this._metric.manhattan(query, vec);
      else score = this._metric.dot(query, vec);
      results.push({ id, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  size(): number { return this._vectors.size; }

  remove(id: string): boolean {
    return this._vectors.delete(id);
  }
}

// V5045: VectorQuantCoreIndex
export const CP_BATCH_1_ENGINES = [
  'VectorQuantizer', 'ProductQuantizer', 'ScalarQuantizer', 'ResidualQuantizer', 'QuantizationCodebook',
  'QuantizationEncoder', 'QuantizationDecoder', 'DistanceMetric', 'SimilaritySearch', 'VectorQuantCoreIndex'
] as const;

export class VectorQuantCoreIndex {
  list(): string[] {
    return [...CP_BATCH_1_ENGINES];
  }

  count(): number {
    return CP_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CP_BATCH_1_ENGINES.includes(name as typeof CP_BATCH_1_ENGINES[number]);
  }
}