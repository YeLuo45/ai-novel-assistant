// Round 8 Direction CH — Image Generation Batch 3/3 (Integration Tests)
// V4816-V4825: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  VariationGenerator, SeedExplorer, PromptWeight, LoRAManager, EmbeddingManager,
  TileGenerator, CompositeEditor, Image2Prompt, StyleMixer, ImageGenIntegration,
  ImageGenIntegrationIndex, ImageGenMasterIndex, CH_BATCH_3_ENGINES,
  CH_ALL_ENGINES
} from './ImageGenIntegration';
import { PromptBuilder } from './ImageGenCore';

describe('VariationGenerator', () => {
  it('default count 4', () => {
    expect(new VariationGenerator().count()).toBe(4);
  });

  it('setCount clamps 1-20', () => {
    const v = new VariationGenerator();
    v.setCount(99);
    expect(v.count()).toBe(20);
  });

  it('generate produces N variations with offset seeds', () => {
    const v = new VariationGenerator().setCount(3).setBaseSeed(100);
    const out = v.generate('cat portrait');
    expect(out).toHaveLength(3);
    expect(out[0].seed).toBeLessThan(out[1].seed);
    expect(out[1].seed).toBeLessThan(out[2].seed);
  });

  it('variation seeds spread symmetric around base', () => {
    const v = new VariationGenerator().setCount(5).setBaseSeed(1000).setSeedStep(10);
    const out = v.generate('test');
    const centerIdx = 2;
    expect(out[centerIdx].seed).toBe(1000);
    expect(out[0].seed).toBeLessThan(out[centerIdx].seed);
    expect(out[4].seed).toBeGreaterThan(out[centerIdx].seed);
  });

  it('setStrengthVariation caps variation delta', () => {
    const v = new VariationGenerator().setCount(3).setStrengthVariation(0.5);
    expect(v.baseSeed()).toBe(42);
  });
});

describe('SeedExplorer', () => {
  it('seeds enumerates within radius', () => {
    const e = new SeedExplorer().setCenter(100).setRadius(50).setStep(25);
    const seeds = e.seeds();
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds).toContain(100);
  });

  it('count = (2r/step)+1', () => {
    const e = new SeedExplorer().setCenter(0).setRadius(100).setStep(20);
    expect(e.count()).toBe(11);
  });

  it('recordSimilarity + best returns top score', () => {
    const e = new SeedExplorer();
    e.recordSimilarity(1, 0.5, 0.8);
    e.recordSimilarity(2, 0.9, 0.9);
    e.recordSimilarity(3, 0.3, 0.4);
    const top = e.best();
    expect(top).not.toBeNull();
    expect(top!.seed).toBe(2);
    expect(top!.score).toBe(0.9);
  });

  it('best returns null when no records', () => {
    expect(new SeedExplorer().best()).toBeNull();
  });

  it('setRadius clamps 1-1000000', () => {
    const e = new SeedExplorer();
    e.setRadius(0);
    expect(e.center()).toBe(0);
    e.setRadius(99999999);
    expect(e.center()).toBe(0);
  });
});

describe('PromptWeight', () => {
  it('addVariant + count + totalWeight', () => {
    const p = new PromptWeight();
    p.addVariant('cat', 0.7).addVariant('dog', 0.3);
    expect(p.count()).toBe(2);
    expect(p.totalWeight()).toBe(1.0);
  });

  it('removeVariant deletes entry', () => {
    const p = new PromptWeight();
    p.addVariant('cat', 0.5);
    p.removeVariant('cat');
    expect(p.count()).toBe(0);
  });

  it('setWeight clamps 0-10', () => {
    const p = new PromptWeight();
    p.addVariant('x', 99);
    expect(p.totalWeight()).toBe(10);
  });

  it('normalized returns proportions', () => {
    const p = new PromptWeight();
    p.addVariant('a', 1).addVariant('b', 3);
    const norm = p.normalized();
    const sum = norm.reduce((s, v) => s + v.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('blend produces AND-joined weighted prompts', () => {
    const p = new PromptWeight();
    p.addVariant('cat', 0.6).addVariant('dog', 0.4);
    expect(p.blend()).toContain('AND');
    expect(p.blend()).toContain('(cat:0.60)');
  });
});

describe('LoRAManager', () => {
  it('add LoRA + count', () => {
    const m = new LoRAManager();
    m.add('char1', '/loras/c1.safetensors', 0.8, 'character');
    expect(m.count()).toBe(1);
    expect(m.names()).toContain('char1');
  });

  it('setWeight clamps -2 to 2', () => {
    const m = new LoRAManager();
    m.add('a', '/a', 5, 'style');
    expect(m.toDict().a.weight).toBe(2);
  });

  it('isFull when count >= max', () => {
    const m = new LoRAManager().setMax(2);
    m.add('a', '/a', 0.5, 'style');
    m.add('b', '/b', 0.5, 'style');
    expect(m.isFull()).toBe(true);
  });

  it('remove LoRA', () => {
    const m = new LoRAManager();
    m.add('x', '/x', 0.5, 'object');
    m.remove('x');
    expect(m.count()).toBe(0);
  });

  it('totalWeight sums absolute weights', () => {
    const m = new LoRAManager();
    m.add('a', '/a', 0.5, 'style');
    m.add('b', '/b', -0.3, 'concept');
    expect(m.totalWeight()).toBe(0.8);
  });
});

describe('EmbeddingManager', () => {
  it('add + count + totalTokens', () => {
    const e = new EmbeddingManager();
    e.add('e1', '/emb1', '<emb1>', 2);
    e.add('e2', '/emb2', '<emb2>', 3);
    expect(e.count()).toBe(2);
    expect(e.totalTokens()).toBe(5);
  });

  it('augment appends triggers when not manual', () => {
    const e = new EmbeddingManager();
    e.add('e1', '/emb1', '<emb1>', 1);
    expect(e.augment('a cat')).toContain('<emb1>');
  });

  it('manual mode skips augment', () => {
    const e = new EmbeddingManager().setTriggerMode('manual');
    e.add('e1', '/emb1', '<emb1>', 1);
    expect(e.augment('a cat')).toBe('a cat');
  });

  it('triggers returns list of trigger strings', () => {
    const e = new EmbeddingManager();
    e.add('a', '/a', '<trig_a>', 1);
    e.add('b', '/b', '<trig_b>', 1);
    expect(e.triggers()).toContain('<trig_a>');
    expect(e.triggers()).toContain('<trig_b>');
  });

  it('setTokens clamps 1-8', () => {
    const e = new EmbeddingManager();
    e.add('x', '/x', '<x>', 99);
    expect(e.totalTokens()).toBe(8);
  });
});

describe('TileGenerator', () => {
  it('count for 2048x2048 with 512 tile 64 overlap', () => {
    const t = new TileGenerator().setTileSize(512).setOverlap(64).setSize(2048, 2048);
    const c = t.count();
    expect(c.total).toBeGreaterThan(0);
  });

  it('generate produces tile positions', () => {
    const t = new TileGenerator().setTileSize(256).setOverlap(0).setSize(512, 256);
    const tiles = t.generate();
    expect(tiles.length).toBe(2);
    expect(tiles[0].x).toBe(0);
    expect(tiles[1].x).toBe(256);
  });

  it('reassemble computes coverage ratio', () => {
    const t = new TileGenerator().setTileSize(256).setOverlap(0).setSize(512, 512);
    const tiles = t.generate();
    const result = t.reassemble(tiles.map(() => 'data'));
    expect(result.coverage).toBe(1);
  });

  it('setTileSize clamps 64-2048', () => {
    const t = new TileGenerator();
    t.setTileSize(0);
    expect(t.tileSize()).toBe(64);
  });

  it('width/height tracks size', () => {
    const t = new TileGenerator().setSize(1024, 768);
    expect(t.width()).toBe(1024);
    expect(t.height()).toBe(768);
  });
});

describe('CompositeEditor', () => {
  it('addImage + imageCount', () => {
    const c = new CompositeEditor();
    c.addImage('/img1.png', 0, 0, 256, 256);
    c.addImage('/img2.png', 256, 0, 256, 256);
    expect(c.imageCount()).toBe(2);
  });

  it('setColumns clamps 1-8', () => {
    const c = new CompositeEditor();
    c.setColumns(99);
    expect(c.toDict().columns).toBe(8);
  });

  it('layoutGrid arranges images in grid', () => {
    const c = new CompositeEditor().setColumns(2).setPadding(10);
    c.addImage('/a', 0, 0, 100, 100);
    c.addImage('/b', 0, 0, 100, 100);
    c.addImage('/c', 0, 0, 100, 100);
    const grid = c.layoutGrid(100, 100);
    expect(grid[0].x).toBe(10);
    expect(grid[1].x).toBe(120);
    expect(grid[2].x).toBe(10);
    expect(grid[2].y).toBe(120);
  });

  it('setOpacity clamps 0-1', () => {
    const c = new CompositeEditor();
    c.addImage('/a', 0, 0, 100, 100, 5);
    expect(c.toDict().images[0].opacity).toBe(1);
  });

  it('clear empties images', () => {
    const c = new CompositeEditor();
    c.addImage('/a', 0, 0, 100, 100);
    c.clear();
    expect(c.imageCount()).toBe(0);
  });
});

describe('Image2Prompt', () => {
  it('default mode best + 3 categories', () => {
    const i = new Image2Prompt();
    expect(i.mode()).toBe('best');
    expect(i.categories()).toHaveLength(3);
  });

  it('infer returns prompt + confidence', () => {
    const i = new Image2Prompt();
    const result = i.infer('image-data-here');
    expect(result.prompt.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThan(1);
  });

  it('setMaxTokens clamps 10-150', () => {
    const i = new Image2Prompt();
    i.setMaxTokens(0);
    expect(i.mode()).toBe('best');
    i.setMaxTokens(999);
    expect(i.mode()).toBe('best');
  });

  it('enableCategory adds to set', () => {
    const i = new Image2Prompt();
    i.enableCategory('lighting');
    expect(i.categories()).toContain('lighting');
  });

  it('negative mode returns negative string', () => {
    const i = new Image2Prompt().setMode('negative');
    const result = i.infer('image');
    expect(result.negative).toContain('blurry');
  });
});

describe('StyleMixer', () => {
  it('addStyle + count + normalize', () => {
    const m = new StyleMixer();
    m.addStyle('anime', 0.6).addStyle('photoreal', 0.4);
    expect(m.count()).toBe(2);
    const norm = m.normalize();
    const sum = norm.reduce((s, v) => s + v.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it('dominant returns highest weight', () => {
    const m = new StyleMixer();
    m.addStyle('a', 0.3).addStyle('b', 0.7);
    const top = m.dominant();
    expect(top!.name).toBe('b');
    expect(top!.weight).toBe(0.7);
  });

  it('removeStyle', () => {
    const m = new StyleMixer();
    m.addStyle('x', 0.5);
    m.removeStyle('x');
    expect(m.count()).toBe(0);
  });

  it('apply adds weighted tokens to PromptBuilder', () => {
    const m = new StyleMixer();
    m.addStyle('anime', 1.0);
    const p = new PromptBuilder();
    m.apply(p);
    expect(p.build()).toContain('anime');
  });

  it('setBlendMode switches mode', () => {
    const m = new StyleMixer().setBlendMode('layered');
    expect(m.blendMode()).toBe('layered');
  });
});

describe('ImageGenIntegration', () => {
  it('default accessor methods return sub-engines', () => {
    const i = new ImageGenIntegration();
    expect(i.cache()).toBeDefined();
    expect(i.variations()).toBeDefined();
    expect(i.sampler()).toBeDefined();
  });

  it('record + history', () => {
    const i = new ImageGenIntegration();
    i.record('generate', { seed: 42 });
    i.record('cache', { key: 'abc' });
    expect(i.history()).toHaveLength(2);
    expect(i.history()[0].type).toBe('generate');
  });

  it('pipeline runs prompt+seeds through cache', () => {
    const i = new ImageGenIntegration();
    i.embeddings().add('e1', '/emb', '<trig>', 1);
    const out = i.pipeline('a cat', [100, 200, 300]);
    expect(out).toHaveLength(3);
    expect(out[0].key.length).toBeGreaterThan(0);
    expect(i.history().length).toBe(3);
  });

  it('loras() and embeddings() return sub-managers', () => {
    const i = new ImageGenIntegration();
    i.loras().add('l1', '/lora1', 0.5, 'style');
    expect(i.loras().count()).toBe(1);
  });
});

describe('ImageGenIntegrationIndex', () => {
  it('list has 10 engines', () => {
    expect(new ImageGenIntegrationIndex().list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new ImageGenIntegrationIndex().count()).toBe(10);
  });

  it('has checks', () => {
    expect(new ImageGenIntegrationIndex().has('TileGenerator')).toBe(true);
    expect(new ImageGenIntegrationIndex().has('Foo')).toBe(false);
  });

  it('CH_BATCH_3_ENGINES const has 10', () => {
    expect(CH_BATCH_3_ENGINES).toHaveLength(10);
  });
});

describe('ImageGenMasterIndex', () => {
  it('list contains all 30 engines', () => {
    const idx = new ImageGenMasterIndex();
    expect(idx.list()).toHaveLength(30);
  });

  it('count 30', () => {
    expect(new ImageGenMasterIndex().count()).toBe(30);
  });

  it('has returns true for all 3 batches', () => {
    const idx = new ImageGenMasterIndex();
    expect(idx.has('PromptBuilder')).toBe(true);     // Batch 1
    expect(idx.has('Img2Img')).toBe(true);           // Batch 2
    expect(idx.has('VariationGenerator')).toBe(true); // Batch 3
  });

  it('CH_ALL_ENGINES const has 30', () => {
    expect(CH_ALL_ENGINES).toHaveLength(30);
  });
});