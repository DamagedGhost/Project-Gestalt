const express = require('express');
const { extraerFuentes } = require('../services/emilService');
const { runPopola } = require('../services/popolaService');
const { guardarNota } = require('../services/notaService');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/emil/ingest
router.post('/ingest', requireAuth, async (req, res) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[EMIL] Nueva petición de ingestión.`);

  const { urls } = req.body || {};
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de URLs.' });
  }

  try {
    console.log(`[EMIL] Extrayendo fuentes limpias...`);
    const { fuentes, fuentesInaccesibles } = await extraerFuentes(urls);

    if (fuentes.length === 0) {
      return res.status(422).json({
        error: 'No se pudo extraer contenido válido.',
        fuentes_inaccesibles: fuentesInaccesibles,
      });
    }

    console.log(`[EMIL] Fuentes limpias extraídas: ${fuentes.length}`);

    console.log(`[EMIL] Enviando payload a Popola...`);
    const resultado = await runPopola({
      sources: fuentes,
      fuentes_inaccesibles: fuentesInaccesibles,
    });

    console.log(`[EMIL] Guardando nota en MongoDB...`);
    const notaGuardada = await guardarNota(resultado);

    console.log(`[EMIL] Pipeline completado.`);
    console.log(`${'='.repeat(60)}\n`);

    return res.status(201).json({
      message: 'Ingestión completada y guardada.',
      nota_id: notaGuardada._id,
      status: notaGuardada.status,
      titular: notaGuardada.titular_sugerido,
      fuentes_analizadas: fuentes.length,
      fuentes_inaccesibles: fuentesInaccesibles,
      resultado,
    });
  } catch (err) {
    console.error(`[EMIL] Error en pipeline: ${err.message}`);
    console.log(`${'='.repeat(60)}\n`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
