import { Request, Response, NextFunction } from 'express';

export type UserRole =
  | 'owner'
  | 'admin'
  | 'campaign_manager'
  | 'support_agent'
  | 'analyst'
  | 'billing_manager';

const ROLE_HIERARCHY: Record<UserRole, string[]> = {
  owner: ['all'],
  admin: [
    'campaigns:read', 'campaigns:write',
    'templates:read', 'templates:write',
    'contacts:read', 'contacts:write',
    'inbox:read', 'inbox:write',
    'automations:read', 'automations:write',
    'reports:read',
    'team:read', 'team:write',
    'settings:read', 'settings:write',
    'billing:read', 'billing:write',
    'api:manage',
  ],
  campaign_manager: [
    'campaigns:read', 'campaigns:write',
    'templates:read', 'templates:write',
    'contacts:read', 'contacts:write',
    'reports:read',
    'inbox:read',
  ],
  support_agent: [
    'inbox:read', 'inbox:write',
    'contacts:read',
    'templates:read',
  ],
  analyst: [
    'reports:read',
    'campaigns:read',
    'templates:read',
  ],
  billing_manager: [
    'billing:read', 'billing:write',
    'reports:read',
    'settings:read',
  ],
};

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (req.auth.isPlatformAdmin) {
      return next();
    }

    const currentRole = req.auth.role as UserRole;
    if (currentRole === 'owner' || allowedRoles.includes(currentRole)) {
      return next();
    }

    res.status(403).json({
      error: 'Forbidden',
      message: `Your current role '${currentRole}' lacks permission for this action. Allowed: ${allowedRoles.join(', ')}`,
    });
  };
}

export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth || !req.auth.isPlatformAdmin) {
    res.status(403).json({ error: 'Forbidden', message: 'Platform Administrator privileges required' });
    return;
  }
  next();
}
