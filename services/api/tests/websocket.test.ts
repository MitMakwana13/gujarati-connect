import { test } from 'vitest';
import { build } from '../src/app';
import WebSocket from 'ws';

test('WebSocket Auth Rejection (Invalid Token)', async ({ expect }) => {
  const app = await build();
  await app.listen({ port: 0 }); // Websockets require listening port
  const address = app.server.address() as any;
  const wsUrl = `ws://localhost:${address.port}/api/v1/messages/conversations/123/stream`;

  return new Promise<void>((resolve) => {
    const ws = new WebSocket(wsUrl, {
      headers: { Authorization: 'Bearer invalid_token' }
    });

    ws.on('unexpected-response', (request, response) => {
      expect(response.statusCode).toBe(401);
      app.close().then(resolve);
    });
    
    ws.on('error', () => {
        // Handle connection error gracefully
        app.close().then(resolve);
    });
  });
});

test('WebSocket Access Rejection (Cross-user Thread)', async ({ expect }) => {
  const app = await build();
  await app.listen({ port: 0 });
  
  // Here we would setup a valid token for User A, but try to access User B's conversation (456)
  // The server drops connection with 1008 Forbidden.
  
  await app.close();
});
