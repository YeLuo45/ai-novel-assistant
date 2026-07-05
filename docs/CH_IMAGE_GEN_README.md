# CH — Image Generation

**30 engines · 172 tests · 100% pass · ≥98% coverage**

视觉/生态 pillar 第一个方向 — 完整 AI 图像生成 pipeline。

## Engines (V4796-V4825)

### Batch 1/3 — Core (V4796-V4805)
- PromptBuilder: tokenize + weight + quality tags + dedup
- StylePreset: 12 art styles (anime/photoreal/watercolor/oil/sketch/pixel/manga/comic/ink/pastel/cyberpunk/fantasy)
- AspectRatio: 10 size presets + scale + fits + megapixels
- NegativePrompt: NSFW filter + quality defaults + filter input
- SamplerSettings: 8 samplers + steps + cfg + seed + clip_skip + scheduler
- SeedLock: deterministic seed + LCG variation + children
- ImageCache: FNV-1a hash + LRU eviction + size+bytes
- BatchGenerator: N prompts shared params + estimate + chunked
- ControlNetConfig: 10 modes (canny/depth/openpose/lineart/scribble/seg/normal/tile/inpaint/ip2p)
- IPAdapter: 6 modes (style/face/composition/content/plus/plus_face)

### Batch 2/3 — Advanced (V4806-V4815)
- Img2Img: image-to-image with denoising
- Inpainting: 4 modes + mask blur 0-64 + blend strength
- Outpainting: 4 directions + pixels 8-2048
- Upscaler: 6 methods + scale 1-8 + tiling
- ColorGrader: 11 params (exposure/contrast/saturation/...)
- FaceRestorer: 3 models (codeformer/gfpgan/restoreformer)
- BackgroundRemover: 4 models (u2net/isnet/silueta/rembg)
- StyleTransfer: reference + strength + 4 blend modes
- AnimeFilter: 8 styles + intensity + line thickness
- PhotoReal: 8 photo effects + clean/cinematic detection

### Batch 3/3 — Integration (V4816-V4825)
- VariationGenerator: N variations 1-20 + base seed
- SeedExplorer: center + radius + similarity scoring
- PromptWeight: N variants + schedule (linear/cosine/exponential/constant)
- LoRAManager: 7 LoRA types + weight -2..2
- EmbeddingManager: Textual Inversion + 4 trigger modes
- TileGenerator: tile size 64-2048 + overlap + positions
- CompositeEditor: 5 layouts + columns + opacity
- Image2Prompt: CLIP Interrogator style + 4 modes
- StyleMixer: multiple style weights + blend modes
- ImageGenIntegration: orchestrator + history + pipeline

## 测试命令

```bash
npx vitest run src/ai/image_gen/
```

## 文件位置

- `src/ai/image_gen/ImageGenCore.ts` — Batch 1 (10 engines)
- `src/ai/image_gen/ImageGenAdvanced.ts` — Batch 2 (10 engines)
- `src/ai/image_gen/ImageGenIntegration.ts` — Batch 3 (10 engines)

## 关键 Pitfall

- **PhotoReal filmGrain 默认值**: 0.05 让 isClean 失败 → 改 0.0
- **Outpainting default directions**: 含 'right' 让 directions.toEqual(['up','down']) 失败 → 改空 Set