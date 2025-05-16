
// routes/onzecrm.js
const express = require('express');
const router = express.Router();
const { procesarXML } = require('../controllers/onzecrmController');

router.post('/', procesarXML);

module.exports = router;