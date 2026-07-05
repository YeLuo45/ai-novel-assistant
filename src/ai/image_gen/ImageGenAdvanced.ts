// Round 8 Direction CH — Image Generation Batch 2/3 (Advanced)
// V4806-V4815: Img2Img + Inpainting + Outpainting + Upscaler + ColorGrader
//            + FaceRestorer + BackgroundRemover + StyleTransfer + AnimeFilter + PhotoReal
// 3-files × 10-engines pattern (P-97)

import type { AspectRatio } from './ImageGenCore';

export type UpscaleMethod = 'lanczos' | 'esrgan' | 'real-esrgan' | 'swinir' | 'latent' | 'bicubic';
export type InpaintMode = 'fill' | 'original' | 'masked-blur' | 'masked-content';
export type OutpaintDirection = 'left' | 'right' | 'up' | 'down';
export type ColorSpace = 'srgb' | 'linear' | 'adobe-rgb' | 'display-p3' | 'prophoto';
export type AnimeFilterStyle = 'cel' | 'shojo' | 'shonen' | 'ghibli' | 'makoto' | 'pas' | 'cyber' | 'vapor';

// V4806: Img2Img — image-to-image with denoising + init image strength
export class Img2Img {
  private _initImage: string = '';
  private _denoising: number = 0.6;
  private _mask: string = '';
  private _inpaintArea: 'whole' | 'masked' = 'whole';
  private _prompt: string = '';
  private _negativePrompt: string = '';
  private _width: number = 512;
  private _height: number = 512;

  setInitImage(img: string): this { this._initImage = img; return this; }
  setDenoising(d: number): this { this._denoising = Math.max(0, Math.min(1, d)); return this; }
  setMask(m: string): this { this._mask = m; return this; }
  setInpaintArea(a: 'whole' | 'masked'): this { this._inpaintArea = a; return this; }
  setPrompt(p: string): this { this._prompt = p; return this; }
  setNegativePrompt(n: string): this { this._negativePrompt = n; return this; }
  setSize(w: number, h: number): this { this._width = w; this._height = h; return this; }

  hasInitImage(): boolean { return this._initImage.length > 0; }
  hasMask(): boolean { return this._mask.length > 0; }

  isStrongVariation(): boolean { return this._denoising > 0.7; }
  isLightVariation(): boolean { return this._denoising < 0.4; }

  toDict(): Record<string, string | number> {
    const d: Record<string, string | number> = {
      prompt: this._prompt,
      negative: this._negativePrompt,
      denoising: this._denoising,
      width: this._width,
      height: this._height
    };
    if (this._initImage) d.initImage = this._initImage;
    if (this._mask) d.mask = this._mask;
    d.inpaintArea = this._inpaintArea;
    return d;
  }

  denoising(): number { return this._denoising; }
  prompt(): string { return this._prompt; }
}

// V4807: Inpainting — masked region fill + mode + blend
export class Inpainting {
  private _mode: InpaintMode = 'fill';
  private _maskBlur: number = 4;
  private _maskedContentPadding: number = 32;
  private _inpaintPadding: number = 32;
  private _seamlessBlend: boolean = true;
  private _blendStrength: number = 0.8;

  setMode(m: InpaintMode): this { this._mode = m; return this; }
  setMaskBlur(b: number): this { this._maskBlur = Math.max(0, Math.min(64, b)); return this; }
  setMaskedContentPadding(p: number): this { this._maskedContentPadding = Math.max(0, Math.min(256, p)); return this; }
  setInpaintPadding(p: number): this { this._inpaintPadding = Math.max(0, Math.min(256, p)); return this; }
  setSeamless(enabled: boolean): this { this._seamlessBlend = enabled; return this; }
  setBlendStrength(s: number): this { this._blendStrength = Math.max(0, Math.min(1, s)); return this; }

  isConservative(): boolean { return this._mode === 'original'; }
  isAggressive(): boolean { return this._mode === 'fill'; }

  toDict(): Record<string, number | string | boolean> {
    return {
      mode: this._mode,
      maskBlur: this._maskBlur,
      maskedContentPadding: this._maskedContentPadding,
      inpaintPadding: this._inpaintPadding,
      seamless: this._seamlessBlend,
      blendStrength: this._blendStrength
    };
  }

  mode(): InpaintMode { return this._mode; }
  blendStrength(): number { return this._blendStrength; }
}

// V4808: Outpainting — extend canvas in 4 directions
export class Outpainting {
  private _pixels: number = 64;
  private _directions: Set<OutpaintDirection> = new Set();
  private _applyControlnet: boolean = true;
  private _colorMatch: boolean = true;
  private _noiseFalloff: number = 0.5;

  setPixels(p: number): this { this._pixels = Math.max(8, Math.min(2048, p)); return this; }
  enableDirection(d: OutpaintDirection): this { this._directions.add(d); return this; }
  disableDirection(d: OutpaintDirection): this { this._directions.delete(d); return this; }
  setControlnet(enabled: boolean): this { this._applyControlnet = enabled; return this; }
  setColorMatch(enabled: boolean): this { this._colorMatch = enabled; return this; }
  setNoiseFalloff(n: number): this { this._noiseFalloff = Math.max(0, Math.min(1, n)); return this; }

  directions(): OutpaintDirection[] { return Array.from(this._directions); }
  directionCount(): number { return this._directions.size; }

  expandedSize(origW: number, origH: number): { width: number; height: number } {
    let w = origW;
    let h = origH;
    if (this._directions.has('left')) w += this._pixels;
    if (this._directions.has('right')) w += this._pixels;
    if (this._directions.has('up')) h += this._pixels;
    if (this._directions.has('down')) h += this._pixels;
    return { width: w, height: h };
  }

  toDict(): Record<string, number | string | boolean | string[]> {
    return {
      pixels: this._pixels,
      directions: Array.from(this._directions),
      controlnet: this._applyControlnet,
      colorMatch: this._colorMatch,
      noiseFalloff: this._noiseFalloff
    };
  }

  pixels(): number { return this._pixels; }
}

// V4809: Upscaler — scale factor + method + denoise
export class Upscaler {
  private _method: UpscaleMethod = 'real-esrgan';
  private _scaleFactor: number = 4;
  private _denoise: number = 0.3;
  private _tileSize: number = 512;
  private _overlap: number = 32;

  setMethod(m: UpscaleMethod): this { this._method = m; return this; }
  setScale(s: number): this { this._scaleFactor = Math.max(1, Math.min(8, s)); return this; }
  setDenoise(d: number): this { this._denoise = Math.max(0, Math.min(1, d)); return this; }
  setTileSize(t: number): this { this._tileSize = Math.max(64, Math.min(2048, t)); return this; }
  setOverlap(o: number): this { this._overlap = Math.max(0, Math.min(128, o)); return this; }

  isAIMethod(): boolean { return ['esrgan', 'real-esrgan', 'swinir'].includes(this._method); }
  needsTiling(): boolean { return this._tileSize > 0 && this._method !== 'lanczos'; }

  upscaleSize(origW: number, origH: number): { width: number; height: number } {
    return { width: Math.round(origW * this._scaleFactor), height: Math.round(origH * this._scaleFactor) };
  }

  tileCount(origW: number, origH: number): { x: number; y: number } {
    if (!this.needsTiling()) return { x: 1, y: 1 };
    const outW = origW * this._scaleFactor;
    const outH = origH * this._scaleFactor;
    return {
      x: Math.ceil(outW / (this._tileSize - this._overlap)),
      y: Math.ceil(outH / (this._tileSize - this._overlap))
    };
  }

  toDict(): Record<string, number | string> {
    return {
      method: this._method,
      scale: this._scaleFactor,
      denoise: this._denoise,
      tileSize: this._tileSize,
      overlap: this._overlap
    };
  }

  method(): UpscaleMethod { return this._method; }
  scaleFactor(): number { return this._scaleFactor; }
}

// V4810: ColorGrader — exposure + contrast + saturation + temperature + tint
export class ColorGrader {
  private _exposure: number = 0.0;
  private _contrast: number = 1.0;
  private _saturation: number = 1.0;
  private _temperature: number = 6500;
  private _tint: number = 0;
  private _highlights: number = 0;
  private _shadows: number = 0;
  private _whites: number = 0;
  private _blacks: number = 0;
  private _vibrance: number = 0;
  private _colorSpace: ColorSpace = 'srgb';

  setExposure(e: number): this { this._exposure = Math.max(-5, Math.min(5, e)); return this; }
  setContrast(c: number): this { this._contrast = Math.max(0, Math.min(2, c)); return this; }
  setSaturation(s: number): this { this._saturation = Math.max(0, Math.min(2, s)); return this; }
  setTemperature(t: number): this { this._temperature = Math.max(2000, Math.min(50000, t)); return this; }
  setTint(t: number): this { this._tint = Math.max(-100, Math.min(100, t)); return this; }
  setHighlights(h: number): this { this._highlights = Math.max(-100, Math.min(100, h)); return this; }
  setShadows(s: number): this { this._shadows = Math.max(-100, Math.min(100, s)); return this; }
  setWhites(w: number): this { this._whites = Math.max(-100, Math.min(100, w)); return this; }
  setBlacks(b: number): this { this._blacks = Math.max(-100, Math.min(100, b)); return this; }
  setVibrance(v: number): this { this._vibrance = Math.max(-100, Math.min(100, v)); return this; }
  setColorSpace(c: ColorSpace): this { this._colorSpace = c; return this; }

  isNeutral(): boolean {
    return this._exposure === 0 && this._contrast === 1 && this._saturation === 1
      && this._temperature === 6500 && this._tint === 0;
  }

  reset(): this {
    this._exposure = 0;
    this._contrast = 1;
    this._saturation = 1;
    this._temperature = 6500;
    this._tint = 0;
    this._highlights = 0;
    this._shadows = 0;
    this._whites = 0;
    this._blacks = 0;
    this._vibrance = 0;
    return this;
  }

  toDict(): Record<string, number | string> {
    return {
      exposure: this._exposure,
      contrast: this._contrast,
      saturation: this._saturation,
      temperature: this._temperature,
      tint: this._tint,
      highlights: this._highlights,
      shadows: this._shadows,
      whites: this._whites,
      blacks: this._blacks,
      vibrance: this._vibrance,
      colorSpace: this._colorSpace
    };
  }

  exposure(): number { return this._exposure; }
  temperature(): number { return this._temperature; }
}

// V4811: FaceRestorer — codeformer / gfpgan / detector + fidelity
export class FaceRestorer {
  private _model: 'codeformer' | 'gfpgan' | 'restoreformer' = 'codeformer';
  private _fidelity: number = 0.7;
  private _detectionThreshold: number = 0.5;
  private _maxFaces: number = 4;
  private _upsampleTimes: number = 1;

  setModel(m: 'codeformer' | 'gfpgan' | 'restoreformer'): this { this._model = m; return this; }
  setFidelity(f: number): this { this._fidelity = Math.max(0, Math.min(1, f)); return this; }
  setThreshold(t: number): this { this._detectionThreshold = Math.max(0, Math.min(1, t)); return this; }
  setMaxFaces(n: number): this { this._maxFaces = Math.max(1, Math.min(20, n)); return this; }
  setUpsample(t: number): this { this._upsampleTimes = Math.max(0, Math.min(4, t)); return this; }

  isConservative(): boolean { return this._fidelity > 0.7; }
  isAggressive(): boolean { return this._fidelity < 0.4; }

  toDict(): Record<string, number | string> {
    return {
      model: this._model,
      fidelity: this._fidelity,
      threshold: this._detectionThreshold,
      maxFaces: this._maxFaces,
      upsample: this._upsampleTimes
    };
  }

  model(): string { return this._model; }
  fidelity(): number { return this._fidelity; }
}

// V4812: BackgroundRemover — rembg / u2net / isnet + alpha matting
export class BackgroundRemover {
  private _model: 'u2net' | 'isnet-general-use' | 'silueta' | 'rembg' = 'u2net';
  private _alphaMatting: boolean = true;
  private _alphaMattingErode: number = 10;
  private _alphaMattingForegroundThreshold: number = 240;
  private _alphaMattingBackgroundThreshold: number = 10;
  private _postProcessMask: boolean = true;

  setModel(m: 'u2net' | 'isnet-general-use' | 'silueta' | 'rembg'): this { this._model = m; return this; }
  setAlphaMatting(enabled: boolean): this { this._alphaMatting = enabled; return this; }
  setErodeSize(n: number): this { this._alphaMattingErode = Math.max(0, Math.min(40, n)); return this; }
  setForegroundThreshold(t: number): this { this._alphaMattingForegroundThreshold = Math.max(0, Math.min(255, t)); return this; }
  setBackgroundThreshold(t: number): this { this._alphaMattingBackgroundThreshold = Math.max(0, Math.min(255, t)); return this; }
  setPostProcessMask(enabled: boolean): this { this._postProcessMask = enabled; return this; }

  returnsTransparent(): boolean { return this._alphaMatting || this._postProcessMask; }

  toDict(): Record<string, number | string | boolean> {
    return {
      model: this._model,
      alphaMatting: this._alphaMatting,
      erode: this._alphaMattingErode,
      fgThreshold: this._alphaMattingForegroundThreshold,
      bgThreshold: this._alphaMattingBackgroundThreshold,
      postProcess: this._postProcessMask
    };
  }

  model(): string { return this._model; }
}

// V4813: StyleTransfer — reference image + strength + preserve color
export class StyleTransfer {
  private _reference: string = '';
  private _strength: number = 0.6;
  private _preserveColor: boolean = false;
  private _preserveComposition: boolean = true;
  private _blendMode: 'replace' | 'multiply' | 'overlay' | 'soft-light' = 'overlay';

  setReference(img: string): this { this._reference = img; return this; }
  setStrength(s: number): this { this._strength = Math.max(0, Math.min(1, s)); return this; }
  setPreserveColor(enabled: boolean): this { this._preserveColor = enabled; return this; }
  setPreserveComposition(enabled: boolean): this { this._preserveComposition = enabled; return this; }
  setBlendMode(m: 'replace' | 'multiply' | 'overlay' | 'soft-light'): this { this._blendMode = m; return this; }

  hasReference(): boolean { return this._reference.length > 0; }
  isSubtle(): boolean { return this._strength < 0.3; }
  isStrong(): boolean { return this._strength > 0.7; }

  toDict(): Record<string, number | string | boolean> {
    return {
      reference: this._reference,
      strength: this._strength,
      preserveColor: this._preserveColor,
      preserveComposition: this._preserveComposition,
      blendMode: this._blendMode
    };
  }

  strength(): number { return this._strength; }
  blendMode(): string { return this._blendMode; }
}

// V4814: AnimeFilter — 8 anime styles + intensity + line preservation
export class AnimeFilter {
  private _style: AnimeFilterStyle = 'cel';
  private _intensity: number = 0.8;
  private _preserveLineart: boolean = true;
  private _lineThickness: number = 1.0;
  private _colorReduction: number = 32;
  private _edgeEnhancement: number = 0.5;

  setStyle(s: AnimeFilterStyle): this { this._style = s; return this; }
  setIntensity(i: number): this { this._intensity = Math.max(0, Math.min(1, i)); return this; }
  setPreserveLineart(enabled: boolean): this { this._preserveLineart = enabled; return this; }
  setLineThickness(t: number): this { this._lineThickness = Math.max(0.1, Math.min(5, t)); return this; }
  setColorReduction(n: number): this { this._colorReduction = Math.max(2, Math.min(256, n)); return this; }
  setEdgeEnhancement(e: number): this { this._edgeEnhancement = Math.max(0, Math.min(2, e)); return this; }

  isLight(): boolean { return this._intensity < 0.4; }
  isHeavy(): boolean { return this._intensity > 0.7; }

  toDict(): Record<string, number | string | boolean> {
    return {
      style: this._style,
      intensity: this._intensity,
      preserveLineart: this._preserveLineart,
      lineThickness: this._lineThickness,
      colorReduction: this._colorReduction,
      edgeEnhancement: this._edgeEnhancement
    };
  }

  style(): AnimeFilterStyle { return this._style; }
  intensity(): number { return this._intensity; }
}

// V4815: PhotoReal — photoreal enhancement + skin detail + lighting realism
export class PhotoReal {
  private _skinDetail: number = 0.6;
  private _lightingRealism: number = 0.7;
  private _depthOfField: number = 0.3;
  private _motionBlur: number = 0.0;
  private _filmGrain: number = 0.0;
  private _chromaticAberration: number = 0.0;
  private _lensDistortion: number = 0.0;
  private _vignette: number = 0.0;

  setSkinDetail(d: number): this { this._skinDetail = Math.max(0, Math.min(1, d)); return this; }
  setLighting(l: number): this { this._lightingRealism = Math.max(0, Math.min(1, l)); return this; }
  setDoF(d: number): this { this._depthOfField = Math.max(0, Math.min(1, d)); return this; }
  setMotionBlur(m: number): this { this._motionBlur = Math.max(0, Math.min(1, m)); return this; }
  setFilmGrain(g: number): this { this._filmGrain = Math.max(0, Math.min(0.5, g)); return this; }
  setChromatic(c: number): this { this._chromaticAberration = Math.max(0, Math.min(0.1, c)); return this; }
  setLensDistortion(l: number): this { this._lensDistortion = Math.max(-0.5, Math.min(0.5, l)); return this; }
  setVignette(v: number): this { this._vignette = Math.max(0, Math.min(1, v)); return this; }

  isClean(): boolean { return this._filmGrain < 0.05 && this._chromaticAberration === 0 && this._vignette === 0; }
  isCinematic(): boolean { return this._vignette > 0.3 && this._filmGrain > 0.1; }

  toDict(): Record<string, number> {
    return {
      skinDetail: this._skinDetail,
      lightingRealism: this._lightingRealism,
      depthOfField: this._depthOfField,
      motionBlur: this._motionBlur,
      filmGrain: this._filmGrain,
      chromaticAberration: this._chromaticAberration,
      lensDistortion: this._lensDistortion,
      vignette: this._vignette
    };
  }

  skinDetail(): number { return this._skinDetail; }
  filmGrain(): number { return this._filmGrain; }
}

// V4806-V4815: CH Batch 2/3 Index
export const CH_BATCH_2_ENGINES = [
  'Img2Img', 'Inpainting', 'Outpainting', 'Upscaler', 'ColorGrader',
  'FaceRestorer', 'BackgroundRemover', 'StyleTransfer', 'AnimeFilter', 'PhotoReal'
] as const;

export class ImageGenAdvancedIndex {
  list(): string[] {
    return [...CH_BATCH_2_ENGINES];
  }

  count(): number {
    return CH_BATCH_2_ENGINES.length;
  }

  engines(): string[] {
    return [...CH_BATCH_2_ENGINES];
  }

  has(name: string): boolean {
    return CH_BATCH_2_ENGINES.includes(name as typeof CH_BATCH_2_ENGINES[number]);
  }
}

// Force AspectRatio import to be retained for downstream usage (P-44 best practice)
export type { AspectRatio };