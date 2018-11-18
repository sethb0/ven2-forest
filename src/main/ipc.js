import { ipcMain } from 'electron';

import { connect, disconnect, listGroups, loadWithProxies } from './db';

export function init (errorHandler) {
  ipcMain.on('connect', (evt, { username, password }) => {
    connect(username, password)
      .then((collections) => evt.sender.send('connected', { collections }))
      .catch(() => errorHandler(
        new Error('Login failed. Check your username and password and try again.')
      ));
  });

  ipcMain.on('disconnect', (evt) => {
    disconnect()
      .then(() => evt.sender.send('disconnected'))
      .catch(errorHandler);
  });

  ipcMain.on('refreshGroups', (evt, { type }) => {
    listGroups(type)
      .then((groups) => evt.sender.send('setGroups', { type, groups }))
      .catch(errorHandler);
  });

  ipcMain.on('refreshCharms', (evt, { type, group }) => {
    loadWithProxies(type, group)
      .then((charms) => evt.sender.send('setCharms', { type, group, charms }))
      .catch(errorHandler);
  });
}

export function send (win, command) {
  win.webContents.send(command);
}
