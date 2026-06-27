/**
 * ai/collab/MultiUser.ts (L1-L15) - 15 engines
 *
 * - L1 UserSession: 用户会话
 * - L2 Presence: 在线状态
 * - L3 SharedWorkspace: 共享工作区
 * - L4 Permissions: 权限管理
 * - L5 Comments: 评论系统
 * - L6 Reviews: 审阅系统
 * - L7 Approval: 审批工作流
 * - L8 Notifications: 通知
 * - L9 ActivityFeed: 活动流
 * - L10 AuditLog: 审计日志
 * - L11 Invitations: 邀请
 * - L12 TeamMembership: 团队成员
 * - L13 RoleAssignment: 角色分配
 * - L14 AccessControl: 访问控制
 * - L15 CollaborationMetrics: 协作指标
 */

// =============================================================================
// L1: UserSession
// =============================================================================

export interface UserInfo {
  userId: string
  displayName: string
  email: string
  avatarUrl?: string
}

export interface Session {
  sessionId: string
  userId: string
  startedAt: number
  lastActive: number
  device: string
  ipAddress?: string
}

export class UserSessionManager {
  private _sessions: Map<string, Session> = new Map()
  private _nextId: number = 0

  create(userId: string, device: string, ipAddress?: string): Session {
    const session: Session = {
      sessionId: `sess_${++this._nextId}`,
      userId, device, ipAddress,
      startedAt: Date.now(), lastActive: Date.now(),
    }
    this._sessions.set(session.sessionId, session)
    return session
  }

  touch(sessionId: string): boolean {
    const s = this._sessions.get(sessionId)
    if (!s) return false
    s.lastActive = Date.now()
    return true
  }

  end(sessionId: string): boolean {
    return this._sessions.delete(sessionId)
  }

  get(sessionId: string): Session | undefined {
    return this._sessions.get(sessionId)
  }

  forUser(userId: string): Session[] {
    return Array.from(this._sessions.values()).filter(s => s.userId === userId)
  }

  list(): Session[] {
    return Array.from(this._sessions.values())
  }

  pruneInactive(maxAgeMs: number): number {
    const now = Date.now()
    let count = 0
    for (const [id, s] of this._sessions) {
      if (now - s.lastActive > maxAgeMs) {
        this._sessions.delete(id)
        count += 1
      }
    }
    return count
  }
}

// =============================================================================
// L2: Presence
// =============================================================================

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

export interface PresenceInfo {
  userId: string
  status: PresenceStatus
  currentLocation?: string  // "page 5 of chapter 3"
  lastSeen: number
}

export class PresenceTracker {
  private _presence: Map<string, PresenceInfo> = new Map()

  setStatus(userId: string, status: PresenceStatus, location?: string): void {
    this._presence.set(userId, { userId, status, currentLocation: location, lastSeen: Date.now() })
  }

  get(userId: string): PresenceInfo | undefined {
    return this._presence.get(userId)
  }

  online(): PresenceInfo[] {
    return Array.from(this._presence.values()).filter(p => p.status !== 'offline')
  }

  byStatus(status: PresenceStatus): PresenceInfo[] {
    return Array.from(this._presence.values()).filter(p => p.status === status)
  }

  list(): PresenceInfo[] {
    return Array.from(this._presence.values())
  }
}

// =============================================================================
// L3: SharedWorkspace
// =============================================================================

export interface WorkspaceMember {
  userId: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  joinedAt: number
}

export class SharedWorkspace {
  private _workspaces: Map<string, WorkspaceMember[]> = new Map()
  private _projectOwners: Map<string, string> = new Map()  // projectId -> ownerUserId

  create(projectId: string, ownerUserId: string): void {
    this._workspaces.set(projectId, [{ userId: ownerUserId, role: 'owner', joinedAt: Date.now() }])
    this._projectOwners.set(projectId, ownerUserId)
  }

  addMember(projectId: string, userId: string, role: WorkspaceMember['role']): boolean {
    const ws = this._workspaces.get(projectId)
    if (!ws) return false
    if (ws.find(m => m.userId === userId)) return false
    ws.push({ userId, role, joinedAt: Date.now() })
    return true
  }

  removeMember(projectId: string, userId: string): boolean {
    const ws = this._workspaces.get(projectId)
    if (!ws) return false
    const owner = this._projectOwners.get(projectId)
    if (userId === owner) return false  // can't remove owner
    const before = ws.length
    this._workspaces.set(projectId, ws.filter(m => m.userId !== userId))
    return this._workspaces.get(projectId)!.length < before
  }

  members(projectId: string): WorkspaceMember[] {
    return [...(this._workspaces.get(projectId) ?? [])]
  }

  isMember(projectId: string, userId: string): boolean {
    return this._workspaces.get(projectId)?.some(m => m.userId === userId) ?? false
  }

  /** 角色 of user in project */
  roleOf(projectId: string, userId: string): WorkspaceMember['role'] | null {
    return this._workspaces.get(projectId)?.find(m => m.userId === userId)?.role ?? null
  }

  ownerOf(projectId: string): string | undefined {
    return this._projectOwners.get(projectId)
  }
}

// =============================================================================
// L4: Permissions
// =============================================================================

export type Permission = 'read' | 'write' | 'comment' | 'admin' | 'delete'

export class PermissionChecker {
  private _rolePermissions: Map<string, Set<Permission>> = new Map()

  static readonly DEFAULT_ROLE_PERMS: Record<string, Set<Permission>> = {
    owner: new Set(['read', 'write', 'comment', 'admin', 'delete']),
    editor: new Set(['read', 'write', 'comment']),
    commenter: new Set(['read', 'comment']),
    viewer: new Set(['read']),
  }

  constructor() {
    for (const [role, perms] of Object.entries(PermissionChecker.DEFAULT_ROLE_PERMS)) {
      this._rolePermissions.set(role, new Set(perms))
    }
  }

  /** 角色是否拥有 permission */
  roleHas(role: string, perm: Permission): boolean {
    return this._rolePermissions.get(role)?.has(perm) ?? false
  }

  /** 自定义角色权限 */
  setRolePermissions(role: string, perms: Permission[]): void {
    this._rolePermissions.set(role, new Set(perms))
  }

  /** 综合检查: 角色 + 资源 */
  canAccess(role: string, perm: Permission, resourceOwnerId?: string, userId?: string): boolean {
    if (!this.roleHas(role, perm)) return false
    // admin can do anything
    if (this.roleHas(role, 'admin')) return true
    // owner can delete own
    if (perm === 'delete' && resourceOwnerId && userId && resourceOwnerId === userId) return true
    return true
  }
}

// =============================================================================
// L5: Comments
// =============================================================================

export interface Comment {
  commentId: string
  authorId: string
  targetType: 'chapter' | 'scene' | 'character' | 'general'
  targetId: string
  text: string
  parentId?: string
  resolved: boolean
  createdAt: number
}

export class CommentThread {
  private _comments: Comment[] = []
  private _nextId: number = 0

  add(authorId: string, targetType: Comment['targetType'], targetId: string, text: string, parentId?: string): Comment {
    const c: Comment = {
      commentId: `cmt_${++this._nextId}`,
      authorId, targetType, targetId, text, parentId,
      resolved: false, createdAt: Date.now(),
    }
    this._comments.push(c)
    return c
  }

  forTarget(targetType: Comment['targetType'], targetId: string): Comment[] {
    return this._comments.filter(c => c.targetType === targetType && c.targetId === targetId)
  }

  thread(commentId: string): Comment[] {
    const c = this._comments.find(x => x.commentId === commentId)
    if (!c) return []
    return this._comments.filter(x => x.parentId === commentId || x.commentId === commentId)
  }

  resolve(commentId: string): boolean {
    const c = this._comments.find(x => x.commentId === commentId)
    if (!c) return false
    c.resolved = true
    return true
  }

  unresolved(): Comment[] {
    return this._comments.filter(c => !c.resolved)
  }

  byAuthor(authorId: string): Comment[] {
    return this._comments.filter(c => c.authorId === authorId)
  }

  count(): number {
    return this._comments.length
  }
}

// =============================================================================
// L6: Reviews
// =============================================================================

export type ReviewStatus = 'pending' | 'in-progress' | 'approved' | 'rejected' | 'changes-requested'

export interface Review {
  reviewId: string
  reviewerId: string
  targetId: string  // chapter/scene id
  status: ReviewStatus
  rating: number  // 1-5
  comments: string[]
  createdAt: number
  completedAt?: number
}

export class ReviewManager {
  private _reviews: Review[] = []
  private _nextId: number = 0

  create(reviewerId: string, targetId: string): Review {
    const r: Review = {
      reviewId: `rv_${++this._nextId}`,
      reviewerId, targetId, status: 'pending', rating: 0, comments: [],
      createdAt: Date.now(),
    }
    this._reviews.push(r)
    return r
  }

  approve(reviewId: string, rating: number, comment: string): boolean {
    return this._update(reviewId, 'approved', rating, comment)
  }

  reject(reviewId: string, rating: number, comment: string): boolean {
    return this._update(reviewId, 'rejected', rating, comment)
  }

  requestChanges(reviewId: string, rating: number, comment: string): boolean {
    return this._update(reviewId, 'changes-requested', rating, comment)
  }

  pending(): Review[] {
    return this._reviews.filter(r => r.status === 'pending' || r.status === 'in-progress')
  }

  byReviewer(reviewerId: string): Review[] {
    return this._reviews.filter(r => r.reviewerId === reviewerId)
  }

  byTarget(targetId: string): Review[] {
    return this._reviews.filter(r => r.targetId === targetId)
  }

  averageRating(targetId: string): number {
    const all = this.byTarget(targetId).filter(r => r.rating > 0)
    if (all.length === 0) return 0
    return all.reduce((a, r) => a + r.rating, 0) / all.length
  }

  private _update(reviewId: string, status: ReviewStatus, rating: number, comment: string): boolean {
    const r = this._reviews.find(x => x.reviewId === reviewId)
    if (!r) return false
    r.status = status
    r.rating = rating
    r.comments.push(comment)
    r.completedAt = Date.now()
    return true
  }
}

// =============================================================================
// L7: Approval
// =============================================================================

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface ApprovalRequest {
  approvalId: string
  requesterId: string
  approverIds: string[]
  resourceType: string
  resourceId: string
  reason: string
  status: ApprovalStatus
  approvals: string[]  // approverIds who approved
  rejections: string[]  // approverIds who rejected
  createdAt: number
  decidedAt?: number
}

export class ApprovalWorkflow {
  private _approvals: ApprovalRequest[] = []
  private _nextId: number = 0

  create(requesterId: string, approverIds: string[], resourceType: string, resourceId: string, reason: string): ApprovalRequest {
    const a: ApprovalRequest = {
      approvalId: `appr_${++this._nextId}`,
      requesterId, approverIds, resourceType, resourceId, reason,
      status: 'pending', approvals: [], rejections: [],
      createdAt: Date.now(),
    }
    this._approvals.push(a)
    return a
  }

  approve(approvalId: string, approverId: string): boolean {
    const a = this._approvals.find(x => x.approvalId === approvalId)
    if (!a || !a.approverIds.includes(approverId)) return false
    if (a.approvals.includes(approverId)) return false
    a.approvals.push(approverId)
    if (a.approvals.length === a.approverIds.length) {
      a.status = 'approved'
      a.decidedAt = Date.now()
    }
    return true
  }

  reject(approvalId: string, approverId: string): boolean {
    const a = this._approvals.find(x => x.approvalId === approvalId)
    if (!a || !a.approverIds.includes(approverId)) return false
    a.rejections.push(approverId)
    a.status = 'rejected'
    a.decidedAt = Date.now()
    return true
  }

  cancel(approvalId: string): boolean {
    const a = this._approvals.find(x => x.approvalId === approvalId)
    if (!a) return false
    a.status = 'cancelled'
    return true
  }

  pending(): ApprovalRequest[] {
    return this._approvals.filter(a => a.status === 'pending')
  }

  get(approvalId: string): ApprovalRequest | undefined {
    return this._approvals.find(a => a.approvalId === approvalId)
  }
}

// =============================================================================
// L8: Notifications
// =============================================================================

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'mention'

export interface Notification {
  notificationId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: number
}

export class NotificationCenter {
  private _notifications: Notification[] = []
  private _nextId: number = 0

  send(userId: string, type: NotificationType, title: string, message: string): Notification {
    const n: Notification = {
      notificationId: `n_${++this._nextId}`,
      userId, type, title, message,
      read: false, createdAt: Date.now(),
    }
    this._notifications.push(n)
    return n
  }

  forUser(userId: string): Notification[] {
    return this._notifications.filter(n => n.userId === userId)
  }

  markRead(notificationId: string): boolean {
    const n = this._notifications.find(x => x.notificationId === notificationId)
    if (!n) return false
    n.read = true
    return true
  }

  unread(userId: string): Notification[] {
    return this.forUser(userId).filter(n => !n.read)
  }

  count(): number {
    return this._notifications.length
  }
}

// =============================================================================
// L9: ActivityFeed
// =============================================================================

export type ActivityType = 'created' | 'updated' | 'deleted' | 'commented' | 'reviewed' | 'shared' | 'invited'

export interface Activity {
  activityId: string
  userId: string
  type: ActivityType
  target: string
  description: string
  timestamp: number
}

export class ActivityFeed {
  private _activities: Activity[] = []
  private _nextId: number = 0

  record(userId: string, type: ActivityType, target: string, description: string): Activity {
    const a: Activity = {
      activityId: `act_${++this._nextId}`,
      userId, type, target, description, timestamp: Date.now(),
    }
    this._activities.push(a)
    return a
  }

  recent(n: number = 20): Activity[] {
    return this._activities.slice(-n).reverse()  // newest first
  }

  forUser(userId: string): Activity[] {
    return this._activities.filter(a => a.userId === userId).reverse()
  }

  byType(type: ActivityType): Activity[] {
    return this._activities.filter(a => a.type === type).reverse()
  }

  count(): number {
    return this._activities.length
  }
}

// =============================================================================
// L10: AuditLog
// =============================================================================

export interface AuditEntry {
  auditId: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  before?: unknown
  after?: unknown
  ipAddress?: string
  timestamp: number
}

export class AuditLog {
  private _entries: AuditEntry[] = []
  private _nextId: number = 0

  record(userId: string, action: string, resourceType: string, resourceId: string, before?: unknown, after?: unknown, ipAddress?: string): AuditEntry {
    const e: AuditEntry = {
      auditId: `audit_${++this._nextId}`,
      userId, action, resourceType, resourceId, before, after, ipAddress,
      timestamp: Date.now(),
    }
    this._entries.push(e)
    return e
  }

  forResource(resourceType: string, resourceId: string): AuditEntry[] {
    return this._entries.filter(e => e.resourceType === resourceType && e.resourceId === resourceId)
  }

  forUser(userId: string): AuditEntry[] {
    return this._entries.filter(e => e.userId === userId)
  }

  recent(n: number = 50): AuditEntry[] {
    return this._entries.slice(-n).reverse()
  }

  byAction(action: string): AuditEntry[] {
    return this._entries.filter(e => e.action === action)
  }

  count(): number {
    return this._entries.length
  }
}

// =============================================================================
// L11: Invitations
// =============================================================================

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface Invitation {
  invitationId: string
  inviterId: string
  inviteeEmail: string
  projectId: string
  role: WorkspaceMember['role']
  status: InvitationStatus
  expiresAt: number
  createdAt: number
}

export class InvitationManager {
  private _invitations: Invitation[] = []
  private _nextId: number = 0

  create(inviterId: string, inviteeEmail: string, projectId: string, role: WorkspaceMember['role'], ttlMs: number = 7 * 86400000): Invitation {
    const inv: Invitation = {
      invitationId: `inv_${++this._nextId}`,
      inviterId, inviteeEmail, projectId, role,
      status: 'pending',
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    }
    this._invitations.push(inv)
    return inv
  }

  accept(invitationId: string): boolean {
    const inv = this._invitations.find(x => x.invitationId === invitationId)
    if (!inv || inv.status !== 'pending') return false
    inv.status = 'accepted'
    return true
  }

  decline(invitationId: string): boolean {
    const inv = this._invitations.find(x => x.invitationId === invitationId)
    if (!inv || inv.status !== 'pending') return false
    inv.status = 'declined'
    return true
  }

  expire(): number {
    const now = Date.now()
    let count = 0
    for (const inv of this._invitations) {
      if (inv.status === 'pending' && inv.expiresAt < now) {
        inv.status = 'expired'
        count += 1
      }
    }
    return count
  }

  forProject(projectId: string): Invitation[] {
    return this._invitations.filter(i => i.projectId === projectId)
  }

  pending(): Invitation[] {
    return this._invitations.filter(i => i.status === 'pending')
  }
}

// =============================================================================
// L12: TeamMembership
// =============================================================================

export interface Team {
  teamId: string
  name: string
  members: string[]  // userIds
  createdAt: number
}

export class TeamMembership {
  private _teams: Map<string, Team> = new Map()

  createTeam(teamId: string, name: string, founderId: string): Team {
    const t: Team = { teamId, name, members: [founderId], createdAt: Date.now() }
    this._teams.set(teamId, t)
    return t
  }

  addMember(teamId: string, userId: string): boolean {
    const t = this._teams.get(teamId)
    if (!t) return false
    if (t.members.includes(userId)) return false
    t.members.push(userId)
    return true
  }

  removeMember(teamId: string, userId: string): boolean {
    const t = this._teams.get(teamId)
    if (!t) return false
    if (t.members.length <= 1) return false  // founder
    t.members = t.members.filter(m => m !== userId)
    return true
  }

  inTeam(teamId: string, userId: string): boolean {
    return this._teams.get(teamId)?.members.includes(userId) ?? false
  }

  getTeam(teamId: string): Team | undefined {
    return this._teams.get(teamId)
  }

  teamsOf(userId: string): Team[] {
    return Array.from(this._teams.values()).filter(t => t.members.includes(userId))
  }

  all(): Team[] {
    return Array.from(this._teams.values())
  }
}

// =============================================================================
// L13: RoleAssignment
// =============================================================================

export type SystemRole = 'admin' | 'user' | 'guest' | 'service'

export class RoleAssigner {
  private _assignments: Map<string, SystemRole> = new Map()

  assign(userId: string, role: SystemRole): void {
    this._assignments.set(userId, role)
  }

  revoke(userId: string): boolean {
    return this._assignments.delete(userId)
  }

  roleOf(userId: string): SystemRole | null {
    return this._assignments.get(userId) ?? null
  }

  byRole(role: SystemRole): string[] {
    return Array.from(this._assignments.entries()).filter(([_, r]) => r === role).map(([u]) => u)
  }

  isAdmin(userId: string): boolean {
    return this._assignments.get(userId) === 'admin'
  }

  count(): number {
    return this._assignments.size
  }
}

// =============================================================================
// L14: AccessControl
// =============================================================================

export class AccessControl {
  private _permissions = new PermissionChecker()
  private _workspace = new SharedWorkspace()

  /** 综合检查访问权限 */
  canRead(projectId: string, userId: string, resourceId: string): boolean {
    return this._checkAccess(projectId, userId, 'read', resourceId)
  }

  canWrite(projectId: string, userId: string, resourceId: string): boolean {
    return this._checkAccess(projectId, userId, 'write', resourceId)
  }

  canComment(projectId: string, userId: string, resourceId: string): boolean {
    return this._checkAccess(projectId, userId, 'comment', resourceId)
  }

  canDelete(projectId: string, userId: string, resourceId: string): boolean {
    return this._checkAccess(projectId, userId, 'delete', resourceId)
  }

  permissions(): PermissionChecker {
    return this._permissions
  }

  workspace(): SharedWorkspace {
    return this._workspace
  }

  private _checkAccess(projectId: string, userId: string, perm: Permission, resourceId: string): boolean {
    const role = this._workspace.roleOf(projectId, userId)
    if (!role) return false
    return this._permissions.canAccess(role, perm, resourceId, userId)
  }
}

// =============================================================================
// L15: CollaborationMetrics
// =============================================================================

export interface CollaborationStats {
  totalUsers: number
  onlineUsers: number
  totalWorkspaces: number
  totalComments: number
  unresolvedComments: number
  totalReviews: number
  pendingReviews: number
  totalNotifications: number
  unreadNotifications: number
  totalAuditEntries: number
}

export class CollaborationMetrics {
  private _presence: PresenceTracker
  private _workspace: SharedWorkspace
  private _comments: CommentThread
  private _reviews: ReviewManager
  private _notif: NotificationCenter
  private _audit: AuditLog

  constructor(deps: {
    presence: PresenceTracker; workspace: SharedWorkspace;
    comments: CommentThread; reviews: ReviewManager;
    notif: NotificationCenter; audit: AuditLog;
  }) {
    this._presence = deps.presence
    this._workspace = deps.workspace
    this._comments = deps.comments
    this._reviews = deps.reviews
    this._notif = deps.notif
    this._audit = deps.audit
  }

  stats(): CollaborationStats {
    return {
      totalUsers: this._presence.list().length,
      onlineUsers: this._presence.online().length,
      totalWorkspaces: this._workspace.members.length > 0 ? 1 : 0,  // simplified
      totalComments: this._comments.count(),
      unresolvedComments: this._comments.unresolved().length,
      totalReviews: 0,  // 简化
      pendingReviews: this._reviews.pending().length,
      totalNotifications: this._notif.count(),
      unreadNotifications: this._notif.unread('any').length,  // 简化
      totalAuditEntries: this._audit.count(),
    }
  }
}