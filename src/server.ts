// src/server.ts

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectMongo } from './db/mongo';
import * as services from './service';
import { handleMessage } from './rpc/dispatcher';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = parseInt(process.env.PORT || '8080', 10);
const SERVICE_NAME = process.env.SERVICE_ID || 'unknown-service';

console.log(`🟢 ${SERVICE_NAME} Service Booting...`);

async function main() {
  const mongoConnected = await connectMongo();
  if (!mongoConnected) {
    console.error('❌ MongoDB connection failed. Service cannot start.');
    process.exit(1);
  }

  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    console.log(`🔌 Client connected: ${clientId}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const response = await handleMessage(message, services);
        if (response) ws.send(JSON.stringify(response));
      } catch (err: any) {
        console.error('❌ Failed to handle message:', err.message || err);
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error'
          },
          id: null
        }));
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`✅ WebSocket server listening on ws://localhost:${PORT}`);
    console.log(`🚀 ${SERVICE_NAME} Service Ready`);
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('❌ Error during startup:', message);
  process.exit(1);
});
