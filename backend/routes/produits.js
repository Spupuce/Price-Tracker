// backend/routes/produits.js
const express = require('express');
const Produit = require('../models/Produit');

const router = express.Router();

// POST /produits
router.post('/', async (req, res) => {
  try {
    console.log('Body reçu :', req.body); // <-- ajout

    const {
      titre,
      asin,
      url_produit,
      image,
      prix_actuel,
      prix_initial,
      prix_plus_bas,
      prix_plus_haut,
      devise,
    } = req.body || {};

    const produit = await Produit.create({
      titre,
      asin,
      url_produit,
      image,
      prix_actuel,
      prix_initial,
      prix_plus_bas,
      prix_plus_haut,
      devise,
    });

    res.status(201).json(produit);
  } catch (error) {
    console.error('Erreur création produit :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du produit' });
  }
});

module.exports = router;
