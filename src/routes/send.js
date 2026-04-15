const { Router } = require('express');
const whatsapp = require('../whatsapp');
const logger = require('../logger');

const router = Router();

router.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ success: false, error: '"phone" is required' });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: '"message" is required' });
  }

  const { status } = whatsapp.getStatus();
  if (status !== 'connected') {
    return res.status(503).json({ success: false, error: 'WhatsApp is not connected' });
  }

  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const result = await whatsapp.sendMessage(cleanPhone, { text: message.trim() });

    res.json({
      success: true,
      messageId: result?.key?.id || null,
      jid: `${cleanPhone}@s.whatsapp.net`,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to send message');
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
