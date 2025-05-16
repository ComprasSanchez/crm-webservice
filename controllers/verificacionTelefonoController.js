
// controllers/verificacionTelefonoController.js
const { dbRailway } = require('../db');

function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function iniciarVerificacionTelefono(req, res) {
    const { cod_cliente, telefono } = req.body;
    if (!cod_cliente || !telefono) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    const codigo = generarCodigo();

    try {
        await dbRailway.execute(
            `INSERT INTO verificaciones_telefono (cod_cliente, telefono, codigo) VALUES (?, ?, ?)`,
            [cod_cliente, telefono, codigo]
        );

        // Simulación de envío por WhatsApp o SMS
        console.log(`📲 Código de verificación ${codigo} enviado a ${telefono}`);

        res.json({ message: 'Código enviado al cliente' });
    } catch (err) {
        console.error('❌ Error al iniciar verificación de teléfono:', err);
        res.status(500).json({ error: 'Error interno' });
    }
}

async function confirmarCodigoTelefono(req, res) {
    const { cod_cliente, codigo } = req.body;

    if (!cod_cliente || !codigo) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    try {
        const [rows] = await dbRailway.execute(
            `SELECT * FROM verificaciones_telefono WHERE cod_cliente = ? AND codigo = ? AND verificado = 0 ORDER BY fecha_creacion DESC LIMIT 1`,
            [cod_cliente, codigo]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Código incorrecto o ya verificado' });
        }

        await dbRailway.execute(
            `UPDATE verificaciones_telefono SET verificado = 1, fecha_verificacion = NOW() WHERE id = ?`,
            [rows[0].id]
        );

        res.json({ message: '✅ Teléfono verificado correctamente' });
    } catch (err) {
        console.error('❌ Error al confirmar código:', err);
        res.status(500).json({ error: 'Error interno' });
    }
}

module.exports = {
    iniciarVerificacionTelefono,
    confirmarCodigoTelefono
};
