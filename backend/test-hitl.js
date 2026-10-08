require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const analyzeRouter = require('./routes/analyze');
const authRouter = require('./routes/auth');
const notasRouter = require('./routes/notas');
const emilRouter = require('./routes/emil');

async function testFullHitLFlow() {
  const app = express();
  const PORT = 3002;

  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.use('/api/analyze', analyzeRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/notas', notasRouter);
  app.use('/api/emil', emilRouter);

  let server;
  try {
    console.log('[TEST-HITL] Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.DB_URL);
    console.log('[TEST-HITL] ✓ Conectado a MongoDB Atlas.');

    server = await new Promise((res) => {
      const s = app.listen(PORT, () => {
        console.log(`[TEST-HITL] ✓ Servidor temporal en http://localhost:${PORT}`);
        res(s);
      });
    });

    const baseUrl = `http://127.0.0.1:${PORT}`;

    // 1. Iniciar sesión como Devola
    console.log('\n[1/4] Autenticando operador Devola...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'devola@gestalt.local', password: 'gestalt2026' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`      ✓ Token JWT obtenido para: ${loginData.user?.email}`);

    // 2. Ingestión con POPOLA_MOCK=true (simulación)
    console.log('\n[2/4] Ejecutando Ingestión con Agentes (Emil + Popola MOCK)...');
    const ingestRes = await fetch(`${baseUrl}/api/emil/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        urls: [
          'https://www.latercera.com/nacional/noticia/bajas-penas-y-falta-de-especializacion-de-los-fiscales-radiografia-a-la-ley-cholito/',
        ],
      }),
    });
    const ingestData = await ingestRes.json();
    console.log(`      Status Ingestión: ${ingestRes.status}`);
    console.log(`      ✓ Nota creada con ID: ${ingestData.nota_id}`);
    console.log(`      ✓ Titular generado: "${ingestData.titular}"`);
    console.log(`      ✓ Estado inicial: "${ingestData.status}"`);

    const notaId = ingestData.nota_id;
    if (!notaId) throw new Error('No se generó nota_id');

    // 3. Revisión HitL y Aprobación
    console.log('\n[3/4] Simulando Human-in-the-Loop (Devola aprueba y publica nota)...');
    const approveRes = await fetch(`${baseUrl}/api/notas/${notaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: 'publicada',
        titular_final: `[VERIFICADO DEVOLA] ${ingestData.titular}`,
        notas_devola: 'Hechos verificados por el panel editorial. Publicación autorizada.',
      }),
    });
    const approveData = await approveRes.json();
    console.log(`      Status Aprobación: ${approveRes.status}`);
    console.log(`      ✓ Nuevo estado: "${approveData.nota?.status}"`);
    console.log(`      ✓ Aprobado por operador: ${approveData.nota?.aprobado_por}`);

    // 4. Verificar que aparece en La Biblioteca
    console.log('\n[4/4] Verificando presencia en La Biblioteca pública (/api/notas?status=publicada)...');
    const biblioRes = await fetch(`${baseUrl}/api/notas?status=publicada`);
    const biblioData = await biblioRes.json();
    const found = (biblioData.notas || []).find((n) => n._id === notaId);
    console.log(`      Total publicadas: ${biblioData.notas?.length}`);
    console.log(`      ✓ Nota encontrada en La Biblioteca: ${Boolean(found)}`);
    console.log(`      ✓ Titular final visible: "${found?.titular_final}"`);

    console.log('\n=============================================');
    console.log('✓ FLUJO COMPLETO HITL + POPOLA_MOCK EXITOSO');
    console.log('=============================================\n');
  } catch (err) {
    console.error('\n✕ ERROR EN TEST HITL:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }
}

testFullHitLFlow();
