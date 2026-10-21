const path = require('path');
const express = require('express');
const client = require('prom-client');

const app = express();
const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: 'task_manager_http_requests_total',
  help: 'Total HTTP requests received by the Task Manager application',
  registers: [register]
});

app.use((req, res, next) => {
  if (req.path !== '/metrics') {
    httpRequestCounter.inc();
  }
  next();
});

// Serve static assets from the project directory.
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve the homepage using an explicit root directory.
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile('index.html', { root: __dirname }, (err) => {
    if (err) {
      console.error('Homepage error:', err);
      if (!res.headersSent) {
        res.status(err.statusCode || 500).send('Unable to serve homepage');
      }
    }
  });
});

// Prometheus metrics endpoint.
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).send('Unable to generate metrics');
  }
});

const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Task Manager listening on port ${port}`);
    console.log(`Homepage path: ${path.join(__dirname, 'index.html')}`);
  });
}

module.exports = { app, register, httpRequestCounter };