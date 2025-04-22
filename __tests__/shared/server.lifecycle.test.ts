// @capability:server.lifecycle
// @capability:infra.healthcheck
// @capability:server.startup.resilience

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

describe('Server Lifecycle', () => {
  let serverProcess: ReturnType<typeof spawn>;

  beforeAll((done) => {
    // Start the server process
    serverProcess = spawn('npm', ['run', 'server'], {
      cwd: path.resolve(__dirname, '../../'), // Adjust the path as needed
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Wait for the server to start
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server is running')) {
        done();
      }
    });

    // Handle server errors
    serverProcess.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error(`Failed to start server: ${error}`);
    });
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should respond to HTTP requests', (done) => {
    http.get('http://localhost:3000/health', (res) => {
      expect(res.statusCode).toBe(200);
      done();
    }).on('error', (err) => {
      done.fail(`HTTP request failed: ${err.message}`);
    });
  });
});
