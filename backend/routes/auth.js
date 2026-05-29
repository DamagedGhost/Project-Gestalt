const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/user');
const { requireAuth, COOKIE_NAME } = require('../middleware/auth');

const router = express.Router();

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
  };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son obligatorios.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado.' });
  }

  try {
    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const payload = {
      sub: usuario._id.toString(),
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.cookie(COOKIE_NAME, token, buildCookieOptions());
    return res.status(200).json({
      message: 'Login exitoso.',
      user: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error(`[AUTH] Error en login: ${err.message}`);
    return res.status(500).json({ error: 'Error interno en autenticación.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, buildCookieOptions());
  return res.status(200).json({ message: 'Sesión cerrada.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.sub).select('email nombre rol activo');
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Sesión inválida.' });
    }

    return res.status(200).json({
      user: {
        id: usuario._id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error(`[AUTH] Error en /me: ${err.message}`);
    return res.status(500).json({ error: 'Error interno en autenticación.' });
  }
});

module.exports = router;
