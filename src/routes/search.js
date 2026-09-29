const { Router } = require('express');
const db = require('../db');
const logger = require('../logger');

const router = Router();

router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: '"q" query parameter is required' });
  }

  try {
    const results = await db.searchSignals(query.trim());
    res.json({ query: query.trim(), results });
  } catch (err) {
    logger.error({ err }, 'Failed to search signals');
    res.status(500).json({ error: 'Failed to search signals' });
  }
});

module.exports = router;
