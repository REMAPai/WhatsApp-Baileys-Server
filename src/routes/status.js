const { Router } = require('express');
const whatsapp = require('../whatsapp');

const router = Router();

router.get('/status', (req, res) => {
  res.json(whatsapp.getStatus());
});

module.exports = router;
