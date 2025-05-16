// controllers/onzecrmController.js
const { parseStringPromise } = require('xml2js');
const handle300Consulta = require('../xmlHandlers/handle300Consulta');

async function procesarXML(req, res) {
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
}

module.exports = { procesarXML };
