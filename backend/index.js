require('dotenv').config({ path: '../.env' });
const express  = require('express');
const mongoose = require('mongoose');

const analyzeRouter = require('./routes/analyze');

const app  = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173' // puerto de Vite
}));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/select', require('./routes/select'));

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
      console.log(`[SERVER] Endpoint disponible: POST /api/analyze`);
    });

  } catch (err) {
    console.error(`[DB] Error al conectar: ${err.message}`);
    process.exit(1);
  }
}

startServer();
