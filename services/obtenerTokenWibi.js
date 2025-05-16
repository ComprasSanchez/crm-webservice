// services/obtenerTokenWibi.js

const axios = require('axios');
const { create } = require('xmlbuilder2');
const { parseStringPromise } = require('xml2js');
const https = require('https');
require('dotenv').config();

const agent = new https.Agent({ rejectUnauthorized: false });

let tokenCache = null;
let tokenExpira = null;

async function obtenerTokenWibi() {

    // Si el token existe y no expiró, devolvemos el cache
    if (tokenCache && tokenExpira && new Date() < tokenExpira) {
        return tokenCache;
    }

    // Crear el XML
    const xml = create({ version: '1.0', encoding: 'utf-8' })
        .ele('MensajeFidelyGb')
        .ele('CodAccion').txt('1').up()
        .ele('auth')
        .ele('user').txt(process.env.WIBI_USER).up()
        .ele('pass').txt(process.env.WIBI_PASS).up()
        .up()
        .end({ prettyPrint: true });

    try {
        const response = await axios.post(
            'https://api.wibi.com.ar/onzecrm/token',
            xml,
            {
                headers: {
                    'Content-Type': 'application/xml',
                    'api-key': process.env.WIBI_API_KEY
                },
                httpsAgent: agent
            }
        );

        const parsed = await parseStringPromise(response.data);
        const token = parsed?.RespuestaFidelyGb?.auth?.[0]?.token?.[0];
        const exp = parsed?.RespuestaFidelyGb?.auth?.[0]?.exp?.[0]; // "2025-05-15 15:35"

        if (!token || !exp) throw new Error('Token o expiración no encontrados');

        tokenCache = token;
        tokenExpira = new Date(exp.replace(' ', 'T')); // Convertimos a Date

        return token;

    } catch (error) {
        console.error('❌ Error al obtener token Wibi:', error.message);
        return null;
    }
}

module.exports = obtenerTokenWibi;
