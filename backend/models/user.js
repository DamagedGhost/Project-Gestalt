const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    rol: {
      type: String,
      enum: ['devola', 'admin'],
      default: 'devola',
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', UsuarioSchema);