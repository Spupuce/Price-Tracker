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
 * Scrape les informations d'un produit Amazon
 * @param {string} url - URL du produit Amazon OU ASIN seul
 * @returns {Object} - Informations du produit
 */
const scraperProduitAmazon = async (urlOuAsin) => {
  try {
    console.log("Scraping demandé pour :", urlOuAsin);

    let asin = null;
    let urlPropre = '';

    // Si on reçoit directement un ASIN
    if (/^[A-Z0-9]{10}$/.test(urlOuAsin)) {
      asin = urlOuAsin;
      urlPropre = `https://www.amazon.fr/dp/${asin}`;
    } else {
      // Sinon on considère que c'est une URL
      asin = extraireASIN(urlOuAsin);
      if (!asin) {
        throw new Error('ASIN introuvable dans l’URL');
      }
      urlPropre = `https://www.amazon.fr/dp/${asin}`;
    }

    console.log('ASIN détecté :', asin);
    console.log('URL nettoyée :', urlPropre);

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      DNT: '1',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    };

    const response = await axios.get(urlPropre, {
      headers,
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    console.log('Longueur HTML récupéré :', html.length, 'caractères');

    if (!html || html.length < 10000) {
      console.warn('Page Amazon trop petite ou vide : probable blocage/captcha');
      throw new Error('Page Amazon non exploitable (blocage ou captcha)');
    }

    const $ = cheerio.load(html);

    // Titre
    let titre =
      $('#productTitle').text().trim() ||
      $('h1#title').text().trim() ||
      $('h1.a-size-large').text().trim() ||
      $('#title_feature_div h1').text().trim() ||
      '';

    // Image
    let image =
      $('#landingImage').attr('data-old-hires') ||
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('data-a-dynamic-image') ||
      $('#imgBlkFront').attr('src') ||
      $('.a-dynamic-image').first().attr('data-old-hires') ||
      $('.a-dynamic-image').first().attr('src') ||
      $('img#main-image').attr('src') ||
      null;

    if (image && image.startsWith('{')) {
      try {
        const imageObj = JSON.parse(image);
        const urls = Object.keys(imageObj);
        if (urls.length > 0) {
          image = urls[0];
        }
      } catch (e) {
        // ignore
      }
    }

    // Prix
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
        .replace(/[^\d,.,-]/g, '')
        .replace(',', '.');

      prixActuel = parseFloat(prixNettoyé);

      if (prixTexte.includes('€')) devise = '€';
      else if (prixTexte.includes('$')) devise = '$';
      else if (prixTexte.includes('£')) devise = '£';
      else if (prixTexte.includes('EUR')) devise = '€';
    }

    if (!titre || !prixActuel) {
      console.warn(
        'Données insuffisantes extraites (titre ou prix manquant) :',
        { titreOK: !!titre, prixOK: !!prixActuel }
      );
      throw new Error('Impossible d’extraire les informations du produit');
    }

    console.log('✅ Scraping réussi pour', asin);

    return {
      asin,
      titre,
      image: image || null,
      prix_actuel: prixActuel,
      devise,
      url_produit: urlPropre,
    };
  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error.message);
    throw new Error(
      `Impossible de récupérer les informations du produit: ${error.message}`
    );
  }
};

module.exports = {
  scraperProduitAmazon,
  extraireASIN,
};
