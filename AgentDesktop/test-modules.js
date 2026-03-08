const { app, BrowserWindow, dialog } = require('electron');

process.on('uncaughtException', (err) => {
  console.error('CRASH:', err.stack);
  try { dialog.showErrorBox('Crash', err.stack || err.message); } catch {}
});

app.whenReady().then(async () => {
  console.log('=== TESTING AGENT MODULES ===');
  
  let results = [];
  
  // Test config
  try {
    const config = require('./src/config');
    results.push('config.js: OK');
    console.log('isLoggedIn:', config.isLoggedIn());
  } catch (e) {
    results.push('config.js: FAIL - ' + e.message);
  }
  
  // Test api
  try {
    const api = require('./src/api');
    results.push('api.js: OK');
  } catch (e) {
    results.push('api.js: FAIL - ' + e.message);
  }
  
  // Test activity
  try {
    const activity = require('./src/activity');
    results.push('activity.js: OK');
  } catch (e) {
    results.push('activity.js: FAIL - ' + e.message);
  }
  
  // Test network
  try {
    const network = require('./src/network');
    results.push('network.js: OK');
  } catch (e) {
    results.push('network.js: FAIL - ' + e.message);
  }
  
  // Test heartbeat
  try {
    const heartbeat = require('./src/heartbeat');
    results.push('heartbeat.js: OK');
  } catch (e) {
    results.push('heartbeat.js: FAIL - ' + e.message);
  }
  
  // Test popup-manager
  try {
    const popup = require('./src/popup-manager');
    results.push('popup-manager.js: OK');
  } catch (e) {
    results.push('popup-manager.js: FAIL - ' + e.message);
  }
  
  // Test tray
  try {
    const tray = require('./src/tray');
    results.push('tray.js: OK');
  } catch (e) {
    results.push('tray.js: FAIL - ' + e.message);
  }
  
  const msg = results.join('\n');
  console.log(msg);
  
  const win = new BrowserWindow({ width: 500, height: 400 });
  win.loadURL('data:text/html,<pre style="font-size:16px;padding:20px">' + msg.replace(/\n/g, '<br>') + '</pre>');
  win.show();
});

app.on('window-all-closed', () => app.quit());
