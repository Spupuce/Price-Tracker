// backend/routes/produits.js
const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');
const HistoriquePrix = require('../models/HistoriquePrix');
const { scraperProduitAmazon } = require('../services/amazonScraper');
const { mettreAJourProduit, mettreAJourTousLesProduits } = require('../services/updatePrices');

/**
 * POST /produits - Ajouter un nouveau produit à suivre
 */
router.post('/', async (req, res) => {
  try {
    const { url_produit } = req.body;

    if (!url_produit) {
      return res.status(400).json({
        erreur: 'L\'URL du produit est requise',
      });
    }

    if (!url_produit.includes('amazon.')) {
      return res.status(400).json({
        erreur: 'L\'URL doit être une URL Amazon valide',
      });
    }

    console.log('Ajout d\'un nouveau produit:', url_produit);

    const infosScrapees = await scraperProduitAmazon(url_produit);

    const produitExistant = await Produit.findOne({ asin: infosScrapees.asin });
    if (produitExistant) {
      return res.status(409).json({
        erreur: 'Ce produit est déjà suivi',
        produit: produitExistant,
      });
    }

    const nouveauProduit = new Produit({
      titre: infosScrapees.titre,
      asin: infosScrapees.asin,
      url_produit: infosScrapees.url_produit,
      image: infosScrapees.image,
      prix_actuel: infosScrapees.prix_actuel,
      prix_initial: infosScrapees.prix_actuel,
      prix_plus_bas: infosScrapees.prix_actuel,
      prix_plus_haut: infosScrapees.prix_actuel,
      devise: infosScrapees.devise,
      en_promo: false,
      variation_prix: 0,
      derniere_mise_a_jour: new Date(),
    });

    const produitSauvegarde = await nouveauProduit.save();

    // Historique initial
    if (typeof produitSauvegarde.prix_actuel === 'number') {
      await HistoriquePrix.create({
        produit: produitSauvegarde._id,
        prix: produitSauvegarde.prix_actuel,
        devise: produitSauvegarde.devise,
        source: 'creation',
        date_releve: new Date(),
      });
    }

    console.log('Produit ajouté avec succès:', produitSauvegarde._id);

    res.status(201).json(produitSauvegarde);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du produit:', error);
    res.status(500).json({
      erreur: 'Erreur lors de l\'ajout du produit',
      details: error.message,
    });
  }
});

/**
 * GET /produits - Liste de tous les produits
 */
router.get('/', async (req, res) => {
  try {
    const produits = await Produit.find().sort({ createdAt: -1 });
    res.json(produits);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      erreur: 'Erreur lors de la récupération des produits',
    });
  }
});

/**
 * GET /produits/:id - Détail d'un produit
 */
router.get('/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
      return res.status(404).json({
        erreur: 'Produit non trouvé',
      });
    }

    res.json(produit);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      erreur: 'Erreur lors de la récupération du produit',
    });
  }
});

/**
 * DELETE /produits/:id - Supprimer un produit
 */
router.delete('/:id', async (req, res) => {
  try {
    const produit = await Produit.findByIdAndDelete(req.params.id);

    if (!produit) {
      return res.status(404).json({
        erreur: 'Produit non trouvé',
      });
    }

    console.log('Produit supprimé:', req.params.id);
    res.json({
      message: 'Produit supprimé avec succès',
      produit,
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      erreur: 'Erreur lors de la suppression du produit',
    });
  }
});

/**
 * PUT /produits/:id/actualiser - Mettre à jour un produit
 */
router.put('/:id/actualiser', async (req, res) => {
  try {
    console.log(`Demande de mise à jour du produit ${req.params.id}`);

    const resultat = await mettreAJourProduit(req.params.id);

    if (!resultat.success) {
      return res.status(500).json({
        erreur: 'Erreur lors de la mise à jour',
        details: resultat.message,
      });
    }

    const produitMisAJour = await Produit.findById(req.params.id);

    res.json({
      message: resultat.message,
      produit: produitMisAJour,
      changements: {
        ancienPrix: resultat.ancienPrix,
        nouveauPrix: resultat.nouveauPrix,
        variation: resultat.variation,
        variationPourcentage: resultat.variationPourcentage,
        enPromo: resultat.enPromo,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      erreur: 'Erreur lors de la mise à jour du produit',
      details: error.message,
    });
  }
});

/**
 * POST /produits/actualiser-tous - Mettre à jour tous les produits
 */
router.post('/actualiser-tous', async (req, res) => {
  try {
    console.log('Demande de mise à jour de tous les produits');

    const resultat = await mettreAJourTousLesProduits();

    if (!resultat.success) {
      return res.status(500).json({
        erreur: 'Erreur lors de la mise à jour',
        details: resultat.message,
      });
    }

    res.json({
      message: 'Mise à jour terminée',
      statistiques: {
        total: resultat.total,
        reussis: resultat.reussis,
        echoues: resultat.echoues,
      },
      resultats: resultat.resultats,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de tous les produits:', error);
    res.status(500).json({
      erreur: 'Erreur lors de la mise à jour de tous les produits',
      details: error.message,
    });
  }
});

/**
 * GET /produits/:id/historique - Historique des prix sur 30 jours
 */
router.get('/:id/historique', async (req, res) => {
  try {
    const produitId = req.params.id;

    const produit = await Produit.findById(produitId);
    if (!produit) {
      return res.status(404).json({
        erreur: 'Produit non trouvé',
      });
    }

    const ilYA30Jours = new Date();
    ilYA30Jours.setDate(ilYA30Jours.getDate() - 30);

    const historique = await HistoriquePrix.find({
      produit: produitId,
      date_releve: { $gte: ilYA30Jours },
    }).sort({ date_releve: 1 });

    res.json({
      produitId,
      historique,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      erreur: 'Erreur lors de la récupération de l\'historique des prix',
      details: error.message,
    });
  }
});

module.exports = router;
