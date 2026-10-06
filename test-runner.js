const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn, spawnSync } = require('child_process');

const rootDir = __dirname;
const reportDir = path.join(rootDir, 'test-results');
fs.mkdirSync(reportDir, { recursive: true });

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

const serverPort = 8080;

function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(check, 200);
      });

      req.on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(check, 200);
      });

      req.setTimeout(1000, () => req.destroy());
    };

    check();
  });
}

const tests = [
  { name: 'Smoke Test', command: 'node', args: ['smoke.test.js'] },
  { name: 'Asset Test', command: 'node', args: ['assets.test.js'] }
];

(async () => {
  let effectivePort = serverPort;
  let server;
  let testEnv;

  try {
    effectivePort = await getFreePort();
    server = spawn('python3', ['-m', 'http.server', String(effectivePort), '--directory', rootDir], {
      cwd: rootDir,
      stdio: 'ignore',
      detached: true
    });
    server.unref();

    testEnv = {
      ...process.env,
      APP_URL: process.env.APP_URL || `http://localhost:${effectivePort}`
    };

    await waitForServer(testEnv.APP_URL);
  } catch (error) {
    console.error(`Failed to start local test server: ${error.message}`);
    process.exit(1);
  }

  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  let totalDuration = 0;

  for (const test of tests) {
    const startTime = Date.now();
    const child = spawnSync(test.command, test.args, {
      cwd: rootDir,
      encoding: 'utf8',
      env: testEnv
    });

    const duration = Date.now() - startTime;
    totalDuration += duration;

    const stdout = child.stdout || '';
    const stderr = child.stderr || '';
    const status = child.status === null ? 1 : child.status;
    const success = status === 0;

    if (success) passedCount += 1;
    else failedCount += 1;

    const entry = {
      name: test.name,
      command: `${test.command} ${test.args.join(' ')}`,
      success,
      exitCode: status,
      durationMs: duration,
      stdout,
      stderr
    };

    results.push(entry);

    console.log(`\n=== ${test.name} ===`);
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  }

  const summary = {
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      durationMs: totalDuration
    },
    results
  };

  const jsonPath = path.join(reportDir, 'test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const xmlTests = results.length;
  const xmlFailures = failedCount;
  const xmlTime = (totalDuration / 1000).toFixed(3);
  const xmlSuites = results
    .map((result) => {
      const suiteName = result.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const stdoutEscaped = (result.stdout || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const stderrEscaped = (result.stderr || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const failureText = result.success ? '' : `<failure message="${result.name}">${stderrEscaped || stdoutEscaped || 'Test failed'}</failure>`;
      return `  <testsuite name="${suiteName}" tests="1" failures="${result.success ? 0 : 1}" errors="0" skipped="0" time="${(result.durationMs / 1000).toFixed(3)}">\n    <testcase classname="TaskManager" name="${suiteName}" time="${(result.durationMs / 1000).toFixed(3)}">${failureText}\n${stderrEscaped ? `      <system-err>${stderrEscaped}</system-err>` : ''}\n${stdoutEscaped ? `      <system-out>${stdoutEscaped}</system-out>` : ''}\n    </testcase>\n  </testsuite>`;
    })
    .join('\n');

  const summaryLine = failedCount === 0 ? 'Test Cases Pass' : 'Test Cases Failed';
  console.log(`\n${summaryLine}`);

  const xmlPath = path.join(reportDir, 'test-results.xml');
  const junitXml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${xmlTests}" failures="${xmlFailures}" errors="0" time="${xmlTime}">\n${xmlSuites}\n</testsuites>\n`;
  fs.writeFileSync(xmlPath, junitXml);

  console.log(`\nJSON report saved to ${jsonPath}`);
  console.log(`JUnit report saved to ${xmlPath}`);

  try {
    server.kill('SIGTERM');
  } catch (error) {
    // Ignore cleanup failure.
  }

  if (failedCount > 0) {
    process.exit(1);
  }
})();
