// Service de heartbeat - envoie l'état de l'employé au serveur chaque minute
// L'agent collecte et envoie les données brutes (IP, SSID, activité)
// Le BACKEND gère toute la logique métier (vérification SSID, horaires, retard, etc.)
const api = require('./api');
const network = require('./network');
const activity = require('./activity');
const config = require('./config');

let heartbeatInterval = null;
let configRefreshInterval = null;
let clockedInToday = false; // Clock-in envoyé aujourd'hui ?
let lastClockInDate = null;  // Date du dernier clock-in

// Démarrer le heartbeat (toutes les 60 secondes)
function start() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Premier heartbeat immédiat
  sendHeartbeat();
  
  // Puis toutes les 60 secondes
  heartbeatInterval = setInterval(sendHeartbeat, 60000);
  
  // Rafraîchir la config du serveur toutes les 15 minutes
  if (configRefreshInterval) clearInterval(configRefreshInterval);
  configRefreshInterval = setInterval(refreshConfig, 15 * 60 * 1000);
  
  console.log('[Heartbeat] Service démarré - intervalle 60s, config refresh 15min');
}

// Arrêter le heartbeat
function stop() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (configRefreshInterval) {
    clearInterval(configRefreshInterval);
    configRefreshInterval = null;
  }
  console.log('[Heartbeat] Service arrêté');
}

// Rafraîchir la config depuis le serveur
async function refreshConfig() {
  try {
    console.log('[Config] Rafraîchissement de la configuration...');
    await api.fetchConfig();
  } catch (error) {
    console.error('[Config] Erreur rafraîchissement:', error.message);
  }
}

// Envoyer un heartbeat - l'agent envoie TOUJOURS les données,
// c'est le backend qui décide quoi en faire
async function sendHeartbeat() {
  if (!config.isLoggedIn()) return;
  
  // Vérifier si on est dans les horaires de travail (Lun-Ven 8h-18h par défaut)
  if (!config.isWorkingTime()) {
    // Si on était clocké → auto clock-out avec SSID
    if (config.get('clockedIn')) {
      console.log('[Heartbeat] Fin des horaires de travail → CLOCK_OUT automatique');
      const netInfo = await network.getNetworkInfo();
      const success = await api.sendEvent('CLOCK_OUT', netInfo.localIP, netInfo.ssid);
      if (success) {
        config.set('clockedIn', false);
        clockedInToday = false;
      }
    }
    return;
  }
  
  try {
    const netInfo = await network.getNetworkInfo();
    const activityStatus = activity.getStatus();
    
    // Auto CLOCK_IN au premier heartbeat de la journée (pendant les horaires)
    const today = new Date().toDateString();
    if (!clockedInToday || lastClockInDate !== today) {
      if (!config.get('clockedIn')) {
        console.log(`[Heartbeat] Premier heartbeat du jour → CLOCK_IN (SSID: ${netInfo.ssid}, IP: ${netInfo.localIP})`);
        const success = await api.sendEvent('CLOCK_IN', netInfo.localIP, netInfo.ssid);
        if (success) {
          config.set('clockedIn', true);
          clockedInToday = true;
          lastClockInDate = today;
        }
      } else {
        clockedInToday = true;
        lastClockInDate = today;
      }
    }
    
    // Envoyer heartbeat avec IP, SSID et activité
    const success = await api.sendHeartbeat(
      netInfo.localIP,
      netInfo.ssid,
      activityStatus.isActive
    );
    
    if (success) {
      console.log(`[Heartbeat] Envoyé - IP: ${netInfo.localIP}, SSID: ${netInfo.ssid}, Actif: ${activityStatus.isActive}`);
    }
  } catch (error) {
    console.error('[Heartbeat] Erreur:', error.message);
  }
}

module.exports = { start, stop };
