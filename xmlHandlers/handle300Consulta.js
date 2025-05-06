const pool = require('../db');
const builder = require('xmlbuilder2');

async function handle300Consulta(parsedXml) {
  const dni = parsedXml?.MensajeFidelyGb?.NroTarjeta?.[0];

  if (!dni) {
    return buildXmlError('DNI no proporcionado');
  }

  try {
    const [rows] = await pool.query('SELECT * FROM clientes_crm WHERE documento = ?', [dni]);
    if (rows.length === 0) {
      return buildXmlError('Cliente no encontrado');
    }

    const cliente = rows[0];

    const xml = builder.create()
      .ele('RespuestaFidelyGb')
        .ele('RespCode').txt('0').up()
        .ele('RespMsg').txt('Consulta exitosa').up()
        .ele('Cliente')
          .ele('IDClienteFidely').txt(cliente.id_cliente_fidely || '').up()
          .ele('Campania').txt('DEFAULT').up()
          .ele('Nombre').txt(cliente.nombre || '').up()
          .ele('Apellido').txt(cliente.apellido || '').up()
          .ele('Dni').txt(cliente.documento || '').up()
          .ele('Telefono').txt(cliente.telefono || '').up()
          .ele('Email').txt(cliente.email || '').up()
          .ele('NroTarjeta').txt(cliente.nro_tarjeta || '').up()
        .up()
      .end({ prettyPrint: true });

    return xml;

  } catch (err) {
    console.error('Error en consulta:', err);
    return buildXmlError('Error interno del servidor');
  }
}

function buildXmlError(msg) {
  return builder.create()
    .ele('RespuestaFidelyGb')
      .ele('RespCode').txt('1').up()
      .ele('RespMsg').txt(msg).up()
    .end({ prettyPrint: true });
}

module.exports = handle300Consulta;