import { db } from '../db/index.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { sseManager } from './sse.js';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowEngine {
  /**
   * Process incoming customer WhatsApp message:
   * 1. Evaluates automatic classification and reply rules
   * 2. Checks for active chatbot session or trigger keyword
   * 3. Executes published flow steps
   */
  async processInboundMessage(options: {
    orgId: string;
    conversationId: string;
    contactId: string;
    phoneE164: string;
    messageText: string;
  }): Promise<void> {
    const { orgId, conversationId, contactId, phoneE164, messageText } = options;
    const cleanText = messageText.trim().toLowerCase();

    // 1. Human Handoff Guard: If conversation is in human-controlled mode, stop bot execution
    const conv = db.queryOne<any>('SELECT control_mode, status FROM conversations WHERE id = ?', [conversationId]);
    if (conv && conv.control_mode === 'human_controlled') {
      return;
    }

    // 2. Automatic Reply Classification & Intelligent Tagging Rules
    this.evaluateReplyRules(orgId, conversationId, contactId, phoneE164, cleanText);

    // 3. Check for existing active chatbot session waiting for input
    const session = db.queryOne<any>(
      "SELECT * FROM chatbot_sessions WHERE organization_id = ? AND conversation_id = ? AND status = 'waiting_for_input'",
      [orgId, conversationId]
    );

    if (session) {
      await this.resumeSession(session, messageText);
      return;
    }

    // 4. Check for keyword-triggered published active chatbots
    const matchingBot = db.queryOne<any>(
      "SELECT * FROM chatbots WHERE organization_id = ? AND is_active = 1 AND trigger_keyword != '' AND ? LIKE CONCAT('%', trigger_keyword, '%')",
      [orgId, cleanText]
    );

    if (matchingBot) {
      await this.startChatbotSession(matchingBot, conversationId, contactId, phoneE164);
    }
  }

  private evaluateReplyRules(orgId: string, convId: string, contactId: string, phone: string, text: string): void {
    const rules = db.query<any>(
      'SELECT * FROM reply_rules WHERE organization_id = ? AND is_active = 1 ORDER BY priority ASC',
      [orgId]
    );

    for (const r of rules) {
      let isMatch = false;
      const kw = r.trigger_keyword.toLowerCase();

      if (r.match_type === 'exact') {
        isMatch = text === kw;
      } else if (r.match_type === 'starts_with') {
        isMatch = text.startsWith(kw);
      } else {
        isMatch = text.includes(kw);
      }

      if (isMatch) {
        const now = new Date().toISOString();

        // Handle Opt-Out compliance immediately
        if (r.is_optout) {
          db.execute(
            `INSERT OR REPLACE INTO suppression_list (id, organization_id, phone_e164, reason, created_at)
             VALUES (?, ?, ?, 'user_optout', ?)`,
            [uuidv4(), orgId, phone, now]
          );
        }

        // Apply automatic tags
        try {
          const ruleTags = JSON.parse(r.add_tags_json || '[]');
          if (ruleTags.length > 0) {
            const contact = db.queryOne<any>('SELECT tags FROM contacts WHERE id = ?', [contactId]);
            if (contact) {
              const currentTags = JSON.parse(contact.tags || '[]');
              const merged = Array.from(new Set([...currentTags, ...ruleTags]));
              db.execute('UPDATE contacts SET tags = ?, updated_at = ? WHERE id = ?', [
                JSON.stringify(merged),
                now,
                contactId,
              ]);
            }
          }
        } catch (e) {}

        // Move CRM stage if configured
        if (r.move_pipeline_stage_id) {
          db.execute('UPDATE contacts SET pipeline_stage_id = ?, updated_at = ? WHERE id = ?', [
            r.move_pipeline_stage_id,
            now,
            contactId,
          ]);
        }

        // Tag recent message with classification
        db.execute(
          `UPDATE messages
           SET classified_category = ?,
               classified_intent = ?,
               classification_confidence = 0.95
           WHERE conversation_id = ? AND direction = 'inbound' ORDER BY created_at DESC LIMIT 1`,
          [r.category, r.trigger_keyword, convId]
        );

        break; // Matched highest priority rule
      }
    }
  }

  private async startChatbotSession(bot: any, conversationId: string, contactId: string, phone: string): Promise<void> {
    const publishedNodes: any[] = JSON.parse(bot.published_nodes_json || '[]');
    const publishedEdges: any[] = JSON.parse(bot.published_edges_json || '[]');

    const startNode = publishedNodes.find((n) => n.type === 'start');
    if (!startNode) return;

    const sessionId = uuidv4();
    const now = new Date().toISOString();

    db.execute(
      `INSERT OR REPLACE INTO chatbot_sessions
       (id, organization_id, chatbot_id, conversation_id, contact_id, current_node_id, status, variables_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', '{}', ?, ?)`,
      [sessionId, bot.organization_id, bot.id, conversationId, contactId, startNode.id, now, now]
    );

    // Increment execution counter
    db.execute('UPDATE chatbots SET execution_count = execution_count + 1 WHERE id = ?', [bot.id]);

    await this.executeFromNode(bot.organization_id, sessionId, conversationId, contactId, phone, startNode.id, publishedNodes, publishedEdges, {});
  }

  private async resumeSession(session: any, userReply: string): Promise<void> {
    const bot = db.queryOne<any>('SELECT * FROM chatbots WHERE id = ?', [session.chatbot_id]);
    if (!bot) return;

    const publishedNodes: any[] = JSON.parse(bot.published_nodes_json || '[]');
    const publishedEdges: any[] = JSON.parse(bot.published_edges_json || '[]');
    const currentVars: Record<string, any> = JSON.parse(session.variables_json || '{}');

    // Save user response if waiting for variable
    if (session.waiting_variable_name) {
      currentVars[session.waiting_variable_name] = userReply;
    }

    // Determine matching outgoing edge (by button text or default)
    const outgoingEdges = publishedEdges.filter((e) => e.source === session.current_node_id);
    let chosenEdge = outgoingEdges.find((e) => e.label && e.label.toLowerCase() === userReply.trim().toLowerCase());
    if (!chosenEdge && outgoingEdges.length > 0) {
      chosenEdge = outgoingEdges[0]; // Default fall-through path
    }

    if (chosenEdge) {
      await this.executeFromNode(
        session.organization_id,
        session.id,
        session.conversation_id,
        session.contact_id,
        '',
        chosenEdge.target,
        publishedNodes,
        publishedEdges,
        currentVars
      );
    } else {
      // End session if no further path
      db.execute("UPDATE chatbot_sessions SET status = 'completed', updated_at = ? WHERE id = ?", [
        new Date().toISOString(),
        session.id,
      ]);
    }
  }

  private async executeFromNode(
    orgId: string,
    sessionId: string,
    conversationId: string,
    contactId: string,
    phone: string,
    startNodeId: string,
    nodes: any[],
    edges: any[],
    variables: Record<string, any>
  ): Promise<void> {
    const { provider } = getWhatsAppProviderForOrg(orgId);
    let activeNode = nodes.find((n) => n.id === startNodeId);
    let currentVars = { ...variables };
    let stepsRun = 0;

    // Contact phone fallback
    let contactPhone = phone;
    if (!contactPhone) {
      const c = db.queryOne<any>('SELECT phone_e164 FROM contacts WHERE id = ?', [contactId]);
      contactPhone = c?.phone_e164 || '';
    }

    while (activeNode && stepsRun < 15) {
      stepsRun++;
      const now = new Date().toISOString();

      // Node Actions:
      if (activeNode.type === 'send_message') {
        let text = activeNode.data?.text || '';
        Object.keys(currentVars).forEach((k) => {
          text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(currentVars[k]));
        });

        if (contactPhone && text) {
          await provider.sendMessage({
            toPhoneE164: contactPhone,
            type: 'text',
            text: { body: text },
          });

          // Record in messages ledger
          db.execute(
            `INSERT INTO messages (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'outbound', 'text', ?, 'sent', ?, ?)`,
            [uuidv4(), orgId, conversationId, contactId, contactPhone, text, now, now]
          );

          sseManager.broadcastToOrg(orgId, 'inbox:new_message', { conversationId, text });
        }
      } else if (activeNode.type === 'buttons') {
        const text = activeNode.data?.text || 'Please choose an option:';
        const buttonTitles = activeNode.data?.buttons || ['Option 1', 'Option 2'];

        if (contactPhone) {
          await provider.sendMessage({
            toPhoneE164: contactPhone,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text },
              action: {
                buttons: buttonTitles.slice(0, 3).map((title: string, i: number) => ({
                  type: 'reply',
                  reply: { id: `btn_${i}`, title },
                })),
              },
            },
          });

          db.execute(
            `INSERT INTO messages (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'outbound', 'interactive', ?, 'sent', ?, ?)`,
            [uuidv4(), orgId, conversationId, contactId, contactPhone, `${text} [${buttonTitles.join(' | ')}]`, now, now]
          );
        }

        // Pause session waiting for user button reply
        db.execute(
          `UPDATE chatbot_sessions
           SET current_node_id = ?, status = 'waiting_for_input', variables_json = ?, updated_at = ?
           WHERE id = ?`,
          [activeNode.id, JSON.stringify(currentVars), now, sessionId]
        );
        return;
      } else if (activeNode.type === 'ask_question') {
        const questionText = activeNode.data?.question || 'Please enter details:';
        if (contactPhone) {
          await provider.sendMessage({
            toPhoneE164: contactPhone,
            type: 'text',
            text: { body: questionText },
          });

          db.execute(
            `INSERT INTO messages (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'outbound', 'text', ?, 'sent', ?, ?)`,
            [uuidv4(), orgId, conversationId, contactId, contactPhone, questionText, now, now]
          );
        }

        // Pause session waiting for user input into variable
        db.execute(
          `UPDATE chatbot_sessions
           SET current_node_id = ?, status = 'waiting_for_input', waiting_variable_name = ?, variables_json = ?, updated_at = ?
           WHERE id = ?`,
          [activeNode.id, activeNode.data?.variable || 'answer', JSON.stringify(currentVars), now, sessionId]
        );
        return;
      } else if (activeNode.type === 'tag_contact') {
        const tag = activeNode.data?.tag;
        if (tag) {
          const contact = db.queryOne<any>('SELECT tags FROM contacts WHERE id = ?', [contactId]);
          if (contact) {
            const tags = JSON.parse(contact.tags || '[]');
            if (!tags.includes(tag)) {
              tags.push(tag);
              db.execute('UPDATE contacts SET tags = ?, updated_at = ? WHERE id = ?', [
                JSON.stringify(tags),
                now,
                contactId,
              ]);
            }
          }
        }
      } else if (activeNode.type === 'human_handoff') {
        // Transfer conversation to human control & suspend automated bot replies
        db.execute(
          "UPDATE conversations SET control_mode = 'human_controlled', status = 'open', updated_at = ? WHERE id = ?",
          [now, conversationId]
        );

        db.execute("UPDATE chatbot_sessions SET status = 'human_takeover', updated_at = ? WHERE id = ?", [
          now,
          sessionId,
        ]);

        const transferMsg = activeNode.data?.transferMessage || 'A human agent has been assigned to your conversation.';
        if (contactPhone) {
          await provider.sendMessage({
            toPhoneE164: contactPhone,
            type: 'text',
            text: { body: transferMsg },
          });
        }
        return;
      } else if (activeNode.type === 'end_flow') {
        db.execute("UPDATE chatbot_sessions SET status = 'completed', updated_at = ? WHERE id = ?", [now, sessionId]);
        return;
      }

      // Next node along edge
      const nextEdge = edges.find((e) => e.source === activeNode.id);
      if (nextEdge) {
        activeNode = nodes.find((n) => n.id === nextEdge.target);
      } else {
        break;
      }
    }

    db.execute(
      `UPDATE chatbot_sessions
       SET current_node_id = ?, status = 'completed', variables_json = ?, updated_at = ?
       WHERE id = ?`,
      [activeNode?.id || null, JSON.stringify(currentVars), new Date().toISOString(), sessionId]
    );
  }
}

export const workflowEngine = new WorkflowEngine();
