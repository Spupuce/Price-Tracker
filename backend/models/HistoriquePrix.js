// backend/models/HistoriquePrix.js
const mongoose = require('mongoose');

const historiquePrixSchema = new mongoose.Schema(
  {
    produit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produit',
      required: true,
    },
    prix: {
      type: Number,
      required: true,
    },
    devise: {
      type: String,
      default: '€',
    },
    source: {
      type: String,
      enum: ['creation', 'mise_a_jour_cron', 'mise_a_jour_manuelle'],
      default: 'creation',
    },
    date_releve: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HistoriquePrix', historiquePrixSchema);
