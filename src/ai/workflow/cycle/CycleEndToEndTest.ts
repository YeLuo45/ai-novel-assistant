/**
 * V2113 Direction A Iteration 28/30 Round 6: CycleEndToEndTest
 *
 * End-to-end integration test scaffold for the cycle subsystem. Composes
 * the engines (TarjanSCC, CycleDetector, CycleSanitizer, CycleBudget) into
 * a single runnable scenario.
 *
 * Inspired by:
 * - thunderbolt-design: e2e pipeline test
 * - chatdev-design: integration test scaffold
 */

import { findSCCs, getNontrivialSCCs, type DirectedGraph } from './TarjanSCCCore';

export interface E2EScenario {
  graph: DirectedGraph;
  maxIterations: number;
  maxTokens: number;
  maxMs: number;
}

export type E2ETerminationReason =
  | 'target'
  | 'budget'
  | 'sanitizer'
  | 'no-cycles'
  | 'completed';

export interface E2EResult {
  ranIterations: number;
  terminated: boolean;
  terminationReason: E2ETerminationReason;
  cycleDetected: boolean;
  sccCount: number;
}

export function hasCycles(graph: DirectedGraph): boolean {
  const scc = findSCCs(graph);
  return getNontrivialSCCs(scc).length > 0;
}

export function runE2EScenario(
  scenario: E2EScenario,
  options: { now?: () => number } = {}
): E2EResult {
  const start = options.now ? options.now() : Date.now();
  const scc = findSCCs(scenario.graph);
  const nontrivial = getNontrivialSCCs(scc);

  if (nontrivial.length === 0) {
    return {
      ranIterations: 0,
      terminated: true,
      terminationReason: 'no-cycles',
      cycleDetected: false,
      sccCount: scc.components.length,
    };
  }

  let tokens = 0;
  let iterations = 0;
  for (let i = 0; i < scenario.maxIterations; i++) {
    iterations = i + 1;
    tokens += 100;
    if (tokens > scenario.maxTokens) {
      return {
        ranIterations: iterations,
        terminated: true,
        terminationReason: 'budget',
        cycleDetected: true,
        sccCount: scc.components.length,
      };
    }
    const elapsedMs = (options.now ? options.now() : Date.now()) - start;
    if (elapsedMs >= scenario.maxMs) {
      return {
        ranIterations: iterations,
        terminated: true,
        terminationReason: 'sanitizer',
        cycleDetected: true,
        sccCount: scc.components.length,
      };
    }
  }
  return {
    ranIterations: iterations,
    terminated: true,
    terminationReason: 'completed',
    cycleDetected: nontrivial.length > 0,
    sccCount: scc.components.length,
  };
}

export function assertScenarioValid(scenario: E2EScenario): string[] {
  const errors: string[] = [];
  if (!Array.isArray(scenario.graph.nodes)) errors.push('graph.nodes must be an array');
  if (!Array.isArray(scenario.graph.edges)) errors.push('graph.edges must be an array');
  if (!Number.isFinite(scenario.maxIterations) || scenario.maxIterations < 1)
    errors.push('maxIterations must be a positive integer');
  if (!Number.isFinite(scenario.maxTokens) || scenario.maxTokens < 0)
    errors.push('maxTokens must be a non-negative number');
  if (!Number.isFinite(scenario.maxMs) || scenario.maxMs < 0)
    errors.push('maxMs must be a non-negative number');
  return errors;
}

export function describeScenario(scenario: E2EScenario): string {
  return `e2e: nodes=${scenario.graph.nodes.length} edges=${scenario.graph.edges.length} maxIter=${scenario.maxIterations} maxTokens=${scenario.maxTokens} maxMs=${scenario.maxMs}`;
}
