/**
 * ai/collab/__tests__/multi-user-integration.test.ts
 */

import { describe, it, expect } from 'vitest'
import {
  UserSessionManager, PresenceTracker, SharedWorkspace, PermissionChecker,
  CommentThread, ReviewManager, ApprovalWorkflow, NotificationCenter,
  ActivityFeed, AuditLog, InvitationManager, TeamMembership, RoleAssigner,
  AccessControl, CollaborationMetrics,
} from '../index'

describe('Multi-User — end-to-end', () => {
  it('workspace + permissions flow', () => {
    const ac = new AccessControl()
    ac.workspace().create('p1', 'u1')
    ac.workspace().addMember('p1', 'u2', 'editor')
    ac.workspace().addMember('p1', 'u3', 'viewer')
    expect(ac.canRead('p1', 'u1', 'ch1')).toBe(true)
    expect(ac.canRead('p1', 'u2', 'ch1')).toBe(true)
    expect(ac.canRead('p1', 'u3', 'ch1')).toBe(true)
    expect(ac.canWrite('p1', 'u3', 'ch1')).toBe(false)  // viewer can't write
    expect(ac.canWrite('p1', 'u2', 'ch1')).toBe(true)  // editor can write
  })

  it('comment thread + review + approval pipeline', () => {
    const comments = new CommentThread()
    const reviews = new ReviewManager()
    const approvals = new ApprovalWorkflow()

    // Reviewer comments
    const cm = comments.add('u2', 'chapter', 'ch1', 'needs work')
    // Reviewer rates
    const rv = reviews.create('u2', 'ch1')
    reviews.requestChanges(rv.reviewId, 3, 'please revise')
    // Submit for approval
    const ap = approvals.create('u1', ['u3'], 'chapter', 'ch1', 'approval for ch1')
    approvals.approve(ap.approvalId, 'u3')

    expect(comments.unresolved().length).toBe(1)
    expect(approvals.pending().length).toBe(0)
  })

  it('session + presence lifecycle', () => {
    const sessions = new UserSessionManager()
    const presence = new PresenceTracker()
    const s = sessions.create('u1', 'desktop')
    presence.setStatus('u1', 'online')
    expect(sessions.get(s.sessionId)).toBeDefined()
    expect(presence.get('u1')?.status).toBe('online')
    sessions.end(s.sessionId)
    expect(sessions.get(s.sessionId)).toBeUndefined()
  })

  it('notification + activity + audit trail', () => {
    const notif = new NotificationCenter()
    const activity = new ActivityFeed()
    const audit = new AuditLog()
    notif.send('u1', 'info', 'New review', 'review ready')
    activity.record('u2', 'reviewed', 'ch1', 'approved')
    audit.record('u2', 'review', 'chapter', 'ch1')
    expect(notif.count()).toBe(1)
    expect(activity.count()).toBe(1)
    expect(audit.count()).toBe(1)
  })

  it('invitation + team membership', () => {
    const inv = new InvitationManager()
    const teams = new TeamMembership()
    const invitation = inv.create('u1', 'u4@x.com', 'p1', 'editor')
    expect(inv.accept(invitation.invitationId)).toBe(true)

    const team = teams.createTeam('team-1', 'A', 'u1')
    teams.addMember(team.teamId, 'u4')
    expect(teams.inTeam(team.teamId, 'u4')).toBe(true)
  })

  it('role assignment + access control', () => {
    const roles = new RoleAssigner()
    roles.assign('u1', 'admin')
    roles.assign('u2', 'user')
    expect(roles.isAdmin('u1')).toBe(true)
    expect(roles.byRole('admin')).toEqual(['u1'])
  })

  it('collaboration metrics aggregates all subsystems', () => {
    const presence = new PresenceTracker()
    const workspace = new SharedWorkspace()
    const comments = new CommentThread()
    const reviews = new ReviewManager()
    const notif = new NotificationCenter()
    const audit = new AuditLog()
    workspace.create('p1', 'u1')
    presence.setStatus('u1', 'online')
    comments.add('u1', 'general', 'all', 'hi everyone')
    notif.send('u1', 'info', 'X', 'Y')

    const metrics = new CollaborationMetrics({ presence, workspace, comments, reviews, notif, audit })
    const s = metrics.stats()
    expect(s.totalUsers).toBe(1)
    expect(s.onlineUsers).toBe(1)
    expect(s.totalComments).toBe(1)
    expect(s.totalNotifications).toBe(1)
  })
})