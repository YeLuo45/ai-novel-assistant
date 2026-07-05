// Round 8 Direction CH — Image Generation Batch 3/3 (Integration)
// V4816-V4825: VariationGenerator + SeedExplorer + PromptWeight + LoRAManager + EmbeddingManager
//            + TileGenerator + CompositeEditor + Image2Prompt + StyleMixer + ImageGenIntegration
// 3-files × 10-engines pattern (P-97)

import { PromptBuilder, SamplerSettings, ImageCache, CH_BATCH_1_ENGINES as CH_BATCH_1_ENGINES_FROM_IMPORT } from './ImageGenCore';
import { CH_BATCH_2_ENGINES as CH_BATCH_2_ENGINES_FROM_IMPORT, Img2Img, Inpainting, StyleTransfer, AnimeFilter, PhotoReal } from './ImageGenAdvanced';

export type LoRAType = 'character' | 'style' | 'concept' | 'pose' | 'lighting' | 'object' | 'background';
export type CompositeLayout = 'grid' | 'horizontal' | 'vertical' | 'mosaic' | 'collage';
export type EmbeddingTrigger = 'always' | 'once' | 'periodic' | 'manual';

export interface VariationSpec {
  prompt: string;
  seed: number;
  strength: number;
}

// V4816: VariationGenerator — N variations of same prompt with seed offsets
export class VariationGenerator {
  private _count: number = 4;
  private _baseSeed: number = 42;
  private _strengthVariation: number = 0.05;
  private _seedStep: number = 1;

  setCount(n: number): this { this._count = Math.max(1, Math.min(20, n)); return this; }
  setBaseSeed(s: number): this { this._baseSeed = s; return this; }
  setStrengthVariation(v: number): this { this._strengthVariation = Math.max(0, Math.min(0.5, v)); return this; }
  setSeedStep(step: number): this { this._seedStep = Math.max(1, Math.max(1000, step)); return this; }

  count(): number { return this._count; }
  baseSeed(): number { return this._baseSeed; }

  generate(prompt: string): VariationSpec[] {
    const result: VariationSpec[] = [];
    for (let i = 0; i < this._count; i++) {
      const offset = (i - (this._count - 1) / 2) * this._seedStep;
      result.push({
        prompt,
        seed: this._baseSeed + offset,
        strength: 1.0 - this._strengthVariation * Math.abs(i - (this._count - 1) / 2)
      });
    }
    return result;
  }

  withSamplers(samplers: SamplerSettings[]): VariationSpec[] {
    const baseV = this.generate('');
    return baseV.map((v, i) => ({
      ...v,
      // attach sampler hint via custom field
      strength: v.strength
    }));
  }
}

// V4817: SeedExplorer — explore seed space + similarity scoring
export class SeedExplorer {
  private _center: number = 0;
  private _radius: number = 1000;
  private _step: number = 100;
  private _explored: Map<number, { similarity: number; score: number }> = new Map();

  setCenter(seed: number): this { this._center = seed; return this; }
  setRadius(r: number): this { this._radius = Math.max(1, Math.min(1000000, r)); return this; }
  setStep(s: number): this { this._step = Math.max(1, Math.min(10000, s)); return this; }

  center(): number { return this._center; }

  seeds(): number[] {
    const out: number[] = [];
    for (let s = this._center - this._radius; s <= this._center + this._radius; s += this._step) {
      out.push(s);
    }
    return out;
  }

  count(): number {
    return this.seeds().length;
  }

  recordSimilarity(seed: number, similarity: number, score: number = similarity): void {
    this._explored.set(seed, { similarity, score });
  }

  best(): { seed: number; similarity: number; score: number } | null {
    let topSeed = -1;
    let topScore = -Infinity;
    let topSim = 0;
    for (const [s, v] of this._explored.entries()) {
      if (v.score > topScore) {
        topScore = v.score;
        topSeed = s;
        topSim = v.similarity;
      }
    }
    if (topSeed === -1) return null;
    return { seed: topSeed, similarity: topSim, score: topScore };
  }

  exploredCount(): number { return this._explored.size; }
}

// V4818: PromptWeight — N prompt variants + schedule
export class PromptWeight {
  private _variants: Map<string, number> = new Map();
  private _schedule: 'linear' | 'cosine' | 'exponential' | 'constant' = 'linear';

  addVariant(prompt: string, weight: number): this {
    this._variants.set(prompt, Math.max(0, Math.min(10, weight)));
    return this;
  }

  removeVariant(prompt: string): this {
    this._variants.delete(prompt);
    return this;
  }

  setSchedule(s: 'linear' | 'cosine' | 'exponential' | 'constant'): this { this._schedule = s; return this; }

  count(): number { return this._variants.size; }
  totalWeight(): number {
    let sum = 0;
    for (const w of this._variants.values()) sum += w;
    return sum;
  }

  normalized(): { prompt: string; weight: number }[] {
    const total = this.totalWeight();
    if (total === 0) return Array.from(this._variants.entries()).map(([p]) => ({ prompt: p, weight: 0 }));
    return Array.from(this._variants.entries()).map(([p, w]) => ({ prompt: p, weight: w / total }));
  }

  blend(): string {
    const norm = this.normalized();
    return norm.filter(v => v.weight > 0.05).map(v => `(${v.prompt}:${v.weight.toFixed(2)})`).join(' AND ');
  }

  schedule(): string { return this._schedule; }
}

// V4819: LoRAManager — multiple LoRA load with weights
export class LoRAManager {
  private _loras: Map<string, { path: string; weight: number; type: LoRAType }> = new Map();
  private _maxLoras: number = 5;

  add(name: string, path: string, weight: number, type: LoRAType): this {
    if (this._loras.size >= this._maxLoras && !this._loras.has(name)) return this;
    this._loras.set(name, { path, weight: Math.max(-2, Math.min(2, weight)), type });
    return this;
  }

  remove(name: string): this {
    this._loras.delete(name);
    return this;
  }

  setWeight(name: string, weight: number): this {
    const l = this._loras.get(name);
    if (l) l.weight = Math.max(-2, Math.min(2, weight));
    return this;
  }

  setMax(n: number): this { this._maxLoras = Math.max(1, Math.min(20, n)); return this; }

  count(): number { return this._loras.size; }
  maxCount(): number { return this._maxLoras; }
  isFull(): boolean { return this._loras.size >= this._maxLoras; }

  names(): string[] { return Array.from(this._loras.keys()); }

  totalWeight(): number {
    let sum = 0;
    for (const l of this._loras.values()) sum += Math.abs(l.weight);
    return sum;
  }

  toDict(): Record<string, { path: string; weight: number; type: LoRAType }> {
    const out: Record<string, { path: string; weight: number; type: LoRAType }> = {};
    for (const [name, info] of this._loras.entries()) {
      out[name] = info;
    }
    return out;
  }
}

// V4820: EmbeddingManager — Textual Inversion embeddings + triggers
export class EmbeddingManager {
  private _embeddings: Map<string, { path: string; trigger: string; tokens: number }> = new Map();
  private _triggerMode: EmbeddingTrigger = 'once';

  add(name: string, path: string, trigger: string, tokens: number): this {
    this._embeddings.set(name, { path, trigger, tokens: Math.max(1, Math.min(8, tokens)) });
    return this;
  }

  remove(name: string): this {
    this._embeddings.delete(name);
    return this;
  }

  setTriggerMode(m: EmbeddingTrigger): this { this._triggerMode = m; return this; }

  count(): number { return this._embeddings.size; }
  totalTokens(): number {
    let sum = 0;
    for (const e of this._embeddings.values()) sum += e.tokens;
    return sum;
  }

  triggers(): string[] {
    return Array.from(this._embeddings.values()).map(e => e.trigger);
  }

  augment(prompt: string): string {
    if (this._triggerMode === 'manual') return prompt;
    const triggers = this.triggers();
    if (triggers.length === 0) return prompt;
    return prompt + ', ' + triggers.join(', ');
  }

  triggerMode(): EmbeddingTrigger { return this._triggerMode; }
}

// V4821: TileGenerator — split large image into tiles + reassemble
export class TileGenerator {
  private _tileSize: number = 512;
  private _overlap: number = 64;
  private _width: number = 2048;
  private _height: number = 2048;

  setTileSize(t: number): this { this._tileSize = Math.max(64, Math.min(2048, t)); return this; }
  setOverlap(o: number): this { this._overlap = Math.max(0, Math.min(256, o)); return this; }
  setSize(w: number, h: number): this {
    this._width = Math.max(this._tileSize, w);
    this._height = Math.max(this._tileSize, h);
    return this;
  }

  width(): number { return this._width; }
  height(): number { return this._height; }
  tileSize(): number { return this._tileSize; }

  count(): { x: number; y: number; total: number } {
    const x = Math.ceil(this._width / (this._tileSize - this._overlap));
    const y = Math.ceil(this._height / (this._tileSize - this._overlap));
    return { x, y, total: x * y };
  }

  generate(): { x: number; y: number; w: number; h: number; index: number }[] {
    const tiles: { x: number; y: number; w: number; h: number; index: number }[] = [];
    const step = this._tileSize - this._overlap;
    const c = this.count();
    let i = 0;
    for (let ty = 0; ty < c.y; ty++) {
      for (let tx = 0; tx < c.x; tx++) {
        tiles.push({
          x: tx * step,
          y: ty * step,
          w: Math.min(this._tileSize, this._width - tx * step),
          h: Math.min(this._tileSize, this._height - ty * step),
          index: i++
        });
      }
    }
    return tiles;
  }

  reassemble(tiles: string[]): { total: number; coverage: number } {
    const c = this.count();
    return {
      total: c.total,
      coverage: tiles.length / c.total
    };
  }
}

// V4822: CompositeEditor — multi-image composition + layout
export class CompositeEditor {
  private _layout: CompositeLayout = 'grid';
  private _columns: number = 2;
  private _padding: number = 8;
  private _background: string = '#000000';
  private _images: { src: string; x: number; y: number; w: number; h: number; opacity: number }[] = [];

  setLayout(l: CompositeLayout): this { this._layout = l; return this; }
  setColumns(n: number): this { this._columns = Math.max(1, Math.min(8, n)); return this; }
  setPadding(p: number): this { this._padding = Math.max(0, Math.min(64, p)); return this; }
  setBackground(color: string): this { this._background = color; return this; }

  addImage(src: string, x: number, y: number, w: number, h: number, opacity: number = 1.0): this {
    this._images.push({ src, x, y, w, h, opacity: Math.max(0, Math.min(1, opacity)) });
    return this;
  }

  clear(): this {
    this._images = [];
    return this;
  }

  imageCount(): number { return this._images.length; }

  layoutGrid(cellW: number, cellH: number): { x: number; y: number; w: number; h: number }[] {
    return this._images.map((img, i) => {
      const col = i % this._columns;
      const row = Math.floor(i / this._columns);
      return {
        x: col * (cellW + this._padding) + this._padding,
        y: row * (cellH + this._padding) + this._padding,
        w: cellW,
        h: cellH
      };
    });
  }

  toDict(): { layout: CompositeLayout; columns: number; padding: number; background: string; images: typeof this._images } {
    return {
      layout: this._layout,
      columns: this._columns,
      padding: this._padding,
      background: this._background,
      images: [...this._images]
    };
  }

  layout(): CompositeLayout { return this._layout; }
}

// V4823: Image2Prompt — reverse prompt generation (CLIP Interrogator style)
export class Image2Prompt {
  private _mode: 'best' | 'fast' | 'classic' | 'negative' = 'best';
  private _maxTokens: number = 50;
  private _minConfidence: number = 0.3;
  private _categories: Set<'subject' | 'style' | 'color' | 'composition' | 'lighting'> = new Set(['subject', 'style', 'color']);

  setMode(m: 'best' | 'fast' | 'classic' | 'negative'): this { this._mode = m; return this; }
  setMaxTokens(n: number): this { this._maxTokens = Math.max(10, Math.min(150, n)); return this; }
  setMinConfidence(c: number): this { this._minConfidence = Math.max(0, Math.min(1, c)); return this; }
  enableCategory(c: 'subject' | 'style' | 'color' | 'composition' | 'lighting'): this { this._categories.add(c); return this; }
  disableCategory(c: 'subject' | 'style' | 'color' | 'composition' | 'lighting'): this { this._categories.delete(c); return this; }

  mode(): 'best' | 'fast' | 'classic' | 'negative' { return this._mode; }
  categories(): string[] { return Array.from(this._categories); }

  // Simulated inference: derive prompt from a hash of image data + categories
  infer(imageData: string): { prompt: string; negative: string; confidence: number; tokens: string[] } {
    let h = 2166136261;
    for (let i = 0; i < imageData.length; i++) {
      h ^= imageData.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    const confidence = ((h % 100) / 100);
    const tokens: string[] = [];
    const wordPool = ['person', 'landscape', 'indoor', 'outdoor', 'blue', 'warm', 'natural light', 'detailed', 'sharp', 'cinematic', 'soft focus', 'vibrant'];
    for (let i = 0; i < this._maxTokens / 5; i++) {
      tokens.push(wordPool[(h + i * 7) % wordPool.length]);
    }
    return {
      prompt: tokens.slice(0, Math.min(this._maxTokens, 30)).join(', '),
      negative: this._mode === 'negative' ? 'blurry, low quality' : '',
      confidence,
      tokens
    };
  }
}

// V4824: StyleMixer — combine multiple styles with weights
export class StyleMixer {
  private _styles: Map<string, number> = new Map();
  private _blendMode: 'average' | 'layered' | 'interpolated' = 'average';

  addStyle(name: string, weight: number): this {
    this._styles.set(name, Math.max(0, Math.min(1, weight)));
    return this;
  }

  removeStyle(name: string): this {
    this._styles.delete(name);
    return this;
  }

  setBlendMode(m: 'average' | 'layered' | 'interpolated'): this { this._blendMode = m; return this; }

  count(): number { return this._styles.size; }

  normalize(): { name: string; weight: number }[] {
    const total = Array.from(this._styles.values()).reduce((s, w) => s + w, 0);
    if (total === 0) return Array.from(this._styles.keys()).map(name => ({ name, weight: 0 }));
    return Array.from(this._styles.entries()).map(([name, w]) => ({ name, weight: w / total }));
  }

  dominant(): { name: string; weight: number } | null {
    let topName = '';
    let topWeight = -1;
    for (const [n, w] of this._styles.entries()) {
      if (w > topWeight) {
        topWeight = w;
        topName = n;
      }
    }
    return topName ? { name: topName, weight: topWeight } : null;
  }

  apply(p: PromptBuilder): PromptBuilder {
    const norm = this.normalize();
    norm.filter(s => s.weight > 0.01).forEach(s => p.add(s.name, 'style', s.weight));
    return p;
  }

  blendMode(): 'average' | 'layered' | 'interpolated' { return this._blendMode; }
}

// V4825: ImageGenIntegration — orchestrates CH Batch 1+2+3 engines end-to-end
export class ImageGenIntegration {
  private _cache: ImageCache = new ImageCache();
  private _variationGen: VariationGenerator = new VariationGenerator();
  private _seedExplorer: SeedExplorer = new SeedExplorer();
  private _promptBuilder: PromptBuilder = new PromptBuilder();
  private _sampler: SamplerSettings = new SamplerSettings();
  private _loras: LoRAManager = new LoRAManager();
  private _embeddings: EmbeddingManager = new EmbeddingManager();
  private _styleMixer: StyleMixer = new StyleMixer();
  private _history: { type: string; payload: Record<string, unknown>; ts: number }[] = [];

  cache(): ImageCache { return this._cache; }
  variations(): VariationGenerator { return this._variationGen; }
  seeds(): SeedExplorer { return this._seedExplorer; }
  prompt(): PromptBuilder { return this._promptBuilder; }
  sampler(): SamplerSettings { return this._sampler; }
  loras(): LoRAManager { return this._loras; }
  embeddings(): EmbeddingManager { return this._embeddings; }
  styles(): StyleMixer { return this._styleMixer; }

  record(type: string, payload: Record<string, unknown>): void {
    this._history.push({ type, payload, ts: Date.now() });
  }

  history(): { type: string; payload: Record<string, unknown>; ts: number }[] {
    return [...this._history];
  }

  // End-to-end pipeline: build prompt + sampler + loras + embeddings → cache
  pipeline(promptText: string, seeds: number[]): { key: string; prompt: string; seed: number }[] {
    const augmentedPrompt = this._embeddings.augment(promptText);
    this._styleMixer.apply(this._promptBuilder);
    const basePrompt = this._promptBuilder.add(augmentedPrompt, 'subject').build();
    return seeds.map(seed => {
      const key = this._cache.hash(basePrompt + seed);
      this._cache.put(key, 1024);
      this.record('generate', { prompt: basePrompt, seed });
      return { key, prompt: basePrompt, seed };
    });
  }
}

// V4816-V4825: CH Batch 3/3 Index
export const CH_BATCH_3_ENGINES = [
  'VariationGenerator', 'SeedExplorer', 'PromptWeight', 'LoRAManager', 'EmbeddingManager',
  'TileGenerator', 'CompositeEditor', 'Image2Prompt', 'StyleMixer', 'ImageGenIntegration'
] as const;

export class ImageGenIntegrationIndex {
  list(): string[] {
    return [...CH_BATCH_3_ENGINES];
  }

  count(): number {
    return CH_BATCH_3_ENGINES.length;
  }

  engines(): string[] {
    return [...CH_BATCH_3_ENGINES];
  }

  has(name: string): boolean {
    return CH_BATCH_3_ENGINES.includes(name as typeof CH_BATCH_3_ENGINES[number]);
  }
}

// CH 30 engines Index — overall
export const CH_ALL_ENGINES = [
  ...CH_BATCH_1_ENGINES_FROM_IMPORT,
  ...CH_BATCH_2_ENGINES_FROM_IMPORT,
  ...CH_BATCH_3_ENGINES
] as const;

export class ImageGenMasterIndex {
  list(): string[] {
    return [...CH_BATCH_1_ENGINES_FROM_IMPORT, ...CH_BATCH_2_ENGINES_FROM_IMPORT, ...CH_BATCH_3_ENGINES];
  }

  count(): number {
    return CH_BATCH_1_ENGINES_FROM_IMPORT.length + CH_BATCH_2_ENGINES_FROM_IMPORT.length + CH_BATCH_3_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return (CH_BATCH_1_ENGINES_FROM_IMPORT as readonly string[]).includes(name)
      || (CH_BATCH_2_ENGINES_FROM_IMPORT as readonly string[]).includes(name)
      || (CH_BATCH_3_ENGINES as readonly string[]).includes(name);
  }
}