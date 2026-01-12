// backend/routes/produits.js
const express = require('express');
const Produit = require('../models/Produit');

const router = express.Router();

// POST /produits
router.post('/', async (req, res) => {
  try {
    console.log('Body brut reçu :', req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: 'Aucun corps JSON reçu. Vérifiez le Content-Type et le format.' });
    }

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
    } = req.body;

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

    return res.status(201).json(produit);
  } catch (error) {
    console.error('Erreur création produit :', error);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la création du produit', erreur: error.message });
  }
});

// GET /produits
router.get('/', async (req, res) => {
  try {
    const produits = await Produit.find().sort({ createdAt: -1 });
    return res.json(produits);
  } catch (error) {
    console.error('Erreur récupération produits :', error);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération des produits' });
  }
});

// GET /produits/:id
router.get('/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    return res.json(produit);
  } catch (error) {
    console.error('Erreur récupération produit :', error);
    return res
      .status(500)
      .json({ message: 'Erreur serveur lors de la récupération du produit' });
  }
});

module.exports = router;
