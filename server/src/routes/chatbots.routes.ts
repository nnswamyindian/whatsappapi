import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// 1. List Chatbots
router.get('/', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const bots = db.query<any>(
    'SELECT * FROM chatbots WHERE organization_id = ? ORDER BY created_at DESC',
    [orgId]
  );

  res.json(
    bots.map((b) => ({
      ...b,
      isActive: Boolean(b.is_active),
      draftNodes: JSON.parse(b.draft_nodes_json || '[]'),
      draftEdges: JSON.parse(b.draft_edges_json || '[]'),
      publishedNodes: JSON.parse(b.published_nodes_json || '[]'),
      publishedEdges: JSON.parse(b.published_edges_json || '[]'),
    }))
  );
});

// 2. Get Single Chatbot
router.get('/:id', (req: Request, res: Response) => {
  const bot = db.queryOne<any>(
    'SELECT * FROM chatbots WHERE id = ? AND organization_id = ?',
    [req.params.id, req.auth!.orgId]
  );

  if (!bot) {
    res.status(404).json({ error: 'Chatbot not found' });
    return;
  }

  res.json({
    ...bot,
    isActive: Boolean(bot.is_active),
    draftNodes: JSON.parse(bot.draft_nodes_json || '[]'),
    draftEdges: JSON.parse(bot.draft_edges_json || '[]'),
    publishedNodes: JSON.parse(bot.published_nodes_json || '[]'),
    publishedEdges: JSON.parse(bot.published_edges_json || '[]'),
  });
});

// 3. Create Chatbot
router.post('/', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req: Request, res: Response) => {
  const { name, description, triggerKeyword = 'hi' } = req.body;
  const orgId = req.auth!.orgId;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Chatbot name is required' });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  // Initial starter flow with connectable nodes
  const initialNodes = [
    { id: 'start_1', type: 'start', position: { x: 50, y: 150 }, data: { label: 'Start Flow', description: 'Customer initiates chat' } },
    { id: 'msg_1', type: 'send_message', position: { x: 300, y: 150 }, data: { text: 'Hello! Welcome to our WhatsApp service.' } },
    { id: 'btn_1', type: 'buttons', position: { x: 560, y: 150 }, data: { text: 'How can we help?', buttons: ['Learn More', 'Support'] } },
    { id: 'end_1', type: 'end_flow', position: { x: 850, y: 150 }, data: { label: 'End' } },
  ];
  const initialEdges = [
    { id: 'e1', source: 'start_1', target: 'msg_1' },
    { id: 'e2', source: 'msg_1', target: 'btn_1' },
    { id: 'e3', source: 'btn_1', target: 'end_1' },
  ];

  db.execute(
    `INSERT INTO chatbots
     (id, organization_id, name, description, trigger_keyword, is_active, draft_nodes_json, draft_edges_json, published_nodes_json, published_edges_json, version, execution_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1, 0, ?, ?)`,
    [
      id,
      orgId,
      name.trim(),
      description || '',
      triggerKeyword.toLowerCase().trim(),
      JSON.stringify(initialNodes),
      JSON.stringify(initialEdges),
      JSON.stringify(initialNodes),
      JSON.stringify(initialEdges),
      now,
      now,
    ]
  );

  res.status(201).json({ id, name, triggerKeyword });
});

// 4. Save Draft Nodes & Edges
router.put('/:id', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req: Request, res: Response) => {
  const { name, description, triggerKeyword, draftNodes, draftEdges } = req.body;
  const orgId = req.auth!.orgId;

  const bot = db.queryOne('SELECT id FROM chatbots WHERE id = ? AND organization_id = ?', [req.params.id, orgId]);
  if (!bot) {
    res.status(404).json({ error: 'Chatbot not found' });
    return;
  }

  const now = new Date().toISOString();
  db.execute(
    `UPDATE chatbots
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         trigger_keyword = COALESCE(?, trigger_keyword),
         draft_nodes_json = ?,
         draft_edges_json = ?,
         updated_at = ?
     WHERE id = ? AND organization_id = ?`,
    [
      name ? name.trim() : null,
      description !== undefined ? description : null,
      triggerKeyword ? triggerKeyword.toLowerCase().trim() : null,
      JSON.stringify(draftNodes || []),
      JSON.stringify(draftEdges || []),
      now,
      req.params.id,
      orgId,
    ]
  );

  res.json({ success: true, message: 'Draft saved successfully' });
});

// 5. Publish Chatbot Flow (Validates connections and creates published snapshot)
router.post('/:id/publish', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const bot = db.queryOne<any>('SELECT * FROM chatbots WHERE id = ? AND organization_id = ?', [req.params.id, orgId]);

  if (!bot) {
    res.status(404).json({ error: 'Chatbot not found' });
    return;
  }

  const draftNodes: any[] = JSON.parse(bot.draft_nodes_json || '[]');
  const draftEdges: any[] = JSON.parse(bot.draft_edges_json || '[]');

  // Validation: Must have at least 1 start node
  const startNode = draftNodes.find((n) => n.type === 'start');
  if (!startNode) {
    res.status(400).json({ error: 'Validation Error: Flow must contain a Start node.' });
    return;
  }

  // Check if start node has an outgoing edge
  const hasStartConnection = draftEdges.some((e) => e.source === startNode.id);
  if (!hasStartConnection && draftNodes.length > 1) {
    res.status(400).json({ error: 'Validation Error: Start node must connect to a subsequent action.' });
    return;
  }

  const now = new Date().toISOString();
  const nextVersion = (bot.version || 1) + 1;

  db.execute(
    `UPDATE chatbots
     SET published_nodes_json = draft_nodes_json,
         published_edges_json = draft_edges_json,
         version = ?,
         is_active = 1,
         updated_at = ?
     WHERE id = ? AND organization_id = ?`,
    [nextVersion, now, req.params.id, orgId]
  );

  res.json({
    success: true,
    version: nextVersion,
    isActive: true,
    message: `Chatbot '${bot.name}' published successfully (v${nextVersion}) and activated!`,
  });
});

// 6. Toggle Active Status
router.post('/:id/toggle', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const bot = db.queryOne<any>('SELECT is_active FROM chatbots WHERE id = ? AND organization_id = ?', [req.params.id, orgId]);
  if (!bot) {
    res.status(404).json({ error: 'Chatbot not found' });
    return;
  }

  const newStatus = bot.is_active ? 0 : 1;
  db.execute('UPDATE chatbots SET is_active = ?, updated_at = ? WHERE id = ? AND organization_id = ?', [
    newStatus,
    new Date().toISOString(),
    req.params.id,
    orgId,
  ]);

  res.json({ success: true, isActive: Boolean(newStatus) });
});

// 7. Interactive Conversation Simulator Step
router.post('/simulate-step', (req: Request, res: Response) => {
  const { nodes, edges, currentNodeId, userInput, variables = {} } = req.body;

  if (!Array.isArray(nodes) || nodes.length === 0) {
    res.status(400).json({ error: 'No flow nodes provided for simulation' });
    return;
  }

  // Find starting node if currentNodeId not provided
  let current = nodes.find((n: any) => (currentNodeId ? n.id === currentNodeId : n.type === 'start'));
  if (!current) {
    res.status(400).json({ error: 'Current node not found' });
    return;
  }

  const simulatedResponses: Array<{ type: string; text?: string; buttons?: string[]; options?: string[]; mediaUrl?: string }> = [];
  const updatedVariables = { ...variables };
  let nextNodeId: string | null = null;
  let isWaitingForInput = false;

  // If previous node was asking a question and user provided input, record it
  if (current.type === 'ask_question' && userInput && current.data?.variable) {
    updatedVariables[current.data.variable] = userInput;
  }

  // Traverse through immediate execution nodes
  let activeNode = current;
  let stepsCount = 0;

  while (activeNode && stepsCount < 10) {
    stepsCount++;

    if (activeNode.type === 'send_message') {
      let text = activeNode.data?.text || '';
      // Interpolate variables {{name}}
      Object.keys(updatedVariables).forEach((k) => {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), updatedVariables[k]);
      });
      simulatedResponses.push({ type: 'text', text });
    } else if (activeNode.type === 'buttons') {
      simulatedResponses.push({
        type: 'buttons',
        text: activeNode.data?.text || 'Please select:',
        buttons: activeNode.data?.buttons || ['Option 1', 'Option 2'],
      });
      isWaitingForInput = true;
      nextNodeId = activeNode.id;
      break;
    } else if (activeNode.type === 'ask_question') {
      simulatedResponses.push({
        type: 'question',
        text: activeNode.data?.question || 'Please enter information:',
      });
      isWaitingForInput = true;
      nextNodeId = activeNode.id;
      break;
    } else if (activeNode.type === 'tag_contact') {
      simulatedResponses.push({
        type: 'system',
        text: `🏷️ Contact tagged: [${activeNode.data?.tag || 'New Tag'}]`,
      });
    } else if (activeNode.type === 'human_handoff') {
      simulatedResponses.push({
        type: 'system',
        text: `👤 Conversation transferred to Human Agent (${activeNode.data?.reason || 'Handoff'}). Automated replies paused.`,
      });
      break;
    } else if (activeNode.type === 'end_flow') {
      simulatedResponses.push({ type: 'system', text: '🏁 Flow completed.' });
      break;
    }

    // Find outgoing edge
    let nextEdge = edges.find((e: any) => e.source === activeNode.id);
    if (userInput && edges.some((e: any) => e.source === activeNode.id && e.label === userInput)) {
      nextEdge = edges.find((e: any) => e.source === activeNode.id && e.label === userInput);
    }

    if (nextEdge) {
      activeNode = nodes.find((n: any) => n.id === nextEdge.target);
      nextNodeId = activeNode?.id || null;
    } else {
      break;
    }
  }

  res.json({
    responses: simulatedResponses,
    variables: updatedVariables,
    nextNodeId,
    isWaitingForInput,
  });
});

// 8. Delete Chatbot
router.delete('/:id', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req: Request, res: Response) => {
  db.execute('DELETE FROM chatbots WHERE id = ? AND organization_id = ?', [req.params.id, req.auth!.orgId]);
  res.json({ success: true });
});

export default router;
