// backend/scheduler.js
const cron = require('node-cron');
const { mettreAJourTousLesProduits } = require('./services/updatePrices');

/**
 * Configure et démarre les tâches planifiées
 */
const demarrerScheduler = () => {
  console.log('📅 Démarrage du scheduler de mise à jour des prix...');

  // Mise à jour toutes les heures (à la minute 0)
  // Format cron: '0 * * * *' = toutes les heures à :00
  // Pour tester, tu peux utiliser '*/5 * * * *' = toutes les 5 minutes
  const tacheActualisation = cron.schedule('0 * * * *', async () => {
    console.log('\n⏰ Déclenchement automatique de la mise à jour des prix...');
    console.log(`Heure: ${new Date().toLocaleString('fr-FR')}`);
    
    try {
      await mettreAJourTousLesProduits();
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour planifiée:', error);
    }
  }, {
    scheduled: true,
    timezone: "Europe/Paris" // Fuseau horaire de la France
  });

  console.log('✅ Scheduler démarré : mise à jour automatique toutes les heures');
  console.log('   Prochaine exécution à la prochaine heure pile (XX:00)');
  
  return tacheActualisation;
};

/**
 * Arrête le scheduler
 * @param {Object} tache - La tâche cron à arrêter
 */
const arreterScheduler = (tache) => {
  if (tache) {
    tache.stop();
    console.log('⏹️ Scheduler arrêté');
  }
};

module.exports = {
  demarrerScheduler,
  arreterScheduler,
};
