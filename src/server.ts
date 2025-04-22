import { connectMongo } from './db/mongo';

async function startServer() {
  console.log('🟢 AIMSIF Client Service Booting...');

  await connectMongo();

  console.log('🚀 AIMSIF Client Service Ready');
}

startServer();
