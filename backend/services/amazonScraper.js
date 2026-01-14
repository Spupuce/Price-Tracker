// backend/services/amazonScraper.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extrait l'ASIN depuis une URL Amazon
 * @param {string} url - URL du produit Amazon
 * @returns {string|null} - ASIN du produit ou null
 */
const extraireASIN = (url) => {
  try {
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/,
      /\/gp\/product\/([A-Z0-9]{10})/,
      /\/product\/([A-Z0-9]{10})/,
      /\/ASIN\/([A-Z0-9]{10})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur extraction ASIN:', error);
    return null;
  }
};

/**
 * Génère des données fictives pour le développement
 * @param {string} asin - ASIN du produit
 * @param {string} url - URL du produit
 * @returns {Object} - Données fictives
 */
// backend/services/amazonScraper.js
// Trouve la fonction genererDonneesFictives() et remplace les URLs d'images

const genererDonneesFictives = (asin, url) => {
  // Liste de produits fictifs pour le développement
  const produitsFictifs = {
    'B08N5WRWNW': {
      titre: 'Sony WH-1000XM5 Casque Bluetooth à Réduction de Bruit - Noir',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',
      prix_actuel: 329.99,
    },
    'B0BDJ7RXQM': {
      titre: 'Apple MacBook Pro 14" M3 Pro, 18 Go RAM, 512 Go SSD - Gris sidéral',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      prix_actuel: 2199.99,
    },
    'B0C1J9NWQD': {
      titre: 'Samsung Galaxy S24 Ultra 5G - 256 Go, 12 Go RAM - Titanium Black',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      prix_actuel: 1199.99,
    },
  };

  // Si l'ASIN est connu, utiliser les données fictives
  if (produitsFictifs[asin]) {
    console.log('📦 Utilisation de données fictives pour le développement (ASIN:', asin + ')');
    return {
      asin,
      titre: produitsFictifs[asin].titre,
      image: produitsFictifs[asin].image,
      prix_actuel: produitsFictifs[asin].prix_actuel,
      devise: '€',
      url_produit: url,
    };
  }

  // Sinon, générer des données aléatoires
  console.log('📦 Génération de données fictives aléatoires (ASIN:', asin + ')');
  const prixAleatoire = (Math.random() * 500 + 50).toFixed(2);
  
  return {
    asin,
    titre: `Produit Amazon ${asin}`,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', // Image produit générique
    prix_actuel: parseFloat(prixAleatoire),
    devise: '€',
    url_produit: url,
  };
};


/**
 * Scrape les informations d'un produit Amazon
 * @param {string} url - URL du produit Amazon
 * @returns {Object} - Informations du produit
 */
const scraperProduitAmazon = async (url) => {
  try {
    console.log('Scraping de l\'URL:', url);

    // Extraire l'ASIN
    const asin = extraireASIN(url);
    if (!asin) {
      throw new Error('ASIN introuvable dans l\'URL');
    }

    // Reconstruire une URL propre
    const urlPropre = `https://www.amazon.fr/dp/${asin}`;
    console.log('URL nettoyée:', urlPropre);

    // Configuration des headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    };

    let html = '';
    try {
      // Tenter le scraping réel
      const response = await axios.get(urlPropre, { 
        headers,
        timeout: 15000,
        maxRedirects: 5,
      });

      html = response.data;
      console.log('Longueur HTML récupéré:', html.length, 'caractères');
    } catch (error) {
      console.warn('⚠️ Échec du scraping Amazon:', error.message);
      console.log('→ Basculement sur données fictives');
      return genererDonneesFictives(asin, urlPropre);
    }

    // Si la page est trop petite, c'est probablement un blocage
    if (html.length < 10000) {
      console.warn('⚠️ Page Amazon trop petite, probable blocage');
      console.log('→ Basculement sur données fictives');
      return genererDonneesFictives(asin, urlPropre);
    }

    const $ = cheerio.load(html);

    // Extraire le titre
    let titre = 
      $('#productTitle').text().trim() ||
      $('h1#title').text().trim() ||
      $('h1.a-size-large').text().trim() ||
      $('#title_feature_div h1').text().trim() ||
      '';

    // Extraire l'image
    let image = 
      $('#landingImage').attr('data-old-hires') ||
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('data-a-dynamic-image') ||
      $('#imgBlkFront').attr('src') ||
      $('.a-dynamic-image').first().attr('data-old-hires') ||
      $('.a-dynamic-image').first().attr('src') ||
      $('img#main-image').attr('src') ||
      null;

    // Parser JSON si nécessaire
    if (image && image.startsWith('{')) {
      try {
        const imageObj = JSON.parse(image);
        const urls = Object.keys(imageObj);
        if (urls.length > 0) {
          image = urls[0];
        }
      } catch (e) {
        // Ignorer l'erreur
      }
    }

    // Extraire le prix
    let prixActuel = null;
    let devise = '€';

    const selecteursPrix = [
      '.a-price[data-a-color="price"] .a-offscreen',
      '.a-price.apexPriceToPay .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#price_inside_buybox',
      '.a-price .a-offscreen',
      'span.a-price-whole',
    ];

    let prixTexte = '';
    for (const selecteur of selecteursPrix) {
      prixTexte = $(selecteur).first().text().trim();
      if (prixTexte) {
        break;
      }
    }

    if (prixTexte) {
      const prixNettoyé = prixTexte
        .replace(/\s/g, '')
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.');
      
      prixActuel = parseFloat(prixNettoyé);

      if (prixTexte.includes('€')) devise = '€';
      else if (prixTexte.includes('$')) devise = '$';
      else if (prixTexte.includes('£')) devise = '£';
      else if (prixTexte.includes('EUR')) devise = '€';
    }

    // Si aucune donnée significative, utiliser les données fictives
    if (!titre && !prixActuel) {
      console.warn('❌ Aucune donnée significative extraite');
      console.log('→ Basculement sur données fictives');
      return genererDonneesFictives(asin, urlPropre);
    }

    console.log('✅ Scraping réussi');
    return {
      asin,
      titre: titre || 'Titre non disponible',
      image: image || null,
      prix_actuel: prixActuel,
      devise,
      url_produit: urlPropre,
    };

  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error.message);
    throw new Error(`Impossible de récupérer les informations du produit: ${error.message}`);
  }
};

module.exports = {
  scraperProduitAmazon,
  extraireASIN,
};
