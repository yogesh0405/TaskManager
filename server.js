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

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
});

const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Task Manager listening on port ${port}`);
    });
}

module.exports = { app, register, httpRequestCounter };