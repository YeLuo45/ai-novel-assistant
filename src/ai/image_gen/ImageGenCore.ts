// Round 8 Direction CH — Image Generation Batch 1/3 (Core)
// V4796-V4805: PromptBuilder + StylePreset + AspectRatio + NegativePrompt + SamplerSettings
//            + SeedLock + ImageCache + BatchGenerator + ControlNetConfig + IPAdapter
// 3-files × 10-engines pattern (P-97)

export type ArtStyle = 'anime' | 'photoreal' | 'watercolor' | 'oil' | 'sketch' | 'pixel' | 'manga' | 'comic' | 'ink' | 'pastel' | 'cyberpunk' | 'fantasy';
export type SamplerType = 'euler' | 'euler_a' | 'dpm++' | 'dpm++_sde' | 'uni_pc' | 'ddim' | 'pndm' | 'lms';
export type ImageSize = '512x512' | '768x768' | '1024x1024' | '1024x576' | '576x1024' | '1280x720' | '720x1280' | '1536x640' | '640x1536' | '2048x1024';
export type ControlNetMode = 'canny' | 'depth' | 'openpose' | 'lineart' | 'scribble' | 'seg' | 'normal' | 'tile' | 'inpaint' | 'ip2p';
export type IPAdapterMode = 'style' | 'face' | 'composition' | 'content' | 'plus' | 'plus_face';

export interface PromptToken {
  text: string;
  weight: number;
  type: 'subject' | 'style' | 'quality' | 'lighting' | 'composition';
}

export interface PromptBuilderConfig {
  defaultWeight: number;
  maxTokens: number;
  bannedWords: string[];
}

// V4796: PromptBuilder — tokenize + weight + quality tags + deduplicate
export class PromptBuilder {
  private _config: PromptBuilderConfig;
  private _tokens: PromptToken[] = [];
  private _qualityTags: string[] = ['masterpiece', 'best quality', 'highly detailed', 'sharp focus'];
  private _negativeDefaults: string[] = ['lowres', 'bad anatomy', 'bad hands', 'missing fingers', 'extra digit', 'cropped', 'worst quality'];

  constructor(config?: Partial<PromptBuilderConfig>) {
    this._config = { defaultWeight: 1.0, maxTokens: 77, bannedWords: [], ...config };
  }

  add(token: string, type: PromptToken['type'], weight: number = this._config.defaultWeight): this {
    if (this._tokens.length >= this._config.maxTokens) return this;
    if (this._config.bannedWords.some(b => token.toLowerCase().includes(b.toLowerCase()))) return this;
    const existing = this._tokens.findIndex(t => t.text === token);
    if (existing >= 0) {
      this._tokens[existing].weight = Math.max(this._tokens[existing].weight, weight);
      return this;
    }
    this._tokens.push({ text: token, weight, type });
    return this;
  }

  addMany(tokens: string[], type: PromptToken['type']): this {
    tokens.forEach(t => this.add(t, type));
    return this;
  }

  remove(text: string): this {
    this._tokens = this._tokens.filter(t => t.text !== text);
    return this;
  }

  setWeight(text: string, weight: number): this {
    const t = this._tokens.find(t => t.text === text);
    if (t) t.weight = weight;
    return this;
  }

  withQualityTags(enabled: boolean): this {
    if (enabled && !this._qualityTags.every(q => this._tokens.some(t => t.text === q))) {
      this._qualityTags.forEach(q => this.add(q, 'quality', 1.0));
    }
    return this;
  }

  build(): string {
    return this._tokens
      .map(t => t.weight !== 1.0 ? `(${t.text}:${t.weight.toFixed(2)})` : t.text)
      .join(', ');
  }

  tokens(): PromptToken[] {
    return [...this._tokens];
  }

  length(): number {
    return this._tokens.length;
  }

  clear(): this {
    this._tokens = [];
    return this;
  }
}

// V4797: StylePreset — 12 art styles with bundled token sets
export class StylePreset {
  private _presets: Map<ArtStyle, { tokens: string[]; negative: string[]; sampler: SamplerType; cfgScale: number; steps: number }> = new Map([
    ['anime', { tokens: ['anime', 'cel shading', 'vivid colors', 'clean lines'], negative: ['photorealistic', '3d'], sampler: 'euler_a', cfgScale: 7, steps: 28 }],
    ['photoreal', { tokens: ['photorealistic', '8k uhd', 'dslr', 'natural lighting'], negative: ['anime', 'cartoon', 'painting'], sampler: 'dpm++_sde', cfgScale: 7.5, steps: 30 }],
    ['watercolor', { tokens: ['watercolor', 'soft edges', 'paper texture', 'muted'], negative: ['sharp', 'digital'], sampler: 'euler', cfgScale: 6.5, steps: 25 }],
    ['oil', { tokens: ['oil painting', 'thick brushstrokes', 'impasto', 'classical'], negative: ['digital', 'flat'], sampler: 'euler', cfgScale: 7, steps: 30 }],
    ['sketch', { tokens: ['pencil sketch', 'graphite', 'rough lines', 'hand drawn'], negative: ['color', 'rendered'], sampler: 'euler_a', cfgScale: 6, steps: 20 }],
    ['pixel', { tokens: ['pixel art', '16-bit', 'low-res', 'sprite'], negative: ['high resolution', 'smooth'], sampler: 'euler', cfgScale: 6, steps: 18 }],
    ['manga', { tokens: ['manga', 'screentone', 'black and white', 'panel'], negative: ['color', 'painterly'], sampler: 'euler_a', cfgScale: 7, steps: 26 }],
    ['comic', { tokens: ['comic book', 'bold lines', 'flat colors', 'halftone'], negative: ['gradient', 'painterly'], sampler: 'euler', cfgScale: 7, steps: 24 }],
    ['ink', { tokens: ['ink wash', 'sumi-e', 'minimal', 'flowing'], negative: ['color', 'thick paint'], sampler: 'euler', cfgScale: 6, steps: 22 }],
    ['pastel', { tokens: ['soft pastel', 'light colors', 'dreamy', 'feathered'], negative: ['bold', 'saturated'], sampler: 'euler', cfgScale: 6.5, steps: 24 }],
    ['cyberpunk', { tokens: ['cyberpunk', 'neon', 'rain', 'high tech'], negative: ['pastoral', 'medieval'], sampler: 'dpm++_sde', cfgScale: 8, steps: 32 }],
    ['fantasy', { tokens: ['fantasy art', 'magical', 'ethereal', 'epic'], negative: ['mundane', 'modern'], sampler: 'euler_a', cfgScale: 7.5, steps: 30 }]
  ]);

  get(style: ArtStyle): { tokens: string[]; negative: string[]; sampler: SamplerType; cfgScale: number; steps: number } | undefined {
    return this._presets.get(style);
  }

  list(): ArtStyle[] {
    return Array.from(this._presets.keys());
  }

  apply(prompt: PromptBuilder, style: ArtStyle): PromptBuilder {
    const preset = this._presets.get(style);
    if (preset) prompt.addMany(preset.tokens, 'style');
    return prompt;
  }

  applyNegative(prompt: PromptBuilder, style: ArtStyle): PromptBuilder {
    const preset = this._presets.get(style);
    if (preset) prompt.addMany(preset.negative, 'style');
    return prompt;
  }

  match(query: string): ArtStyle | null {
    for (const [style, preset] of this._presets.entries()) {
      if (style === query || preset.tokens.some(t => t === query)) return style;
    }
    return null;
  }
}

// V4798: AspectRatio — 10 size presets + aspect math
export class AspectRatio {
  private _width: number;
  private _height: number;
  private _label: string;

  constructor(width: number, height: number, label?: string) {
    this._width = width;
    this._height = height;
    this._label = label || `${width}x${height}`;
  }

  ratio(): number {
    return this._width / this._height;
  }

  orientation(): 'square' | 'landscape' | 'portrait' {
    if (this._width === this._height) return 'square';
    return this._width > this._height ? 'landscape' : 'portrait';
  }

  scale(factor: number): AspectRatio {
    return new AspectRatio(Math.round(this._width * factor), Math.round(this._height * factor), this._label);
  }

  fits(targetW: number, targetH: number): boolean {
    return this._width <= targetW && this._height <= targetH;
  }

  megapixels(): number {
    return (this._width * this._height) / 1_000_000;
  }

  label(): string { return this._label; }
  width(): number { return this._width; }
  height(): number { return this._height; }

  static presets(): Map<ImageSize, AspectRatio> {
    return new Map([
      ['512x512', new AspectRatio(512, 512)],
      ['768x768', new AspectRatio(768, 768)],
      ['1024x1024', new AspectRatio(1024, 1024)],
      ['1024x576', new AspectRatio(1024, 576)],
      ['576x1024', new AspectRatio(576, 1024)],
      ['1280x720', new AspectRatio(1280, 720)],
      ['720x1280', new AspectRatio(720, 1280)],
      ['1536x640', new AspectRatio(1536, 640)],
      ['640x1536', new AspectRatio(640, 1536)],
      ['2048x1024', new AspectRatio(2048, 1024)]
    ]);
  }

  static from(size: ImageSize): AspectRatio {
    const preset = AspectRatio.presets().get(size);
    return preset || new AspectRatio(512, 512, size);
  }
}

// V4799: NegativePrompt — NSFW filter + banned content + auto-augment
export class NegativePrompt {
  private _entries: string[] = [];
  private _nsfwBlocked: string[] = ['nsfw', 'nude', 'explicit', 'gore', 'violence-realistic'];
  private _qualityBlocked: string[] = ['blurry', 'jpeg artifacts', 'noise', 'static', 'lowres'];

  add(entry: string): this {
    if (!this._entries.includes(entry)) this._entries.push(entry);
    return this;
  }

  addMany(entries: string[]): this {
    entries.forEach(e => this.add(e));
    return this;
  }

  addNSFWFilter(): this {
    return this.addMany(this._nsfwBlocked);
  }

  addQualityDefaults(): this {
    return this.addMany(this._qualityBlocked);
  }

  contains(text: string): boolean {
    const lower = text.toLowerCase();
    return this._entries.some(e => lower.includes(e.toLowerCase()));
  }

  filter(input: string): string {
    let filtered = input;
    this._entries.forEach(e => {
      const re = new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filtered = filtered.replace(re, '');
    });
    return filtered.replace(/\s+/g, ' ').trim();
  }

  build(): string {
    return this._entries.join(', ');
  }

  entries(): string[] {
    return [...this._entries];
  }

  size(): number {
    return this._entries.length;
  }
}

// V4800: SamplerSettings — 8 samplers + step + cfg + scheduling
export class SamplerSettings {
  private _sampler: SamplerType = 'euler_a';
  private _steps: number = 28;
  private _cfgScale: number = 7.0;
  private _seed: number = -1;
  private _denoisingStrength: number = 0.7;
  private _scheduler: string = 'karras';
  private _clipSkip: number = 2;

  setSampler(s: SamplerType): this { this._sampler = s; return this; }
  setSteps(n: number): this { this._steps = Math.max(1, Math.min(150, n)); return this; }
  setCFG(c: number): this { this._cfgScale = Math.max(1, Math.min(30, c)); return this; }
  setSeed(s: number): this { this._seed = s; return this; }
  setDenoisingStrength(d: number): this { this._denoisingStrength = Math.max(0, Math.min(1, d)); return this; }
  setScheduler(s: string): this { this._scheduler = s; return this; }
  setClipSkip(c: number): this { this._clipSkip = Math.max(1, Math.min(12, c)); return this; }

  randomizeSeed(): this {
    this._seed = Math.floor(Math.random() * 2 ** 32);
    return this;
  }

  estimatedTime(base: number = 0.5): number {
    const factor = { euler: 1.0, euler_a: 1.1, 'dpm++': 1.3, 'dpm++_sde': 1.5, uni_pc: 0.9, ddim: 0.8, pndm: 1.0, lms: 1.1 }[this._sampler] || 1.0;
    return this._steps * factor * base;
  }

  toDict(): Record<string, number | string> {
    return {
      sampler: this._sampler,
      steps: this._steps,
      cfgScale: this._cfgScale,
      seed: this._seed,
      denoisingStrength: this._denoisingStrength,
      scheduler: this._scheduler,
      clipSkip: this._clipSkip
    };
  }

  static fromDict(d: Record<string, number | string>): SamplerSettings {
    const s = new SamplerSettings();
    if (d.sampler) s._sampler = d.sampler as SamplerType;
    if (d.steps) s._steps = d.steps as number;
    if (d.cfgScale) s._cfgScale = d.cfgScale as number;
    if (d.seed !== undefined) s._seed = d.seed as number;
    if (d.denoisingStrength !== undefined) s._denoisingStrength = d.denoisingStrength as number;
    if (d.scheduler) s._scheduler = d.scheduler as string;
    if (d.clipSkip) s._clipSkip = d.clipSkip as number;
    return s;
  }

  sampler(): SamplerType { return this._sampler; }
  steps(): number { return this._steps; }
  cfgScale(): number { return this._cfgScale; }
  seed(): number { return this._seed; }
}

// V4801: SeedLock — deterministic seed + variation + explore
export class SeedLock {
  private _base: number;
  private _variations: Map<string, number> = new Map();

  constructor(base: number = 42) {
    this._base = base;
  }

  base(): number {
    return this._base;
  }

  setBase(seed: number): this {
    this._base = seed;
    return this;
  }

  variation(label: string): number {
    if (this._variations.has(label)) return this._variations.get(label)!;
    // LCG-style deterministic variation
    let h = this._base;
    for (let i = 0; i < label.length; i++) {
      h = ((h * 1103515245) + (label.charCodeAt(i) * 12345 + 1)) & 0x7fffffff;
    }
    const seed = h;
    this._variations.set(label, seed);
    return seed;
  }

  random(max: number = 2 ** 32): number {
    this._base = (this._base * 1103515245 + 12345) & 0x7fffffff;
    return this._base % max;
  }

  children(count: number): number[] {
    const result: number[] = [];
    let h = this._base;
    for (let i = 0; i < count; i++) {
      h = ((h * 1103515245) + 12345) & 0x7fffffff;
      result.push(h);
    }
    return result;
  }

  cache(): Map<string, number> {
    return new Map(this._variations);
  }

  clear(): this {
    this._variations.clear();
    return this;
  }
}

// V4802: ImageCache — file:// hashing + LRU eviction + dedup
export class ImageCache {
  private _store: Map<string, { hash: string; size: number; timestamp: number }> = new Map();
  private _maxSize: number = 100;
  private _maxBytes: number = 500 * 1024 * 1024; // 500MB
  private _currentBytes: number = 0;

  constructor(maxSize: number = 100, maxBytes: number = 500 * 1024 * 1024) {
    this._maxSize = maxSize;
    this._maxBytes = maxBytes;
  }

  // FNV-1a hash (P-39, P-49 verified across jsdom/node)
  hash(data: string): string {
    let h = 2166136261;
    for (let i = 0; i < data.length; i++) {
      h ^= data.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

  put(key: string, size: number): boolean {
    const hash = this.hash(key);
    if (this._store.has(key)) return false;
    if (this._store.size >= this._maxSize || this._currentBytes + size > this._maxBytes) {
      this.evict();
    }
    this._store.set(key, { hash, size, timestamp: Date.now() });
    this._currentBytes += size;
    return true;
  }

  has(key: string): boolean {
    return this._store.has(key);
  }

  get(key: string): { hash: string; size: number; timestamp: number } | undefined {
    return this._store.get(key);
  }

  remove(key: string): boolean {
    const v = this._store.get(key);
    if (!v) return false;
    this._currentBytes -= v.size;
    this._store.delete(key);
    return true;
  }

  // LRU: evict oldest
  evict(): number {
    let oldest: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of this._store.entries()) {
      if (v.timestamp < oldestTs) {
        oldestTs = v.timestamp;
        oldest = k;
      }
    }
    if (oldest) {
      this.remove(oldest);
      return 1;
    }
    return 0;
  }

  size(): number { return this._store.size; }
  bytes(): number { return this._currentBytes; }

  clear(): void {
    this._store.clear();
    this._currentBytes = 0;
  }
}

// V4803: BatchGenerator — N image generation with shared params
export class BatchGenerator {
  private _prompts: string[] = [];
  private _sharedSampler: SamplerSettings = new SamplerSettings();
  private _sharedSize: AspectRatio = AspectRatio.from('1024x1024');
  private _sharedStyle: ArtStyle = 'photoreal';

  addPrompt(prompt: string): this {
    this._prompts.push(prompt);
    return this;
  }

  addPrompts(prompts: string[]): this {
    prompts.forEach(p => this.addPrompt(p));
    return this;
  }

  setSampler(s: SamplerSettings): this { this._sharedSampler = s; return this; }
  setSize(s: ImageSize): this { this._sharedSize = AspectRatio.from(s); return this; }
  setStyle(s: ArtStyle): this { this._sharedStyle = s; return this; }

  count(): number { return this._prompts.length; }

  estimate(): { totalSteps: number; estimatedSec: number; totalMegapixels: number } {
    const steps = this._prompts.length * this._sharedSampler.steps();
    const sec = this._prompts.length * this._sharedSampler.estimatedTime();
    const mp = this._prompts.length * this._sharedSize.megapixels();
    return { totalSteps: steps, estimatedSec: sec, totalMegapixels: mp };
  }

  generate(): { prompt: string; sampler: Record<string, number | string>; size: ImageSize; style: ArtStyle; index: number }[] {
    return this._prompts.map((prompt, index) => ({
      prompt,
      sampler: this._sharedSampler.toDict(),
      size: `${this._sharedSize.width()}x${this._sharedSize.height()}` as ImageSize,
      style: this._sharedStyle,
      index
    }));
  }

  chunked(chunkSize: number): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < this._prompts.length; i += chunkSize) {
      chunks.push(this._prompts.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// V4804: ControlNetConfig — mode + weight + guidance + preprocessor
export class ControlNetConfig {
  private _mode: ControlNetMode = 'canny';
  private _weight: number = 1.0;
  private _guidanceStart: number = 0.0;
  private _guidanceEnd: number = 1.0;
  private _preprocessorEnabled: boolean = true;
  private _modelId: string = 'control_v11p_sd15_canny';

  setMode(m: ControlNetMode): this { this._mode = m; return this; }
  setWeight(w: number): this { this._weight = Math.max(0, Math.min(2, w)); return this; }
  setGuidance(start: number, end: number): this {
    this._guidanceStart = Math.max(0, Math.min(1, start));
    this._guidanceEnd = Math.max(this._guidanceStart, Math.min(1, end));
    return this;
  }
  setPreprocessor(enabled: boolean): this { this._preprocessorEnabled = enabled; return this; }
  setModel(id: string): this { this._modelId = id; return this; }

  isActive(): boolean { return this._weight > 0 && this._guidanceEnd > this._guidanceStart; }

  toDict(): Record<string, number | string | boolean> {
    return {
      mode: this._mode,
      weight: this._weight,
      guidanceStart: this._guidanceStart,
      guidanceEnd: this._guidanceEnd,
      preprocessor: this._preprocessorEnabled,
      model: this._modelId
    };
  }

  mode(): ControlNetMode { return this._mode; }
  weight(): number { return this._weight; }
  duration(): number { return this._guidanceEnd - this._guidanceStart; }
}

// V4805: IPAdapter — image prompt mode + weight + embedding model
export class IPAdapter {
  private _mode: IPAdapterMode = 'style';
  private _weight: number = 0.8;
  private _imageReference: string = '';
  private _noiseStrength: number = 0.0;
  private _modelId: string = 'ip-adapter_sd15';

  setMode(m: IPAdapterMode): this { this._mode = m; return this; }
  setWeight(w: number): this { this._weight = Math.max(0, Math.min(2, w)); return this; }
  setImage(ref: string): this { this._imageReference = ref; return this; }
  setNoise(n: number): this { this._noiseStrength = Math.max(0, Math.min(1, n)); return this; }
  setModel(id: string): this { this._modelId = id; return this; }

  hasReference(): boolean { return this._imageReference.length > 0; }

  toDict(): Record<string, number | string> {
    return {
      mode: this._mode,
      weight: this._weight,
      imageRef: this._imageReference,
      noiseStrength: this._noiseStrength,
      model: this._modelId
    };
  }

  mode(): IPAdapterMode { return this._mode; }
  weight(): number { return this._weight; }
}

// V4805: CH Batch 1/3 Index — all 10 engines self-list
export const CH_BATCH_1_ENGINES = [
  'PromptBuilder', 'StylePreset', 'AspectRatio', 'NegativePrompt', 'SamplerSettings',
  'SeedLock', 'ImageCache', 'BatchGenerator', 'ControlNetConfig', 'IPAdapter'
] as const;

export class ImageGenCoreIndex {
  list(): string[] {
    return [...CH_BATCH_1_ENGINES];
  }

  count(): number {
    return CH_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return [...CH_BATCH_1_ENGINES];
  }

  has(name: string): boolean {
    return CH_BATCH_1_ENGINES.includes(name as typeof CH_BATCH_1_ENGINES[number]);
  }
}