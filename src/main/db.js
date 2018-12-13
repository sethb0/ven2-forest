import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

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
    } catch (err) {
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

export async function listGroups (type) {
  if (!clientPromise) {
    throw new Error('Database not connected');
  }
  const a = (await clientPromise)
    .db()
    .collection(toKebab(type))
    .distinct('group', {});
  const b = await a;
  b.sort();
  return b.filter((x) => x);
}

export async function loadCharmGroup (type, group, options) {
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
    filter = { 'for.exalt': type };
    filter['for.group'] = group || { $exists: 0 };
  } else {
    filter = { group: group || { $exists: 0 } };
  }
  return (await clientPromise)
    .db()
    .collection(proxies ? 'proxies' : toKebab(type))
    .find(filter, { projection: { _id: 0 } })
    .toArray();
}

export async function loadWithProxies (type, group, options) {
  if (!clientPromise) {
    throw new Error('Database not connected');
  }
  if (!options) {
    options = {};
  }
  const opt1 = { ...options, proxies: false };
  const opt2 = { ...options, proxies: true };
  const results = await Promise.all([
    loadCharmGroup(type, group, opt1),
    loadCharmGroup(type, group, opt2),
  ]);
  return [].concat(...results);
}

export async function loadWithProxiesAndGenerics (type, group, options) {
  if (!clientPromise) {
    throw new Error('Database not connected');
  }
  if (!options) {
    options = {};
  }
  const opt1 = { ...options, proxies: false };
  const opt2 = { ...options, proxies: true };
  const results = await Promise.all([
    loadCharmGroup(type, '', opt1),
    loadCharmGroup(type, group, opt1),
    loadCharmGroup(type, group, opt2),
  ]);
  return [].concat(...results);
}

export async function disconnect () {
  if (clientPromise) {
    const p = clientPromise;
    clientPromise = null;
    try {
      (await p).close(true);
    } catch (err) {
      // IGNORE
    }
  }
}

export function initIpc (errorHandler) {
  ipcMain.on('connect', async (evt, { username, password }) => {
    let types;
    try {
      types = await connect(username, password);
    } catch (err) {
      errorHandler('Login failed. Check your username and password and try again.');
      return;
    }
    evt.sender.send('connected', { types });
  });

  ipcMain.on('disconnect', async (evt) => {
    try {
      await disconnect();
    } catch (err) {
      errorHandler(err.message);
    }
    evt.sender.send('disconnected');
  });

  ipcMain.on('refreshGroups', async (evt, { type }) => {
    let groups;
    try {
      groups = await listGroups(type);
    } catch (err) {
      errorHandler(err.message);
      return;
    }
    evt.sender.send('setGroups', { type, groups });
  });

  ipcMain.on('refreshCharms', async (evt, { type, group }) => {
    let charms;
    try {
      if (
        ['Heretical', 'Martial Arts', 'Occult'].includes(group)
        && ['Alchemical', 'Infernal', 'Lunar'].includes(type)
      ) {
        charms = await loadWithProxies(type, group);
      } else {
        charms = filterGenerics(await loadWithProxiesAndGenerics(type, group), type, group);
      }
    } catch (err) {
      errorHandler(err.message);
      return;
    }
    evt.sender.send('renderCharms', { type, group, charms });
  });
}

function filterGenerics (charms, type, group) {
  let g = group;
  if (g.includes(' ')) {
    g = g.replace(/ (\S?)/gu, (match, p1) => p1.toUpperCase());
  }
  const out = [];
  for (const charm of charms) {
    if (charm.type === 'generic') {
      if (charm.variants) {
        const ch = { ...charm };
        let variant;
        for (const v of ch.variants) {
          if (v.id === g) {
            variant = v;
            break;
          }
        }
        if (variant?.description) {
          const gTxt = group === 'Ebon Dragon' ? 'The Ebon Dragon' : group;
          ch.description = `${ch.description}\n### ${gTxt}\n${variant.description}`;
        }
        ch.name = renameCharm(ch, group, variant);
        delete ch.variants;
        out.push(ch);
      } else if (
        !(
          (charm.id === 'Infernal.2ndExcellency' && g === 'EbonDragon')
          || (
            charm.id === 'Abyssal.RaveningMouthOf'
            && !['Archery', 'MartialArts', 'Melee', 'Thrown'].includes(g)
          )
        )
      ) {
        out.push({ ...charm, name: renameCharm(charm, group) });
      }
    } else {
      out.push(charm);
    }
  }
  return out;
}

function renameCharm (charm, group, variant) {
  if (variant?.name) {
    return variant.name;
  }
  if (charm.name.includes('{')) {
    return charm.name.replace(/\{.*\}/u, group);
  }
  return `${charm.name}: ${group}`;
}
