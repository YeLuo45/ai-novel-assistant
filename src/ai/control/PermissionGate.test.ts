import { describe, it, expect } from 'vitest';
import {
  createPermissionState,
  addRole,
  addUser,
  assignRole,
  checkPermission,
  gateAccess,
  userRoles,
  rolePermissions,
  recentDenied,
  permissionHealth,
} from './PermissionGate';

describe('V2138 PermissionGate', () => {
  it('should create empty permission state', () => {
    const s = createPermissionState();
    expect(s.roles.size).toBe(0);
    expect(s.users.size).toBe(0);
  });

  it('should add role and user', () => {
    let s = createPermissionState();
    s = addRole(s, { roleId: 'admin', name: 'Admin', permissions: { '*': ['admin'] } });
    s = addUser(s, { userId: 'u1', roleIds: [] });
    expect(s.roles.size).toBe(1);
    expect(s.users.size).toBe(1);
  });

  it('should assign role to user', () => {
    let s = createPermissionState();
    s = addUser(s, { userId: 'u1', roleIds: [] });
    s = addRole(s, { roleId: 'admin', name: 'A', permissions: { '*': ['admin'] } });
    s = assignRole(s, 'u1', 'admin');
    expect(userRoles(s, 'u1')).toEqual(['admin']);
  });

  it('should not double-assign same role', () => {
    let s = createPermissionState();
    s = addUser(s, { userId: 'u1', roleIds: [] });
    s = addRole(s, { roleId: 'admin', name: 'A', permissions: {} });
    s = assignRole(s, 'u1', 'admin');
    s = assignRole(s, 'u1', 'admin');
    expect(userRoles(s, 'u1')).toEqual(['admin']);
  });

  it('should check granted permission', () => {
    let s = createPermissionState();
    s = addRole(s, { roleId: 'reader', name: 'R', permissions: { 'books': ['read'] } });
    s = addUser(s, { userId: 'u1', roleIds: ['reader'] });
    expect(checkPermission(s, 'u1', 'books', 'read').allowed).toBe(true);
  });

  it('should deny when no matching permission', () => {
    let s = createPermissionState();
    s = addRole(s, { roleId: 'reader', name: 'R', permissions: { 'books': ['read'] } });
    s = addUser(s, { userId: 'u1', roleIds: ['reader'] });
    expect(checkPermission(s, 'u1', 'books', 'delete').allowed).toBe(false);
  });

  it('should deny unknown user', () => {
    const s = createPermissionState();
    expect(checkPermission(s, 'nope', 'books', 'read').allowed).toBe(false);
  });

  it('should gate access and audit', () => {
    let s = createPermissionState();
    s = addRole(s, { roleId: 'reader', name: 'R', permissions: { 'books': ['read'] } });
    s = addUser(s, { userId: 'u1', roleIds: ['reader'] });
    s = gateAccess(s, 'u1', 'books', 'read');
    expect(s.auditLog).toHaveLength(1);
  });

  it('should count recent denied', () => {
    let s = createPermissionState();
    s = addUser(s, { userId: 'u1', roleIds: [] });
    s = gateAccess(s, 'u1', 'books', 'read');
    expect(recentDenied(s, 60000)).toBe(1);
  });

  it('should compute permission health', () => {
    let s = createPermissionState();
    s = addUser(s, { userId: 'u1', roleIds: [] });
    s = addRole(s, { roleId: 'r', name: 'R', permissions: {} });
    const h = permissionHealth(s);
    expect(h.userCount).toBe(1);
    expect(h.roleCount).toBe(1);
  });
});
