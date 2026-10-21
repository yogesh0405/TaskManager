
const path = require('path');
const fs = require('fs');
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

// Resolve the homepage from the project directory.
const indexPath = path.join(__dirname, 'index.html');

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.get('/', (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send('index.html is missing from the application directory');
  }

  res.sendFile(indexPath);
});

app.get('/index.html', (req, res) => {
  if (!fs.existsSync(indexPath)) {
    return res.status(500).send('index.html is missing from the application directory');
  }

  res.sendFile(indexPath);
});

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Task Manager listening on port ${port}`);
    console.log(`Homepage path: ${indexPath}`);
    console.log(`Homepage exists: ${fs.existsSync(indexPath)}`);
  });
}

module.exports = { app, register, httpRequestCounter };
