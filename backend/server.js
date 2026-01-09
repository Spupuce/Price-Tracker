// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const produitsRoutes = require('./routes/produits');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // <= IMPORTANT, avant les routes

// Routes
app.use('/produits', produitsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API PriceTracker OK' });
});

// URL de connexion MongoDB locale (par défaut)
const MONGO_URI = 'mongodb://localhost:27017/pricetracker';

// Démarrage du serveur seulement si MongoDB est connecté
const PORT = 4000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connecté');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erreur de connexion MongoDB :', error);
  });
