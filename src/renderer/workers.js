/* eslint no-process-env: off */
import { dialog, ipcRenderer } from 'electron';
import Viz from 'viz.js/viz.es';

import GvWorker from './visualizer/gv.worker';

const VIZ_WORKER_URL = process.env.NODE_ENV === 'production'
  ? `${process.env.BASE_URL}/lite.render.js`
  : '/lite.render.js';

let gvWorker;
let viz;

export function initWorkers (store) {
  try {
    viz = new Viz({ workerURL: VIZ_WORKER_URL });
  } catch (err) {
    dialog.showErrorBox('Viz.js initialization failed', err.message);
    return;
  }

  gvWorker = new GvWorker();
  gvWorker.onmessage = async (evt) => {
    const { type, group, gv, title } = evt.data;
    if (type === store.state.activeType && group === store.state.activeGroup) {
      try {
        store.dispatch('setSvgElement', await viz.renderSVGElement(gv));
        store.dispatch('setTitle', title);
      } catch (err) {
        viz = new Viz({ workerURL: VIZ_WORKER_URL });
        console.error(err); // eslint-disable-line no-console
      }
    }
  };
  ipcRenderer.on('renderCharms', (evt, { type, group, charms }) => {
    if (type === store.state.activeType && group === store.state.activeGroup) {
      gvWorker.postMessage({
        type,
        group,
        charms,
        options: {
          topdown: store.state.topdown,
          pack: store.state.pack,
          character: store.state.character,
        },
      });
    }
  });
  ipcRenderer.on('setCharacter', (evt, { data }) => {
    const character = processCharacterData(data);
    store.dispatch('setCharacter', character);
    gvWorker.postMessage({
      type: store.state.activeType,
      group: store.state.activeGroup,
      charms: store.state.charms,
      options: { topdown: store.state.topdown, pack: store.state.pack, character },
    });
  });
  ipcRenderer.on('setOptions', (evt, { topdown, pack }) => {
    store.dispatch('setPack', pack);
    store.dispatch('setTopdown', topdown);
    gvWorker.postMessage({
      type: store.state.activeType,
      group: store.state.activeGroup,
      charms: store.state.charms,
      options: { topdown, pack, character: store.state.character },
    });
  });
  ipcRenderer.on('redisplay', () => {
    gvWorker.postMessage({
      type: store.state.activeType,
      group: store.state.activeGroup,
      charms: store.state.charms,
      options: {
        topdown: store.state.topdown,
        pack: store.state.pack,
        character: store.state.character,
      },
    });
  });
}

function processCharacterData (data) {
  if (!data || !(data.charms || data.installed || data.uninstalled)) {
    return [];
  }
  const characterCharms = [].concat(
    processCharacterCharmBatch(data.charms),
    processCharacterCharmBatch(data.installed),
    processCharacterCharmBatch(data.uninstalled),
  );
  return characterCharms;
}

function processCharacterCharmBatch (x) {
  if (!x || typeof x !== 'object') {
    return [];
  }
  if (Array.isArray(x)) {
    return [].concat(...x.map(processCharacterCharmBatch));
  }
  if (x.id) {
    return [{
      id: x.id,
      variant: x.variant,
      count: x.diminished ?? (x.augmented || x.experienced || x.bonus || x.creation || 0),
    }];
  }
  if (x.name) {
    // we don't currently look up Charms by name
    return [];
  }
  return processCharacterCharmBatch(Object.values(x));
}
