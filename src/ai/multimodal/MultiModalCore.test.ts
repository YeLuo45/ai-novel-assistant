// V5246-V5255: CW Multi-Modal Generation Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  TextToImage,
  ImageToText,
  AudioGenerator,
  VideoGenerator,
  Model3DGenerator,
  MultimodalEncoder,
  MultimodalDecoder,
  ModalityRouter,
  EmbeddingAligner,
  MultiModalCoreIndex,
  CW_BATCH_1_ENGINES
} from './MultiModalCore';

describe('TextToImage + ImageToText + AudioGenerator + VideoGenerator + Model3DGenerator', () => {
  it('TextToImage generate + get + count', () => {
    const t = new TextToImage();
    const id = t.generate('a cat', 'http://img.png');
    expect(t.get(id)?.url).toBe('http://img.png');
    expect(t.get('missing')).toBeNull();
    expect(t.count()).toBe(1);
  });

  it('ImageToText caption + batch + isValid', () => {
    const i = new ImageToText();
    const c = i.caption('http://x.png');
    expect(c.length).toBeGreaterThan(0);
    expect(i.captionBatch(['a', 'b'])).toHaveLength(2);
    expect(i.isValidCaption('long enough caption')).toBe(true);
    expect(i.isValidCaption('ab')).toBe(false);
  });

  it('AudioGenerator generate + get + totalDuration + count', () => {
    const a = new AudioGenerator();
    a.generate(1000); a.generate(2000);
    expect(a.totalDurationMs()).toBe(3000);
    expect(a.count()).toBe(2);
    expect(a.get('missing')).toBeNull();
  });

  it('VideoGenerator generate + get + frameCount + count', () => {
    const v = new VideoGenerator();
    const id = v.generate(1000, 30); // 1s @ 30fps = 30 frames
    expect(v.frameCount(id)).toBe(30);
    expect(v.get(id)?.fps).toBe(30);
    expect(v.frameCount('missing')).toBe(0);
  });

  it('Model3DGenerator generate + get + totalVertices + count', () => {
    const m = new Model3DGenerator();
    m.generate(100, 'obj'); m.generate(200, 'gltf');
    expect(m.totalVertices()).toBe(300);
    expect(m.get('missing')).toBeNull();
  });
});

describe('MultimodalEncoder + MultimodalDecoder + ModalityRouter + EmbeddingAligner', () => {
  it('MultimodalEncoder encode + batch + dim', () => {
    const e = new MultimodalEncoder();
    const emb = e.encode('hello', 'http://img.png');
    expect(emb).toHaveLength(3);
    expect(e.dim()).toBe(3);
    expect(e.encodeBatch([{ text: 'a', imageUrl: 'b' }])).toHaveLength(1);
  });

  it('MultimodalDecoder decode + batch', () => {
    const d = new MultimodalDecoder();
    const r = d.decode([0.5, 0.3, 0.4]);
    expect(r.text.startsWith('text-')).toBe(true);
    expect(d.decodeBatch([[0.1, 0.2, 0.3]])).toHaveLength(1);
  });

  it('ModalityRouter route + supportsType', () => {
    const r = new ModalityRouter();
    expect(r.route({ type: 'image', content: 'x' })).toBe('i2t');
    expect(r.route({ type: 'audio', content: 'x' })).toBe('t2a');
    expect(r.route({ type: 'video', content: 'x' })).toBe('t2v');
    expect(r.route({ type: '3d', content: 'x' })).toBe('t2m');
    expect(r.route({ type: 'text', content: 'x' })).toBe('unknown');
    expect(r.supportsType('image')).toBe(true);
    expect(r.supportsType('unknown')).toBe(false);
  });

  it('EmbeddingAligner align + batch + similarity', () => {
    const a = new EmbeddingAligner();
    const aligned = a.align([1, 2, 3], 5);
    expect(aligned).toHaveLength(5);
    expect(a.alignBatch([[1, 2], [3, 4]], 3)).toHaveLength(2);
    const v1 = a.align([1, 0], 2);
    const v2 = a.align([0, 1], 2);
    expect(a.similarity(v1, v2)).toBeLessThan(1);
  });
});

describe('MultiModalCoreIndex', () => {
  it('list has 10', () => {
    expect(new MultiModalCoreIndex().list()).toHaveLength(10);
  });

  it('count + engines + has', () => {
    const idx = new MultiModalCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('TextToImage')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
  });

  it('CW_BATCH_1_ENGINES const has 10', () => {
    expect(CW_BATCH_1_ENGINES).toHaveLength(10);
  });
});