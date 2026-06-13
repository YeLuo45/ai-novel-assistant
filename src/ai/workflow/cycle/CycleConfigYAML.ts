/**
 * V2107 Direction A Iteration 22/30 Round 6: CycleConfigYAML
 *
 * YAML DSL for cycle configuration. Provides serialize/deserialize helpers
 * with simple, deterministic output (no YAML library dependency).
 *
 * Inspired by:
 * - chatdev-design: YAML config DSL
 * - claude-code-design: config file pattern
 */

export interface CycleYAMLConfig {
  cycleId: string;
  maxIterations: number;
  minImprovement: number;
  targetQuality: number;
  exitConditions: string[];
  isolationMode: 'strict' | 'shared' | 'none';
  metrics: string[];
}

export function configToYAML(config: CycleYAMLConfig): string {
  const lines: string[] = [];
  lines.push(`cycleId: ${config.cycleId}`);
  lines.push(`maxIterations: ${config.maxIterations}`);
  lines.push(`minImprovement: ${config.minImprovement}`);
  lines.push(`targetQuality: ${config.targetQuality}`);
  lines.push(`isolationMode: ${config.isolationMode}`);
  lines.push('exitConditions:');
  if (config.exitConditions.length === 0) {
    lines.push('  - none');
  } else {
    for (const c of config.exitConditions) lines.push(`  - ${c}`);
  }
  lines.push('metrics:');
  if (config.metrics.length === 0) {
    lines.push('  - none');
  } else {
    for (const m of config.metrics) lines.push(`  - ${m}`);
  }
  return lines.join('\n');
}

export function yamlToConfig(yaml: string): CycleYAMLConfig {
  const lines = yaml.split('\n');
  const result: Partial<CycleYAMLConfig> = { exitConditions: [], metrics: [] };
  let inList: 'exitConditions' | 'metrics' | null = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line || line.startsWith('#')) continue;
    if (line === 'exitConditions:' || line === 'metrics:') {
      inList = line === 'exitConditions:' ? 'exitConditions' : 'metrics';
      continue;
    }
    if (line.startsWith('  - ')) {
      const value = line.slice(4).trim();
      if (value === 'none') continue;
      if (inList) (result[inList] as string[]).push(value);
      continue;
    }
    inList = null;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key === 'cycleId') result.cycleId = value;
    else if (key === 'maxIterations') result.maxIterations = parseInt(value, 10);
    else if (key === 'minImprovement') result.minImprovement = parseFloat(value);
    else if (key === 'targetQuality') result.targetQuality = parseFloat(value);
    else if (key === 'isolationMode')
      result.isolationMode = value as CycleYAMLConfig['isolationMode'];
  }
  if (
    !result.cycleId ||
    result.maxIterations === undefined ||
    result.minImprovement === undefined ||
    result.targetQuality === undefined ||
    !result.isolationMode
  ) {
    throw new Error('YAML is missing required fields');
  }
  return result as CycleYAMLConfig;
}

export function validateYAMLConfig(config: CycleYAMLConfig): string[] {
  const errors: string[] = [];
  if (!config.cycleId) errors.push('cycleId is required');
  if (!Number.isFinite(config.maxIterations) || config.maxIterations < 1)
    errors.push('maxIterations must be a positive integer');
  if (!Number.isFinite(config.minImprovement) || config.minImprovement < 0)
    errors.push('minImprovement must be a non-negative number');
  if (
    !Number.isFinite(config.targetQuality) ||
    config.targetQuality < 0 ||
    config.targetQuality > 1
  )
    errors.push('targetQuality must be in [0, 1]');
  if (!['strict', 'shared', 'none'].includes(config.isolationMode))
    errors.push('isolationMode must be strict, shared, or none');
  return errors;
}

export function roundTripYAML(config: CycleYAMLConfig): CycleYAMLConfig {
  return yamlToConfig(configToYAML(config));
}
