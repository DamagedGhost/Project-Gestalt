const express  = require('express');
const router   = express.Router();
const { runPopola }   = require('../services/popolaService');
const { guardarNota } = require('../services/notaService');

// POST /api/analyze
router.post('/', async (req, res) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[ANALYZE] Nueva petición recibida`);
  console.log(`[ANALYZE] Body: ${JSON.stringify(req.body)}`);

  const { urls } = req.body;

  // Validación
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    console.warn(`[ANALYZE] Validación fallida: urls inválidas.`);
    return res.status(400).json({ error: 'Se requiere un array de URLs.' });
  }
  console.log(`[ANALYZE] URLs validadas: ${urls.length} URL(s)`);

  try {
    // 1. Llamar a Popola
    console.log(`[ANALYZE] Paso 1 — Llamando a Popola...`);
    const resultado = await runPopola(urls);
    console.log(`[ANALYZE] Paso 1 — Popola completado OK.`);

    // 2. Guardar en MongoDB
    console.log(`[ANALYZE] Paso 2 — Guardando en MongoDB...`);
    const notaGuardada = await guardarNota(resultado);
    console.log(`[ANALYZE] Paso 2 — Guardado OK.`);

    // 3. Responder
    console.log(`[ANALYZE] Paso 3 — Enviando respuesta al cliente.`);
    console.log(`${'='.repeat(60)}\n`);

    return res.status(201).json({
      message:  'Análisis completado y guardado.',
      nota_id:  notaGuardada._id,
      status:   notaGuardada.status,
      titular:  notaGuardada.titular_sugerido,
      resultado,
    });

  } catch (err) {
    console.error(`[ANALYZE] Error en el pipeline: ${err.message}`);
    console.log(`${'='.repeat(60)}\n`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
