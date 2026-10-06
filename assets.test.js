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
    const assetChecks = [
      '/css/styles.css',
      '/css/calendar.css',
      '/css/profile.css',
      '/css/studyplan.css',
      '/js/app.js',
      '/js/calendar.js',
      '/js/completed.js',
      '/js/nav.js',
      '/js/profile.js',
      '/js/studyplan.js',
      '/index.html'
    ];

    const requiredAssetMarkers = {
      '/css/styles.css': ['.app-shell', '.sidebar', '.nav-link'],
      '/js/app.js': ['renderTasks', 'calculateStats', 'window.taskManagerTasks'],
      '/js/nav.js': ['allNavLinks', 'window.pageController', 'selectPage'],
      '/js/calendar.js': ['calendarController', 'switchView', 'renderSelectedDate'],
      '/js/completed.js': ['completedController', 'render', 'switchView']
    };

    for (const path of assetChecks) {
      const res = await fetch(`${BASE_URL}${path}`);
      assert.strictEqual(res.status, 200, `Asset missing: ${path} -> ${res.status}`);
      assert.ok(res.body.length > 0, `Asset empty: ${path}`);

      const markers = requiredAssetMarkers[path];
      if (markers) {
        for (const marker of markers) {
          assert.ok(res.body.includes(marker), `Asset missing expected marker '${marker}' in ${path}`);
        }
      }
    }

    console.log('Test Cases Pass');
  } catch (error) {
    console.error('Asset test failed:', error.message);
    process.exit(1);
  }
})();
