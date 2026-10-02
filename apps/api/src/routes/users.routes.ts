import { Router, Response } from 'express';
import { DatabaseStore } from '../db';
import { UpdateProfileSchema } from '@mivo/validation';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordAuditLog } from '../middleware/audit.middleware';

export const usersRouter = Router();

// GET /api/users/profile
usersRouter.get('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;

  // Compute stats
  let totalHosted = 0;
  let totalMinutes = 0;
  for (const m of db.meetings.values()) {
    if (m.hostId === user.id) {
      totalHosted++;
      totalMinutes += m.durationSeconds ? Math.floor(m.durationSeconds / 60) : 30;
    }
  }

  res.json({
    success: true,
    data: {
      user,
      stats: {
        totalHostedMeetings: totalHosted,
        totalMeetingMinutes: totalMinutes,
        organizationsCount: 1,
      },
    },
  });
});

// PATCH /api/users/profile
usersRouter.patch('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;
  const validated = UpdateProfileSchema.parse(req.body);

  const dbUser = db.users.get(user.id);
  if (!dbUser) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  if (validated.name) dbUser.name = validated.name;
  if (validated.avatarUrl !== undefined) dbUser.avatarUrl = validated.avatarUrl;
  if (validated.timezone) dbUser.timezone = validated.timezone;
  if (validated.preferences) {
    dbUser.preferences = {
      ...dbUser.preferences,
      ...validated.preferences,
    };
  }
  dbUser.updatedAt = new Date().toISOString();

  const { passwordHash: _, ...updatedUser } = dbUser;

  recordAuditLog(req, 'security.setting_update', 'User', user.id, { changes: Object.keys(validated) });

  res.json({
    success: true,
    data: updatedUser,
  });
});
