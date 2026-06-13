// V2138 PermissionGate - Direction A Iter 23/30
// 权限网关 - 多用户隔离
// Source: chatdev (RBAC)

export type ResourceAction = 'read' | 'write' | 'delete' | 'admin';

export interface Role {
  roleId: string;
  name: string;
  permissions: Record<string, ResourceAction[]>;
}

export interface User {
  userId: string;
  roleIds: string[];
}

export interface PermissionState {
  roles: Map<string, Role>;
  users: Map<string, User>;
  auditLog: { userId: string; resource: string; action: ResourceAction; allowed: boolean; at: number }[];
}

export function createPermissionState(): PermissionState {
  return { roles: new Map(), users: new Map(), auditLog: [] };
}

export function addRole(state: PermissionState, role: Role): PermissionState {
  const roles = new Map(state.roles);
  roles.set(role.roleId, role);
  return { ...state, roles };
}

export function addUser(state: PermissionState, user: User): PermissionState {
  const users = new Map(state.users);
  users.set(user.userId, user);
  return { ...state, users };
}

export function assignRole(state: PermissionState, userId: string, roleId: string): PermissionState {
  const user = state.users.get(userId);
  if (!user) return state;
  if (user.roleIds.includes(roleId)) return state;
  const users = new Map(state.users);
  users.set(userId, { ...user, roleIds: [...user.roleIds, roleId] });
  return { ...state, users };
}

export function checkPermission(state: PermissionState, userId: string, resource: string, action: ResourceAction): { allowed: boolean; reason?: string } {
  const user = state.users.get(userId);
  if (!user) return { allowed: false, reason: 'user not found' };
  for (const rid of user.roleIds) {
    const role = state.roles.get(rid);
    if (!role) continue;
    const actions = role.permissions[resource] || [];
    if (actions.includes(action) || actions.includes('admin')) return { allowed: true };
  }
  return { allowed: false, reason: 'no matching role permission' };
}

export function gateAccess(state: PermissionState, userId: string, resource: string, action: ResourceAction): PermissionState {
  const result = checkPermission(state, userId, resource, action);
  return { ...state, auditLog: [...state.auditLog, { userId, resource, action, allowed: result.allowed, at: Date.now() }] };
}

export function userRoles(state: PermissionState, userId: string): string[] {
  return state.users.get(userId)?.roleIds || [];
}

export function rolePermissions(state: PermissionState, roleId: string, resource: string): ResourceAction[] {
  return state.roles.get(roleId)?.permissions[resource] || [];
}

export function recentDenied(state: PermissionState, windowMs: number, now = Date.now()): number {
  return state.auditLog.filter((e) => !e.allowed && now - e.at <= windowMs).length;
}

export function permissionHealth(state: PermissionState): { userCount: number; roleCount: number; deniedRecent: number; health: number } {
  const denied = recentDenied(state, 60000);
  return { userCount: state.users.size, roleCount: state.roles.size, deniedRecent: denied, health: denied === 0 ? 1 : 0.5 };
}
