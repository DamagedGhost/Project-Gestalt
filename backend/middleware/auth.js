const jwt = require('jsonwebtoken');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'gestalt_token';

function requireAuth(req, res, next) {
  let token = null;

  // 1. Extraer de Header Authorization: Bearer <token> (útil para Swagger, API y móviles)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2. Si no viene en header, extraer de cookie HttpOnly (usado por frontend web)
  if (!token && req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  }

  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Se requiere token o sesión activa.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado.' });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = { requireAuth, COOKIE_NAME };

