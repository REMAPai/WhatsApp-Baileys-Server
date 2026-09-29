const { Router } = require('express');
const db = require('../db');
const logger = require('../logger');

const router = Router();

router.get('/priorities', async (req, res) => {
  try {
    const priorities = await db.getTodayPriorities();
    res.json({ date: new Date().toISOString().slice(0, 10), priorities });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch priorities');
    res.status(500).json({ error: 'Failed to fetch priorities' });
  }
});

module.exports = router;
