import '@vuikit/theme';

import { ipcRenderer } from 'electron';
import Vue from 'vue/dist/vue.runtime.esm';
import { mapState } from 'vuex/dist/vuex.esm';

import App from './toplevel/app.vue';
import store from './store';
import { initWorkers } from './workers';

ipcRenderer.on('setCharacter', (evt, { title }) => {
  if (title) {
    document.title = `${title} \u2014 Forest`;
  } else {
    document.title = 'Forest';
  }
});

let requestTimer = 0;

new Vue({
  store,
  render: (h) => h(App),
  computed: mapState(['activeType', 'activeGroup']),
  watch: {
    activeType (newValue) {
      ipcRenderer.send('refreshGroups', { type: newValue });
      scheduleReload();
    },
    activeGroup (newValue) {
      if (requestTimer) {
        clearTimeout(requestTimer);
        requestTimer = 0;
      }
      ipcRenderer.send('refreshCharms', { type: this.activeType, group: newValue });
    },
  },
  mounted () {
    initIpc();
    initWorkers(store);
    ipcRenderer.send('refreshTitle');
  },
}).$mount('#app');

function initIpc () {
  ipcRenderer.on('connected', (evt, { types }) => {
    store.dispatch('setEnabledTypes', types);
    store.dispatch('setConnected', true);
    if (store.state.activeType) {
      ipcRenderer.send('refreshGroups', { type: store.state.activeType });
      scheduleReload();
    }
  });
  ipcRenderer.on('disconnected', () => {
    store.dispatch('setConnected', false);
  });
  ipcRenderer.on('setGroups', (evt, { type, groups }) => {
    if (type === store.state.activeType) {
      store.dispatch('setGroups', groups);
    }
  });
  ipcRenderer.on('renderCharms', (evt, { type, group, charms }) => {
    if (type === store.state.activeType || group === store.state.activeGroup) {
      if (requestTimer) {
        clearTimeout(requestTimer);
        requestTimer = 0;
      }
      store.dispatch('setCharms', charms);
    }
  });
}

function scheduleReload () {
  if (requestTimer) {
    clearTimeout(requestTimer);
  }
  requestTimer = setTimeout(() => {
    requestTimer = 0;
    ipcRenderer.send('refreshCharms', {
      type: store.state.activeType, group: store.state.activeGroup,
    });
  }, 200);
}
