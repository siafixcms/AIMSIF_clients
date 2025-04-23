// src/server.ts

import * as path from 'path';
import * as dotenv from 'dotenv';
import { connectMongo } from './db/mongo';
import { WebSocketServer } from 'ws';
import { dispatchRpc } from './rpc/dispatcher';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

console.log(`🟢 ${process.env.SERVICE_NAME || 'AIMSIF'} Client Service Booting...`);

async function main() {
  const mongoConnected = await connectMongo();

  if (!mongoConnected) {
    console.error('❌ MongoDB connection failed. AIMSIF Client Service cannot start.');
    process.exit(1);
  }

  const wss = new WebSocketServer({ port: PORT });

  wss.on('listening', () => {
    console.log(`✅ WebSocket server is listening on ws://localhost:${PORT}`);
  });

  wss.on('connection', (ws) => {
    console.log('🔌 New client connected');

    ws.on('message', async (data) => {
      try {
        const request = JSON.parse(data.toString());
        const response = await dispatchRpc(request);
        ws.send(JSON.stringify(response));
      } catch (err: any) {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32700,
              message: 'Parse error',
              data: err.message,
            },
            id: null,
          })
        );
      }
    });
  });

  console.log(`🚀 ${process.env.SERVICE_NAME || 'AIMSIF'} Client Service Ready`);
}

main().catch((err) => {
  console.error('❌ Error during service startup:', err);
  process.exit(1);
});
