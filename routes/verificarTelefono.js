// routes/verificarTelefono.js
const express = require('express');
const router = express.Router();
const {
    iniciarVerificacionTelefono,
    confirmarCodigoTelefono
} = require('../controllers/verificacionTelefonoController');

router.post('/', iniciarVerificacionTelefono);
router.post('/confirmar', confirmarCodigoTelefono);

module.exports = router;