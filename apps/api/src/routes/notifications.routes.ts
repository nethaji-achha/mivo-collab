import { Router, Response } from 'express';
import { DatabaseStore } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const userId = req.user!.id;
  const notifs = db.notifications.get(userId) || [];

  res.json({
    success: true,
    data: notifs,
  });
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = DatabaseStore.getInstance();
  const userId = req.user!.id;
  const notifs = db.notifications.get(userId) || [];

  const notif = notifs.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
  }

  res.json({
    success: true,
    data: { message: 'Notification marked as read' },
  });
});

// POST /api/notifications/read-all
notificationsRouter.post('/read-all', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const userId = req.user!.id;
  const notifs = db.notifications.get(userId) || [];

  notifs.forEach((n) => (n.read = true));

  res.json({
    success: true,
    data: { message: 'All notifications marked as read' },
  });
});
