const mongoose = require('mongoose');

// Representa un análisis cruzado generado sobre múltiples notas
// Se puebla por jobs CRON o consultas manuales — no en tiempo real

const ConvergenciaFuenteSchema = new mongoose.Schema({
  fuente:             { type: String, required: true },
  sesgo_promedio:     { type: String },
  total_notas:        { type: Number, default: 0 },
  temas_frecuentes:   { type: [String], default: [] },
}, { _id: false });

const PatronTemaSchema = new mongoose.Schema({
  tema:         { type: String, required: true },
  frecuencia:   { type: Number, default: 0 },
  fuentes:      { type: [String], default: [] },
  primera_aparicion: { type: Date },
  ultima_aparicion:  { type: Date },
}, { _id: false });

const CompilacionSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      enum: ['sesgo_por_fuente', 'convergencia_tematica', 'reporte_geopolitico', 'custom'],
      required: true,
    },
    periodo: {
      desde: { type: Date, required: true },
      hasta:  { type: Date, required: true },
    },
    notas_incluidas: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nota',
    }],
    total_notas_analizadas: { type: Number, default: 0 },
    convergencia_por_fuente: { type: [ConvergenciaFuenteSchema], default: [] },
    patrones_tematicos:      { type: [PatronTemaSchema], default: [] },
    resumen_narrativo:       { type: String }, // Texto generado por Popola o redactado por Devola
    generado_por: {
      type: String,
      enum: ['cron', 'manual', 'devola'],
      default: 'manual',
    },
    aprobado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
    publicado: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Compilacion', CompilacionSchema);