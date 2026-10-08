require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Nota = require('./models/Nota');
const Usuario = require('./models/user');

async function testConnection() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('[ERROR] DB_URL no definida en .env');
    process.exit(1);
  }

  console.log(`[TEST-DB] Conectando a MongoDB Atlas...`);
  console.log(`[TEST-DB] Host: ${dbUrl.split('@')[1] ? dbUrl.split('@')[1].split('/')[0] : 'oculto'}`);

  try {
    await mongoose.connect(dbUrl);
    console.log(`[TEST-DB] ✓ Conexión exitosa a la base de datos: [${mongoose.connection.name}]`);

    const totalNotas = await Nota.countDocuments();
    const totalUsuarios = await Usuario.countDocuments();

    console.log(`[TEST-DB] ✓ Colección 'notas': ${totalNotas} documentos`);
    console.log(`[TEST-DB] ✓ Colección 'usuarios': ${totalUsuarios} documentos`);

    if (totalNotas > 0) {
      const ultimaNota = await Nota.findOne().sort({ createdAt: -1 });
      console.log(`[TEST-DB] Última nota registrada: "${ultimaNota.titular_final || ultimaNota.titular_sugerido}" (${ultimaNota.status})`);
    }

    if (totalUsuarios > 0) {
      const usuario = await Usuario.findOne();
      console.log(`[TEST-DB] Usuario de prueba: ${usuario.email} (${usuario.rol})`);
    }

    console.log('\n[TEST-DB] Todo el sistema de base de datos está operativo y sincronizado con Mongoose.\n');
  } catch (err) {
    console.error(`[TEST-DB] ✕ Error: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();
