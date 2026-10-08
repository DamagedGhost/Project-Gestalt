require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Nota = require('./models/Nota');

const REPLACEMENTS = [
  ['Jos\uFFFD', 'José'],
  ['public\uFFFD', 'publicó'],
  ['cr\uFFFDticas', 'críticas'],
  ['acompa\uFFFDado', 'acompañado'],
  ['conten\uFFFDa', 'contenía'],
  ['alud\uFFFDa', 'aludía'],
  ['hab\uFFFDa', 'había'],
  ['da\uFFFDos', 'daños'],
  ['detect\uFFFD', 'detectó'],
  ['publicaci\uFFFDn', 'publicación'],
  ['despu\uFFFDs', 'después'],
  ['ma\uFFFDana', 'mañana'],
  ['confirm\uFFFD', 'confirmó'],
  ['Rep\uFFFDblica', 'República'],
  ['advirti\uFFFD', 'advirtió'],
  ['recuperaci\uFFFDn', 'recuperación'],
  ['m\uFFFDs', 'más'],
  ['r\uFFFDpida', 'rápida'],
  ['Contralor\uFFFDa', 'Contraloría'],
  ['informaci\uFFFDn', 'información'],
  ['p\uFFFDblica', 'pública'],
  ['gener\uFFFD', 'generó'],
  ['deb\uFFFDan', 'debían'],
  ['presentaci\uFFFDn', 'presentación'],
  ['colabor\uFFFD', 'colaboró'],
  ['Cristi\uFFFDn', 'Cristián'],
  ['opin\uFFFD', 'opinó'],
  ['seg\uFFFDn', 'según'],
  ['Seg\uFFFDn', 'Según'],
  ['sugiri\uFFFD', 'sugirió'],
  ['trat\uFFFD', 'trató'],
  ['intervenci\uFFFDn', 'intervención'],
  ['bas\uFFFDndose', 'basándose'],
  ['adjudicaci\uFFFDn', 'adjudicación'],
  ['econ\uFFFDmico', 'económico'],
  ['Chilevisi\uFFFDn', 'Chilevisión'],
  ['indic\uFFFD', 'indicó'],
  ['comunic\uFFFD', 'comunicó'],
  ['hab\uFFFDan', 'habían'],
  ['mencion\uFFFD', 'mencionó'],
  ['Publicaci\uFFFDn', 'Publicación'],
  ['Art\uFFFDculo', 'Artículo'],
  ['ocurri\uFFFD', 'ocurrió'],
  ['Omiti\uFFFD', 'Omitió'],
  ['distinci\uFFFDn', 'distinción'],
  ['tambi\uFFFDn', 'también'],
  ['podr\uFFFDa', 'podría'],
  ['cr\uFFFDtico', 'crítico'],
  ['gesti\uFFFDn', 'gestión'],
  ['t\uFFFDtulo', 'título'],
  ['art\uFFFDculo', 'artículo'],
  ['\uFFFDFue', '¿Fue'],
  ['inclin\uFFFDndose', 'inclinándose'],
  ['opini\uFFFDn', 'opinión'],
  ['ambig\uFFFDedad', 'ambigüedad'],
  ['as\uFFFD', 'así'],
  ['ser\uFFFDan', 'serían'],
  ['abri\uFFFD', 'abrió'],
  ['se\uFFFDalar', 'señalar'],
  ['adopt\uFFFD', 'adoptó'],
  ['todav\uFFFDa', 'todavía'],
  ['lograr\uFFFDa', 'lograría'],
  ['\uFFFDcomprometidas', "'comprometidas"],
  ['terceros\uFFFD', "terceros'"],
  ['eliminaci\uFFFDn', 'eliminación'],
  ['confirmaci\uFFFDn', 'confirmación'],
  ['caracterizaci\uFFFDn', 'caracterización'],
  ['pol\uFFFDtica', 'política'],
];

function repairString(str) {
  if (typeof str !== 'string') return str;
  let res = str;
  for (const [from, to] of REPLACEMENTS) {
    res = res.replaceAll(from, to);
  }
  return res;
}

function deepRepair(obj) {
  if (obj instanceof mongoose.Types.ObjectId || (obj && obj._bsontype === 'ObjectID') || (obj && obj._bsontype === 'ObjectId')) {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (typeof obj === 'string') {
    return repairString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(deepRepair);
  }
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      res[key] = deepRepair(obj[key]);
    }
    return res;
  }
  return obj;
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('No DB_URL');
    process.exit(1);
  }

  await mongoose.connect(dbUrl);
  console.log('Conectado a Mongo.');

  const notas = await Nota.find();
  let repairedCount = 0;

  for (const nota of notas) {
    const raw = nota.toObject();
    const str = JSON.stringify(raw);
    if (str.includes('\uFFFD')) {
      console.log(`Reparando nota: ${nota._id} (${nota.titular_sugerido})`);
      const fixed = deepRepair(raw);
      delete fixed._id;
      delete fixed.__v;
      await Nota.findByIdAndUpdate(nota._id, fixed);
      repairedCount++;
    }
  }

  console.log(`Reparación terminada. Notas reparadas: ${repairedCount}`);

  // Verificar
  const remaining = await Nota.find();
  let badRemaining = 0;
  for (const n of remaining) {
    const s = JSON.stringify(n);
    const count = (s.match(/\uFFFD/g) || []).length;
    if (count > 0) {
      console.log(`Aún quedan ${count} caracteres corruptos en: ${n._id}`);
      badRemaining += count;
    }
  }

  console.log(`Caracteres corruptos restantes en toda la base de datos: ${badRemaining}`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
