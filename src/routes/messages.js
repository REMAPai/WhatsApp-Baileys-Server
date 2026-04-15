const { Router } = require('express');
const db = require('../db');
const logger = require('../logger');

const router = Router();

router.get('/messages', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const [messages, count] = await Promise.all([
      db.getMessages({ limit, offset }),
      db.getMessageCount(),
    ]);

    res.json({ count, messages });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch messages');
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
