import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { DatabaseStore } from '../db';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@mivo/validation';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordAuditLog } from '../middleware/audit.middleware';
import { DEFAULT_USER_PREFERENCES } from '@mivo/config';
import { User, Organization } from '@mivo/types';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const validated = RegisterSchema.parse(req.body);
  const db = DatabaseStore.getInstance();

  // Check if email already exists
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === validated.email.toLowerCase()) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }
  }

  const userId = `usr_${nanoid(12)}`;
  const passwordHash = await bcrypt.hash(validated.password, 10);

  const newUser: User & { passwordHash: string } = {
    id: userId,
    email: validated.email.toLowerCase(),
    name: validated.name,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(validated.name)}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    role: validated.organizationName ? 'org_admin' : 'individual',
    preferences: { ...DEFAULT_USER_PREFERENCES },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passwordHash,
  };

  db.users.set(newUser.id, newUser);

  // If organizationName provided, create new organization
  if (validated.organizationName) {
    const orgId = `org_${nanoid(10)}`;
    const newOrg: Organization = {
      id: orgId,
      name: validated.organizationName,
      slug: validated.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ownerId: newUser.id,
      plan: 'free',
      subscriptionStatus: 'active',
      maxMembers: 10,
      settings: {
        allowGuestInvites: true,
        requireWaitingRoom: false,
        recordingsEnabled: false,
        aiFeaturesEnabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.organizations.set(orgId, newOrg);
    db.orgMembers.set(`mem_${nanoid(10)}`, {
      id: `mem_${nanoid(10)}`,
      organizationId: orgId,
      userId: newUser.id,
      user: newUser,
      role: 'owner',
      status: 'active',
      joinedAt: new Date().toISOString(),
    });
  }

  const { passwordHash: _, ...userWithoutPass } = newUser;
  const token = generateToken(userWithoutPass);

  recordAuditLog({ user: userWithoutPass } as any, 'auth.signup', 'User', newUser.id);

  res.status(201).json({
    success: true,
    data: {
      user: userWithoutPass,
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  });
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const validated = LoginSchema.parse(req.body);
  const db = DatabaseStore.getInstance();

  let foundUser: (User & { passwordHash: string }) | undefined;
  for (const user of db.users.values()) {
    if (user.email.toLowerCase() === validated.email.toLowerCase()) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  const passwordMatch = await bcrypt.compare(validated.password, foundUser.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  const { passwordHash: _, ...userWithoutPass } = foundUser;
  const token = generateToken(userWithoutPass);

  recordAuditLog({ user: userWithoutPass } as any, 'auth.login', 'User', userWithoutPass.id);

  res.json({
    success: true,
    data: {
      user: userWithoutPass,
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  });
});

// POST /api/auth/demo-login (Quick testing as demo users)
authRouter.post('/demo-login', async (req: Request, res: Response) => {
  const role = (req.body.role || 'alex').toLowerCase();
  const db = DatabaseStore.getInstance();

  let targetId = 'usr_demo_alex';
  if (role === 'sarah' || role === 'admin') targetId = 'usr_demo_sarah';
  else if (role === 'liam') targetId = 'usr_demo_liam';
  else if (role === 'maya') targetId = 'usr_demo_maya';
  else if (role === 'david') targetId = 'usr_demo_david';
  else if (role === 'elena') targetId = 'usr_demo_elena';
  else if (role === 'marcus') targetId = 'usr_demo_marcus';
  else if (role === 'sophia') targetId = 'usr_demo_sophia';
  else if (db.users.has(role)) targetId = role;
  else {
    for (const u of db.users.values()) {
      if (u.email.toLowerCase().includes(role) || u.name.toLowerCase().includes(role)) {
        targetId = u.id;
        break;
      }
    }
  }

  const userWithPass = db.users.get(targetId);
  if (!userWithPass) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Demo user not found' } });
  }

  const { passwordHash: _, ...userWithoutPass } = userWithPass;
  const token = generateToken(userWithoutPass);

  recordAuditLog({ user: userWithoutPass } as any, 'auth.login', 'User', userWithoutPass.id, { isDemoLogin: true });

  res.json({
    success: true,
    data: {
      user: userWithoutPass,
      token,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;

  // Find user organizations
  const userOrgs: Organization[] = [];
  for (const member of db.orgMembers.values()) {
    if (member.userId === user.id) {
      const org = db.organizations.get(member.organizationId);
      if (org) userOrgs.push(org);
    }
  }

  res.json({
    success: true,
    data: {
      user,
      organizations: userOrgs,
      primaryOrg: userOrgs[0] || null,
    },
  });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req: Request, res: Response) => {
  const validated = ForgotPasswordSchema.parse(req.body);
  // Simulate sending password reset email
  res.json({
    success: true,
    data: {
      message: `If an account with ${validated.email} exists, a secure reset link has been dispatched.`,
      simulatedResetToken: 'reset_token_mivo_demo_123',
    },
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const validated = ResetPasswordSchema.parse(req.body);
  const db = DatabaseStore.getInstance();

  const user = db.users.get('usr_demo_alex');
  if (user) {
    user.passwordHash = await bcrypt.hash(validated.password, 10);
    user.updatedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    data: { message: 'Password has been successfully updated. You may now sign in.' },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  recordAuditLog(req, 'auth.logout', 'User', req.user!.id);
  res.json({
    success: true,
    data: { message: 'Signed out successfully' },
  });
});
