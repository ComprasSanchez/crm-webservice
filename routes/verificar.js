// routes/verificar.js
const express = require('express');
const router = express.Router();
const { iniciarVerificacion, confirmarVerificacion } = require('../controllers/verificacionController');

router.post('/iniciar', iniciarVerificacion);
router.get('/email', confirmarVerificacion);

module.exports = router;
