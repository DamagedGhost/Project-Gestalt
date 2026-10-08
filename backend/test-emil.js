const { extraerFuentes } = require('./services/emilService');

async function testEmil() {
  console.log('=== TEST AISLADO AGENTE EMIL ===');
  const urls = [
    'https://www.biobiochile.cl/noticias/nacional/chile/2024/11/21/claudio-orrego-asegura-que-crisis-en-la-moneda-por-monsalve-es-aun-mas-grave-que-el-bullado-caso-caval.shtml',
    'https://www.latercera.com/la-tercera-pm/noticia/como-la-moneda-termino-de-soltar-a-manuel-monsalve/QJU6KNBLTJAGLPUMLLOKR6H5MI/',
    'https://elpais.com/chile/2024-10-23/el-caso-monsalve-la-acusacion-por-violacion-que-impacta-a-chile-y-golpea-a-la-moneda.html'
  ];

  console.log(`Probando extracción en ${urls.length} fuentes reales...`);
  const { fuentes, fuentesInaccesibles } = await extraerFuentes(urls);

  console.log(`✓ Fuentes procesadas exitosamente: ${fuentes.length}`);
  fuentes.forEach((f, idx) => {
    console.log(`  [${idx + 1}] Medio detectado: ${f.medio}`);
    console.log(`      Titular: "${f.titular}"`);
    console.log(`      Caracteres de texto limpio: ${f.texto.length}`);
  });

  if (fuentesInaccesibles.length > 0) {
    console.log(`! Fuentes inaccesibles detectadas: ${fuentesInaccesibles.length}`);
  }

  console.log('=== PRUEBA DE EMIL FINALIZADA CON ÉXITO ===');
}

testEmil().catch(err => {
  console.error('Error en prueba de Emil:', err);
  process.exit(1);
});
