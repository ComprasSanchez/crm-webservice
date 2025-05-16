// services/tokenWibi.js

const obtenerTokenWibi = require('./obtenerTokenWibi');

(async () => {
    const token = await obtenerTokenWibi();
    console.log('🎟️ Token Wibi:', token);
})();
