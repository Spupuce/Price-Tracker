// frontend/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListeProduitsScreen from './screens/ListeProduitsScreen';
import DetailProduitScreen from './screens/DetailProduitScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Pas de header par défaut, on gère nous-mêmes
        }}
      >
        <Stack.Screen 
          name="ListeProduits" 
          component={ListeProduitsScreen} 
        />
        <Stack.Screen 
          name="DetailProduit" 
          component={DetailProduitScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
