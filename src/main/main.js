/* eslint no-process-env: off */
import { app, dialog, ipcMain, protocol, BrowserWindow } from 'electron';
import { createProtocol, installVueDevtools } from 'vue-cli-plugin-electron-builder/lib';
import { load as loadYaml } from '@sethb0/yaml-utils';
import { basename } from 'path';

import { connectAtStartup, disconnect, initIpc } from './db';
import { installMenu, enableCloseCharacter, disableCloseCharacter, enableView, disableView }
  from './menu';

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let toolsWin;

let title = '';

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], { secure: true });

// Windows thingy I don't understand but electron-builder doco recommends it
// (hurrah for cargo-cult programming!)
// must match appId from vue.config.js
app.setAppUserModelId('ws.sharpcla.venator.forest');

function errorHandler (message) {
  dialog.showMessageBox(win, {
    type: 'error',
    buttons: ['OK'],
    defaultId: 0,
    message,
  }, () => null);
}

initIpc((err) => errorHandler(err.message));

app.on('quit', () => {
  disconnect();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!win) {
    createWindow();
  }
});

let characterFileToOpen;

app.on('will-finish-launching', () => {
  app.on('open-file', (evt, path) => {
    evt.preventDefault();
    if (app.isReady()) {
      openCharacter(path);
    } else {
      characterFileToOpen = path;
    }
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (IS_DEVELOPMENT && !process.env.IS_TEST) {
    // Install Vue Devtools
    await installVueDevtools();
  }
  installMenu(openCharacter, closeCharacter);
  createWindow();
  if (characterFileToOpen) {
    openCharacter(characterFileToOpen);
    characterFileToOpen = null;
  }
});

ipcMain.on('refreshTitle', (evt) => {
  evt.sender.send('setCharacter', { title });
});

// Exit cleanly on request from parent process in development mode.
if (IS_DEVELOPMENT) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 200,
    webPreferences: { defaultEncoding: 'UTF-8' },
  });

  if (IS_DEVELOPMENT) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) {
      toolsWin = new BrowserWindow({ center: false });
      win.webContents.setDevToolsWebContents(toolsWin.webContents);
      win.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadFile('index.html');
  }

  win.once('show', async () => {
    try {
      const types = await connectAtStartup();
      if (types) {
        win.webContents.send('connected', { types });
      }
    } catch (err) {
      errorHandler(err.message);
    }
    enableView();
  });

  win.on('closed', () => {
    win = null;
    if (toolsWin) {
      toolsWin.destroy();
      toolsWin = null;
    }
    disableView();
    disableCloseCharacter();
    title = '';
  });
}

function openCharacter (path) {
  if (typeof path === 'string') {
    doOpenCharacter(path);
  } else {
    dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'YAML Files', extensions: ['yml'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    }, (p) => p?.length && doOpenCharacter(p[0]));
  }
}

async function doOpenCharacter (p) {
  let data;
  try {
    data = await loadYaml(p);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`${p} is not a valid character data file`);
    }
  } catch (err) {
    dialog.showMessageBox(win, {
      type: 'error',
      buttons: ['OK'],
      message: err.message,
    }, () => null);
    return;
  }
  app.addRecentDocument(p);
  if (!win) {
    createWindow();
  }
  win.setRepresentedFilename(p);
  title = basename(p);
  win.webContents.send('setCharacter', { data, title });
  enableCloseCharacter();
}

function closeCharacter () {
  win.setRepresentedFilename('');
  title = '';
  win.webContents.send('setCharacter', { data: {}, title });
  disableCloseCharacter();
}
