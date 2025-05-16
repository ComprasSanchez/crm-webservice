// controllers/verificacionController.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { dbRailway } = require('../db');

async function iniciarVerificacion(req, res) {
    const { cod_cliente, email, telefono, nombre } = req.body;

    if (!cod_cliente) return res.status(400).json({ error: 'Falta cod_cliente' });
    console.log(req.body);
    try {

        /// 🛑 Verificar si ya está verificado
        const [verificado] = await dbRailway.execute(`
      SELECT verificado FROM verificaciones_email
      WHERE cod_cliente = ? ORDER BY fecha_creacion DESC LIMIT 1
  `, [cod_cliente]);

        if (verificado.length > 0 && verificado[0].verificado === 1) {
            return res.status(200).json({ message: '⚠️ Este email ya fue verificado' });
        }

        // 🟠 Buscar si ya hay una verificación pendiente
        const [verifs] = await dbRailway.execute(
            `SELECT id FROM verificaciones_email WHERE cod_cliente = ? AND verificado = 0`,
            [cod_cliente]
        );

        // Generar nuevo token
        const token = require('crypto').randomBytes(16).toString('hex');

        if (verifs.length > 0) {
            // Ya existe una solicitud → actualizar token y fecha
            await dbRailway.execute(
                `UPDATE verificaciones_email SET token = ?, fecha_creacion = NOW() WHERE id = ?`,
                [token, verifs[0].id]
            );
        } else {
            // No existe solicitud previa → insertar nueva
            await dbRailway.execute(
                `INSERT INTO verificaciones_email (cod_cliente, token) VALUES (?, ?)`,
                [cod_cliente, token]
            );
        }

        // Enviar mail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        const url = `https://crm-webservice-production.up.railway.app/verificar-email?token=${token}`;

        await transporter.sendMail({
            from: '"Farmacia Sanchez Antoniolli" <no-reply@empresa.com>',
            to: email,
            subject: 'Confirmación de email',
            html: `
        <p>Hola ${nombre?.split(',')[1]?.trim() || 'cliente'} 👋</p>
        <p>En tu visita a nuestra sucursal, revisamos y actualizamos tus datos de contacto:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Teléfono:</strong> ${telefono || 'Sin registrar'}</li>
        </ul>
        <p style="text-align: center;">

        <p style="text-align: center; margin-top: 20px;">
          <a href="${url}"
            style="background-color: #2e7d32; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ✅ Confirmar mi correo electrónico
          </a>
        </p>

        <p style="margin-top: 30px;">Si detectás algún error, podés corregirlo en tu próxima visita o comunicarte con nuestro equipo de atención.</p>

        <p style="font-size: 0.9em; color: #666;">Este mensaje fue generado automáticamente. No respondas a este correo.</p>
      `

        });

        console.log(`📧 Mail enviado a ${email} con token ${token}`);
        res.json({ message: 'Mail enviado para verificación', email });

    } catch (err) {
        console.error('❌ Error al iniciar verificación:', err);
        res.status(500).json({ error: 'Error interno' });
    }
}


async function confirmarVerificacion(req, res) {
    const token = req.query.token;

    if (!token) {
        return res.status(400).send(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1>❌ Token faltante</h1>
          <p>El enlace que usaste no es válido.</p>
        </body>
      </html>
    `);
    }

    try {
        const [rows] = await dbRailway.execute(
            `SELECT * FROM verificaciones_email WHERE token = ?`,
            [token]
        );
        const [clienteData] = await dbRailway.execute(`
  SELECT c.email, c.nro_tarjeta
  FROM verificaciones_email v
  JOIN clientes_crm c ON v.cod_cliente = c.cod_cliente
  WHERE v.token = ?
`, [token]);

        if (clienteData.length > 0) {
            const { email, nro_tarjeta } = clienteData[0];

            const { create } = require('xmlbuilder2');
            const xml = create({ version: '1.0' })
                .ele('MensajeFidelyGb')
                .ele('Proveedor').txt('FIDELYGB').up()
                .ele('CodAccion').txt('301').up()
                .ele('NroTarjeta').txt(nro_tarjeta).up()
                .ele('Email').txt(email).up()
                .end({ prettyPrint: true });

            console.log('📦 XML generado:\n', xml);

            // Enviar a tu propio endpoint /onzecrm
            const axios = require('axios');
            try {
                const respuesta = await axios.post('http://localhost:3000/onzecrm', xml, {
                    headers: { 'Content-Type': 'application/xml' }
                });
                console.log('📨 XML enviado, respuesta:', respuesta.status);
            } catch (error) {
                console.error('❌ Error al enviar XML:', error.message);
            }
        }


        if (rows.length === 0) {
            return res.status(404).send(`
        <html>
          <head><title>Token inválido</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>❌ Enlace inválido</h1>
            <p>Este enlace ya fue usado o no es correcto.</p>
          </body>
        </html>
      `);
        }

        const verificacion = rows[0];
        if (verificacion.verificado) {
            return res.send(`
        <html>
          <head><title>Ya verificado</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>⚠️ Ya está verificado</h1>
            <p>Este correo ya fue confirmado previamente.</p>
          </body>
        </html>
      `);
        }

        await dbRailway.execute(
            `UPDATE verificaciones_email SET verificado = 1, fecha_verificacion = NOW() WHERE token = ?`,
            [token]
        );

        res.send(`
      <html>
        <head><title>Email verificado</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1>✅ ¡Gracias!</h1>
          <p>Tu email fue verificado correctamente.</p>
        </body>
      </html>
    `);
    } catch (err) {
        console.error('❌ Error al verificar:', err);
        res.status(500).send(`
      <html>
        <head><title>Error interno</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1>❌ Error del servidor</h1>
          <p>Ocurrió un problema al procesar tu verificación.</p>
        </body>
      </html>
    `);
    }
}

module.exports = {
    iniciarVerificacion,
    confirmarVerificacion
};