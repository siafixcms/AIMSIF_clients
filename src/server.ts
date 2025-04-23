import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as service from './service';
import { connectMongo } from './db/mongo';
import { createClient } from 'redis';

// Read package.json to get the service name
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const serviceName = packageJson.name;

// Create an HTTP server (required by ws)
const server = createServer();

// Create a WebSocket server
const wss = new WebSocketServer({ server });

// Connect to MongoDB
connectMongo();

// Connect to Redis
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Handle incoming WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (message: string) => {
    let request;
    try {
      request = JSON.parse(message);
    } catch (err) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null,
      }));
      return;
    }

    const { jsonrpc, method, params, id } = request;

    if (jsonrpc !== '2.0' || typeof method !== 'string' || (params && typeof params !== 'object')) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: id || null,
      }));
      return;
    }

    const [namespace, methodName] = method.split('.');

    if (namespace !== serviceName || typeof (service as any)[methodName] !== 'function') {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id,
      }));
      return;
    }

    try {
      const result = await (service as Record<string, Function>)[methodName](params);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        result,
        id,
      }));
    } catch (err: any) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: err?.message || 'Internal error',
        },
        id,
      }));
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket JSON-RPC server is running on ws://localhost:${PORT}`);
});
