import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

import { setTypes, setGroups } from './menu';
import { toKebab } from '../common/util';

const CONFIG_FILE = 'database.properties';
const DEFAULT_DB_URL = 'mongodb+srv://venator-ifskr.mongodb.net/ven2';

let clientPromise;

export async function connect (username, password) {
  let client;
  if (clientPromise) {
    client = await clientPromise;
  } else {
    const url = DEFAULT_DB_URL.replace(/:\/\//u, `://${username}:${password}@`);
    clientPromise = MongoClient.connect(url, { appname: 'ven2-forest', useNewUrlParser: true });
    client = await clientPromise;
    try {
      const p = path.join(app.getPath('userData'), CONFIG_FILE);
      fs.writeFileSync(p, `url=${url}\n`, { encoding: 'utf8', mode: 0o600 });
    } catch (e) {
      // IGNORE
    }
  }
  return (await client.db().collections()).map((x) => x.s.name);
}

export async function connectAtStartup () {
  const ini = fs.readFileSync(path.join(app.getPath('userData'), CONFIG_FILE), 'utf8');
  const matchUrl = /^\s*url\s*=\s*(.+?)\s*$/mu.exec(ini);
  let url = matchUrl ? matchUrl[1] : DEFAULT_DB_URL;
  let hasUserAndPass = /^mongodb(?:\+srv)?:\/\/\S+:\S+@\S+$/u.test(url);
  if (!hasUserAndPass) {
    const matchUser = /^\s*username\s*=\s*(.+?)\s*$/mu.exec(ini);
    const matchPass = /^\s*password\s*=\s*(.+?)\s*$/mu.exec(ini);
    if (matchUser && matchPass) {
      url = url.replace('://', `://${matchUser[1]}:${matchPass[1]}@`);
      hasUserAndPass = true;
    }
  }
  if (hasUserAndPass) {
    clientPromise = MongoClient.connect(url, { appname: 'ven2-forest', useNewUrlParser: true });
    return connect();
  }
  return null;
}

export async function listGroups (exalt) {
  if (!clientPromise) {
    throw new Error('Database not connected');
  }
  const a = (await clientPromise)
    .db()
    .collection(toKebab(exalt))
    .distinct('group', {});
  const b = await a;
  b.sort();
  return b.map((x) => x || 'General Charms');
}

export async function loadCharmGroup (exalt, group, options) {
  if (!clientPromise) {
    throw new Error('Database not connected');
  }
  if (!options && typeof group === 'object') {
    options = group;
    group = null;
  }
  const proxies = options?.proxies;
  let filter;
  if (proxies) {
    filter = { 'for.exalt': exalt };
    if (group) {
      filter['for.group'] = group;
    }
  } else {
    filter = {};
    if (group) {
      filter.group = group;
    }
  }
  return (await clientPromise)
    .db()
    .collection(proxies ? 'proxies' : toKebab(exalt))
    .find(filter, { projection: { _id: 0 } })
    .toArray();
}

export async function loadWithProxies (exalt, group, options) {
  if (!clientPromise) {
    throw new Error('Database not connected');
  }
  if (!options && typeof group === 'object') {
    options = group;
    group = null;
  }
  if (!options) {
    options = {};
  }
  const opt1 = { ...options, proxies: false };
  const opt2 = { ...options, proxies: true };
  const results = await Promise.all([
    loadCharmGroup(exalt, group, opt1),
    loadCharmGroup(exalt, group, opt2),
  ]);
  return [].concat(...results);
}

export async function disconnect () {
  if (clientPromise) {
    const p = clientPromise;
    clientPromise = null;
    try {
      (await p).close(true);
    } catch (e) {
      // IGNORE
    }
  }
}

export function initIpc (errorHandler) {
  ipcMain.on('connect', (evt, { username, password }) => {
    connect(username, password)
      .then((collections) => {
        setTypes(collections);
        evt.sender.send('connected', { collections });
      })
      .catch(() => errorHandler(
        new Error('Login failed. Check your username and password and try again.')
      ));
  });

  ipcMain.on('disconnect', (evt) => {
    disconnect()
      .then(() => {
        setTypes([]);
        evt.sender.send('disconnected');
      })
      .catch(errorHandler);
  });

  ipcMain.on('refreshGroups', (evt, { type }) => {
    listGroups(type)
      .then((groups) => {
        setGroups(type, groups);
        evt.sender.send('setGroups', { type, groups });
      })
      .catch(errorHandler);
  });

  ipcMain.on('refreshCharms', (evt, { type, group }) => {
    loadWithProxies(type, group)
      .then((charms) => evt.sender.send('renderCharms', { type, group, charms }))
      .catch(errorHandler);
  });
}
