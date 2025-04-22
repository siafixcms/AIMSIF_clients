// src/server.ts

import * as path from 'path';
import * as dotenv from 'dotenv';
import { connectMongo } from './db/mongo';

console.log('🟢 AIMSIF Client Service Booting...');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

async function main() {
  const mongoConnected = await connectMongo();

  if (!mongoConnected) {
    console.error('❌ MongoDB connection failed. AIMSIF Client Service cannot start.');
    process.exit(1);
  }

  console.log('🚀 AIMSIF Client Service Ready');
  console.log('Server is running');
}

main().catch((err) => {
  console.error('❌ Error during service startup:', err);
  process.exit(1);
});
