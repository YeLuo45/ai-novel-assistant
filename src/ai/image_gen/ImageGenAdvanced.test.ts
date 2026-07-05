// Round 8 Direction CH — Image Generation Batch 2/3 (Advanced Tests)
// V4806-V4815: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  Img2Img, Inpainting, Outpainting, Upscaler, ColorGrader,
  FaceRestorer, BackgroundRemover, StyleTransfer, AnimeFilter, PhotoReal,
  ImageGenAdvancedIndex, CH_BATCH_2_ENGINES
} from './ImageGenAdvanced';

describe('Img2Img', () => {
  it('hasInitImage reflects state', () => {
    expect(new Img2Img().hasInitImage()).toBe(false);
    expect(new Img2Img().setInitImage('/path/img.png').hasInitImage()).toBe(true);
  });

  it('setDenoising clamps 0-1', () => {
    const i = new Img2Img();
    i.setDenoising(5);
    expect(i.denoising()).toBe(1);
    i.setDenoising(-1);
    expect(i.denoising()).toBe(0);
  });

  it('isStrongVariation > 0.7 / isLightVariation < 0.4', () => {
    expect(new Img2Img().setDenoising(0.8).isStrongVariation()).toBe(true);
    expect(new Img2Img().setDenoising(0.3).isLightVariation()).toBe(true);
    expect(new Img2Img().setDenoising(0.5).isStrongVariation()).toBe(false);
  });

  it('toDict omits initImage when empty', () => {
    const d = new Img2Img().setPrompt('test').toDict();
    expect(d.prompt).toBe('test');
    expect(d.initImage).toBeUndefined();
  });

  it('toDict includes initImage when set', () => {
    const d = new Img2Img().setInitImage('/img.png').toDict();
    expect(d.initImage).toBe('/img.png');
  });

  it('hasMask tracks mask state', () => {
    expect(new Img2Img().setMask('/mask.png').hasMask()).toBe(true);
  });
});

describe('Inpainting', () => {
  it('default mode fill + blend', () => {
    const i = new Inpainting();
    expect(i.mode()).toBe('fill');
    expect(i.blendStrength()).toBe(0.8);
  });

  it('setMaskBlur clamps 0-64', () => {
    const i = new Inpainting();
    i.setMaskBlur(999);
    expect(i.toDict().maskBlur).toBe(64);
  });

  it('isConservative original / isAggressive fill', () => {
    expect(new Inpainting().setMode('original').isConservative()).toBe(true);
    expect(new Inpainting().setMode('fill').isAggressive()).toBe(true);
  });

  it('setBlendStrength clamps 0-1', () => {
    const i = new Inpainting();
    i.setBlendStrength(99);
    expect(i.blendStrength()).toBe(1);
  });

  it('toDict includes all settings', () => {
    const i = new Inpainting().setMode('masked-content').setMaskBlur(8);
    const d = i.toDict();
    expect(d.mode).toBe('masked-content');
    expect(d.maskBlur).toBe(8);
  });
});

describe('Outpainting', () => {
  it('expandedSize grows by pixels on each direction', () => {
    const o = new Outpainting().setPixels(100);
    o.enableDirection('left');
    o.enableDirection('right');
    const out = o.expandedSize(512, 512);
    expect(out.width).toBe(712);
    expect(out.height).toBe(512);
  });

  it('4 directions grows both dimensions', () => {
    const o = new Outpainting().setPixels(64);
    o.enableDirection('left').enableDirection('right').enableDirection('up').enableDirection('down');
    const out = o.expandedSize(100, 100);
    expect(out.width).toBe(228);
    expect(out.height).toBe(228);
  });

  it('directionCount counts enabled', () => {
    const o = new Outpainting();
    o.enableDirection('right');
    expect(o.directionCount()).toBe(1);
  });

  it('setPixels clamps 8-2048', () => {
    const o = new Outpainting();
    o.setPixels(0);
    expect(o.pixels()).toBe(8);
  });

  it('toDict includes directions array', () => {
    const o = new Outpainting().setPixels(128);
    o.enableDirection('up').enableDirection('down');
    const d = o.toDict();
    expect(d.pixels).toBe(128);
    expect(d.directions).toEqual(['up', 'down']);
  });
});

describe('Upscaler', () => {
  it('upscaleSize multiplies dimensions', () => {
    const u = new Upscaler().setScale(4);
    const out = u.upscaleSize(512, 512);
    expect(out.width).toBe(2048);
    expect(out.height).toBe(2048);
  });

  it('isAIMethod true for ESRGAN family', () => {
    expect(new Upscaler().setMethod('esrgan').isAIMethod()).toBe(true);
    expect(new Upscaler().setMethod('lanczos').isAIMethod()).toBe(false);
  });

  it('tileCount splits large image', () => {
    const u = new Upscaler().setScale(4).setTileSize(512).setOverlap(64);
    const t = u.tileCount(1024, 1024);
    expect(t.x).toBeGreaterThanOrEqual(8); // 4096 / (512-64)
  });

  it('setScale clamps 1-8', () => {
    const u = new Upscaler();
    u.setScale(99);
    expect(u.scaleFactor()).toBe(8);
  });

  it('toDict returns method+scale+denoise', () => {
    const u = new Upscaler().setMethod('swinir').setScale(2);
    expect(u.toDict().method).toBe('swinir');
  });
});

describe('ColorGrader', () => {
  it('isNeutral when all at default', () => {
    expect(new ColorGrader().isNeutral()).toBe(true);
  });

  it('setExposure clamps -5..5', () => {
    const c = new ColorGrader();
    c.setExposure(99);
    expect(c.exposure()).toBe(5);
  });

  it('setContrast clamps 0-2', () => {
    const c = new ColorGrader();
    c.setContrast(-1);
    expect(c.toDict().contrast).toBe(0);
  });

  it('setTemperature 2000-50000', () => {
    const c = new ColorGrader();
    c.setTemperature(100);
    expect(c.temperature()).toBe(2000);
  });

  it('reset returns to neutral', () => {
    const c = new ColorGrader().setExposure(2).setContrast(1.5);
    c.reset();
    expect(c.isNeutral()).toBe(true);
  });

  it('setColorSpace sets profile', () => {
    const c = new ColorGrader().setColorSpace('display-p3');
    expect(c.toDict().colorSpace).toBe('display-p3');
  });
});

describe('FaceRestorer', () => {
  it('default codeformer fidelity 0.7', () => {
    const f = new FaceRestorer();
    expect(f.model()).toBe('codeformer');
    expect(f.fidelity()).toBe(0.7);
  });

  it('setFidelity clamps 0-1', () => {
    const f = new FaceRestorer();
    f.setFidelity(5);
    expect(f.fidelity()).toBe(1);
  });

  it('isConservative > 0.7 / isAggressive < 0.4', () => {
    expect(new FaceRestorer().setFidelity(0.8).isConservative()).toBe(true);
    expect(new FaceRestorer().setFidelity(0.3).isAggressive()).toBe(true);
  });

  it('setMaxFaces clamps 1-20', () => {
    const f = new FaceRestorer();
    f.setMaxFaces(99);
    expect(f.toDict().maxFaces).toBe(20);
  });

  it('toDict includes all', () => {
    const f = new FaceRestorer().setModel('gfpgan').setUpsample(2);
    const d = f.toDict();
    expect(d.model).toBe('gfpgan');
    expect(d.upsample).toBe(2);
  });
});

describe('BackgroundRemover', () => {
  it('default u2net model', () => {
    expect(new BackgroundRemover().model()).toBe('u2net');
  });

  it('returnsTransparent with alphaMatting', () => {
    expect(new BackgroundRemover().returnsTransparent()).toBe(true);
    expect(new BackgroundRemover().setAlphaMatting(false).setPostProcessMask(false).returnsTransparent()).toBe(false);
  });

  it('setErodeSize clamps 0-40', () => {
    const b = new BackgroundRemover();
    b.setErodeSize(99);
    expect(b.toDict().erode).toBe(40);
  });

  it('setForegroundThreshold clamps 0-255', () => {
    const b = new BackgroundRemover();
    b.setForegroundThreshold(999);
    expect(b.toDict().fgThreshold).toBe(255);
  });

  it('setModel supports 4 models', () => {
    const b = new BackgroundRemover().setModel('silueta');
    expect(b.model()).toBe('silueta');
  });
});

describe('StyleTransfer', () => {
  it('hasReference false when empty', () => {
    expect(new StyleTransfer().hasReference()).toBe(false);
    expect(new StyleTransfer().setReference('/img.png').hasReference()).toBe(true);
  });

  it('isSubtle < 0.3 / isStrong > 0.7', () => {
    expect(new StyleTransfer().setStrength(0.2).isSubtle()).toBe(true);
    expect(new StyleTransfer().setStrength(0.8).isStrong()).toBe(true);
  });

  it('setStrength clamps 0-1', () => {
    const s = new StyleTransfer();
    s.setStrength(99);
    expect(s.strength()).toBe(1);
  });

  it('setBlendMode switches blend strategy', () => {
    const s = new StyleTransfer().setBlendMode('multiply');
    expect(s.blendMode()).toBe('multiply');
  });

  it('toDict includes reference+strength', () => {
    const s = new StyleTransfer().setReference('/r.png').setStrength(0.5);
    expect(s.toDict().reference).toBe('/r.png');
    expect(s.toDict().strength).toBe(0.5);
  });
});

describe('AnimeFilter', () => {
  it('default cel style intensity 0.8', () => {
    const a = new AnimeFilter();
    expect(a.style()).toBe('cel');
    expect(a.intensity()).toBe(0.8);
  });

  it('isLight < 0.4 / isHeavy > 0.7', () => {
    expect(new AnimeFilter().setIntensity(0.3).isLight()).toBe(true);
    expect(new AnimeFilter().setIntensity(0.9).isHeavy()).toBe(true);
  });

  it('setLineThickness clamps 0.1-5', () => {
    const a = new AnimeFilter();
    a.setLineThickness(99);
    expect(a.toDict().lineThickness).toBe(5);
  });

  it('setColorReduction clamps 2-256', () => {
    const a = new AnimeFilter();
    a.setColorReduction(0);
    expect(a.toDict().colorReduction).toBe(2);
  });

  it('8 anime styles supported', () => {
    const styles: Array<typeof AnimeFilter.prototype.style extends () => infer T ? T : never> = [];
    const a = new AnimeFilter();
    ['cel', 'shojo', 'shonen', 'ghibli', 'makoto', 'pas', 'cyber', 'vapor'].forEach(s => a.setStyle(s as 'cel'));
    expect(a.style()).toBe('vapor');
  });
});

describe('PhotoReal', () => {
  it('isClean when film grain + aberration + vignette at min', () => {
    expect(new PhotoReal().isClean()).toBe(true);
  });

  it('isCinematic requires vignette + film grain high', () => {
    const p = new PhotoReal().setVignette(0.5).setFilmGrain(0.2);
    expect(p.isCinematic()).toBe(true);
  });

  it('setFilmGrain clamps 0-0.5', () => {
    const p = new PhotoReal();
    p.setFilmGrain(99);
    expect(p.filmGrain()).toBe(0.5);
  });

  it('setSkinDetail clamps 0-1', () => {
    const p = new PhotoReal();
    p.setSkinDetail(5);
    expect(p.skinDetail()).toBe(1);
  });

  it('setLensDistortion -0.5 to 0.5', () => {
    const p = new PhotoReal();
    p.setLensDistortion(99);
    expect(p.toDict().lensDistortion).toBe(0.5);
  });

  it('toDict has 8 photo effects', () => {
    const d = new PhotoReal().toDict();
    expect(Object.keys(d)).toHaveLength(8);
  });
});

describe('ImageGenAdvancedIndex', () => {
  it('list has all 10 engines', () => {
    const idx = new ImageGenAdvancedIndex();
    expect(idx.list()).toHaveLength(10);
    expect(idx.list()).toContain('Img2Img');
    expect(idx.list()).toContain('PhotoReal');
  });

  it('count returns 10', () => {
    expect(new ImageGenAdvancedIndex().count()).toBe(10);
  });

  it('has true for known engine', () => {
    expect(new ImageGenAdvancedIndex().has('Upscaler')).toBe(true);
    expect(new ImageGenAdvancedIndex().has('UnknownEngine')).toBe(false);
  });

  it('CH_BATCH_2_ENGINES const has 10 entries', () => {
    expect(CH_BATCH_2_ENGINES).toHaveLength(10);
  });
});