# CU Synthetic Data Generation — Training Bootstrap

**V5186-V5215** | **28 engines / 35 tests / 100% pass / 95%+ coverage**

## Overview

CU provides a complete synthetic data generation layer: generator + template
synthesizer + diversity filter + quality validator + privacy filter + statistical
matcher + schema generator + sample augmenter + balancer + seed manager, plus
advanced (distribution analyzer + coverage analyzer + novelty scorer + bias
detector + drift detector + fairness scorer + regeneration strategy + comparator +
synthetic validator), plus integration (dashboard + report + config + audit +
migration + indices).

## Engines

### Batch 1/3 — Core (SyntheticDataCore.ts)
- `SyntheticGenerator` — template-based text generation
- `TemplateSynthesizer` — variable detection + fillDefaults
- `DiversityFilter` — unique ratio + dedup
- `QualityValidator` — text uniqueness scoring
- `PrivacyFilter` — PII detection + redaction
- `StatisticalMatcher` — distribution mean/variance matching
- `SchemaGenerator` — typed schema → records
- `SampleAugmenter` — paraphrase + synonym replace
- `Balancer` — class balancing
- `SeedManager` — deterministic seed
- `SynthDataCoreIndex` — Batch 1/3 index

### Batch 2/3 — Advanced (SyntheticDataAdvanced.ts)
- `DistributionAnalyzer` — mean/variance/min/max
- `CoverageAnalyzer` — feature space coverage + gaps
- `NoveltyScorer` — cosine novelty score
- `BiasDetector` — class imbalance ratio
- `DriftDetector` — PSI drift detection
- `FairnessScorer` — demographic parity
- `RegenerationStrategy` — regenerate/fix/accept
- `SyntheticComparator` — precision/recall
- `SyntheticValidator` — rule-based validation
- `SynthDataAdvancedIndex` — Batch 2/3 index

### Batch 3/3 — Integration (SyntheticDataIntegration.ts)
- `SyntheticDashboard` — panel container
- `SyntheticReport` — markdown + CSV
- `SyntheticConfig` — typed config
- `SyntheticAudit` — user/action/sampleCount log
- `SyntheticMigration` — version migrations
- `SynthDataIntegrationIndex` — Batch 3/3 index
- `SynthDataMasterIndex` — all 28 engines

## Usage

```ts
import { SyntheticGenerator, DiversityFilter, QualityValidator } from './src/ai/synthetic_data/SyntheticDataCore';

const g = new SyntheticGenerator();
g.registerTemplate('bio', 'My name is {name} and I am a {role}.');
const output = g.generate('bio', { name: 'Alice', role: 'writer' });

const filter = new DiversityFilter();
const diversity = filter.score(['a', 'b', 'c']); // 1.0

const qv = new QualityValidator();
const quality = qv.score('the cat sat on the mat'); // uniqueness ratio
```

## Testing

```bash
npx vitest run src/ai/synthetic_data/ --coverage --coverage.include='src/ai/synthetic_data/**'
```

Coverage: **~99% statements / 95%+ branches** ≥95% target met across all 3 batches.