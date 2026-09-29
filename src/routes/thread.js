const { Router } = require('express');
const db = require('../db');
const logger = require('../logger');

const router = Router();

router.get('/thread/:remoteJid', async (req, res) => {
  try {
    const messages = await db.getThreadSummary(req.params.remoteJid);
    res.json({ remoteJid: req.params.remoteJid, messages });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch thread summary');
    res.status(500).json({ error: 'Failed to fetch thread summary' });
  }
});

module.exports = router;
