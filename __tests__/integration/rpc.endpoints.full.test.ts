import path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { TestClient } from '../../utils/testClient'; // Assume you move it to utils/testClient.ts

let serverProcess: ChildProcessWithoutNullStreams;
let client: TestClient;

beforeAll((done) => {
  const serverPath = path.resolve(__dirname, '../../src/server.ts');
  serverProcess = spawn('ts-node', [serverPath]);

  serverProcess.stdout?.on('data', (data) => {
    if (data.toString().includes('Server is running')) {
      client = new TestClient('ws://localhost:7885');
      client.connect().then(done);
    }
  });

  serverProcess.stderr?.on('data', (err) => {
    console.error(`[stderr]: ${err}`);
  });
});

afterAll(() => {
  client.close();
  serverProcess.kill();
});

describe('Full RPC Endpoint Coverage', () => {
  const testClientId = 'test-id';

  it('calls ping()', async () => {
    const result = await client.call('ping');
    expect(result).toBe('pong');
  });

  it('creates a client with createClient()', async () => {
    const newClient = await client.call('createClient', {
      id: testClientId,
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(newClient).toMatchObject({ id: testClientId, email: 'test@example.com' });
  });

  it('fetches client with getClient()', async () => {
    const fetched = await client.call('getClient', testClientId);
    expect(fetched).toHaveProperty('email', 'test@example.com');
  });

  it('updates client with updateClientData()', async () => {
    await client.call('updateClientData', [testClientId, { name: 'Updated Name' }]);
    const updated = await client.call('getClient', testClientId);
    expect(updated).toHaveProperty('name', 'Updated Name');
  });

  it('checks readiness with getClientReadiness()', async () => {
    const readiness = await client.call('getClientReadiness', [testClientId, 'mock-service']);
    expect(readiness).toHaveProperty('ready');
  });

  it('sends message with sendMessage()', async () => {
    const response = await client.call('sendMessage', { clientId: testClientId, message: 'hello' });
    expect(response).toBe('queued');
  });

  it('deletes client with deleteClient()', async () => {
    await client.call('deleteClient', testClientId);
    const fetched = await client.call('getClient', testClientId);
    expect(fetched).toBeNull();
  });
});
