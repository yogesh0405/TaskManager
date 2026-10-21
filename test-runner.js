
const fs = require('fs');
const path = require('path');
const { app } = require('./server');
const { spawn } = require('child_process');

const rootDir = __dirname;
const reportDir = path.join(rootDir, 'test-results');

fs.mkdirSync(reportDir, { recursive: true });

const tests = [
  { name: 'Smoke Test', args: ['smoke.test.js'] },
  { name: 'Asset Test', args: ['assets.test.js'] },
  { name: 'Metrics Test', args: ['metrics.test.js'] }
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function runOneTest(test, testEnv) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    console.log(`\n=== Starting ${test.name} ===`);

    const child = spawn(process.execPath, test.args, {
      cwd: rootDir,
      env: testEnv,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 30000);

    function finish(code, error = null) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (error) {
        stderr = `${stderr}\n${error.message}`.trim();
      }

      const exitCode = timedOut ? 1 : (code ?? 1);
      const success = exitCode === 0;
      const durationMs = Date.now() - startTime;

      if (timedOut) {
        stderr = `${stderr}\nTest timed out after 30 seconds.`.trim();
      }

      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr + '\n');

      console.log(
        `${test.name}: ${success ? 'PASS' : 'FAIL'} (${durationMs} ms)`
      );

      resolve({
        name: test.name,
        command: `node ${test.args.join(' ')}`,
        success,
        exitCode,
        durationMs,
        stdout,
        stderr
      });
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.once('error', (error) => {
      finish(1, error);
    });

    child.once('close', (code) => {
      finish(code);
    });
  });
}

async function runTests(testEnv) {
  const results = [];
  let totalDuration = 0;

  // Run tests sequentially to keep the output easy to follow.
  for (const test of tests) {
    const result = await runOneTest(test, testEnv);
    results.push(result);
    totalDuration += result.durationMs;
  }

  const passedCount = results.filter((result) => result.success).length;
  const failedCount = results.length - passedCount;

  return {
    results,
    passedCount,
    failedCount,
    totalDuration
  };
}

function writeReports(summary) {
  const jsonPath = path.join(reportDir, 'test-results.json');

  fs.writeFileSync(
    jsonPath,
    JSON.stringify({
      summary: {
        total: summary.results.length,
        passed: summary.passedCount,
        failed: summary.failedCount,
        durationMs: summary.totalDuration
      },
      results: summary.results
    }, null, 2)
  );

  const xmlSuites = summary.results.map((result) => {
    const name = escapeXml(result.name);
    const output = escapeXml(result.stdout);
    const errors = escapeXml(result.stderr);
    const duration = (result.durationMs / 1000).toFixed(3);

    const failure = result.success
      ? ''
      : `<failure message="${name}">${errors || output || 'Test failed'}</failure>`;

    const systemOut = output
      ? `<system-out>${output}</system-out>`
      : '';

    const systemErr = errors
      ? `<system-err>${errors}</system-err>`
      : '';

    return [
      `<testsuite name="${name}" tests="1" failures="${result.success ? 0 : 1}" errors="0" skipped="0" time="${duration}">`,
      `<testcase classname="TaskManager" name="${name}" time="${duration}">`,
      failure,
      systemOut,
      systemErr,
      '</testcase>',
      '</testsuite>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  const xmlPath = path.join(reportDir, 'test-results.xml');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites tests="${summary.results.length}" failures="${summary.failedCount}" errors="0" time="${(summary.totalDuration / 1000).toFixed(3)}">`,
    xmlSuites,
    '</testsuites>',
    ''
  ].join('\n');

  fs.writeFileSync(xmlPath, xml);

  console.log(`\nJSON report saved to ${jsonPath}`);
  console.log(`JUnit report saved to ${xmlPath}`);
}

(async () => {
  let server;

  try {
    console.log('Starting Express test server...');

    // Let Windows assign an available port.
    server = app.listen(0, '127.0.0.1');

    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const port = server.address().port;
    const appUrl = `http://127.0.0.1:${port}`;

    const testEnv = {
      ...process.env,
      PORT: String(port),
      APP_URL: appUrl
    };

    console.log(`Test server is ready at ${appUrl}`);
    console.log('Starting test cases...');

    const summary = await runTests(testEnv);

    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Total tests: ${summary.results.length}`);
    console.log(`Passed: ${summary.passedCount}`);
    console.log(`Failed: ${summary.failedCount}`);

    const allPassed =
      summary.failedCount === 0 &&
      summary.results.length === tests.length;

    console.log(allPassed ? 'Test Cases Pass' : 'Test Cases Failed');

    writeReports(summary);

    if (!allPassed) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Test runner error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (server && server.listening) {
      await new Promise((resolve) => {
        server.close(resolve);
      });

      console.log('Test server closed.');
    }
  }
})();
process.exitCode = 1;