/**
 * @capability integration:client-storage
 * Tests real MongoDB persistence for clients
 * Ensures proper creation, retrieval, and deletion of documents
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectMongo } from '../../src/db/mongo';
jest.setTimeout(15000);

const clientSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  created: Date,
  lastUpdated: Date,
}, { collection: 'test_clients' });

const Client = mongoose.model('Client', clientSchema);

describe('MongoDB Client Storage Integration', () => {
  beforeEach(async () => {
    await connectMongo();
    await Client.deleteMany({});
  });

  afterEach(async () => {
    await Client.deleteMany({});
    await mongoose.disconnect();
  });

  it('can save a client and retrieve it by ID', async () => {
    const doc = {
      id: 'c-001',
      name: 'Mongo Tester',
      email: 'mongo@example.com',
      created: new Date(),
      lastUpdated: new Date(),
    };

    await new Client(doc).save();

    const result = await Client.findOne({ id: 'c-001' }).lean();
    expect(result?.email).toBe('mongo@example.com');
    expect(result?.name).toBe('Mongo Tester');
  });

  it('can delete a client by ID', async () => {
    await new Client({
      id: 'c-002',
      name: 'To Delete',
      email: 'delete@example.com',
      created: new Date(),
      lastUpdated: new Date(),
    }).save();

    await Client.deleteOne({ id: 'c-002' });

    const check = await Client.findOne({ id: 'c-002' });
    expect(check).toBeNull();
  });
});
