/**
 * V2115 Direction A Iteration 30/30 Round 6: CycleDelivery
 *
 * Final delivery package for the cycle subsystem. Produces a manifest,
 * changelog, and a delivery checklist that the operator / GitHub Pages
 * deployment pipeline can consume.
 *
 * Inspired by:
 * - thunderbolt-design: gh-pages deployment
 * - chatdev-design: delivery checklist
 */

export interface DeliveryManifest {
  cycleEngineVersion: string;
  moduleCount: number;
  totalTests: number;
  modules: Array<{ id: string; name: string; tests: number; commitSha: string }>;
}

export interface DeliveryChecklist {
  manifest: DeliveryManifest;
  changelog: string[];
  passed: boolean;
  failedChecks: string[];
}

export function buildManifest(
  cycleEngineVersion: string,
  modules: Array<{ id: string; name: string; tests: number; commitSha: string }>
): DeliveryManifest {
  const totalTests = modules.reduce((acc, m) => acc + m.tests, 0);
  return {
    cycleEngineVersion,
    moduleCount: modules.length,
    totalTests,
    modules,
  };
}

export function buildChangelog(manifest: DeliveryManifest): string[] {
  const lines: string[] = [];
  lines.push(`# CycleEngine ${manifest.cycleEngineVersion}`);
  lines.push('');
  lines.push(`Modules: ${manifest.moduleCount}`);
  lines.push(`Tests: ${manifest.totalTests}`);
  lines.push('');
  lines.push('## Modules');
  for (const m of manifest.modules) {
    lines.push(`- **${m.name}** (${m.id}) — ${m.tests} tests @ ${m.commitSha.slice(0, 7)}`);
  }
  return lines;
}

export function runDeliveryChecks(
  manifest: DeliveryManifest,
  options: { minTestsPerModule?: number; requiredModules?: number } = {}
): DeliveryChecklist {
  const minTests = options.minTestsPerModule ?? 10;
  const required = options.requiredModules ?? 30;
  const failedChecks: string[] = [];

  if (manifest.moduleCount < required) {
    failedChecks.push(`moduleCount ${manifest.moduleCount} < required ${required}`);
  }
  if (manifest.totalTests < manifest.moduleCount * minTests) {
    failedChecks.push(
      `totalTests ${manifest.totalTests} < moduleCount * minTests (${manifest.moduleCount * minTests})`
    );
  }
  for (const m of manifest.modules) {
    if (m.tests < minTests) {
      failedChecks.push(`module ${m.name} has ${m.tests} tests, expected >= ${minTests}`);
    }
  }

  return {
    manifest,
    changelog: buildChangelog(manifest),
    passed: failedChecks.length === 0,
    failedChecks,
  };
}

export function renderDeliveryMarkdown(checklist: DeliveryChecklist): string {
  const lines: string[] = [...checklist.changelog];
  lines.push('');
  lines.push(`## Delivery Status: ${checklist.passed ? 'PASS' : 'FAIL'}`);
  if (!checklist.passed) {
    lines.push('');
    lines.push('### Failed Checks');
    for (const f of checklist.failedChecks) lines.push(`- ${f}`);
  }
  return lines.join('\n');
}
