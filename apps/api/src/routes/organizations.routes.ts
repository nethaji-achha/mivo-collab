import { Router, Response } from 'express';
import { nanoid } from 'nanoid';
import { DatabaseStore } from '../db';
import { InviteMemberSchema, CreateTeamSchema } from '@mivo/validation';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordAuditLog } from '../middleware/audit.middleware';
import { OrgMember, Team } from '@mivo/types';

export const organizationsRouter = Router();

// GET /api/organizations/current
organizationsRouter.get('/current', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;

  // Find user's primary organization
  let currentOrg = db.organizations.get('org_hyper_lab');
  for (const member of db.orgMembers.values()) {
    if (member.userId === user.id) {
      const org = db.organizations.get(member.organizationId);
      if (org) {
        currentOrg = org;
        break;
      }
    }
  }

  if (!currentOrg) {
    return res.status(404).json({
      success: false,
      error: { code: 'NO_ORG', message: 'No organization found for this user' },
    });
  }

  res.json({
    success: true,
    data: currentOrg,
  });
});

// GET /api/organizations/current/members
organizationsRouter.get('/current/members', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const members = Array.from(db.orgMembers.values());
  res.json({
    success: true,
    data: members,
  });
});

// POST /api/organizations/current/members (Invite member)
organizationsRouter.post('/current/members', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const validated = InviteMemberSchema.parse(req.body);
  const user = req.user!;

  const memberId = `mem_${nanoid(10)}`;

  // Find if user already exists
  let targetUser = Array.from(db.users.values()).find(
    (u) => u.email.toLowerCase() === validated.email.toLowerCase()
  );

  const newMember: OrgMember = {
    id: memberId,
    organizationId: 'org_hyper_lab',
    userId: targetUser ? targetUser.id : `usr_invited_${nanoid(8)}`,
    user: targetUser || {
      id: `usr_invited_${nanoid(8)}`,
      email: validated.email,
      name: validated.email.split('@')[0],
      avatarUrl: null,
      timezone: 'UTC',
      role: 'individual',
      preferences: {} as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    role: validated.role,
    status: targetUser ? 'active' : 'invited',
    invitedEmail: validated.email,
    joinedAt: new Date().toISOString(),
  };

  db.orgMembers.set(memberId, newMember);

  recordAuditLog(req, 'org.member_add', 'OrgMember', memberId, { email: validated.email, role: validated.role });

  res.status(201).json({
    success: true,
    data: newMember,
  });
});

// DELETE /api/organizations/current/members/:id
organizationsRouter.delete('/current/members/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.getInstance();

  if (!db.orgMembers.has(id)) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } });
  }

  db.orgMembers.delete(id);
  recordAuditLog(req, 'org.member_remove', 'OrgMember', id);

  res.json({
    success: true,
    data: { message: 'Member removed successfully' },
  });
});

// GET /api/organizations/current/teams
organizationsRouter.get('/current/teams', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const teams = Array.from(db.teams.values());
  res.json({
    success: true,
    data: teams,
  });
});

// POST /api/organizations/current/teams
organizationsRouter.post('/current/teams', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const validated = CreateTeamSchema.parse(req.body);

  const teamId = `team_${nanoid(10)}`;
  const newTeam: Team = {
    id: teamId,
    organizationId: 'org_hyper_lab',
    name: validated.name,
    description: validated.description,
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };

  db.teams.set(teamId, newTeam);

  res.status(201).json({
    success: true,
    data: newTeam,
  });
});
