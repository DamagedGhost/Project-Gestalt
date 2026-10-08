require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Usuario = require('./models/user');
const Nota = require('./models/Nota');

async function seedDatabase() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('[SEED] ✕ DB_URL no definida en .env');
    process.exit(1);
  }

  console.log('[SEED] Conectando a MongoDB Atlas...');
  try {
    await mongoose.connect(dbUrl);
    console.log(`[SEED] ✓ Conectado a la base de datos: [${mongoose.connection.name}]`);

    const defaultEmail = 'devola@gestalt.local';
    const defaultPassword = 'gestalt2026';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    let devolaUser = await Usuario.findOne({ email: defaultEmail });
    if (!devolaUser) {
      devolaUser = await Usuario.create({
        email: defaultEmail,
        password_hash: passwordHash,
        nombre: 'Devola',
        rol: 'devola',
        activo: true,
      });
      console.log(`[SEED] ✓ Usuario creado: ${devolaUser.email} (rol: ${devolaUser.rol})`);
    } else {
      devolaUser.password_hash = passwordHash;
      devolaUser.nombre = 'Devola';
      devolaUser.rol = 'devola';
      devolaUser.activo = true;
      await devolaUser.save();
      console.log(`[SEED] ✓ Usuario actualizado: ${devolaUser.email} (rol: ${devolaUser.rol})`);
    }

    // Si no hay notas publicadas en La Biblioteca, publicar una como muestra
    const publishedCount = await Nota.countDocuments({ status: 'publicada' });
    if (publishedCount === 0) {
      const notaMuestra = (await Nota.findOne({ titular_sugerido: /Ley Cholito/i })) || (await Nota.findOne());
      if (notaMuestra) {
        notaMuestra.status = 'publicada';
        notaMuestra.titular_final = notaMuestra.titular_final || notaMuestra.titular_sugerido;
        notaMuestra.fecha_publicacion = new Date();
        notaMuestra.fecha_aprobacion = new Date();
        notaMuestra.aprobado_por = devolaUser._id;
        await notaMuestra.save();
        console.log(`[SEED] ✓ Nota activada en 'La Biblioteca': "${notaMuestra.titular_final}"`);
      }
    }

    const totalNotas = await Nota.countDocuments();
    const totalPublicadas = await Nota.countDocuments({ status: 'publicada' });
    const totalPendientes = await Nota.countDocuments({ status: 'pendiente_revision' });
    const totalUsuarios = await Usuario.countDocuments();
    console.log(`[SEED] Estado actual de la base de datos:`);
    console.log(`       - Colección 'usuarios': ${totalUsuarios}`);
    console.log(`       - Colección 'notas':    ${totalNotas} (${totalPublicadas} publicadas, ${totalPendientes} pendientes)`);
    console.log(`[SEED] Credenciales disponibles para pruebas:`);
    console.log(`       - Email:    ${defaultEmail}`);
    console.log(`       - Password: ${defaultPassword}`);
    console.log('[SEED] Base de datos lista.');
  } catch (err) {
    console.error(`[SEED] ✕ Error: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[SEED] Desconectado de MongoDB.');
  }
}

seedDatabase();
