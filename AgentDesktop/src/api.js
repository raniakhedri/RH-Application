// Client API pour communiquer avec le backend Spring Boot
const axios = require('axios');
const config = require('./config');

function getClient() {
  const serverUrl = config.get('serverUrl');
  
  const client = axios.create({
    baseURL: serverUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return client;
}

// Login employé
async function login(username, password) {
  try {
    const serverUrl = config.get('serverUrl');
    const response = await axios.post(`${serverUrl}/api/auth/login`, {
      username,
      password
    });
    
    // La réponse est: { success, message, data: { compteId, employeId, username, ... } }
    const apiResponse = response.data;
    
    if (!apiResponse.success) {
      return { success: false, message: apiResponse.message || 'Identifiants incorrects' };
    }
    
    const loginData = apiResponse.data;
    config.set('employeId', loginData.employeId);
    config.set('username', loginData.username);
    config.set('nom', loginData.nom);
    config.set('prenom', loginData.prenom);
    config.set('isLoggedIn', true);
    
    // Charger la config du serveur
    await fetchConfig();
    
    return { success: true, data: loginData };
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Erreur de connexion';
    return { success: false, message };
  }
}

// Récupérer la configuration du serveur
async function fetchConfig() {
  try {
    const client = getClient();
    const response = await client.get('/api/agent/config');
    
    // Le backend retourne ApiResponse: { success, message, data: { config... } }
    const apiResponse = response.data;
    const serverConfig = apiResponse.data || apiResponse; // Fallback si pas de wrapper
    
    console.log('[API] Config reçue du serveur:', JSON.stringify(serverConfig));
    
    if (serverConfig.popupIntervalleHeures) config.set('popupIntervalleHeures', serverConfig.popupIntervalleHeures);
    if (serverConfig.popupTimeoutSecondes) config.set('popupTimeoutSecondes', serverConfig.popupTimeoutSecondes);
    if (serverConfig.inactiviteToleranceMinutesJour) config.set('inactiviteToleranceMinutesJour', serverConfig.inactiviteToleranceMinutesJour);
    if (serverConfig.reseauEntrepriseIp) config.set('reseauEntrepriseIp', serverConfig.reseauEntrepriseIp);
    if (serverConfig.reseauEntrepriseSsid !== undefined) config.set('reseauEntrepriseSsid', serverConfig.reseauEntrepriseSsid);
    if (serverConfig.toleranceRetardMinutes) config.set('toleranceRetardMinutes', serverConfig.toleranceRetardMinutes);
    // Horaires et jours de travail
    if (serverConfig.heureDebutTravail) config.set('heureDebutTravail', serverConfig.heureDebutTravail);
    if (serverConfig.heureFinTravail) config.set('heureFinTravail', serverConfig.heureFinTravail);
    if (serverConfig.joursTravail) config.set('joursTravail', serverConfig.joursTravail);
    
    config.set('lastConfigRefresh', new Date().toISOString());
    console.log('[API] Config appliquée: SSID=' + config.get('reseauEntrepriseSsid') + ', Horaires=' + config.get('heureDebutTravail') + '-' + config.get('heureFinTravail') + ', Jours=' + config.get('joursTravail'));
    
    return serverConfig;
  } catch (error) {
    console.error('[API] Erreur chargement config:', error.message);
    return null;
  }
}

// Retry silencieux: tente l'appel, puis retente après délai si le serveur est down
async function withRetry(fn, retries = 3, delayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isNetworkError = !error.response || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
      if (isNetworkError && attempt < retries) {
        console.log(`[API] Serveur injoignable, tentative ${attempt}/${retries}. Retry dans ${delayMs / 1000}s...`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        throw error;
      }
    }
  }
}

// Envoyer heartbeat (chaque minute)
async function sendHeartbeat(ipAddress, ssid, actif) {
  try {
    const employeId = config.get('employeId');
    
    await withRetry(() => {
      const client = getClient();
      return client.post('/api/agent/heartbeat', {
        employeId,
        ipAddress: ipAddress || '',
        ssid: ssid || '',
        actif
      });
    });
    
    config.set('lastHeartbeat', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('[API] Erreur heartbeat:', error.message);
    return false;
  }
}

// Envoyer un événement (CLOCK_IN ou CLOCK_OUT) avec IP et SSID
async function sendEvent(eventType, ipAddress, ssid) {
  try {
    const employeId = config.get('employeId');
    
    await withRetry(() => {
      const client = getClient();
      return client.post('/api/agent/event', {
        employeId,
        eventType,
        ipAddress: ipAddress || '',
        ssid: ssid || ''
      });
    });
    
    console.log(`[API] Événement ${eventType} envoyé (SSID: ${ssid || 'N/A'}, IP: ${ipAddress || 'N/A'})`);
    return true;
  } catch (error) {
    console.error(`[API] Erreur événement ${eventType}:`, error.message);
    return false;
  }
}

// Confirmer la présence (popup)
async function sendPresenceConfirm(confirmed) {
  try {
    const employeId = config.get('employeId');
    
    await withRetry(() => {
      const client = getClient();
      return client.post('/api/agent/presence-confirm', {
        employeId,
        confirmed
      });
    });
    
    console.log(`[API] Confirmation présence: ${confirmed}`);
    return true;
  } catch (error) {
    console.error('[API] Erreur confirmation présence:', error.message);
    return false;
  }
}

module.exports = {
  login,
  fetchConfig,
  sendHeartbeat,
  sendEvent,
  sendPresenceConfirm
};
