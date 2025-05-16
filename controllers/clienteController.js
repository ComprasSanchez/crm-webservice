const { dbPlex } = require('../db');

async function buscarClientePorDNI(req, res) {
    const dni = req.params.dni;

    try {
        const [rows] = await dbPlex.execute(`
      SELECT CodCliente, Documento, Nombre, Email, Telefono, NroTarjeta, fidely_card, fidely_customerid, fidely_status
      FROM clientes
      WHERE Documento = ?`, [dni]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('❌ Error al consultar cliente en Plex:', err);
        res.status(500).json({ error: 'Error al consultar cliente en Plex' });
    }
}

module.exports = { buscarClientePorDNI };
