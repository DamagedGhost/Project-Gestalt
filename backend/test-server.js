require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const analyzeRouter = require('./routes/analyze');
const authRouter = require('./routes/auth');
const notasRouter = require('./routes/notas');
const emilRouter = require('./routes/emil');

async function runSmokeTests() {
  const app = express();
  const PORT = 3001; // Usar puerto alternativo para test aislado

  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api/analyze', analyzeRouter);
  app.use('/api/select', require('./routes/select'));
  app.use('/api/auth', authRouter);
  app.use('/api/notas', notasRouter);
  app.use('/api/emil', emilRouter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado' });
  });

  let server;
  try {
    console.log('[TEST-SMOKE] Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.DB_URL);
    console.log('[TEST-SMOKE] ✓ MongoDB conectado.');

    server = await new Promise((resolve) => {
      const s = app.listen(PORT, () => {
        console.log(`[TEST-SMOKE] ✓ Servidor escuchando en http://localhost:${PORT}`);
        resolve(s);
      });
    });

    const baseUrl = `http://127.0.0.1:${PORT}`;

    // 1. Health check
    console.log('\n[1/5] Probando GET /health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    console.log(`      Status: ${healthRes.status}, Body:`, healthJson);
    if (healthRes.status !== 200 || healthJson.status !== 'ok') throw new Error('Health check falló');

    // 2. Swagger UI
    console.log('\n[2/5] Probando GET /api-docs/...');
    const swaggerRes = await fetch(`${baseUrl}/api-docs/`);
    const swaggerHtml = await swaggerRes.text();
    console.log(`      Status: ${swaggerRes.status}, Contiene Swagger UI: ${swaggerHtml.includes('swagger-ui')}`);
    if (swaggerRes.status !== 200 || !swaggerHtml.includes('swagger-ui')) throw new Error('Swagger UI no respondió correctamente');

    // 3. Login
    console.log('\n[3/5] Probando POST /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'devola@gestalt.local', password: 'gestalt2026' }),
    });
    const loginJson = await loginRes.json();
    console.log(`      Status: ${loginRes.status}, Token generado: ${Boolean(loginJson.token)}, Usuario: ${loginJson.user?.email}`);
    if (loginRes.status !== 200 || !loginJson.token) throw new Error('Login falló');

    const token = loginJson.token;

    // 4. Auth /me con Bearer token
    console.log('\n[4/5] Probando GET /api/auth/me con Bearer Token...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const meJson = await meRes.json();
    console.log(`      Status: ${meRes.status}, Usuario autenticado: ${meJson.user?.email} (${meJson.user?.rol})`);
    if (meRes.status !== 200 || meJson.user?.email !== 'devola@gestalt.local') throw new Error('Autenticación Bearer falló');

    // 5. Notas públicas
    console.log('\n[5/5] Probando GET /api/notas...');
    const notasRes = await fetch(`${baseUrl}/api/notas`);
    const notasJson = await notasRes.json();
    console.log(`      Status: ${notasRes.status}, Total notas recuperadas: ${notasJson.notas?.length}`);
    if (notasRes.status !== 200 || !Array.isArray(notasJson.notas)) throw new Error('GET /api/notas falló');

    console.log('\n=========================================');
    console.log('✓ TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON');
    console.log('=========================================\n');
  } catch (err) {
    console.error('\n✕ ERROR EN PRUEBAS:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('[TEST-SMOKE] Servidor de pruebas cerrado.');
    }
    await mongoose.disconnect();
    console.log('[TEST-SMOKE] MongoDB desconectado.');
  }
}

runSmokeTests();
