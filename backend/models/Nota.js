const mongoose = require('mongoose');

// --- Subdocument schemas ---

const CitaSchema = new mongoose.Schema({
  indice:              { type: Number, required: true },
  medio:               { type: String, required: true },
  url:                 { type: String, required: true },
  fragmento_relevante: { type: String },
}, { _id: false });

const HechoFuenteUnicaSchema = new mongoose.Schema({
  hecho:  { type: String, required: true },
  fuente: { type: String, required: true },
}, { _id: false });

const RumorConfirmadoSchema = new mongoose.Schema({
  declaracion: { type: String, required: true },
  quien:       { type: String, required: true },
  medio:       { type: String, required: true },
}, { _id: false });

const ContradiccionSchema = new mongoose.Schema({
  descripcion: { type: String },
  fuentes:     [{ type: String }],
}, { _id: false });

const SesgoPorFuenteSchema = new mongoose.Schema({
  fuente:          { type: String, required: true },
  sesgo_detectado: { type: String },
  hechos_omitidos: { type: String },
}, { _id: false });

const DevolaChecklistItemSchema = new mongoose.Schema({
  hecho:          { type: String, required: true },
  url_respaldo:   { type: String },
  fragmento_clave:{ type: String },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'rechazado'],
    default: 'pendiente',
  },
  nota_devola: { type: String }, // Comentario opcional de Devola al revisar
}, { _id: false });

const EvaluacionVerificacionSchema = new mongoose.Schema({
  nivel:        { type: String, enum: ['alto', 'medio', 'bajo'], required: true },
  justificacion:{ type: String },
}, { _id: false });

const MetadataSchema = new mongoose.Schema({
  fuentes_analizadas:  { type: Number },
  fuentes_inaccesibles:{ type: [String], default: [] },
  urls:                { type: [String], default: [] },
  busquedas_adicionales:{ type: Number, default: 0 },
  protocolo:           { type: String }, // ej. "GESTALT v0.5.0"
}, { _id: false });

// --- Main schema ---

const NotaSchema = new mongoose.Schema(
  {
    // === Output de Popola (Agente) ===
    titular_sugerido:       { type: String, required: true },
    noticia_final:          { type: String, required: true },
    linea_de_tiempo_extraida: { type: [String], default: [] },
    hechos_verificados:     { type: [String], default: [] },
    hechos_fuente_unica:    { type: [HechoFuenteUnicaSchema], default: [] },
    rumores_confirmados:    { type: [RumorConfirmadoSchema], default: [] },
    contradicciones:        { type: [ContradiccionSchema], default: [] },
    sesgo_por_fuente:       { type: [SesgoPorFuenteSchema], default: [] },
    devola_checklist:       { type: [DevolaChecklistItemSchema], default: [] },
    citas:                  { type: [CitaSchema], default: [] },
    evaluacion_verificacion:{ type: EvaluacionVerificacionSchema },
    tags:                   { type: [String], default: [] },
    metadata:               { type: MetadataSchema },

    // === Campos editoriales (agrega el backend) ===
    status: {
      type: String,
      enum: ['pendiente_revision', 'aprobada', 'rechazada', 'publicada'],
      default: 'pendiente_revision',
      index: true,
    },
    titular_final: { 
      type: String,  // Devola puede editar el titular antes de publicar
    },
    aprobado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
    fecha_aprobacion:  { type: Date, default: null },
    fecha_publicacion: { type: Date, default: null },
    notas_devola: { 
      type: String, // Razón de rechazo u observaciones
      default: null,
    },
  },
  { timestamps: true } // createdAt = cuando Popola generó la nota
);

module.exports = mongoose.model('Nota', NotaSchema);