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

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', statusRouter);
app.use('/api', qrRouter);
app.use('/api', sendRouter);
app.use('/api', messagesRouter);
app.use('/api', logoutRouter);

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
    console.log(`    POST /api/logout   — Disconnect WhatsApp\n`);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
