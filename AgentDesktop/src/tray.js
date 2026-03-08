// Gestionnaire du system tray - icône dans la barre des tâches
const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const config = require('./config');

let tray = null;
let onShowLogin = null;
let onQuit = null;

function create(callbacks) {
  onShowLogin = callbacks.onShowLogin;
  onQuit = callbacks.onQuit;
  
  // Créer une icône simple (16x16 bleu)
  const icon = createTrayIcon();
  tray = new Tray(icon);
  
  tray.setToolTip('Antigone RH Agent');
  updateMenu();
  
  tray.on('click', () => {
    if (config.isLoggedIn()) {
      // Afficher le menu
      tray.popUpContextMenu();
    } else {
      // Ouvrir la fenêtre de login
      if (onShowLogin) onShowLogin();
    }
  });
  
  console.log('[Tray] Icône système créée');
}

function updateMenu() {
  if (!tray) return;
  
  const isLoggedIn = config.isLoggedIn();
  const username = config.get('username') || '';
  const clockedIn = config.get('clockedIn') || false;
  
  const menuTemplate = [];
  
  // Header
  menuTemplate.push({
    label: 'Antigone RH Agent v1.0',
    enabled: false
  });
  menuTemplate.push({ type: 'separator' });
  
  if (isLoggedIn) {
    menuTemplate.push({
      label: `👤 Connecté: ${username}`,
      enabled: false
    });
    menuTemplate.push({
      label: clockedIn ? '🟢 Pointé (En service)' : '🔴 Non pointé',
      enabled: false
    });
    menuTemplate.push({ type: 'separator' });
    menuTemplate.push({
      label: '🔄 Rafraîchir config',
      click: async () => {
        const api = require('./api');
        await api.fetchConfig();
        updateMenu();
      }
    });
    menuTemplate.push({ type: 'separator' });
    menuTemplate.push({
      label: '🚪 Se déconnecter',
      click: () => {
        config.set('isLoggedIn', false);
        config.set('token', null);
        config.set('employeId', null);
        config.set('username', null);
        config.set('clockedIn', false);
        updateMenu();
        if (onShowLogin) onShowLogin();
      }
    });
  } else {
    menuTemplate.push({
      label: '🔑 Se connecter',
      click: () => {
        if (onShowLogin) onShowLogin();
      }
    });
  }
  
  menuTemplate.push({ type: 'separator' });
  menuTemplate.push({
    label: '❌ Quitter',
    click: () => {
      if (onQuit) onQuit();
    }
  });
  
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
}

// Mettre à jour le tooltip
function setStatus(status) {
  if (tray) {
    tray.setToolTip(`Antigone RH Agent - ${status}`);
  }
}

// Créer une icône simple programmatiquement (évite le besoin d'un fichier .ico)
function createTrayIcon() {
  // Icône 16x16 simple en bleu  
  const size = 16;
  const canvas = nativeImage.createEmpty();
  
  // Utiliser un buffer RGBA pour créer une icône bleue simple
  const buffer = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Créer un cercle bleu
      const cx = size / 2, cy = size / 2, r = size / 2 - 1;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        buffer[idx] = 25;      // R
        buffer[idx + 1] = 118;  // G (1976d2)
        buffer[idx + 2] = 210;  // B
        buffer[idx + 3] = 255;  // A
      } else {
        buffer[idx + 3] = 0;   // Transparent
      }
    }
  }
  
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

function destroy() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { create, updateMenu, setStatus, destroy };
