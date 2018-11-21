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
        options: { topdown: store.state.topdown, pack: store.state.pack },
      });
    }
  });
  ipcRenderer.on('setOptions', (evt, { topdown, pack }) => {
    store.dispatch('setPack', pack);
    store.dispatch('setTopdown', topdown);
    gvWorker.postMessage({
      type: store.state.activeType,
      group: store.state.activeGroup,
      charms: store.state.charms,
      options: { topdown, pack },
    });
  });
  ipcRenderer.on('redisplay', () => {
    gvWorker.postMessage({
      type: store.state.activeType,
      group: store.state.activeGroup,
      charms: store.state.charms,
      options: { topdown: store.state.topdown, pack: store.state.pack },
    });
  });
}
