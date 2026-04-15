const { Router } = require('express');
const whatsapp = require('../whatsapp');
const logger = require('../logger');

const router = Router();

router.post('/logout', async (req, res) => {
  const { status } = whatsapp.getStatus();
  if (status !== 'connected') {
    return res.status(400).json({ success: false, error: 'WhatsApp is not connected' });
  }

  try {
    await whatsapp.logout();
    res.json({ success: true, message: 'WhatsApp disconnected and logged out' });
  } catch (err) {
    logger.error({ err }, 'Failed to logout');
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
