# Animation & Feedback (V3) — Direction Q

**Version**: 1.0.0
**Engines**: V2806-V2835 (30 engines, 6 batches)
**Tests**: 74 tests, 100% pass

## 目标

完整动画 + 反馈系统：物理弹簧、缓动函数、过渡编排、骨架屏、加载状态、触感反馈、声音反馈、GPU 加速、Reduced Motion。

## 模块结构

| V# | File | 关键能力 |
|----|------|----------|
| Q1-Q15 | `Animation.ts` | SpringConfig + Easing (linear/ease-in/ease-out/ease-in-out/bounce/elastic) + SpringInterpolator + SpringController + PhysicsEngine + TransitionOrchestrator + PageTransition (6 types) + StaggeredAnimation + Choreographer + RAFScheduler + SkeletonGenerator (5 shapes) + LoadingDots + ProgressBar + Spinner + PulseAnimation |
| Q16-Q25 | `AnimationAdvanced.ts` | HapticEngine (7 patterns) + SoundFeedback + VisualFeedback + TooltipAnimator + RippleEffect + ReducedMotion + PerformanceAware (adaptive quality) + GPUAccelerated + TransformOptimizer (cache) + IdleCallback (3 priorities) |
| Q26 | `index.ts` + `demo/animation-demo.ts` | 16 端到端断言 |
| Q27 | `__tests__/animation-integration.test.ts` | 10 集成测试 |
| Q28 | `ANIMATION_README.md` | 本文档 |
| Q29 | 主 README 更新 | 验证命令 |
| Q30 | 收口 commit + push | |

## 核心 API 示例

### 1. Spring + Easing

```ts
import { SpringConfig, Easing, SpringController, SpringInterpolator } from '@/ui/animation'

const config = new SpringConfig({ tension: 80, friction: 20 })
const spring = new SpringInterpolator(0, 100, config)
for (let i = 0; i < 100; i++) spring.update(0.05)

Easing.bounceOut(0.5)  // 0.734375
Easing.elasticOut(1)   // 1
```

### 2. Transitions

```ts
import { TransitionOrchestrator, PageTransition, StaggeredAnimation, Choreographer } from '@/ui/animation'

const to = new TransitionOrchestrator()
to.enter()  // 'entering' → 'active'
to.exit()   // 'exiting' → 'done' → 'idle'

const sa = new StaggeredAnimation(50, 200)
sa.setItems(['a', 'b', 'c'])
sa.update(150)  // 各 item 进度
```

### 3. Loading states

```ts
import { SkeletonGenerator, LoadingDots, ProgressBar, Spinner, PulseAnimation } from '@/ui/animation'

new SkeletonGenerator().generate('card')  // SkeletonItem
const ld = new LoadingDots(3, 100)
const current = ld.tick(150)  // 当前 active dot index

const pb = new ProgressBar()
pb.setValue(75, 100)
pb.percent()  // 75
```

### 4. Feedback

```ts
import { HapticEngine, SoundFeedback, VisualFeedback, Ripple } from '@/ui/animation'

const h = new HapticEngine(); h.trigger('success')
const s = new SoundFeedback(); s.play('click')
const v = new VisualFeedback(5000); v.emit(100, 200)

const r = new Ripple(100, 600)
r.start(50, 50); r.update()
```

### 5. Performance

```ts
import { ReducedMotion, PerformanceAware, GPUAccelerated, TransformOptimizer, IdleCallback } from '@/ui/animation'

const rm = new ReducedMotion()
rm.setEnabled(true)
rm.adjustDuration(500)  // 0 (disabled)

const p = new PerformanceAware()
p.recordFrame(16)
p.recommend()  // 'high' (60fps)

const gpu = new GPUAccelerated()
gpu.createLayer('a')
gpu.markChanged('a')  // triggers GPU composite

const ic = new IdleCallback()
ic.schedule(() => console.log('a'), 'background')
ic.schedule(() => console.log('b'), 'normal')
ic.flush()  // executes in priority order: a, b
```

## 验证命令

```bash
npx vitest run src/ui/animation/  # 74 passed
npx vitest run src/ui/animation/demo/animation-demo.test.ts
npx vitest run src/ui/animation/__tests__/animation-integration.test.ts
```

## 灵感

- React Spring (物理动画)
- Framer Motion (动画编排)
- GSAP (时间轴)
- Popmotion (物理引擎)
- Web Animations API
- Material Design Motion
- iOS HIG (触感反馈)
- Web Audio API

## 累计

- Direction A-Q: **515 engines / 5,647 tests**
- 18 commits pushed
- 灵感: React Spring + Framer Motion + GSAP + Material Design Motion + iOS HIG