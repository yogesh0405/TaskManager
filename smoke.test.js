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

    const html = res.body;
    const lowerHtml = html.toLowerCase();

    assert.ok(html.includes('<!doctype html') || html.includes('<html'), 'Homepage HTML response is invalid');

    const requiredContent = [
      'Student Task Manager',
      'Task Manager',
      'My Tasks',
      'Study Plan',
      'Completed',
      'Calendar',
      'Profile'
    ];

    requiredContent.forEach((text) => {
      assert.ok(lowerHtml.includes(text.toLowerCase()), `Homepage missing expected text: ${text}`);
    });

    const requiredIds = [
      'tasksList',
      'totalTasks',
      'activeTasks',
      'completedTasks',
      'nextTaskTitle'
    ];

    requiredIds.forEach((id) => {
      assert.ok(html.includes(`id="${id}"`), `Homepage missing required element: ${id}`);
    });

    console.log('Test Cases Pass');
  } catch (error) {
    console.error('Smoke test failed:', error.message);
    process.exit(1);
  }
})();
