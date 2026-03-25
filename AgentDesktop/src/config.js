// Configuration de l'agent - stockée localement après login
const Store = require('electron-store');

const store = new Store({
  name: 'antigone-rh-agent-config',
  defaults: {
    serverUrl: 'http://localhost:8080',
    employeId: null,
    token: null,
    username: null,
    // Config récupérée du serveur
    popupIntervalleHeures: 2,
    popupTimeoutSecondes: 60,
    inactiviteToleranceMinutesJour: 30,
    reseauEntrepriseIp: '192.168.1.0/24',
    reseauEntrepriseSsid: '',
    toleranceRetardMinutes: 10,
    heureDebutTravail: '09:00',
    heureFinTravail: '18:00',
    joursTravail: 'LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI',
    // État
    isLoggedIn: false,
    clockedIn: false,
    lastHeartbeat: null,
    lastConfigRefresh: null
  }
});

// Mapping jours français -> numéro JS (0=Dimanche, 1=Lundi...)
const JOURS_MAP = {
  'DIMANCHE': 0, 'LUNDI': 1, 'MARDI': 2, 'MERCREDI': 3,
  'JEUDI': 4, 'VENDREDI': 5, 'SAMEDI': 6
};

/**
 * Vérifie si on est dans les horaires de travail (jour + heure)
 */
function isWorkingTime() {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Dim, 1=Lun...
  
  // Vérifier le jour de travail
  const joursTravail = store.get('joursTravail') || 'LUNDI,MARDI,MERCREDI,JEUDI,VENDREDI';
  const joursArray = joursTravail.split(',').map(j => j.trim().toUpperCase());
  const joursNumeros = joursArray.map(j => JOURS_MAP[j]).filter(n => n !== undefined);
  
  if (!joursNumeros.includes(currentDay)) {
    return false; // Ce n'est pas un jour de travail
  }
  
  // Vérifier l'heure de travail
  const heureDebut = store.get('heureDebutTravail') || '09:00';
  const heureFin = store.get('heureFinTravail') || '18:00';
  
  const [debutH, debutM] = heureDebut.split(':').map(Number);
  const [finH, finM] = heureFin.split(':').map(Number);
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const debutMinutes = debutH * 60 + (debutM || 0);
  const finMinutes = finH * 60 + (finM || 0);
  
  // Ajouter 30 minutes de marge après la fin pour le clock-out
  return currentMinutes >= debutMinutes && currentMinutes <= (finMinutes + 30);
}

function get(key) {
  return store.get(key);
}

function set(key, value) {
  store.set(key, value);
}

function getAll() {
  return store.store;
}

function clear() {
  store.clear();
}

function isLoggedIn() {
  return store.get('isLoggedIn') && store.get('employeId');
}

module.exports = { get, set, getAll, clear, isLoggedIn, isWorkingTime };
