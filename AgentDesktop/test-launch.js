const { app, BrowserWindow, dialog } = require('electron');

process.on('uncaughtException', (err) => {
  console.error('CRASH:', err.stack);
  dialog.showErrorBox('Crash', err.stack || err.message);
});

app.whenReady().then(() => {
  console.log('APP READY!');
  
  // Test 1: Create simple window
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  
  win.loadURL('data:text/html,<h1>Agent Test OK!</h1><p>Electron fonctionne.</p>');
  win.show();
  
  console.log('WINDOW SHOWN!');
});

app.on('window-all-closed', () => app.quit());
