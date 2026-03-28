const Nota = require('../models/Nota');

/**
 * Guarda el output de Popola como una nueva Nota en MongoDB.
 * Retorna el documento guardado.
 */
async function guardarNota(resultado) {
  console.log(`[NOTA SERVICE] Preparando documento para MongoDB...`);

  const doc = {
    // === Campos de Popola ===
    titular_sugerido:          resultado.titular_sugerido,
    noticia_final:             resultado.noticia_final,
    linea_de_tiempo_extraida:  resultado.linea_de_tiempo_extraida  || [],
    hechos_verificados:        resultado.hechos_verificados        || [],
    hechos_fuente_unica:       resultado.hechos_fuente_unica       || [],
    rumores_confirmados:       resultado.rumores_confirmados       || [],
    contradicciones:           resultado.contradicciones           || [],
    sesgo_por_fuente:          resultado.sesgo_por_fuente          || [],
    devola_checklist:          resultado.devola_checklist          || [],
    citas:                     resultado.citas                     || [],
    evaluacion_verificacion:   resultado.evaluacion_verificacion,
    tags:                      resultado.tags                      || [],
    metadata:                  resultado.metadata,

    // === Campos editoriales — estado inicial ===
    status:            'pendiente_revision',
    titular_final:     null,
    aprobado_por:      null,
    fecha_aprobacion:  null,
    fecha_publicacion: null,
    notas_devola:      null,
  };

  console.log(`[NOTA SERVICE] Titular: "${doc.titular_sugerido}"`);
  console.log(`[NOTA SERVICE] Hechos verificados: ${doc.hechos_verificados.length}`);
  console.log(`[NOTA SERVICE] Items en devola_checklist: ${doc.devola_checklist.length}`);
  console.log(`[NOTA SERVICE] Fuentes analizadas: ${doc.metadata?.fuentes_analizadas}`);

  try {
    const nota = new Nota(doc);
    const guardada = await nota.save();
    console.log(`[NOTA SERVICE] Nota guardada con _id: ${guardada._id}`);
    console.log(`[NOTA SERVICE] Status inicial: "${guardada.status}"`);
    return guardada;
  } catch (err) {
    console.error(`[NOTA SERVICE] Error al guardar en MongoDB: ${err.message}`);
    throw err;
  }
}

module.exports = { guardarNota };
