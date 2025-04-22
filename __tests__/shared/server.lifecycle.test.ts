// __tests__/shared/server.lifecycle.test.ts

import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';

describe('Server Lifecycle', () => {
  let serverProcess: ChildProcessWithoutNullStreams;

  beforeAll((done) => {
    const serverPath = path.resolve(__dirname, '../../src/server.ts');
    serverProcess = spawn('ts-node', [serverPath]);

    // Ensure stdout is not null before attaching the listener
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server is running')) {
          done();
        }
      });
    }

    // Ensure stderr is not null before attaching the listener
    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error(`stderr: ${errorOutput}`);
      });
    }

    serverProcess.on('error', (err) => {
      console.error(`Failed to start server: ${err}`);
    });
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should keep the server running without errors', () => {
    expect(serverProcess.killed).toBe(false);
  });
});
