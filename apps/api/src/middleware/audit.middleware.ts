import { AuthenticatedRequest } from './auth.middleware';
import { DatabaseStore } from '../db';
import { AuditAction, AuditLog } from '@mivo/types';
import { nanoid } from 'nanoid';

export function recordAuditLog(
  req: AuthenticatedRequest,
  action: AuditAction,
  targetType: string,
  targetId: string,
  metadata?: Record<string, any>
) {
  try {
    const db = DatabaseStore.getInstance();
    const user = req.user;
    const log: AuditLog = {
      id: `aud_${nanoid(10)}`,
      organizationId: (metadata && metadata.organizationId) || null,
      actorId: user ? user.id : 'anonymous_or_system',
      actorName: user ? user.name : 'Anonymous User',
      actorEmail: user ? user.email : 'system@mivo.collab',
      action,
      targetType,
      targetId,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Unknown Agent',
      metadata,
      createdAt: new Date().toISOString(),
    };

    db.auditLogs.unshift(log);
    if (db.auditLogs.length > 500) {
      db.auditLogs.pop();
    }
  } catch (err) {
    console.error('[AuditLog Error]:', err);
  }
}
