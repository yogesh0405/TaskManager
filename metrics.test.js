const http = require('http');
const assert = require('assert');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

function fetch(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });

        req.on('error', reject);
    });
}

function readRequestCount(metrics) {
    const match = metrics.match(/^task_manager_http_requests_total\s+(\d+(?:\.\d+)?)$/m);
    assert.ok(match, 'HTTP request counter was not present in /metrics');
    return Number(match[1]);
}

(async () => {
    try {
        const beforeResponse = await fetch(`${BASE_URL}/metrics`);
        assert.strictEqual(beforeResponse.status, 200, 'Metrics endpoint should return HTTP 200');
        assert.match(
            beforeResponse.headers['content-type'],
            /text\/plain/,
            'Metrics endpoint should return Prometheus text format'
        );
        assert.match(beforeResponse.body, /^process_resident_memory_bytes\s/m);
        assert.match(beforeResponse.body, /^nodejs_heap_size_used_bytes\s/m);

        const beforeCount = readRequestCount(beforeResponse.body);
        const homepage = await fetch(`${BASE_URL}/`);
        assert.strictEqual(homepage.status, 200, 'Homepage should return HTTP 200');

        const afterResponse = await fetch(`${BASE_URL}/metrics`);
        const afterCount = readRequestCount(afterResponse.body);
        assert.ok(afterCount > beforeCount, 'HTTP request counter should increase after a page request');

        console.log('Metrics test passed');
    } catch (error) {
        console.error('Metrics test failed:', error.message);
        process.exit(1);
    }
})();