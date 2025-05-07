const express = require('express');
const bodyParser = require('body-parser');
const { parseStringPromise } = require('xml2js');
const cors = require('cors');
const handle300Consulta = require('./xmlHandlers/handle300Consulta');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { dbRailway } = require('./db');
const { dbPlex } = require('./db');
const app = express();
app.use(express.json());

app.use(bodyParser.text({ type: 'application/xml' }));

app.use((req, res, next) => {
  console.log(`📩 Llamada entrante: ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: ['http://localhost:3000', 'https://tudominio.com']
}));


app.get('/cliente/:dni', async (req, res) => {
  const dni = req.params.dni;

  try {
    const [rows] = await dbPlex.execute(`
      SELECT CodCliente, Documento, Nombre, Email, Telefono, NroTarjeta, fidely_card, fidely_customerid, fidely_status
      FROM clientes
      WHERE Documento = ?
    `, [dni]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error al consultar cliente en Plex:', err);
    res.status(500).json({ error: 'Error al consultar cliente en Plex' });
  }
});



// 🚀 Endpoint para iniciar verificación de email
app.post('/verificar/iniciar', async (req, res) => {
  const { cod_cliente } = req.body;

  if (!cod_cliente) return res.status(400).json({ error: 'Falta cod_cliente' });

  try {
    // Buscar cliente en la base
    const [clientes] = await dbRailway.execute(
      `SELECT email FROM clientes_crm WHERE cod_cliente = ?`,
      [cod_cliente]
    );

    if (clientes.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

    const email = clientes[0].email;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido' });

    // Generar token único
    const token = crypto.randomBytes(16).toString('hex');

    // Guardar en la tabla verificaciones_email
    await dbRailway.execute(
      `INSERT INTO verificaciones_email (cod_cliente, token) VALUES (?, ?)`,
      [cod_cliente, token]
    );

    // Preparar transporte de correo
    const transporter = nodemailer.createTransport({
      service: 'gmail', // o SMTP si usás uno propio
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    const url = `https://crm-webservice-production.up.railway.app/verificar-email?token=${token}`;

    await transporter.sendMail({
      from: '"CRM Fidelización" <no-reply@empresa.com>',
      to: email,
      subject: 'Confirmación de email',
      html: `<p>Hola, por favor confirmá tu correo haciendo clic en el siguiente enlace:</p><a href="${url}">${url}</a>`
    });

    console.log(`📧 Mail enviado a ${email} con token ${token}`);
    res.json({ message: 'Mail enviado para verificación', email });

  } catch (err) {
    console.error('❌ Error al iniciar verificación:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});


app.post('/onzecrm', async (req, res) => {
  try {
    const xml = req.body;
    console.log('🔍 XML recibido:', xml);

    const parsed = await parseStringPromise(xml);
    console.log('🧠 XML parseado:', parsed);

    const codAccion = parsed?.MensajeFidelyGb?.CodAccion?.[0];
    console.log('🎯 Acción recibida:', codAccion);

    let respuestaXml;

    switch (codAccion) {
      case '300':
        respuestaXml = await handle300Consulta(parsed);
        break;
      default:
        respuestaXml = `<?xml version="1.0"?><RespuestaFidelyGb><RespCode>99</RespCode><RespMsg>Acción no soportada</RespMsg></RespuestaFidelyGb>`;
        break;
    }

    res.set('Content-Type', 'application/xml');
    res.send(respuestaXml);

  } catch (err) {
    console.error('🔥 Error al procesar XML:', err);
    res.status(500).send(`<?xml version="1.0"?><RespuestaFidelyGb><RespCode>1</RespCode><RespMsg>Error interno del servidor</RespMsg></RespuestaFidelyGb>`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Web Service escuchando en http://localhost:${PORT}/onzecrm`);
  setInterval(() => {
    console.log('🟢 App viva', new Date().toISOString());
  }, 5000);
});