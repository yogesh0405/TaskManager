const http = require('http');
const assert = require('assert');

const BASE_URL = process.env.APP_URL || 'http://localhost:80';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
  });
}

(async () => {
  try {
    const res = await fetch(BASE_URL);
    assert.strictEqual(res.status, 200, `Expected 200 from ${BASE_URL}, got ${res.status}`);

    const html = res.body.toLowerCase();
    assert.ok(html.includes('<html') || html.includes('<!doctype html'), 'Homepage HTML response is invalid');
    assert.ok(html.includes('task') || html.length > 0, 'Homepage did not return expected content');

    console.log('Smoke test passed');
  } catch (error) {
    console.error('Smoke test failed:', error.message);
    process.exit(1);
  }
})();
