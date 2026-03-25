// Main Process - Antigone RH Desktop Agent
// Point d'entrée de l'application Electron
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Catch uncaught errors globally
process.on('uncaughtException', (err) => {
  console.error('[Agent] UNCAUGHT ERROR:', err);
  try { dialog.showErrorBox('Agent Error', err.stack || err.message); } catch {}
});

let loginWindow = null;
let isQuitting = false;

// Lazy-loaded modules (after app ready)
let config, api, activity, heartbeat, popupManager, trayManager;

// ========================================
// Empêcher les instances multiples
// ========================================
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Agent] Autre instance détectée, fermeture...');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (loginWindow) {
    if (loginWindow.isMinimized()) loginWindow.restore();
    loginWindow.focus();
  }
});

// ========================================
// Démarrage de l'application
// ========================================
app.whenReady().then(() => {
  console.log('[Agent] Démarrage de Antigone RH Agent v1.0');

  // Load modules after app is ready
  try {
    config = require('./config');
    api = require('./api');
    activity = require('./activity');
    heartbeat = require('./heartbeat');
    popupManager = require('./popup-manager');
    trayManager = require('./tray');
    console.log('[Agent] Tous les modules chargés');
  } catch (err) {
    console.error('[Agent] Erreur chargement modules:', err);
    dialog.showErrorBox('Agent Error', 'Erreur chargement modules: ' + err.message);
    app.quit();
    return;
  }

  // Créer le tray
  try {
    trayManager.create({
      onShowLogin: showLoginWindow,
      onQuit: quitApp
    });
    console.log('[Agent] Tray créé');
  } catch (err) {
    console.error('[Agent] Erreur tray:', err);
  }

  // Setup IPC handlers
  setupIPC();
  popupManager.setupIPC();

  // Vérifier si déjà connecté
  if (config.isLoggedIn()) {
    console.log('[Agent] Session existante trouvée, rafraîchissement config...');
    // Rafraîchir la config serveur AVANT de démarrer les services
    api.fetchConfig().then(() => {
      console.log('[Agent] Config rafraîchie, démarrage des services...');
    }).catch((err) => {
      console.log('[Agent] Config refresh échoué (utilisation du cache):', err.message);
    }).finally(() => {
      startServices();
      trayManager.updateMenu();
      trayManager.setStatus('Connecté');
    });
  } else {
    showLoginWindow();
  }

  // Auto-démarrage au boot Windows
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      path: app.getPath('exe')
    });
  } catch (e) {
    console.log('[Agent] Auto-start setup skipped:', e.message);
  }

  console.log('[Agent] Application initialisée');
}).catch((err) => {
  console.error('[Agent] FATAL:', err);
  try { dialog.showErrorBox('Agent Fatal Error', err.stack || err.message); } catch {}
});

// ========================================
// Fenêtre de Login
// ========================================
function showLoginWindow() {
  if (loginWindow) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 460,
    height: 550,
    resizable: false,
    maximizable: false,
    frame: false,
    transparent: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  loginWindow.loadFile(path.join(__dirname, 'login.html'));

  loginWindow.once('ready-to-show', () => {
    loginWindow.show();
    loginWindow.focus();
  });

  loginWindow.on('closed', () => {
    loginWindow = null;
  });
}

// ========================================
// IPC Handlers
// ========================================
function setupIPC() {
  ipcMain.on('login-attempt', async (event, { serverUrl, username, password }) => {
    console.log(`[Agent] Tentative de connexion: ${username} -> ${serverUrl}`);
    config.set('serverUrl', serverUrl);

    const result = await api.login(username, password);

    if (result.success) {
      console.log('[Agent] Connexion réussie!');
      startServices();
      trayManager.updateMenu();
      trayManager.setStatus('Connecté - ' + username);
      event.reply('login-result', { success: true });

      setTimeout(() => {
        if (loginWindow && !loginWindow.isDestroyed()) {
          loginWindow.close();
        }
      }, 1500);
    } else {
      event.reply('login-result', { success: false, message: result.message });
    }
  });

  ipcMain.on('login-minimize', () => {
    if (loginWindow) loginWindow.minimize();
  });

  ipcMain.on('login-close', () => {
    if (loginWindow) loginWindow.hide();
  });
}

// ========================================
// Services de monitoring
// ========================================
function startServices() {
  console.log('[Agent] Démarrage des services de monitoring...');
  activity.start((isActive) => {
    console.log('[Agent] Changement activité: ' + (isActive ? 'ACTIF' : 'INACTIF'));
  });
  heartbeat.start();
  popupManager.start();
  console.log('[Agent] Tous les services sont démarrés');
}

function stopServices() {
  console.log('[Agent] Arrêt des services...');
  if (activity) activity.stop();
  if (heartbeat) heartbeat.stop();
  if (popupManager) popupManager.stop();
}

// ========================================
// Gestion de la fermeture
// ========================================
function quitApp() {
  isQuitting = true;
  if (config && config.get('clockedIn')) {
    const network = require('./network');
    network.getNetworkInfo().then(netInfo => {
      return api.sendEvent('CLOCK_OUT', netInfo.localIP, netInfo.ssid);
    }).then(() => {
      config.set('clockedIn', false);
    }).catch(() => {}).finally(() => {
      stopServices();
      if (trayManager) trayManager.destroy();
      app.quit();
    });
  } else {
    stopServices();
    if (trayManager) trayManager.destroy();
    app.quit();
  }
}

app.on('window-all-closed', (e) => {
  if (!isQuitting) {
    e.preventDefault();
  }
});

app.on('before-quit', async () => {
  if (config && config.get('clockedIn')) {
    try {
      const network = require('./network');
      const netInfo = await network.getNetworkInfo();
      await api.sendEvent('CLOCK_OUT', netInfo.localIP, netInfo.ssid);
      config.set('clockedIn', false);
    } catch (e) {}
  }
  stopServices();
});
