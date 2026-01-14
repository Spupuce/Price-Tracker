// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const produitsRoutes = require('./routes/produits');
const { demarrerScheduler, arreterScheduler } = require('./scheduler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/produits', produitsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API PriceTracker OK' });
});

const MONGO_URI = 'mongodb://localhost:27017/pricetracker';
const PORT = 4000;

let tacheCron = null;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur le port ${PORT}`);
      console.log(`   API disponible sur http://localhost:${PORT}`);
      
      // Démarrer le scheduler
      tacheCron = demarrerScheduler();
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion MongoDB :', error);
  });

// Gestion propre de l'arrêt
const arreterServeur = async () => {
  console.log('\n⏹️ Arrêt du serveur...');
  
  // Arrêter le scheduler
  arreterScheduler(tacheCron);
  
  // Fermer la connexion MongoDB (SANS callback)
  try {
    await mongoose.connection.close();
    console.log('✅ Connexion MongoDB fermée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture MongoDB:', error);
    process.exit(1);
  }
};

process.on('SIGINT', arreterServeur);
process.on('SIGTERM', arreterServeur);
