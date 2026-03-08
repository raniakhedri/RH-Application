// Module de popup de présence - affiche la fenêtre de confirmation périodique
const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const config = require('./config');
const api = require('./api');

let popupWindow = null;
let popupInterval = null;

// Démarrer le cycle de popups
function start() {
  const intervalHeures = config.get('popupIntervalleHeures') || 2;
  const intervalMs = intervalHeures * 60 * 60 * 1000;
  
  if (popupInterval) clearInterval(popupInterval);
  
  popupInterval = setInterval(() => {
    if (config.isLoggedIn() && config.isWorkingTime()) {
      showPopup();
    } else if (!config.isWorkingTime()) {
      console.log('[Popup] Hors horaires de travail - popup ignoré');
    }
  }, intervalMs);
  
  console.log(`[Popup] Service démarré - intervalle ${intervalHeures}h (actif uniquement pendant les horaires de travail)`);
}

// Arrêter le cycle
function stop() {
  if (popupInterval) {
    clearInterval(popupInterval);
    popupInterval = null;
  }
  closePopup();
  console.log('[Popup] Service arrêté');
}

// Afficher le popup de confirmation
function showPopup() {
  if (popupWindow) {
    popupWindow.focus();
    return;
  }
  
  popupWindow = new BrowserWindow({
    width: 420,
    height: 400,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    frame: false,
    transparent: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  popupWindow.loadFile(path.join(__dirname, 'popup.html'));
  
  popupWindow.once('ready-to-show', () => {
    popupWindow.show();
    popupWindow.focus();
    
    // Envoyer le timeout configuré
    const timeout = config.get('popupTimeoutSecondes') || 60;
    popupWindow.webContents.send('set-timeout', timeout);
  });
  
  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}

// Fermer le popup
function closePopup() {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.destroy();
    popupWindow = null;
  }
}

// Écouter la réponse du popup
function setupIPC() {
  ipcMain.on('presence-response', async (event, confirmed) => {
    console.log(`[Popup] Réponse reçue: ${confirmed ? 'CONFIRMÉ' : 'NON CONFIRMÉ'}`);
    
    // Envoyer au serveur
    await api.sendPresenceConfirm(confirmed);
    
    // Fermer le popup après un court délai
    setTimeout(() => {
      closePopup();
    }, confirmed ? 1000 : 500);
  });
}

module.exports = { start, stop, showPopup, setupIPC };
