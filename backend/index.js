require('dotenv').config({ path: '../.env' });
const express  = require('express');
const mongoose = require('mongoose');

const analyzeRouter = require('./routes/analyze');
const authRouter = require('./routes/auth');
const notasRouter = require('./routes/notas');
const emilRouter = require('./routes/emil');

const app  = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// ─── Documentación Swagger ────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/select', require('./routes/select'));
app.use('/api/auth', authRouter);
app.use('/api/notas', notasRouter);
app.use('/api/emil', emilRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado' });
});

// ─── Conexión a MongoDB ───────────────────────────────────────────────────────
async function startServer() {
  console.log(`[DB] Conectando a MongoDB...`);

  try {
    await mongoose.connect(process.env.DB_URL);
    console.log(`[DB] Conexión exitosa a MongoDB Atlas.`);

    app.listen(PORT, () => {
      console.log(`[SERVER] Escuchando en http://localhost:${PORT}`);
      console.log(`[SERVER] Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
    });

  } catch (err) {
    console.error(`[DB] Error al conectar: ${err.message}`);
    process.exit(1);
  }
}

startServer();
