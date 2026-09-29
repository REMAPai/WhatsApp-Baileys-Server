const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./logger');
const { initDatabase } = require('./db');
const whatsapp = require('./whatsapp');

const statusRouter = require('./routes/status');
const qrRouter = require('./routes/qr');
const sendRouter = require('./routes/send');
const messagesRouter = require('./routes/messages');
const logoutRouter = require('./routes/logout');

const prioritiesRouter = require('./routes/priorities');
const threadRouter = require('./routes/thread');
const searchRouter = require('./routes/search');

const { createMcpServer } = require('./mcp');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', statusRouter);
app.use('/api', qrRouter);
app.use('/api', sendRouter);
app.use('/api', messagesRouter);
app.use('/api', logoutRouter);

app.use('/api', prioritiesRouter);
app.use('/api', threadRouter);
app.use('/api', searchRouter);

app.post('/mcp', async (req, res) => {
  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    logger.error({ err }, 'MCP request failed');
    if (!res.headersSent) {
      res.status(500).json({ error: 'MCP request failed' });
    }
  }
});

app.get('/mcp', (req, res) => {
  res.status(405).json({ error: 'Method not allowed. This MCP endpoint only accepts POST.' });
});

app.get('/', (req, res) => {
  res.json({ name: 'WhatsApp Baileys Server', status: 'running' });
});

async function main() {
  await initDatabase();
  await whatsapp.init();

  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Server started');
    console.log(`\n  WhatsApp Baileys Server running on http://localhost:${config.port}\n`);
    console.log(`  Endpoints:`);
    console.log(`    GET  /api/status   — Connection status`);
    console.log(`    GET  /api/qr       — QR code for authentication`);
    console.log(`    POST /api/send     — Send a message`);
    console.log(`    GET  /api/messages — Fetch received messages`);
    console.log(`    POST /api/logout   — Disconnect WhatsApp`);
    console.log(`    POST /mcp          — MCP connector endpoint\n`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
