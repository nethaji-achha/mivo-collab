import { Router, Response } from 'express';
import { DatabaseStore } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

export const adminRouter = Router();

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const search = (req.query.search as string) || '';
  const action = req.query.action as string;

  let logs = [...db.auditLogs];

  if (action) {
    logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.actorName.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.targetType.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: logs,
    meta: {
      totalCount: logs.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/admin/system-stats
adminRouter.get('/system-stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const user = req.user!;

  if (user.role !== 'org_admin' && user.role !== 'enterprise_admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }

  res.json({
    success: true,
    data: {
      totalUsers: db.users.size,
      totalMeetings: db.meetings.size,
      activeMeetings: Array.from(db.meetings.values()).filter((m) => m.status === 'live').length,
      totalAuditLogs: db.auditLogs.length,
      organizations: db.organizations.size,
      systemHealth: {
        apiStatus: 'healthy',
        databaseStatus: 'connected',
        redisStatus: 'active',
        sfuRelayStatus: 'operational',
        avgLatencyMs: 24,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    },
  });
});
