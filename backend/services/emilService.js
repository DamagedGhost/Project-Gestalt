const axios = require('axios');
const cheerio = require('cheerio');

const MAX_CHARS = 10000;

// Diccionario de medios conocidos por dominio
const KNOWN_OUTLETS = {
  'latercera.com': 'La Tercera',
  'biobiochile.cl': 'BioBioChile',
  'emol.com': 'Emol',
  'cnnchile.com': 'CNN Chile',
  't13.cl': 'T13',
  '24horas.cl': '24 Horas',
  'meganoticias.cl': 'Meganoticias',
  'elmostrador.cl': 'El Mostrador',
  'cooperativa.cl': 'Cooperativa',
  'theclinic.cl': 'The Clinic',
  'df.cl': 'Diario Financiero',
  'elciudadano.com': 'El Ciudadano',
  'chilevision.cl': 'Chilevisión',
  'adnradio.cl': 'ADN Radio',
  'ciperchile.cl': 'CIPER Chile',
};

// Expresiones regulares para descartar ruido y publicidad
const BOILERPLATE_PATTERNS = [
  /suscr[ií]bete\s+(a|al)/i,
  /todos\s+los\s+derechos\s+reservados/i,
  /foto:\s*(agencia|reuters|afp|ap|shutterstock)/i,
  /s[ií]guenos\s+en\s+(redes|nuestras|instagram|twitter|facebook)/i,
  /lee\s+tambi[eé]n:/i,
  /art[ií]culo\s+relacionado:/i,
  /descarga\s+nuestra\s+app/i,
  /comparte\s+esta\s+noticia/i,
  /aviso\s+publicitario/i,
];

function normalizeText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
}

function isBoilerplate(text) {
  if (text.length < 35) return true;
  return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(text));
}

function uniqueParagraphs(paragraphs) {
  const seen = new Set();
  return paragraphs.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function truncateText(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }
  return text.slice(0, maxChars).trim();
}

/**
 * Deduce el nombre del medio combinando OpenGraph, tags y nombre de host.
 */
function detectMedio($, hostname) {
  // 1. Meta og:site_name
  const ogSiteName = normalizeText($('meta[property="og:site_name"]').attr('content'));
  if (ogSiteName && ogSiteName.length < 40) {
    return ogSiteName;
  }

  // 2. Diccionario de conocidos
  for (const [domain, name] of Object.entries(KNOWN_OUTLETS)) {
    if (hostname.endsWith(domain)) {
      return name;
    }
  }

  // 3. Fallback: formatear el hostname limpio
  const cleanHost = hostname.replace(/^www\./, '').split('.')[0];
  if (cleanHost) {
    return cleanHost.charAt(0).toUpperCase() + cleanHost.slice(1);
  }

  return 'Fuente de Prensa';
}

/**
 * Extrae y purifica una noticia usando selectores inteligentes y limpieza DOM.
 */
async function scrapeUrl(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const hostname = new URL(url).hostname.toLowerCase();

  // Limpiar elementos no noticiosos del árbol DOM antes de extraer
  $(
    'script, style, noscript, iframe, nav, footer, header, aside, form, ' +
    '.ad, .ads, .publicidad, .banner, .newsletter, .social-share, .compartir, ' +
    '.comments, .comentarios, .relacionadas, .tags, .etiquetas, .sidebar'
  ).remove();

  // 1. Titular
  const ogTitle = normalizeText($('meta[property="og:title"]').attr('content'));
  const h1Title = normalizeText($('h1').first().text());
  const docTitle = normalizeText($('title').text().split('|')[0].split('-')[0]);
  const title = ogTitle || h1Title || docTitle || 'Titular No Identificado';

  // 2. Nombre del medio
  const medio = detectMedio($, hostname);

  // 3. Extracción de párrafos relevantes
  // Se prioriza el bloque de artículo o cuerpo de la nota
  const articleSelectors = [
    'article p',
    '.entry-content p',
    '.contenido p',
    '.single__body p',
    '.cuerpo-noticia p',
    '.texto-nota p',
    '.article-body p',
    '.story-body p',
    'main p',
    'p',
  ];

  let rawParagraphs = [];
  for (const selector of articleSelectors) {
    const matches = $(selector)
      .map((_, el) => normalizeText($(el).text()))
      .get()
      .filter((t) => !isBoilerplate(t));

    if (matches.length >= 3) {
      rawParagraphs = matches;
      break;
    }
  }

  // Si no se encontraron suficientes con selectores específicos, buscar en todos los p
  if (rawParagraphs.length === 0) {
    rawParagraphs = $('p')
      .map((_, el) => normalizeText($(el).text()))
      .get()
      .filter((t) => !isBoilerplate(t));
  }

  const cleaned = uniqueParagraphs(rawParagraphs).join('\n\n');
  const texto = truncateText(cleaned, MAX_CHARS);

  return {
    url,
    medio,
    titular: title,
    texto,
  };
}

/**
 * Procesa un lote de URLs y reporta las fuentes exitosas e inaccesibles.
 */
async function extraerFuentes(urls) {
  const fuentes = [];
  const fuentesInaccesibles = [];

  for (const url of urls) {
    try {
      const fuente = await scrapeUrl(url);
      if (!fuente.titular || !fuente.texto || fuente.texto.length < 80) {
        throw new Error('Contenido insuficiente o bloqueado');
      }
      fuentes.push(fuente);
    } catch (err) {
      console.warn(`[EMIL] No se pudo extraer ${url}: ${err.message}`);
      fuentesInaccesibles.push(url);
    }
  }

  return { fuentes, fuentesInaccesibles };
}

module.exports = { extraerFuentes, scrapeUrl };
