
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

      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(port);
        }
      });
    });

    server.on('error', reject);
  });
}

function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const req = http.get(url, (res) => {
        const statusCode = res.statusCode;
        res.resume();

        if (statusCode === 200) {
          resolve();
          return;
        }

        if (Date.now() - startTime >= timeoutMs) {
          reject(
            new Error(
              `Server did not return HTTP 200 from ${url}. ` +
              `Last status: ${statusCode}`
            )
          );
          return;
        }

        setTimeout(check, 200);
      });

      req.on('error', () => {
        if (Date.now() - startTime >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(check, 200);
      });

      req.setTimeout(1000, () => req.destroy());
    }

    check();
  });
}

const tests = [
  { name: 'Smoke Test', command: 'node', args: ['smoke.test.js'] },
  { name: 'Asset Test', command: 'node', args: ['assets.test.js'] },
  { name: 'Metrics Test', command: 'node', args: ['metrics.test.js'] }
];

(async () => {
  let server;
  let testEnv;
  let serverExited = false;

  try {
    const effectivePort = await getFreePort();
    const appUrl = `http://127.0.0.1:${effectivePort}`;

    const serverEnv = {
      ...process.env,
      PORT: String(effectivePort)
    };

    // Always use the URL for the server started by this test runner.
    testEnv = {
      ...serverEnv,
      APP_URL: appUrl
    };

    server = spawn(process.execPath, ['server.js'], {
      cwd: rootDir,
      env: serverEnv,
      stdio: 'ignore'
    });

    server.on('error', (error) => {
      console.error(`Application server failed to start: ${error.message}`);
    });

    server.on('exit', (code) => {
      serverExited = true;

      if (code !== 0 && code !== null) {
        console.error(`Application server exited with code ${code}`);
      }
    });

    await waitForServer(appUrl);

    if (serverExited) {
      throw new Error('Application server exited before tests could run.');
    }

    console.log(`Test server is ready at ${appUrl}`);
  } catch (error) {
    console.error(`Failed to start local test server: ${error.message}`);

    if (server && !server.killed) {
      server.kill();
    }

    process.exit(1);
  }

  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  let totalDuration = 0;

  try {
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

      const status =
        child.error || child.status === null ? 1 : child.status;

      const success = status === 0;

      if (success) {
        passedCount++;
      } else {
        failedCount++;
      }

      const entry = {
        name: test.name,
        command: `${test.command} ${test.args.join(' ')}`,
        success,
        exitCode: status,
        durationMs: duration,
        stdout,
        stderr: child.error
          ? `${stderr}\n${child.error.message}`.trim()
          : stderr
      };

      results.push(entry);

      console.log(`\n=== ${test.name} ===`);

      if (stdout) process.stdout.write(stdout);
      if (entry.stderr) process.stderr.write(entry.stderr + '\n');
    }
  } finally {
    if (server && !server.killed) {
      server.kill();
    }
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

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(summary, null, 2)
  );

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  const xmlSuites = results.map((result) => {
    const suiteName = escapeXml(result.name);
    const output = escapeXml(result.stdout);
    const errors = escapeXml(result.stderr);
    const duration = (result.durationMs / 1000).toFixed(3);

    const failureText = result.success
      ? ''
      : `<failure message="${suiteName}">${errors || output || 'Test failed'}</failure>`;

    return [
      `  <testsuite name="${suiteName}" tests="1" failures="${result.success ? 0 : 1}" errors="0" skipped="0" time="${duration}">`,
      `    <testcase classname="TaskManager" name="${suiteName}" time="${duration}">`,
      `      ${failureText}`,
      errors ? `      <system-err>${errors}</system-err>` : '',
      output ? `      <system-out>${output}</system-out>` : '',
      '    </testcase>',
      '  </testsuite>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xmlPath = path.join(reportDir, 'test-results.xml');
  const xmlTime = (totalDuration / 1000).toFixed(3);

  const junitXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites tests="${results.length}" failures="${failedCount}" errors="0" time="${xmlTime}">`,
    xmlSuites,
    '</testsuites>',
    ''
  ].join('\n');

  fs.writeFileSync(xmlPath, junitXml);

  console.log('\n========== TEST SUMMARY ==========');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(failedCount === 0 ? 'Test Cases Pass' : 'Test Cases Failed');

  console.log(`\nJSON report saved to ${jsonPath}`);
  console.log(`JUnit report saved to ${xmlPath}`);

  if (failedCount > 0) {
    process.exitCode = 1;
  }
})();
