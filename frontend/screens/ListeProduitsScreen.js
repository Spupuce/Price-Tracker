// frontend/screens/ListeProduitsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const formatPrix = (valeur, devise) => {
  if (typeof valeur !== 'number') return '-';
  return `${valeur.toFixed(2)} ${devise || ''}`.trim();
};

const formatVariation = (variation) => {
  if (typeof variation !== 'number') return '0%';
  const signe = variation > 0 ? '+' : '';
  return `${signe}${variation.toFixed(2)}%`;
};

export default function ListeProduitsScreen({ navigation }) {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [urlOuAsin, setUrlOuAsin] = useState('');
  const [chargementAjout, setChargementAjout] = useState(false);
  const [messageAjout, setMessageAjout] = useState(null);

  const [suppressionEnCoursId, setSuppressionEnCoursId] = useState(null);

  // état pour le pull-to-refresh
  const [rafraichissement, setRafraichissement] = useState(false);

  const chargerProduits = async () => {
    try {
      setErreur(null);

      // Si on arrive au tout début, on montre le gros loader
      if (!rafraichissement) {
        setChargement(true);
      }

      console.log('Appel API vers :', `${API_URL}/produits`);

      const response = await fetch(`${API_URL}/produits`);
      console.log('Status réponse :', response.status);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }

      const data = await response.json();
      console.log('Données reçues :', data);
      setProduits(data);
    } catch (error) {
      console.error('Erreur chargement produits :', error);
      setErreur(error.message);
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const handleOuvrirDetail = (produit) => {
    navigation.navigate('DetailProduit', { produit });
  };

  const handleAjouterProduit = async () => {
    const valeur = urlOuAsin.trim();

    if (!valeur) {
      setMessageAjout('Merci de saisir une URL Amazon ou un ASIN.');
      return;
    }

    setMessageAjout(null);
    setChargementAjout(true);

    try {
      const body =
        valeur.startsWith('http://') || valeur.startsWith('https://')
          ? { url_produit: valeur }
          : { asin: valeur };

      const response = await fetch(`${API_URL}/produits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 409 && data && data.produit) {
          setMessageAjout('Ce produit est déjà suivi. Ouverture de la fiche.');
          setProduits((prev) => {
            const existeDeja = prev.some((p) => p._id === data.produit._id);
            if (existeDeja) return prev;
            return [data.produit, ...prev];
          });
          setUrlOuAsin('');
          return;
        }

        const messageApi =
          data?.erreur ||
          'Erreur lors de l’ajout du produit. Vérifie l’URL ou l’ASIN.';
        throw new Error(messageApi);
      }

      const nouveauProduit = data;

      setProduits((prev) => [nouveauProduit, ...prev]);
      setUrlOuAsin('');
      setMessageAjout('Produit ajouté avec succès.');
    } catch (error) {
      console.error('Erreur ajout produit :', error);
      setMessageAjout(error.message);
    } finally {
      setChargementAjout(false);
    }
  };

  const confirmerSuppression = (produit) => {
    Alert.alert(
      'Supprimer ce produit ?',
      `Ce produit sera retiré du suivi :\n\n${produit.titre}`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => handleSupprimerProduit(produit),
        },
      ]
    );
  };

  const handleSupprimerProduit = async (produit) => {
    try {
      setSuppressionEnCoursId(produit._id);

      const response = await fetch(`${API_URL}/produits/${produit._id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const messageApi =
          data?.erreur || 'Erreur lors de la suppression du produit.';
        throw new Error(messageApi);
      }

      setProduits((prev) => prev.filter((p) => p._id !== produit._id));
    } catch (error) {
      console.error('Erreur suppression produit :', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setSuppressionEnCoursId(null);
    }
  };

  const onRefresh = useCallback(() => {
    setRafraichissement(true);
    chargerProduits();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.8}
        onPress={() => handleOuvrirDetail(item)}
      >
        <View style={styles.cardText}>
          <Text style={styles.titre} numberOfLines={2}>
            {item.titre}
          </Text>

          <View style={styles.prixRow}>
            <Text style={styles.prixActuel}>
              {formatPrix(item.prix_actuel, item.devise)}
            </Text>
            {item.prix_initial && item.prix_initial !== item.prix_actuel && (
              <Text style={styles.prixInitial}>
                {formatPrix(item.prix_initial, item.devise)}
              </Text>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text
              style={[
                styles.variation,
                item.variation_prix < 0 && styles.variationBaisse,
                item.variation_prix > 0 && styles.variationHausse,
              ]}
            >
              {formatVariation(item.variation_prix)}
            </Text>
            <Text style={styles.dateMaj}>
              Maj :{' '}
              {new Date(item.derniere_mise_a_jour).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.boutonSupprimer,
          suppressionEnCoursId === item._id && styles.boutonSupprimerDisabled,
        ]}
        onPress={() => confirmerSuppression(item)}
        disabled={suppressionEnCoursId === item._id}
      >
        {suppressionEnCoursId === item._id ? (
          <ActivityIndicator size="small" color="#b91c1c" />
        ) : (
          <Text style={styles.boutonSupprimerTexte}>Supprimer</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contenu}>
          {/* Formulaire d’ajout */}
          <View style={styles.formulaire}>
            <Text style={styles.formTitre}>Ajouter un produit</Text>
            <Text style={styles.formSousTitre}>
              Colle une URL Amazon ou saisis un ASIN.
            </Text>

            <View style={styles.formRow}>
              <TextInput
                style={styles.input}
                placeholder="URL Amazon ou ASIN"
                value={urlOuAsin}
                onChangeText={setUrlOuAsin}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.boutonAjouter,
                  (chargementAjout || !urlOuAsin.trim()) &&
                    styles.boutonAjouterDesactive,
                ]}
                onPress={handleAjouterProduit}
                activeOpacity={0.8}
                disabled={chargementAjout || !urlOuAsin.trim()}
              >
                {chargementAjout ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.boutonAjouterTexte}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>

            {messageAjout && (
              <Text style={styles.messageAjout}>{messageAjout}</Text>
            )}
          </View>

          {/* Liste des produits */}
          {chargement ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : erreur ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.erreurTexte}>{erreur}</Text>
            </View>
          ) : (
            <FlatList
              data={produits}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={
                produits.length === 0 ? styles.emptyListContainer : null
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  Aucun produit suivi pour le moment.
                </Text>
              }
              refreshing={rafraichissement}
              onRefresh={onRefresh}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contenu: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  formulaire: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  formTitre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formSousTitre: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  boutonAjouter: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boutonAjouterDesactive: {
    backgroundColor: '#9ca3af',
  },
  boutonAjouterTexte: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageAjout: {
    marginTop: 6,
    fontSize: 13,
    color: '#4b5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  erreurTexte: {
    color: '#b91c1c',
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardText: {
    flex: 1,
  },
  titre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  prixRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  prixActuel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginRight: 8,
  },
  prixInitial: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  variation: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  variationBaisse: {
    color: '#16a34a',
  },
  variationHausse: {
    color: '#b91c1c',
  },
  dateMaj: {
    fontSize: 12,
    color: '#9ca3af',
  },
  boutonSupprimer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boutonSupprimerDisabled: {
    opacity: 0.7,
  },
  boutonSupprimerTexte: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
