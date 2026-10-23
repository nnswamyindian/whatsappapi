import { Response } from 'express';

interface Client {
  id: string;
  orgId: string;
  res: Response;
}

class SSEManager {
  private clients: Map<string, Client> = new Map();

  addClient(clientId: string, orgId: string, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.clients.set(clientId, { id: clientId, orgId, res });

    // Send initial connected ping
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, status: 'connected' })}\n\n`);

    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  broadcastToOrg(orgId: string, event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      if (client.orgId === orgId) {
        try {
          client.res.write(payload);
        } catch (e) {
          this.clients.delete(client.id);
        }
      }
    }
  }

  broadcastGlobal(event: string, data: any): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients.values()) {
      try {
        client.res.write(payload);
      } catch (e) {
        this.clients.delete(client.id);
      }
    }
  }
}

export const sseManager = new SSEManager();
