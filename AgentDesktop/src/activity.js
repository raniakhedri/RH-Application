// Module de surveillance d'activité - détecte souris/clavier et inactivité
const { powerMonitor } = require('electron');

let lastActivityTime = Date.now();
let isActive = true;
let activityCheckInterval = null;
const INACTIVITY_THRESHOLD_MS = 120000; // 2 minutes sans activité = inactif

// Vérifier l'inactivité système via powerMonitor (idle time en secondes)
function getIdleTime() {
  try {
    return powerMonitor.getSystemIdleTime();
  } catch (e) {
    return 0;
  }
}

// Démarrer la surveillance
function start(onStatusChange) {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }
  
  // Vérifier l'activité toutes les 30 secondes
  activityCheckInterval = setInterval(() => {
    const idleSeconds = getIdleTime();
    const wasActive = isActive;
    
    // Si le système est inactif depuis plus de 2 minutes
    isActive = idleSeconds < (INACTIVITY_THRESHOLD_MS / 1000);
    
    if (isActive) {
      lastActivityTime = Date.now();
    }
    
    // Notifier le changement de statut
    if (wasActive !== isActive && onStatusChange) {
      onStatusChange(isActive);
    }
  }, 30000);
  
  console.log('[Activity] Surveillance démarrée');
}

// Arrêter la surveillance
function stop() {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
    activityCheckInterval = null;
  }
  console.log('[Activity] Surveillance arrêtée');
}

// Obtenir le statut actuel
function getStatus() {
  const idleSeconds = getIdleTime();
  isActive = idleSeconds < (INACTIVITY_THRESHOLD_MS / 1000);
  
  return {
    isActive,
    idleSeconds,
    lastActivityTime: new Date(lastActivityTime).toISOString()
  };
}

module.exports = { start, stop, getStatus };
