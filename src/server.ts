import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectMongo } from './db/mongo';
import * as serviceMethods from './service';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

interface ServiceMethods {
  [key: string]: (...args: any[]) => any;
}

const methods: ServiceMethods = serviceMethods;

const server = createServer();

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message.toString());
      const { method, params, id } = request;

      if (methods[method]) {
        const result = await methods[method](...params);
        ws.send(JSON.stringify({ jsonrpc: '2.0', result, id }));
      } else {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: error.message },
          id: null
        }));
      } else {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Unknown error' },
          id: null
        }));
      }
    }
  });
});

server.listen(PORT, async () => {
  try {
    await connectMongo();
    console.log(`Server is listening on port ${PORT}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to connect to MongoDB:', error.message);
    } else {
      console.error('Unknown error during MongoDB connection:', error);
    }
    process.exit(1);
  }
});
