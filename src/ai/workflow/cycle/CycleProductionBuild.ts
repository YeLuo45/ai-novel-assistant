/**
 * V2114 Direction A Iteration 29/30 Round 6: CycleProductionBuild
 *
 * Production-build validator for the cycle subsystem. Verifies that all
 * expected exports are present, no `any` types leak, and bundle size stays
 * under a configured limit. Used as the final gate before delivery.
 *
 * Inspired by:
 * - thunderbolt-design: production build verification
 * - ruflo-design: deployment gate
 */

export interface BuildSpec {
  expectedExports: string[];
  forbiddenSubstrings: string[];
  maxTotalBytes: number;
}

export interface BuildReport {
  passed: boolean;
  missingExports: string[];
  forbiddenMatches: Array<{ export: string; matched: string }>;
  totalBytes: number;
  warnings: string[];
}

export function validateBuild(
  spec: BuildSpec,
  exports: Record<string, string>
): BuildReport {
  const missingExports: string[] = [];
  for (const name of spec.expectedExports) {
    if (!(name in exports)) missingExports.push(name);
  }

  const forbiddenMatches: Array<{ export: string; matched: string }> = [];
  for (const [name, code] of Object.entries(exports)) {
    for (const sub of spec.forbiddenSubstrings) {
      if (code.includes(sub)) forbiddenMatches.push({ export: name, matched: sub });
    }
  }

  let totalBytes = 0;
  for (const code of Object.values(exports)) {
    totalBytes += Buffer.byteLength(code, 'utf8');
  }

  const warnings: string[] = [];
  if (totalBytes > spec.maxTotalBytes * 0.9) {
    warnings.push(
      `Bundle size ${totalBytes} approaching limit ${spec.maxTotalBytes} (90% threshold)`
    );
  }

  const passed =
    missingExports.length === 0 &&
    forbiddenMatches.length === 0 &&
    totalBytes <= spec.maxTotalBytes;

  return { passed, missingExports, forbiddenMatches, totalBytes, warnings };
}

export function countLines(code: string): number {
  if (code.length === 0) return 0;
  return code.split('\n').length;
}

export function summarizeBuild(report: BuildReport): string {
  if (report.passed) return `build OK (${report.totalBytes} bytes, ${report.warnings.length} warnings)`;
  const issues: string[] = [];
  if (report.missingExports.length > 0)
    issues.push(`missing: ${report.missingExports.join(', ')}`);
  if (report.forbiddenMatches.length > 0)
    issues.push(`forbidden: ${report.forbiddenMatches.length} matches`);
  if (report.totalBytes > 0) issues.push(`size=${report.totalBytes}`);
  return `build FAIL (${issues.join('; ')})`;
}
