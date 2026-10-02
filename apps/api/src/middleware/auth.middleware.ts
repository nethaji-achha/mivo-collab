import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseStore } from '../db';
import { User, UserRole } from '@mivo/types';

const JWT_SECRET = process.env.JWT_SECRET || 'mivo_collab_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.mivo_session) {
      token = req.cookies.mivo_session;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const db = DatabaseStore.getInstance();
    const userWithPass = db.users.get(decoded.id);

    if (!userWithPass) {
      return res.status(401).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User session is no longer valid' },
      });
    }

    // Strip password hash from request user object
    const { passwordHash, ...user } = userWithPass;
    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired authentication token' },
    });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.mivo_session) {
      token = req.cookies.mivo_session;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      const db = DatabaseStore.getInstance();
      const userWithPass = db.users.get(decoded.id);
      if (userWithPass) {
        const { passwordHash, ...user } = userWithPass;
        req.user = user;
      }
    }
  } catch {
    // Optional auth, silently proceed
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' },
      });
    }
    next();
  };
}
