import mongoose from 'mongoose';

let isConnected = false;

export const connectMongo = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI not defined. MongoDB connection skipped.');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err: any) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
  }
};

export const isMongoConnected = () => isConnected;
