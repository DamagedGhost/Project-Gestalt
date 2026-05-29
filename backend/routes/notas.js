const express = require('express');
const mongoose = require('mongoose');
const Nota = require('../models/Nota');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function buildFilter(query) {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.tag) {
    filter.tags = query.tag;
  }
  if (query.search) {
    const search = query.search.trim();
    if (search) {
      filter.$or = [
        { titular_sugerido: { $regex: search, $options: 'i' } },
        { titular_final: { $regex: search, $options: 'i' } },
      ];
    }
  }
  return filter;
}

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 20;
  return Math.min(Math.max(parsed, 1), 50);
}

// GET /api/notas
router.get('/', async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const limit = parseLimit(req.query.limit);
    const skip = Number.parseInt(req.query.skip || '0', 10) || 0;

    const notas = await Nota.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ notas });
  } catch (err) {
    console.error(`[NOTAS] Error al listar notas: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/notas/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const nota = await Nota.findById(id);
    if (!nota) {
      return res.status(404).json({ error: 'Nota no encontrada.' });
    }
    return res.status(200).json({ nota });
  } catch (err) {
    console.error(`[NOTAS] Error al obtener nota: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/notas
router.post('/', async (req, res) => {
  const payload = req.body?.nota || req.body;
  if (!payload || !payload.titular_sugerido || !payload.noticia_final) {
    return res.status(400).json({
      error: 'titular_sugerido y noticia_final son obligatorios.',
    });
  }

  try {
    const nueva = await Nota.create({
      ...payload,
      status: payload.status || 'pendiente_revision',
    });
    return res.status(201).json({ nota: nueva });
  } catch (err) {
    console.error(`[NOTAS] Error al crear nota: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/notas/:id (protección HitL)
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  const allowedFields = [
    'titular_final',
    'noticia_final',
    'notas_devola',
    'status',
    'tags',
    'devola_checklist',
  ];

  try {
    const nota = await Nota.findById(id);
    if (!nota) {
      return res.status(404).json({ error: 'Nota no encontrada.' });
    }

    allowedFields.forEach((field) => {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, field)) {
        nota[field] = req.body[field];
      }
    });

    if (req.body?.status) {
      if (['aprobada', 'publicada'].includes(req.body.status)) {
        if (!nota.fecha_aprobacion) {
          nota.fecha_aprobacion = new Date();
        }
        nota.aprobado_por = req.user.sub;
      }
      if (req.body.status === 'publicada') {
        if (!nota.fecha_publicacion) {
          nota.fecha_publicacion = new Date();
        }
        if (!nota.titular_final) {
          nota.titular_final = nota.titular_sugerido;
        }
      }
      if (req.body.status === 'pendiente_revision') {
        nota.aprobado_por = null;
        nota.fecha_aprobacion = null;
        nota.fecha_publicacion = null;
      }
    }

    const actualizada = await nota.save();
    return res.status(200).json({ nota: actualizada });
  } catch (err) {
    console.error(`[NOTAS] Error al actualizar nota: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notas/:id (protección HitL)
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const eliminada = await Nota.findByIdAndDelete(id);
    if (!eliminada) {
      return res.status(404).json({ error: 'Nota no encontrada.' });
    }
    return res.status(200).json({ message: 'Nota eliminada.' });
  } catch (err) {
    console.error(`[NOTAS] Error al eliminar nota: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
