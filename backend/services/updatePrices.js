// backend/services/updatePrices.js
const Produit = require('../models/Produit');
const HistoriquePrix = require('../models/HistoriquePrix');
const { scraperProduitAmazon } = require('./amazonScraper');

/**
 * Met à jour le prix d'un produit spécifique
 * @param {string} produitId - ID du produit à mettre à jour
 * @returns {Object}
 */
const mettreAJourProduit = async (produitId) => {
  try {
    console.log(`Mise à jour du produit ${produitId}...`);

    const produit = await Produit.findById(produitId);
    if (!produit) {
      throw new Error('Produit non trouvé');
    }

    const nouvellesInfos = await scraperProduitAmazon(produit.url_produit);

    const ancienPrix = produit.prix_actuel;
    const nouveauPrix = nouvellesInfos.prix_actuel;

    // Si pas de prix ou pas de changement, juste la date
    if (typeof nouveauPrix !== 'number' || ancienPrix === nouveauPrix) {
      produit.derniere_mise_a_jour = new Date();
      await produit.save();
      console.log(`Produit ${produitId}: Prix inchangé (${nouveauPrix} ${produit.devise})`);
      return {
        success: true,
        produitId,
        message: 'Prix inchangé',
        prix: nouveauPrix,
      };
    }

    const variation = nouveauPrix - ancienPrix;
    const variationPourcentage = ((variation / ancienPrix) * 100).toFixed(2);

    produit.prix_actuel = nouveauPrix;

    if (nouveauPrix < produit.prix_plus_bas) {
      produit.prix_plus_bas = nouveauPrix;
      console.log(`🎉 Nouveau prix le plus bas: ${nouveauPrix} ${produit.devise}`);
    }

    if (nouveauPrix > produit.prix_plus_haut) {
      produit.prix_plus_haut = nouveauPrix;
      console.log(`⚠️ Nouveau prix le plus haut: ${nouveauPrix} ${produit.devise}`);
    }

    produit.variation_prix = parseFloat(variationPourcentage);

    const differenceAvecInitial = ((produit.prix_initial - nouveauPrix) / produit.prix_initial) * 100;
    produit.en_promo = differenceAvecInitial > 5;

    if (nouvellesInfos.image) {
      produit.image = nouvellesInfos.image;
    }
    if (nouvellesInfos.titre) {
      produit.titre = nouvellesInfos.titre;
    }

    produit.derniere_mise_a_jour = new Date();

    await produit.save();

    // Historique de prix
    await HistoriquePrix.create({
      produit: produit._id,
      prix: nouveauPrix,
      devise: produit.devise,
      source: 'mise_a_jour_cron',
      date_releve: new Date(),
    });

    console.log(
      `✅ Produit ${produitId} mis à jour: ${ancienPrix} → ${nouveauPrix} ${produit.devise} (${variation > 0 ? '+' : ''}${variationPourcentage}%)`
    );

    return {
      success: true,
      produitId,
      message: 'Prix mis à jour',
      ancienPrix,
      nouveauPrix,
      variation,
      variationPourcentage,
      enPromo: produit.en_promo,
    };
  } catch (error) {
    console.error(`❌ Erreur mise à jour produit ${produitId}:`, error.message);
    return {
      success: false,
      produitId,
      message: error.message,
    };
  }
};

/**
 * Met à jour tous les produits en base
 */
const mettreAJourTousLesProduits = async () => {
  try {
    console.log('========================================');
    console.log('Début de la mise à jour de tous les produits...');
    console.log('========================================');

    const produits = await Produit.find();
    console.log(`${produits.length} produit(s) à mettre à jour`);

    if (produits.length === 0) {
      return {
        success: true,
        total: 0,
        reussis: 0,
        echoues: 0,
        resultats: [],
      };
    }

    const resultats = [];
    for (let i = 0; i < produits.length; i++) {
      const produit = produits[i];

      console.log(`\n[${i + 1}/${produits.length}] Traitement de: ${produit.titre.substring(0, 50)}...`);

      const resultat = await mettreAJourProduit(produit._id);
      resultats.push(resultat);

      if (i < produits.length - 1) {
        console.log('⏳ Pause de 2 secondes...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const reussis = resultats.filter((r) => r.success).length;
    const echoues = resultats.filter((r) => !r.success).length;

    console.log('\n========================================');
    console.log('Mise à jour terminée !');
    console.log(`✅ Réussis: ${reussis}`);
    console.log(`❌ Échoués: ${echoues}`);
    console.log('========================================\n');

    return {
      success: true,
      total: produits.length,
      reussis,
      echoues,
      resultats,
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de tous les produits:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = {
  mettreAJourProduit,
  mettreAJourTousLesProduits,
};
