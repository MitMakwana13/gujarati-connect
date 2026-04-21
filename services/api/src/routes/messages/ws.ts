import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { AppError } from '../../plugins/error-handler.js';

export default async function messageWsRoutes(app: FastifyInstance): Promise<void> {

  // We need a dedicated Redis subscriber client since Redis pub/sub blocks normal commands
  const subClient = app.redis.duplicate();
  await subClient.connect();

  subClient.on('error', (err) => {
    app.log.error(err, '[ws] Redis subscriber error');
  });

  const listeners = new Map<string, Set<(message: string) => void>>();

  subClient.on('message', (channel, message) => {
    try {
      const channelListeners = listeners.get(channel);
      if (channelListeners) {
        for (const listener of channelListeners) {
          listener(message);
        }
      }
    } catch (err) {
      app.log.error(err, '[ws] Error in global message handler');
    }
  });

  app.get('/conversations/:id/stream', { websocket: true, onRequest: [app.authenticate] }, async (connection: WebSocket, req) => {
    const { id: conversationId } = req.params as { id: string };
    const userId = req.userId!;

    // 1. Resource Auth Check: Is this user a participant?
    const participation = await app.db.query<{ status: string }>(
      'SELECT status FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId],
    );
    
    if (!participation.rows[0] || participation.rows[0].status !== 'active') {
      connection.send(JSON.stringify({ type: 'error', message: 'Not authorized for this conversation' }));
      return connection.close(1008, 'Forbidden');
    }

    // Update last_seen in DB
    await app.db.query(
      'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId],
    );

    const channel = `conversation:${conversationId}`;

    // 2. Subscribe to Redis for this conversation
    const messageHandler = (message: string) => {
      // Don't echo back to the sender
      try {
        const payload = JSON.parse(message);
        if (payload.senderId !== userId) {
          connection.send(message);
        }
      } catch (e) {
        // Ignore parse error
      }
    };

    if (!listeners.has(channel)) {
      listeners.set(channel, new Set());
      await subClient.subscribe(channel);
    }
    listeners.get(channel)!.add(messageHandler);

    // Broadcast presence join
    await app.redis.publish(channel, JSON.stringify({
      type: 'presence',
      userId,
      status: 'online',
    }));

    // 3. Handle incoming WS messages from the client
    connection.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'typing': {
            // Broadcast typing indicator
            await app.redis.publish(channel, JSON.stringify({
              type: 'typing',
              senderId: userId,
              isTyping: data.isTyping,
            }));
            break;
          }

          case 'read_receipt': {
            // Persist read receipt to Postgres
            await app.db.query(
              'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = $1 AND user_id = $2',
              [conversationId, userId],
            );
            
            // Broadcast
            await app.redis.publish(channel, JSON.stringify({
              type: 'read_receipt',
              senderId: userId,
              messageId: data.messageId,
              timestamp: new Date().toISOString(),
            }));
            break;
          }
        }
      } catch (error) {
        app.log.error(error, '[ws] Error handling message');
      }
    });

    // 4. Cleanup on disconnect
    connection.on('close', async () => {
      const channelListeners = listeners.get(channel);
      if (channelListeners) {
        channelListeners.delete(messageHandler);
        if (channelListeners.size === 0) {
          listeners.delete(channel);
          await subClient.unsubscribe(channel);
        }
      }

      await app.redis.publish(channel, JSON.stringify({
        type: 'presence',
        userId,
        status: 'offline',
      }));
    });
  });
}
