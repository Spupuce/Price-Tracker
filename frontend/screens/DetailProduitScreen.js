// frontend/screens/DetailProduitScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const formatPrix = (valeur, devise) => {
  if (typeof valeur !== 'number') return '-';
  return `${valeur.toFixed(2)} ${devise || ''}`.trim();
};

const calculerRemise = (prixInitial, prixActuel) => {
  if (typeof prixInitial !== 'number' || typeof prixActuel !== 'number') return null;
  const diff = prixInitial - prixActuel;
  if (diff <= 0) return null;
  const pourcentage = (diff / prixInitial) * 100;
  return Math.round(pourcentage);
};

const calculerEconomie = (prixInitial, prixActuel) => {
  if (typeof prixInitial !== 'number' || typeof prixActuel !== 'number') return null;
  const diff = prixInitial - prixActuel;
  return diff > 0 ? diff : null;
};

const formaterDate = (dateString) => {
  const date = new Date(dateString);
  const maintenant = new Date();
  const diffMs = maintenant - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHeures = Math.floor(diffMs / 3600000);
  const diffJours = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  } else if (diffHeures < 24) {
    return `il y a ${diffHeures} heure${diffHeures > 1 ? 's' : ''}`;
  } else if (diffJours < 7) {
    return `il y a ${diffJours} jour${diffJours > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('fr-FR');
  }
};

export default function DetailProduitScreen({ route, navigation }) {
  const { produit } = route.params;

  const [historique, setHistorique] = useState([]);
  const [chargementHistorique, setChargementHistorique] = useState(true);
  const [erreurHistorique, setErreurHistorique] = useState(null);

  const remise = calculerRemise(produit.prix_initial, produit.prix_actuel);
  const economie = calculerEconomie(produit.prix_initial, produit.prix_actuel);

  const handleAcheterAmazon = () => {
    if (produit.url_produit) {
      Linking.openURL(produit.url_produit);
    }
  };

  const handleFermer = () => {
    navigation.goBack();
  };

  const chargerHistorique = async () => {
    try {
      setChargementHistorique(true);
      setErreurHistorique(null);

      const response = await fetch(
        `${API_URL}/produits/${produit._id}/historique`
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'historique');
      }

      const data = await response.json();
      setHistorique(data.historique || []);
    } catch (error) {
      console.error('Erreur historique :', error);
      setErreurHistorique(error.message);
    } finally {
      setChargementHistorique(false);
    }
  };

  useEffect(() => {
    if (produit?._id) {
      chargerHistorique();
    }
  }, [produit?._id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton fermer */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleFermer} style={styles.boutonFermer}>
          <Text style={styles.iconeFermer}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image du produit */}
        <View style={styles.imageContainer}>
          {produit.image ? (
            <Image
              source={{ uri: produit.image }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>

        {/* Informations produit */}
        <View style={styles.content}>
          {/* Titre */}
          <Text style={styles.titre}>{produit.titre}</Text>

          {/* Prix actuel */}
          <View style={styles.prixSection}>
            <Text style={styles.labelPrix}>Prix actuel</Text>
            <View style={styles.prixRow}>
              <Text style={styles.prixActuel}>
                {formatPrix(produit.prix_actuel, produit.devise)}
              </Text>
              {produit.prix_initial &&
                produit.prix_initial !== produit.prix_actuel && (
                  <Text style={styles.prixInitial}>
                    {formatPrix(produit.prix_initial, produit.devise)}
                  </Text>
                )}
            </View>

            {/* Badge promo et économie */}
            {remise !== null && (
              <View style={styles.promoRow}>
                <View style={styles.badgePromo}>
                  <Text style={styles.badgePromoTexte}>-{remise}%</Text>
                </View>
                {economie && (
                  <Text style={styles.economie}>
                    Économie : {economie.toFixed(2)} {produit.devise}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Statistiques de prix */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Prix le plus bas</Text>
              <Text style={styles.statValeur}>
                {formatPrix(produit.prix_plus_bas, produit.devise)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Prix le plus élevé</Text>
              <Text style={styles.statValeur}>
                {formatPrix(produit.prix_plus_haut, produit.devise)}
              </Text>
            </View>
          </View>

          {/* Historique des prix */}
          <View style={styles.historiqueSection}>
            <Text style={styles.sectionTitre}>
              Historique des prix (30 derniers jours)
            </Text>

            {chargementHistorique && (
              <View style={styles.graphiquePlaceholder}>
                <ActivityIndicator size="small" />
              </View>
            )}

            {erreurHistorique && !chargementHistorique && (
              <View style={styles.graphiquePlaceholder}>
                <Text style={styles.placeholderText}>
                  {erreurHistorique}
                </Text>
              </View>
            )}

            {!chargementHistorique &&
              !erreurHistorique &&
              historique.length === 0 && (
                <View style={styles.graphiquePlaceholder}>
                  <Text style={styles.placeholderText}>
                    Pas encore assez de données pour afficher un graphique.
                  </Text>
                </View>
              )}

            {!chargementHistorique &&
              !erreurHistorique &&
              historique.length > 0 && (
                <View style={styles.graphiquePlaceholder}>
                  {/* TODO: remplacer par un vrai graphique */}
                  <Text style={styles.placeholderText}>
                    {historique.length} point(s) de données prêt(s) pour le graphique.
                  </Text>
                </View>
              )}
          </View>

          {/* Dernière mise à jour */}
          <Text style={styles.derniereMaj}>
            Dernière mise à jour : {formaterDate(produit.derniere_mise_a_jour)}
          </Text>

          {/* Bouton Acheter sur Amazon */}
          <TouchableOpacity
            style={styles.boutonAcheter}
            onPress={handleAcheterAmazon}
            activeOpacity={0.8}
          >
            <Text style={styles.boutonAcheterTexte}>🔗 Acheter sur Amazon</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  boutonFermer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconeFermer: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f9fafb',
  },
  image: {
    width: 300,
    height: 300,
  },
  imagePlaceholder: {
    width: 300,
    height: 300,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: 16,
  },
  titre: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 28,
  },
  prixSection: {
    marginBottom: 24,
  },
  labelPrix: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  prixRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  prixActuel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#059669',
    marginRight: 12,
  },
  prixInitial: {
    fontSize: 20,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgePromo: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  badgePromoTexte: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  economie: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValeur: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  historiqueSection: {
    marginBottom: 24,
  },
  sectionTitre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  graphiquePlaceholder: {
    height: 200,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  derniereMaj: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  boutonAcheter: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  boutonAcheterTexte: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
