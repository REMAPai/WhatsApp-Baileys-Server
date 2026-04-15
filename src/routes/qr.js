const { Router } = require('express');
const whatsapp = require('../whatsapp');

const router = Router();

router.get('/qr', (req, res) => {
  const { status, user } = whatsapp.getStatus();
  const qr = whatsapp.getQrBase64();

  if (status === 'connected') {
    return res.json({ message: 'Already connected', user });
  }

  if (!qr) {
    return res.status(202).json({ message: 'QR code not yet generated. Waiting for WhatsApp...' });
  }

  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');

  if (acceptsHtml) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp QR Code</title>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0f0f0; }
          img { border: 8px solid white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          p { color: #666; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h2>Scan with WhatsApp</h2>
        <img src="${qr}" alt="QR Code" />
        <p>This page refreshes every 5 seconds</p>
      </body>
      </html>
    `);
  }

  res.json({ qr });
});

module.exports = router;
