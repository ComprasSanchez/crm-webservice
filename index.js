const express = require('express');
const bodyParser = require('body-parser');
const { parseStringPromise } = require('xml2js');
const handle300Consulta = require('./xmlHandlers/handle300Consulta');
require('dotenv').config();

const app = express();
app.use(bodyParser.text({ type: 'application/xml' }));

app.use((req, res, next) => {
  console.log(`📩 Llamada entrante: ${req.method} ${req.url}`);
  next();
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