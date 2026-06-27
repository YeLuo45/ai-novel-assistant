/**
 * ai/collab/demo/multi-user-integration-demo.ts
 */

import {
  UserSessionManager, PresenceTracker, SharedWorkspace, CommentThread,
  ReviewManager, ApprovalWorkflow, NotificationCenter, ActivityFeed,
  AuditLog, InvitationManager, TeamMembership, AccessControl,
} from '../index'

export interface DemoResult {
  sessions: number
  onlineUsers: number
  workspaces: number
  members: number
  comments: number
  reviews: number
  approvals: number
  notifications: number
  activities: number
  auditEntries: number
  invitations: number
  teams: number
}

export function runMultiUserDemo(): DemoResult {
  // 1. Sessions
  const sessions = new UserSessionManager()
  sessions.create('u1', 'desktop')
  sessions.create('u2', 'mobile')
  sessions.create('u3', 'tablet')

  // 2. Presence
  const presence = new PresenceTracker()
  presence.setStatus('u1', 'online', 'ch 5')
  presence.setStatus('u2', 'away')
  presence.setStatus('u3', 'offline')

  // 3. Workspace
  const workspace = new SharedWorkspace()
  workspace.create('p1', 'u1')
  workspace.addMember('p1', 'u2', 'editor')
  workspace.addMember('p1', 'u3', 'commenter')

  // 4. Comments
  const comments = new CommentThread()
  const cm = comments.add('u2', 'chapter', 'ch1', 'good chapter')
  comments.add('u3', 'chapter', 'ch1', 'agree', cm.commentId)

  // 5. Reviews
  const reviews = new ReviewManager()
  reviews.create('u2', 'ch1')
  reviews.create('u3', 'ch1')

  // 6. Approvals
  const approvals = new ApprovalWorkflow()
  approvals.create('u1', ['u2', 'u3'], 'chapter', 'ch1', 'publish request')

  // 7. Notifications
  const notif = new NotificationCenter()
  notif.send('u1', 'info', 'New comment', 'u2 commented on ch1')
  notif.send('u1', 'success', 'Approved', 'ch1 is ready')

  // 8. Activity feed
  const activity = new ActivityFeed()
  activity.record('u1', 'created', 'p1', 'project created')
  activity.record('u2', 'commented', 'ch1', 'added review')

  // 9. Audit
  const audit = new AuditLog()
  audit.record('u1', 'create', 'project', 'p1')
  audit.record('u2', 'update', 'chapter', 'ch1')

  // 10. Invitations
  const invitations = new InvitationManager()
  invitations.create('u1', 'u4@x.com', 'p1', 'viewer')

  // 11. Teams
  const teams = new TeamMembership()
  teams.createTeam('team-1', 'Writers', 'u1')
  teams.addMember('team-1', 'u2')
  teams.addMember('team-1', 'u3')

  // 12. Access control
  const ac = new AccessControl()
  ac.workspace().create('p1', 'u1')

  return {
    sessions: sessions.list().length,
    onlineUsers: presence.online().length,
    workspaces: 1,  // 1 created
    members: workspace.members('p1').length,
    comments: comments.count(),
    reviews: reviews.pending().length,
    approvals: approvals.pending().length,
    notifications: notif.count(),
    activities: activity.count(),
    auditEntries: audit.count(),
    invitations: invitations.pending().length,
    teams: teams.all().length,
  }
}