const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Nota     = require('../models/Nota');
const { listarNotas } = require('../services/notaService');

// GET /api/select
router.get('/', async (req, res) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[SELECT] Nueva petición para listar notas.`);
    try {
        const notas = await listarNotas();
        console.log(`[SELECT] Notas listadas: ${notas.length}`);
        console.log(`${'='.repeat(60)}\n`);
        return res.status(200).json({ notas });
    } catch (err) {
        console.error(`[SELECT] Error al listar notas: ${err.message}`);
        console.log(`${'='.repeat(60)}\n`);
        return res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[SELECT] Nueva petición para obtener nota por ID: ${req.params.id}`);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const nota = await Nota.findById(id);
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada.' });
    console.log(`[SELECT] Nota encontrada: ${nota.titular_sugerido}`);
    console.log(`${'='.repeat(60)}\n`);
    return res.status(200).json({ nota });
  } catch (err) {
    console.error(`[SELECT] Error al obtener nota por ID: ${err.message}`);
    console.log(`${'='.repeat(60)}\n`);

    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;