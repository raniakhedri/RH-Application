// Module de détection réseau - collecte les infos réseau (IP, SSID WiFi)
// L'agent ne fait AUCUNE vérification de SSID - c'est le backend qui gère toute la logique
const { exec } = require('child_process');
const os = require('os');

// Récupérer l'adresse IP locale
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Récupérer le SSID WiFi connecté (Windows)
function getWifiSSID() {
  return new Promise((resolve) => {
    exec('netsh wlan show interfaces', { encoding: 'utf-8' }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        // Chercher "SSID" mais pas "BSSID" - trim pour gérer \r\n
        const trimmed = line.trim();
        const match = trimmed.match(/^SSID\s+:\s+(.+)/);
        if (match && !trimmed.startsWith('BSSID')) {
          resolve(match[1].trim());
          return;
        }
      }
      resolve(null);
    });
  });
}

// Collecter les informations réseau (IP + SSID) - pas de vérification, juste collecte
async function getNetworkInfo() {
  const localIP = getLocalIP();
  const ssid = await getWifiSSID();
  
  return {
    localIP,
    ssid: ssid || ''
  };
}

module.exports = { getNetworkInfo, getLocalIP, getWifiSSID };
