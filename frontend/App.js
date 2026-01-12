// frontend/App.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const LOCAL_IP = '10.212.126.196';

const API_URL =
  Platform.OS === 'android'
    ? `http://${LOCAL_IP}:4000`
    : 'http://localhost:4000';

const Stack = createNativeStackNavigator();

// ------- Utilitaires UI -------

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

// ------- Écran liste -------

function ListeProduitsScreen({ navigation }) {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const chargerProduits = async () => {
    try {
      console.log('Appel API vers :', `${API_URL}/produits`);
      setChargement(true);
      setErreur(null);

      const response = await fetch(`${API_URL}/produits`);
      console.log('Status réponse :', response.status);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }

      const data = await response.json();
      console.log('Données reçues :', data);
      setProduits(data);
    } catch (e) {
      console.error('Erreur fetch :', e);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const renderItem = ({ item }) => {
    const remise = calculerRemise(item.prix_initial, item.prix_actuel);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('DetailProduit', { produitId: item._id })}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.imagePlaceholder} />

            <View style={styles.cardText}>
              <Text style={styles.titre} numberOfLines={2}>
                {item.titre}
              </Text>

              <View style={styles.prixRow}>
                <Text style={styles.prixActuel}>
                  {formatPrix(item.prix_actuel, item.devise)}
                </Text>
                {item.prix_initial && (
                  <Text style={styles.prixInitial}>
                    {formatPrix(item.prix_initial, item.devise)}
                  </Text>
                )}
              </View>

              {remise !== null && (
                <View style={styles.badgePromo}>
                  <Text style={styles.badgePromoTexte}>-{remise}%</Text>
                </View>
              )}

              <Text style={styles.asin}>ASIN : {item.asin}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Mes produits suivis</Text>

      {chargement && <ActivityIndicator size="large" />}

      {erreur && <Text style={styles.erreur}>{erreur}</Text>}

      {!chargement && !erreur && (
        <FlatList
          data={produits}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.liste}
        />
      )}
    </SafeAreaView>
  );
}

// ------- Écran détail -------

function DetailProduitScreen({ route }) {
  const { produitId } = route.params || {};
  const [produit, setProduit] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const chargerProduit = async () => {
    try {
      setChargement(true);
      setErreur(null);

      const response = await fetch(`${API_URL}/produits/${produitId}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du produit');
      }

      const data = await response.json();
      setProduit(data);
    } catch (e) {
      console.error('Erreur fetch détail :', e);
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (produitId) {
      chargerProduit();
    }
  }, [produitId]);

  if (chargement) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (erreur || !produit) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.erreur}>{erreur || 'Produit introuvable'}</Text>
      </SafeAreaView>
    );
  }

  const remise = calculerRemise(produit.prix_initial, produit.prix_actuel);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Détail du produit</Text>

      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.imagePlaceholderLarge} />

          <View style={styles.cardText}>
            <Text style={styles.titre} numberOfLines={3}>
              {produit.titre}
            </Text>

            <View style={styles.prixRow}>
              <Text style={styles.prixActuel}>
                {formatPrix(produit.prix_actuel, produit.devise)}
              </Text>
              {produit.prix_initial && (
                <Text style={styles.prixInitial}>
                  {formatPrix(produit.prix_initial, produit.devise)}
                </Text>
              )}
            </View>

            {remise !== null && (
              <View style={styles.badgePromo}>
                <Text style={styles.badgePromoTexte}>-{remise}%</Text>
              </View>
            )}

            <Text style={styles.asin}>ASIN : {produit.asin}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ------- Entrée principale -------

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="ListeProduits"
          component={ListeProduitsScreen}
          options={{ title: 'PriceTracker' }}
        />
        <Stack.Screen
          name="DetailProduit"
          component={DetailProduitScreen}
          options={{ title: 'Détail du produit' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ------- Styles -------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  liste: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  imagePlaceholderLarge: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  titre: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#111827',
  },
  prixRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  prixActuel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginRight: 8,
  },
  prixInitial: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  asin: {
    fontSize: 12,
    color: '#6b7280',
  },
  badgePromo: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#16a34a',
    marginBottom: 4,
  },
  badgePromoTexte: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  erreur: {
    color: '#b91c1c',
    marginTop: 8,
  },
});