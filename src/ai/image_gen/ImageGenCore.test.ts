// Round 8 Direction CH — Image Generation Batch 1/3 (Core Tests)
// V4796-V4805: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  PromptBuilder, StylePreset, AspectRatio, NegativePrompt, SamplerSettings,
  SeedLock, ImageCache, BatchGenerator, ControlNetConfig, IPAdapter,
  ImageGenCoreIndex, CH_BATCH_1_ENGINES
} from './ImageGenCore';

describe('PromptBuilder', () => {
  it('adds tokens with type and default weight', () => {
    const p = new PromptBuilder();
    p.add('cat', 'subject');
    p.add('sitting', 'subject');
    expect(p.length()).toBe(2);
    expect(p.build()).toContain('cat');
    expect(p.build()).toContain('sitting');
  });

  it('honors custom weight when not 1.0', () => {
    const p = new PromptBuilder();
    p.add('sunset', 'lighting', 1.5);
    expect(p.build()).toBe('(sunset:1.50)');
  });

  it('deduplicates tokens keeping highest weight', () => {
    const p = new PromptBuilder();
    p.add('tree', 'subject', 1.0);
    p.add('tree', 'subject', 1.3);
    expect(p.length()).toBe(1);
    expect(p.build()).toContain('(tree:1.30)');
  });

  it('filters banned words', () => {
    const p = new PromptBuilder({ bannedWords: ['banned'] });
    p.add('allowed', 'subject');
    p.add('banned_word', 'subject');
    expect(p.length()).toBe(1);
  });

  it('respects maxTokens limit', () => {
    const p = new PromptBuilder({ maxTokens: 3 });
    p.add('a', 'subject');
    p.add('b', 'subject');
    p.add('c', 'subject');
    p.add('d', 'subject');
    expect(p.length()).toBe(3);
  });

  it('withQualityTags appends master tags', () => {
    const p = new PromptBuilder();
    p.add('portrait', 'subject').withQualityTags(true);
    expect(p.length()).toBeGreaterThanOrEqual(5);
    expect(p.build()).toContain('masterpiece');
  });
});

describe('StylePreset', () => {
  it('returns 12 art styles', () => {
    const sp = new StylePreset();
    expect(sp.list().length).toBe(12);
  });

  it('get returns sampler+cfg+steps', () => {
    const sp = new StylePreset();
    const anime = sp.get('anime');
    expect(anime).toBeDefined();
    expect(anime!.sampler).toBe('euler_a');
    expect(anime!.cfgScale).toBe(7);
    expect(anime!.steps).toBe(28);
  });

  it('apply adds style tokens to prompt', () => {
    const sp = new StylePreset();
    const p = new PromptBuilder();
    sp.apply(p, 'cyberpunk');
    expect(p.build()).toContain('cyberpunk');
    expect(p.build()).toContain('neon');
  });

  it('applyNegative adds negative tokens', () => {
    const sp = new StylePreset();
    const p = new PromptBuilder();
    sp.applyNegative(p, 'anime');
    expect(p.build()).toContain('photorealistic');
  });

  it('match finds style by query', () => {
    const sp = new StylePreset();
    expect(sp.match('cyberpunk')).toBe('cyberpunk');
    expect(sp.match('nonexistent')).toBeNull();
  });
});

describe('AspectRatio', () => {
  it('ratio and orientation detection', () => {
    const sq = new AspectRatio(512, 512);
    const ls = new AspectRatio(1024, 576);
    const pt = new AspectRatio(576, 1024);
    expect(sq.ratio()).toBe(1);
    expect(sq.orientation()).toBe('square');
    expect(ls.orientation()).toBe('landscape');
    expect(pt.orientation()).toBe('portrait');
  });

  it('scale multiplies dimensions', () => {
    const ar = new AspectRatio(512, 512).scale(2);
    expect(ar.width()).toBe(1024);
    expect(ar.height()).toBe(1024);
  });

  it('fits returns true if both dim ≤ target', () => {
    expect(new AspectRatio(512, 512).fits(1024, 1024)).toBe(true);
    expect(new AspectRatio(2048, 1024).fits(1024, 1024)).toBe(false);
  });

  it('megapixels computes size', () => {
    expect(new AspectRatio(1024, 1024).megapixels()).toBeCloseTo(1.049, 2);
  });

  it('presets returns 10 sizes', () => {
    expect(AspectRatio.presets().size).toBe(10);
  });

  it('from creates AspectRatio from preset label', () => {
    const ar = AspectRatio.from('1024x576');
    expect(ar.width()).toBe(1024);
    expect(ar.height()).toBe(576);
    expect(ar.orientation()).toBe('landscape');
  });
});

describe('NegativePrompt', () => {
  it('add entries + contains check', () => {
    const n = new NegativePrompt();
    n.add('blurry').add('watermark');
    expect(n.entries()).toContain('blurry');
    expect(n.contains('this image is blurry')).toBe(true);
    expect(n.contains('sharp image')).toBe(false);
  });

  it('addNSFWFilter adds banned content', () => {
    const n = new NegativePrompt();
    n.addNSFWFilter();
    expect(n.entries()).toContain('nsfw');
  });

  it('addQualityDefaults adds quality filters', () => {
    const n = new NegativePrompt();
    n.addQualityDefaults();
    expect(n.entries()).toContain('blurry');
  });

  it('filter strips entries from input', () => {
    const n = new NegativePrompt();
    n.add('bad').add('ugly');
    const result = n.filter('good nice bad stuff ugly items');
    expect(result).not.toContain('bad');
    expect(result).not.toContain('ugly');
    expect(result).toContain('good');
  });

  it('build joins entries with commas', () => {
    const n = new NegativePrompt();
    n.add('a').add('b').add('c');
    expect(n.build()).toBe('a, b, c');
  });
});

describe('SamplerSettings', () => {
  it('clamps steps to 1-150', () => {
    const s = new SamplerSettings();
    s.setSteps(0);
    expect(s.steps()).toBe(1);
    s.setSteps(9999);
    expect(s.steps()).toBe(150);
  });

  it('clamps cfgScale to 1-30', () => {
    const s = new SamplerSettings();
    s.setCFG(0.5);
    expect(s.cfgScale()).toBe(1);
    s.setCFG(100);
    expect(s.cfgScale()).toBe(30);
  });

  it('clamps denoising strength to 0-1', () => {
    const s = new SamplerSettings();
    s.setDenoisingStrength(-1);
    expect(s.sampler()).toBe('euler_a');
    // denoisingStrength stored at _denoisingStrength, clamped
    expect(s.toDict().denoisingStrength).toBe(0);
    s.setDenoisingStrength(5);
    expect(s.toDict().denoisingStrength).toBe(1);
  });

  it('estimatedTime scales by sampler', () => {
    const e = new SamplerSettings().setSampler('euler');
    const a = new SamplerSettings().setSampler('euler_a');
    expect(a.estimatedTime()).toBeGreaterThan(e.estimatedTime());
  });

  it('toDict and fromDict round-trip', () => {
    const s1 = new SamplerSettings().setSampler('dpm++').setSteps(35).setCFG(8.5).setSeed(12345);
    const s2 = SamplerSettings.fromDict(s1.toDict());
    expect(s2.sampler()).toBe('dpm++');
    expect(s2.steps()).toBe(35);
    expect(s2.cfgScale()).toBe(8.5);
    expect(s2.seed()).toBe(12345);
  });

  it('randomizeSeed sets non-negative seed', () => {
    const s = new SamplerSettings().setSeed(0);
    s.randomizeSeed();
    expect(s.seed()).toBeGreaterThanOrEqual(0);
  });
});

describe('SeedLock', () => {
  it('base returns current base seed', () => {
    const sl = new SeedLock(42);
    expect(sl.base()).toBe(42);
  });

  it('variation is deterministic for same label', () => {
    const sl = new SeedLock(42);
    const a = sl.variation('cat');
    const b = sl.variation('cat');
    expect(a).toBe(b);
  });

  it('different labels give different seeds', () => {
    const sl = new SeedLock(42);
    expect(sl.variation('cat')).not.toBe(sl.variation('dog'));
  });

  it('children returns N deterministic seeds', () => {
    const sl = new SeedLock(100);
    const kids = sl.children(5);
    expect(kids).toHaveLength(5);
    const kids2 = sl.children(5);
    expect(kids2).toEqual(kids);
  });

  it('random returns number within range', () => {
    const sl = new SeedLock(42);
    const r = sl.random(100);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(100);
  });
});

describe('ImageCache', () => {
  it('hash is deterministic 8-char hex', () => {
    const c = new ImageCache();
    expect(c.hash('hello')).toBe(c.hash('hello'));
    expect(c.hash('hello')).toMatch(/^[0-9a-f]{8}$/);
  });

  it('put + has + get', () => {
    const c = new ImageCache();
    c.put('img1', 1024);
    expect(c.has('img1')).toBe(true);
    expect(c.get('img1')!.size).toBe(1024);
  });

  it('put returns false on duplicate', () => {
    const c = new ImageCache();
    expect(c.put('x', 100)).toBe(true);
    expect(c.put('x', 100)).toBe(false);
  });

  it('evict removes oldest', async () => {
    const c = new ImageCache(2);
    c.put('a', 100);
    await new Promise(r => setTimeout(r, 5));
    c.put('b', 100);
    await new Promise(r => setTimeout(r, 5));
    c.put('c', 100);
    expect(c.size()).toBe(2);
    expect(c.has('a')).toBe(false);
    expect(c.has('c')).toBe(true);
  });

  it('remove returns false for missing key', () => {
    const c = new ImageCache();
    expect(c.remove('nope')).toBe(false);
  });

  it('bytes tracks current byte total', () => {
    const c = new ImageCache();
    c.put('a', 1000);
    c.put('b', 2000);
    expect(c.bytes()).toBe(3000);
    c.remove('a');
    expect(c.bytes()).toBe(2000);
  });
});

describe('BatchGenerator', () => {
  it('addPrompt + count', () => {
    const b = new BatchGenerator();
    b.addPrompt('cat').addPrompt('dog').addPrompt('bird');
    expect(b.count()).toBe(3);
  });

  it('setSampler + setSize + setStyle chain', () => {
    const b = new BatchGenerator();
    b.setSampler(new SamplerSettings().setSteps(40))
     .setSize('1024x576')
     .setStyle('anime');
    expect(b.count()).toBe(0);
  });

  it('estimate totals scale with batch size', () => {
    const b = new BatchGenerator().setSampler(new SamplerSettings().setSteps(20));
    b.addPrompts(['a', 'b', 'c']);
    const e = b.estimate();
    expect(e.totalSteps).toBe(60);
    expect(e.estimatedSec).toBeGreaterThan(0);
  });

  it('generate returns array of job dicts', () => {
    const b = new BatchGenerator();
    b.addPrompt('test1').addPrompt('test2');
    const jobs = b.generate();
    expect(jobs).toHaveLength(2);
    expect(jobs[0].index).toBe(0);
    expect(jobs[1].index).toBe(1);
    expect(jobs[0].prompt).toBe('test1');
  });

  it('chunked splits into N-sized chunks', () => {
    const b = new BatchGenerator();
    b.addPrompts(['a', 'b', 'c', 'd', 'e']);
    expect(b.chunked(2)).toHaveLength(3);
    expect(b.chunked(2)[0]).toEqual(['a', 'b']);
    expect(b.chunked(2)[2]).toEqual(['e']);
  });
});

describe('ControlNetConfig', () => {
  it('default mode canny with weight 1.0', () => {
    const c = new ControlNetConfig();
    expect(c.mode()).toBe('canny');
    expect(c.weight()).toBe(1.0);
  });

  it('setWeight clamps 0-2', () => {
    const c = new ControlNetConfig();
    c.setWeight(5);
    expect(c.weight()).toBe(2);
    c.setWeight(-1);
    expect(c.weight()).toBe(0);
  });

  it('setGuidance enforces start ≤ end', () => {
    const c = new ControlNetConfig();
    c.setGuidance(0.8, 0.2);
    expect(c.duration()).toBe(0); // end clamped to start
  });

  it('isActive when weight > 0 and end > start', () => {
    const c = new ControlNetConfig().setWeight(1.0);
    expect(c.isActive()).toBe(true);
    c.setWeight(0);
    expect(c.isActive()).toBe(false);
  });

  it('toDict serializes all settings', () => {
    const c = new ControlNetConfig().setMode('depth').setWeight(0.8).setModel('ctrl_v11');
    const d = c.toDict();
    expect(d.mode).toBe('depth');
    expect(d.weight).toBe(0.8);
    expect(d.model).toBe('ctrl_v11');
  });
});

describe('IPAdapter', () => {
  it('default style mode weight 0.8', () => {
    const ip = new IPAdapter();
    expect(ip.mode()).toBe('style');
    expect(ip.weight()).toBe(0.8);
  });

  it('hasReference false when empty', () => {
    expect(new IPAdapter().hasReference()).toBe(false);
    expect(new IPAdapter().setImage('/path/img.png').hasReference()).toBe(true);
  });

  it('setWeight clamps 0-2', () => {
    const ip = new IPAdapter();
    ip.setWeight(99);
    expect(ip.weight()).toBe(2);
  });

  it('setNoise clamps 0-1', () => {
    const ip = new IPAdapter();
    ip.setNoise(5);
    expect(ip.toDict().noiseStrength).toBe(1);
  });

  it('toDict includes mode+weight+model', () => {
    const ip = new IPAdapter().setMode('face').setModel('ip-face-v1');
    expect(ip.toDict().mode).toBe('face');
    expect(ip.toDict().model).toBe('ip-face-v1');
  });
});

describe('ImageGenCoreIndex', () => {
  it('list has all 10 engines + Index self', () => {
    const idx = new ImageGenCoreIndex();
    const list = idx.list();
    expect(list).toHaveLength(10);
    expect(list).toContain('PromptBuilder');
    expect(list).toContain('IPAdapter');
  });

  it('count returns 10', () => {
    const idx = new ImageGenCoreIndex();
    expect(idx.count()).toBe(10);
  });

  it('has returns true for existing engines', () => {
    const idx = new ImageGenCoreIndex();
    expect(idx.has('SeedLock')).toBe(true);
    expect(idx.has('NonExistent')).toBe(false);
  });

  it('CH_BATCH_1_ENGINES const has 10 entries', () => {
    expect(CH_BATCH_1_ENGINES).toHaveLength(10);
  });
});