import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// List Automations
router.get('/', (req: Request, res: Response) => {
  const automations = db.query<any>(
    'SELECT * FROM automations WHERE organization_id = ? ORDER BY created_at DESC',
    [req.auth!.orgId]
  );

  res.json(
    automations.map((a) => ({
      ...a,
      isActive: !!a.is_active,
      triggerConfig: JSON.parse(a.trigger_config_json || '{}'),
      flowDefinition: JSON.parse(a.flow_definition_json || '[]'),
    }))
  );
});

// Create Automation Workflow
router.post('/', requireRole(['admin']), (req: Request, res: Response) => {
  const { name, description, triggerType, triggerConfig = {}, flowDefinition = [] } = req.body;
  const orgId = req.auth!.orgId;

  if (!name || !triggerType) {
    res.status(400).json({ error: 'Name and triggerType required' });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO automations
     (id, organization_id, name, description, is_active, trigger_type, trigger_config_json, flow_definition_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
    [
      id,
      orgId,
      name,
      description || null,
      triggerType,
      JSON.stringify(triggerConfig),
      JSON.stringify(flowDefinition),
      now,
      now,
    ]
  );

  res.status(201).json({ id, name, isActive: true });
});

// Update Automation
router.put('/:id', requireRole(['admin']), (req: Request, res: Response) => {
  const { name, description, triggerType, triggerConfig, flowDefinition, isActive } = req.body;
  const now = new Date().toISOString();

  db.execute(
    `UPDATE automations
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         trigger_type = COALESCE(?, trigger_type),
         trigger_config_json = COALESCE(?, trigger_config_json),
         flow_definition_json = COALESCE(?, flow_definition_json),
         is_active = COALESCE(?, is_active),
         updated_at = ?
     WHERE id = ? AND organization_id = ?`,
    [
      name,
      description,
      triggerType,
      triggerConfig ? JSON.stringify(triggerConfig) : null,
      flowDefinition ? JSON.stringify(flowDefinition) : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      now,
      req.params.id,
      req.auth!.orgId,
    ]
  );

  res.json({ success: true });
});

// Toggle Activation Status
router.patch('/:id/toggle', requireRole(['admin']), (req: Request, res: Response) => {
  const auto = db.queryOne<any>('SELECT is_active FROM automations WHERE id = ? AND organization_id = ?', [
    req.params.id,
    req.auth!.orgId,
  ]);

  if (!auto) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const newState = auto.is_active ? 0 : 1;
  db.execute('UPDATE automations SET is_active = ?, updated_at = ? WHERE id = ?', [
    newState,
    new Date().toISOString(),
    req.params.id,
  ]);

  res.json({ id: req.params.id, isActive: !!newState });
});

// Get Execution Logs
router.get('/:id/logs', (req: Request, res: Response) => {
  const logs = db.query<any>(
    'SELECT * FROM automation_logs WHERE automation_id = ? AND organization_id = ? ORDER BY started_at DESC LIMIT 50',
    [req.params.id, req.auth!.orgId]
  );
  res.json(logs);
});

// Delete Workflow
router.delete('/:id', requireRole(['admin']), (req: Request, res: Response) => {
  db.execute('DELETE FROM automations WHERE id = ? AND organization_id = ?', [req.params.id, req.auth!.orgId]);
  res.json({ success: true });
});

export default router;
