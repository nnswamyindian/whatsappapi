export const ROLE_HIERARCHY = {
    owner: ['all'],
    admin: ['all'],
    sub_admin: [
        'campaigns:read', 'campaigns:write',
        'templates:read', 'templates:write',
        'contacts:read', 'contacts:write',
        'crm:read', 'crm:write',
        'chatbots:read', 'chatbots:write',
        'automations:read', 'automations:write',
        'inbox:read', 'inbox:write',
        'reports:read',
        'team:read',
    ],
    marketing_manager: [
        'campaigns:read', 'campaigns:write', 'campaigns:approve',
        'templates:read', 'templates:write',
        'contacts:read', 'contacts:write',
        'crm:read', 'crm:write',
        'reports:read',
        'inbox:read',
        'chatbots:read',
        'automations:read', 'automations:write',
    ],
    campaign_manager: [
        'campaigns:read', 'campaigns:write',
        'templates:read', 'templates:write',
        'contacts:read', 'contacts:write',
        'reports:read',
        'inbox:read',
    ],
    sales_agent: [
        'crm:read', 'crm:write',
        'inbox:read', 'inbox:write',
        'contacts:read', 'contacts:write',
        'templates:read',
    ],
    support_agent: [
        'inbox:read', 'inbox:write',
        'contacts:read',
        'templates:read',
        'crm:read',
    ],
    analyst: [
        'reports:read',
        'campaigns:read',
        'templates:read',
        'crm:read',
    ],
    billing_manager: [
        'billing:read', 'billing:write',
        'reports:read',
        'settings:read',
    ],
    custom: [],
};
export function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.auth) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (req.auth.isPlatformAdmin) {
            return next();
        }
        const currentRole = req.auth.role;
        if (currentRole === 'owner' || currentRole === 'admin' || allowedRoles.includes(currentRole)) {
            return next();
        }
        res.status(403).json({
            error: 'Forbidden',
            message: `Your current role '${currentRole}' lacks permission for this action. Required one of: ${allowedRoles.join(', ')}`,
        });
    };
}
export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.auth) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (req.auth.isPlatformAdmin || req.auth.role === 'owner' || req.auth.role === 'admin') {
            return next();
        }
        const currentRole = req.auth.role;
        const rolePerms = ROLE_HIERARCHY[currentRole] || [];
        if (rolePerms.includes('all') || rolePerms.includes(permission)) {
            return next();
        }
        res.status(403).json({
            error: 'Forbidden',
            message: `Action requires '${permission}' permission.`,
        });
    };
}
export function requirePlatformAdmin(req, res, next) {
    if (!req.auth || !req.auth.isPlatformAdmin) {
        res.status(403).json({ error: 'Forbidden', message: 'Platform Administrator privileges required' });
        return;
    }
    next();
}
