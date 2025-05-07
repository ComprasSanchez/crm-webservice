const mysql = require('mysql2/promise');
require('dotenv').config();

// 📦 Conexión a Railway (base de clientes_crm)
const dbRailway = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
});

// 🔗 Conexión a Plex (base original)
const dbPlex = mysql.createPool({
    host: process.env.PLEX_HOST,
    port: process.env.PLEX_PORT || 3306,
    user: process.env.PLEX_USER,
    password: process.env.PLEX_PASSWORD,
    database: process.env.PLEX_DB,
});

module.exports = { dbRailway, dbPlex };
