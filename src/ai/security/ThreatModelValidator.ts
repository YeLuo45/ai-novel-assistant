// V2144 ThreatModelValidator - Direction A Iter 29/30
// 威胁模型验证器
// Source: generic-agent (security analysis)

export type ThreatCategory = 'spoofing' | 'tampering' | 'repudiation' | 'info_disclosure' | 'denial_of_service' | 'elevation_of_privilege';

export interface Threat {
  id: string;
  category: ThreatCategory;
  description: string;
  severity: number; // 1-10
  mitigated: boolean;
  mitigation?: string;
}

export interface ThreatModelState {
  threats: Map<string, Threat>;
  mitigations: Map<string, string>; // threatId → mitigation
}

export function createThreatModel(): ThreatModelState {
  return { threats: new Map(), mitigations: new Map() };
}

export function addThreat(state: ThreatModelState, threat: Threat): ThreatModelState {
  const threats = new Map(state.threats);
  threats.set(threat.id, threat);
  return { ...state, threats };
}

export function mitigate(state: ThreatModelState, threatId: string, mitigation: string): ThreatModelState {
  const threat = state.threats.get(threatId);
  if (!threat) return state;
  const threats = new Map(state.threats);
  threats.set(threatId, { ...threat, mitigated: true, mitigation });
  const mitigations = new Map(state.mitigations);
  mitigations.set(threatId, mitigation);
  return { ...state, threats, mitigations };
}

export function unmitigate(state: ThreatModelState, threatId: string): ThreatModelState {
  const threat = state.threats.get(threatId);
  if (!threat) return state;
  const threats = new Map(state.threats);
  threats.set(threatId, { ...threat, mitigated: false, mitigation: undefined });
  const mitigations = new Map(state.mitigations);
  mitigations.delete(threatId);
  return { ...state, threats, mitigations };
}

export function removeThreat(state: ThreatModelState, threatId: string): ThreatModelState {
  const threats = new Map(state.threats);
  threats.delete(threatId);
  const mitigations = new Map(state.mitigations);
  mitigations.delete(threatId);
  return { ...state, threats, mitigations };
}

export function threatsByCategory(state: ThreatModelState, category: ThreatCategory): Threat[] {
  return Array.from(state.threats.values()).filter((t) => t.category === category);
}

export function unmitigatedCount(state: ThreatModelState): number {
  return Array.from(state.threats.values()).filter((t) => !t.mitigated).length;
}

export function riskScore(state: ThreatModelState): number {
  // Sum of severity * (1 - mitigated ? 1 : 0.1) for each threat
  let score = 0;
  for (const t of state.threats.values()) {
    score += t.severity * (t.mitigated ? 0.1 : 1);
  }
  return score;
}

export function validateModel(state: ThreatModelState): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (state.threats.size === 0) issues.push('no threats defined');
  if (unmitigatedCount(state) > state.threats.size * 0.5) issues.push('more than 50% unmitigated');
  if (riskScore(state) > 50) issues.push('high overall risk');
  return { valid: issues.length === 0, issues };
}

export function threatModelHealth(state: ThreatModelState): { threatCount: number; mitigated: number; unmitigated: number; risk: number; health: number } {
  const unmit = unmitigatedCount(state);
  const mit = state.threats.size - unmit;
  const risk = riskScore(state);
  const health = unmit === 0 ? 1 : Math.max(0, 1 - unmit / state.threats.size);
  return { threatCount: state.threats.size, mitigated: mit, unmitigated: unmit, risk, health };
}
