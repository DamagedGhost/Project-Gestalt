const axios = require('axios');
const cheerio = require('cheerio');

const MAX_CHARS = 8000;

const SOURCE_CONFIG = [
  {
    match: /latercera\.com$/i,
    medio: 'La Tercera',
    title: 'h1',
    body: 'article p, .contenido p, .single__body p',
  },
  {
    match: /biobiochile\.cl$/i,
    medio: 'BioBioChile',
    title: 'h1',
    body: 'article p, .entry-content p',
  },
  {
    match: /emol\.com$/i,
    medio: 'Emol',
    title: 'h1',
    body: 'article p, .texto-nota p',
  },
  {
    match: /cnnchile\.com$/i,
    medio: 'CNN Chile',
    title: 'h1',
    body: 'article p, .entry-content p',
  },
];

const DEFAULT_CONFIG = {
  medio: 'Fuente desconocida',
  title: 'h1',
  body: 'article p, main p',
};

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
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

function resolveConfig(hostname) {
  const match = SOURCE_CONFIG.find((config) => config.match.test(hostname));
  return match || DEFAULT_CONFIG;
}

async function scrapeUrl(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Project-Gestalt Emil/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  const hostname = new URL(url).hostname.replace('www.', '');
  const config = resolveConfig(hostname);

  const title = normalizeText($(config.title).first().text());
  const paragraphs = $(config.body)
    .map((_, el) => normalizeText($(el).text()))
    .get()
    .filter((text) => text.length > 30);

  const cleaned = uniqueParagraphs(paragraphs).join('\n');
  const texto = truncateText(cleaned, MAX_CHARS);

  return {
    url,
    medio: config.medio,
    titular: title,
    texto,
  };
}

async function extraerFuentes(urls) {
  const fuentes = [];
  const fuentesInaccesibles = [];

  for (const url of urls) {
    try {
      const fuente = await scrapeUrl(url);
      if (!fuente.titular || !fuente.texto) {
        throw new Error('Contenido insuficiente');
      }
      fuentes.push(fuente);
    } catch (err) {
      console.warn(`[EMIL] No se pudo extraer ${url}: ${err.message}`);
      fuentesInaccesibles.push(url);
    }
  }

  return { fuentes, fuentesInaccesibles };
}

module.exports = { extraerFuentes };
