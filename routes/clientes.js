const express = require('express');
const router = express.Router();
const { buscarClientePorDNI } = require('../controllers/clienteController');

router.get('/:dni', buscarClientePorDNI);

module.exports = router;
