// backend/models/Produit.js
const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema(
  {
    titre: { type: String, required: true },
    asin: { type: String, required: true, unique: true },
    url_produit: { type: String, required: true },
    image: { type: String },
    prix_actuel: { type: Number },
    prix_initial: { type: Number },
    prix_plus_bas: { type: Number },
    prix_plus_haut: { type: Number },
    devise: { type: String, default: 'EUR' },
    en_promo: { type: Boolean, default: false },
    variation_prix: { type: Number, default: 0 }, // en %
    derniere_mise_a_jour: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const Produit = mongoose.model('Produit', produitSchema);

module.exports = Produit;
