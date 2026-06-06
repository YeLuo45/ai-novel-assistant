/**
 * V866 CharacterDynamicsEngine — Direction B Iter 11/15 (Round 4)
 * Character dynamics engine: group dynamics + ensemble characters
 * Sources: chatdev character + nanobot + thunderbolt
 */

export type GroupRole = 'leader' | 'follower' | 'rival' | 'mentor' | 'wildcard' | 'mediator';
export type GroupDynamic = 'harmony' | 'tension' | 'conflict' | 'collaboration' | 'competition' | 'transformation';
export type GroupPhase = 'forming' | 'storming' | 'norming' | 'performing' | 'adjourning';

export interface GroupMember {
  memberId: string;
  characterId: string;
  role: GroupRole;
  influence: number;
  loyalty: number;
  status: 'active' | 'inactive' | 'exiled' | 'transformed';
}

export interface CharacterGroup {
  groupId: string;
  name: string;
  members: string[];
  dynamic: GroupDynamic;
  phase: GroupPhase;
  cohesion: number;
  effectiveness: number;
  chapter: number;
}

export interface GroupEvent {
  eventId: string;
  groupId: string;
  type: 'conflict' | 'alliance' | 'betrayal' | 'transformation';
  description: string;
  impact: number;
  resolved: boolean;
  chapter: number;
}

export interface CharacterDynamicsEngineState {
  groups: Map<string, CharacterGroup>;
  members: Map<string, GroupMember>;
  events: Map<string, GroupEvent>;
  totalGroups: number;
  totalMembers: number;
  totalEvents: number;
  averageCohesion: number;
  averageEffectiveness: number;
  groupComplexity: number;
  dynamicsRichness: number;
}

// Factory
export function createCharacterDynamicsEngineState(): CharacterDynamicsEngineState {
  return {
    groups: new Map(),
    members: new Map(),
    events: new Map(),
    totalGroups: 0,
    totalMembers: 0,
    totalEvents: 0,
    averageCohesion: 0.5,
    averageEffectiveness: 0.5,
    groupComplexity: 0.5,
    dynamicsRichness: 0.5,
  };
}

// Create group
export function createCharacterGroup(
  state: CharacterDynamicsEngineState,
  groupId: string,
  name: string,
  dynamic: GroupDynamic,
  chapter: number,
  phase: GroupPhase = 'forming'
): CharacterDynamicsEngineState {
  const group: CharacterGroup = { groupId, name, members: [], dynamic, phase, cohesion: 0.5, effectiveness: 0.5, chapter };
  const groups = new Map(state.groups).set(groupId, group);
  return recomputeCharDyn({ ...state, groups, totalGroups: groups.size });
}

// Add member
export function addGroupMember(
  state: CharacterDynamicsEngineState,
  memberId: string,
  groupId: string,
  characterId: string,
  role: GroupRole,
  influence: number = 0.5
): CharacterDynamicsEngineState {
  const member: GroupMember = { memberId, characterId, role, influence, loyalty: 0.5, status: 'active' };
  const members = new Map(state.members).set(memberId, member);

  // Update group
  const group = state.groups.get(groupId);
  let groups = state.groups;
  if (group) {
    const updated: CharacterGroup = { ...group, members: [...group.members, memberId] };
    groups = new Map(state.groups).set(groupId, updated);
  }

  return recomputeCharDyn({ ...state, groups, members, totalMembers: members.size });
}

// Record group event
export function recordGroupEvent(
  state: CharacterDynamicsEngineState,
  eventId: string,
  groupId: string,
  type: GroupEvent['type'],
  description: string,
  chapter: number,
  impact: number = 0.5
): CharacterDynamicsEngineState {
  const event: GroupEvent = { eventId, groupId, type, description, chapter, impact: Math.min(1, Math.max(0, impact)), resolved: false };
  const events = new Map(state.events).set(eventId, event);
  return recomputeCharDyn({ ...state, events, totalEvents: events.size });
}

// Update cohesion
export function updateGroupCohesion(state: CharacterDynamicsEngineState, groupId: string, cohesion: number, effectiveness: number): CharacterDynamicsEngineState {
  const group = state.groups.get(groupId);
  if (!group) return state;

  const updated: CharacterGroup = { ...group, cohesion, effectiveness };
  const groups = new Map(state.groups).set(groupId, updated);
  return recomputeCharDyn({ ...state, groups });
}

// Get groups by dynamic
export function getGroupsByDynamic(state: CharacterDynamicsEngineState, dynamic: GroupDynamic): CharacterGroup[] {
  return Array.from(state.groups.values()).filter(g => g.dynamic === dynamic);
}

// Get character dynamics report
export function getCharacterDynamicsReport(state: CharacterDynamicsEngineState): {
  totalGroups: number;
  totalMembers: number;
  totalEvents: number;
  averageCohesion: number;
  averageEffectiveness: number;
  dynamicsRichness: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalGroups === 0) recommendations.push('No groups — create groups');
  if (state.averageCohesion < 0.5) recommendations.push('Low cohesion — strengthen bonds');
  if (state.dynamicsRichness < 0.5) recommendations.push('Low richness — add variety');

  return {
    totalGroups: state.totalGroups,
    totalMembers: state.totalMembers,
    totalEvents: state.totalEvents,
    averageCohesion: Math.round(state.averageCohesion * 100) / 100,
    averageEffectiveness: Math.round(state.averageEffectiveness * 100) / 100,
    dynamicsRichness: Math.round(state.dynamicsRichness * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCharDyn(state: CharacterDynamicsEngineState): CharacterDynamicsEngineState {
  const groups = Array.from(state.groups.values());
  const averageCohesion = groups.length === 0 ? 0.5
    : groups.reduce((s, g) => s + g.cohesion, 0) / groups.length;
  const averageEffectiveness = groups.length === 0 ? 0.5
    : groups.reduce((s, g) => s + g.effectiveness, 0) / groups.length;

  const dynamicSet = new Set(groups.map(g => g.dynamic));
  const groupComplexity = Math.min(1, dynamicSet.size / 5);

  const events = Array.from(state.events.values());
  const totalImpact = events.reduce((s, e) => s + e.impact, 0);
  const dynamicsRichness = events.length === 0 ? 0.5
    : Math.min(1, totalImpact / Math.max(1, events.length) * 2);

  return { ...state, averageCohesion, averageEffectiveness, groupComplexity, dynamicsRichness };
}

// Reset character dynamics state
export function resetCharacterDynamicsEngineState(): CharacterDynamicsEngineState {
  return createCharacterDynamicsEngineState();
}