// backend/models/Produit.js
const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: false, // Non requis pour permettre les données fictives
      default: 'Titre non disponible',
    },
    asin: {
      type: String,
      required: true, // ASIN reste requis car c'est l'identifiant unique
      unique: true,
    },
    url_produit: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false,
      default: null,
    },
    prix_actuel: {
      type: Number,
      required: false,
      default: null,
    },
    prix_initial: {
      type: Number,
      required: false,
      default: null,
    },
    prix_plus_bas: {
      type: Number,
      required: false,
      default: null,
    },
    prix_plus_haut: {
      type: Number,
      required: false,
      default: null,
    },
    devise: {
      type: String,
      required: false,
      default: '€',
    },
    en_promo: {
      type: Boolean,
      default: false,
    },
    variation_prix: {
      type: Number,
      default: 0,
    },
    derniere_mise_a_jour: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt automatiquement
  }
);

module.exports = mongoose.model('Produit', produitSchema);
