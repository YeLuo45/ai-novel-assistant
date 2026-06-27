/**
 * ai/collab/MultiUser.test.ts (L1-L15) - 30+ 断言
 */

import { describe, it, expect } from 'vitest'
import {
  UserSessionManager, PresenceTracker, SharedWorkspace, PermissionChecker,
  CommentThread, ReviewManager, ApprovalWorkflow, NotificationCenter,
  ActivityFeed, AuditLog, InvitationManager, TeamMembership,
  RoleAssigner, AccessControl, CollaborationMetrics,
} from './MultiUser'

describe('L1: UserSession', () => {
  it('create + touch + get', () => {
    const m = new UserSessionManager()
    const s = m.create('u1', 'desktop')
    expect(m.get(s.sessionId)?.userId).toBe('u1')
    expect(m.touch(s.sessionId)).toBe(true)
  })

  it('end + forUser', () => {
    const m = new UserSessionManager()
    const s1 = m.create('u1', 'mobile')
    const s2 = m.create('u2', 'mobile')
    expect(m.forUser('u1').length).toBe(1)
    expect(m.end(s1.sessionId)).toBe(true)
  })

  it('pruneInactive', () => {
    const m = new UserSessionManager()
    m.create('u1', 'd1')
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(m.pruneInactive(0)).toBe(1)
        resolve()
      }, 10)
    })
  })
})

describe('L2: Presence', () => {
  it('setStatus + get', () => {
    const p = new PresenceTracker()
    p.setStatus('u1', 'online', 'ch 5')
    expect(p.get('u1')?.status).toBe('online')
  })

  it('online + byStatus', () => {
    const p = new PresenceTracker()
    p.setStatus('u1', 'online')
    p.setStatus('u2', 'offline')
    expect(p.online().length).toBe(1)
    expect(p.byStatus('online').length).toBe(1)
  })
})

describe('L3: SharedWorkspace', () => {
  it('create + addMember + roleOf', () => {
    const w = new SharedWorkspace()
    w.create('p1', 'u1')
    w.addMember('p1', 'u2', 'editor')
    expect(w.roleOf('p1', 'u2')).toBe('editor')
  })

  it('removeMember + isMember', () => {
    const w = new SharedWorkspace()
    w.create('p1', 'u1')
    w.addMember('p1', 'u2', 'viewer')
    expect(w.removeMember('p1', 'u2')).toBe(true)
    expect(w.isMember('p1', 'u2')).toBe(false)
  })

  it('cannot remove owner', () => {
    const w = new SharedWorkspace()
    w.create('p1', 'u1')
    expect(w.removeMember('p1', 'u1')).toBe(false)
  })
})

describe('L4: Permissions', () => {
  it('default role permissions', () => {
    const p = new PermissionChecker()
    expect(p.roleHas('owner', 'delete')).toBe(true)
    expect(p.roleHas('viewer', 'write')).toBe(false)
  })

  it('canAccess admin', () => {
    const p = new PermissionChecker()
    expect(p.canAccess('owner', 'admin')).toBe(true)
  })

  it('canAccess owner delete own', () => {
    const p = new PermissionChecker()
    expect(p.canAccess('viewer', 'delete', 'u1', 'u1')).toBe(false)  // viewer can't delete
  })
})

describe('L5: Comments', () => {
  it('add + thread + resolve', () => {
    const c = new CommentThread()
    const cm = c.add('u1', 'chapter', 'ch1', 'good')
    c.add('u2', 'chapter', 'ch1', 'agree', cm.commentId)
    const thread = c.thread(cm.commentId)
    expect(thread.length).toBeGreaterThanOrEqual(1)
    expect(c.resolve(cm.commentId)).toBe(true)
    // reply is still unresolved
    expect(c.unresolved().length).toBe(1)
    expect(c.resolve(thread[thread.length - 1].commentId)).toBe(true)
    expect(c.unresolved().length).toBe(0)
  })
})

describe('L6: Reviews', () => {
  it('create + approve + average', () => {
    const r = new ReviewManager()
    const rv1 = r.create('u1', 'ch1')
    r.approve(rv1.reviewId, 5, 'great')
    const rv2 = r.create('u2', 'ch1')
    r.approve(rv2.reviewId, 3, 'ok')
    expect(r.averageRating('ch1')).toBe(4)
  })

  it('pending', () => {
    const r = new ReviewManager()
    r.create('u1', 'ch1')
    r.create('u2', 'ch2')
    expect(r.pending().length).toBe(2)
  })
})

describe('L7: Approval', () => {
  it('create + approve unanimous', () => {
    const w = new ApprovalWorkflow()
    const a = w.create('u1', ['u2', 'u3'], 'chapter', 'ch1', 'please review')
    w.approve(a.approvalId, 'u2')
    w.approve(a.approvalId, 'u3')
    expect(a.status).toBe('approved')
  })

  it('reject ends workflow', () => {
    const w = new ApprovalWorkflow()
    const a = w.create('u1', ['u2'], 'chapter', 'ch1', 'x')
    w.reject(a.approvalId, 'u2')
    expect(a.status).toBe('rejected')
  })
})

describe('L8: Notifications', () => {
  it('send + unread + markRead', () => {
    const n = new NotificationCenter()
    n.send('u1', 'info', 'Hi', 'msg')
    expect(n.unread('u1').length).toBe(1)
    const nid = n.forUser('u1')[0].notificationId
    n.markRead(nid)
    expect(n.unread('u1').length).toBe(0)
  })
})

describe('L9: ActivityFeed', () => {
  it('record + recent', () => {
    const a = new ActivityFeed()
    a.record('u1', 'created', 'ch1', 'made chapter 1')
    expect(a.recent().length).toBe(1)
  })

  it('byType', () => {
    const a = new ActivityFeed()
    a.record('u1', 'created', 'x', 'd')
    a.record('u1', 'updated', 'y', 'd')
    expect(a.byType('created').length).toBe(1)
  })
})

describe('L10: AuditLog', () => {
  it('record + forResource', () => {
    const a = new AuditLog()
    a.record('u1', 'update', 'chapter', 'ch1', { v: 1 }, { v: 2 })
    expect(a.forResource('chapter', 'ch1').length).toBe(1)
  })
})

describe('L11: Invitations', () => {
  it('create + accept + expire', () => {
    const i = new InvitationManager()
    const inv = i.create('u1', 'u2@x.com', 'p1', 'editor')
    expect(i.accept(inv.invitationId)).toBe(true)
    expect(i.pending().length).toBe(0)
  })

  it('decline', () => {
    const i = new InvitationManager()
    const inv = i.create('u1', 'u2@x.com', 'p1', 'editor')
    expect(i.decline(inv.invitationId)).toBe(true)
  })

  it('expire', () => {
    const i = new InvitationManager()
    i.create('u1', 'u2@x.com', 'p1', 'editor', 1)  // 1ms TTL
    return new Promise<void>(resolve => {
      setTimeout(() => {
        i.expire()
        expect(i.pending().length).toBe(0)
        resolve()
      }, 10)
    })
  })
})

describe('L12: TeamMembership', () => {
  it('create + addMember', () => {
    const t = new TeamMembership()
    t.createTeam('team1', 'A', 'u1')
    t.addMember('team1', 'u2')
    expect(t.inTeam('team1', 'u2')).toBe(true)
  })

  it('cannot remove founder', () => {
    const t = new TeamMembership()
    t.createTeam('team1', 'A', 'u1')
    expect(t.removeMember('team1', 'u1')).toBe(false)
  })
})

describe('L13: RoleAssigner', () => {
  it('assign + roleOf', () => {
    const r = new RoleAssigner()
    r.assign('u1', 'admin')
    expect(r.roleOf('u1')).toBe('admin')
  })

  it('byRole + isAdmin', () => {
    const r = new RoleAssigner()
    r.assign('u1', 'admin')
    r.assign('u2', 'user')
    expect(r.byRole('admin')).toEqual(['u1'])
    expect(r.isAdmin('u1')).toBe(true)
  })
})

describe('L14: AccessControl', () => {
  it('canRead with member', () => {
    const ac = new AccessControl()
    ac.workspace().create('p1', 'u1')
    expect(ac.canRead('p1', 'u1', 'ch1')).toBe(true)
  })

  it('canRead non-member', () => {
    const ac = new AccessControl()
    ac.workspace().create('p1', 'u1')
    expect(ac.canRead('p1', 'u2', 'ch1')).toBe(false)
  })

  it('canWrite editor', () => {
    const ac = new AccessControl()
    ac.workspace().create('p1', 'u1')
    ac.workspace().addMember('p1', 'u2', 'editor')
    expect(ac.canWrite('p1', 'u2', 'ch1')).toBe(true)
  })
})

describe('L15: CollaborationMetrics', () => {
  it('aggregates stats', () => {
    const presence = new PresenceTracker()
    const workspace = new SharedWorkspace()
    const comments = new CommentThread()
    const reviews = new ReviewManager()
    const notif = new NotificationCenter()
    const audit = new AuditLog()
    const metrics = new CollaborationMetrics({ presence, workspace, comments, reviews, notif, audit })
    presence.setStatus('u1', 'online')
    const s = metrics.stats()
    expect(s.totalUsers).toBe(1)
    expect(s.onlineUsers).toBe(1)
  })
})