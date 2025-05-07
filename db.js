const mysql = require('mysql2/promise');
require('dotenv').config();

const dbRailway = mysql.createPool({
    host: process.env.RAILWAY_HOST,
    port: process.env.RAILWAY_PORT || 3306,
    user: process.env.RAILWAY_USER,
    password: process.env.RAILWAY_PASSWORD,
    database: process.env.RAILWAY_DB,
});

const dbPlex = mysql.createPool({
    host: process.env.PLEX_HOST,
    port: process.env.PLEX_PORT || 3306,
    user: process.env.PLEX_USER,
    password: process.env.PLEX_PASSWORD,
    database: process.env.PLEX_DB,
});

module.exports = { dbRailway, dbPlex };
