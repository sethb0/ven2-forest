import Vue from 'vue/dist/vue.runtime.esm';
import Vuex from 'vuex/dist/vuex.esm';

import { toKebab } from '../common/util';

Vue.use(Vuex);

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production', // eslint-disable-line no-process-env
  state: {
    connected: false,
    title: '',
    enabledTypes: ['infernal'],
    groups: [],
    activeType: '',
    activeGroup: '',
    charms: [],
    svgElement: null,
    selectedCharm: '',
    pack: false,
    topdown: false,
  },
  mutations: {
    connected (state, payload) {
      if (typeof payload !== 'boolean') {
        throw new TypeError('Invalid data received for "connected" in store');
      }
      state.connected = payload;
    },
    title (state, payload) {
      if (typeof payload !== 'string') {
        throw new TypeError('Invalid data received for "title" in store');
      }
      state.title = payload;
    },
    enabledTypes (state, payload) {
      if (!Array.isArray(payload) || payload.some((x) => typeof x !== 'string')) {
        throw new TypeError('Invalid data received for "enabledTypes" in store');
      }
      state.enabledTypes = payload;
    },
    groups (state, payload) {
      if (!Array.isArray(payload) || payload.some((x) => typeof x !== 'string')) {
        throw new TypeError('Invalid data received for "groups" in store');
      }
      state.groups = payload;
    },
    activeType (state, payload) {
      if (typeof payload !== 'string') {
        throw new TypeError('Invalid data received for "activeType" in store');
      }
      state.activeType = payload;
    },
    activeGroup (state, payload) {
      if (typeof payload !== 'string') {
        throw new TypeError('Invalid data received for "activeGroup" in store');
      }
      state.activeGroup = payload;
    },
    charms (state, payload) {
      if (!Array.isArray(payload)) {
        throw new TypeError('Invalid data received for "charms" in store');
      }
      // Not going to do deep inspection--too computationally expensive for too little gain.
      state.charms = payload;
    },
    svgElement (state, payload) {
      state.svgElement = payload;
    },
    selectedCharm (state, payload) {
      if (typeof payload !== 'string') {
        throw new TypeError('Invalid data received for "selectedCharm" in store');
      }
      state.selectedCharm = payload;
    },
    pack (state, payload) {
      if (typeof payload !== 'boolean') {
        throw new TypeError('Invalid data received for "pack" in store');
      }
      state.pack = payload;
    },
    topdown (state, payload) {
      if (typeof payload !== 'boolean') {
        throw new TypeError('Invalid data received for "topdown" in store');
      }
      state.topdown = payload;
    },
  },
  actions: {
    setConnected ({ commit }, payload) {
      commit('connected', payload);
    },
    setEnabledTypes ({ state, commit }, payload) {
      commit('enabledTypes', payload);
      if (!payload.includes(toKebab(state.activeType))) {
        commit('activeType', '');
      }
    },
    setGroups ({ state, commit }, payload) {
      commit('groups', payload);
      if (!payload.includes(state.activeGroup)) {
        commit('activeGroup', payload.length ? payload[0] : '');
      }
    },
    setCharms ({ commit }, payload) {
      commit('charms', payload);
    },
    setSvgElement ({ commit }, payload) {
      commit('svgElement', payload);
    },
    setTitle ({ commit }, payload) {
      commit('title', payload);
    },
    setSelectedCharm ({ commit }, payload) {
      commit('selectedCharm', payload);
    },
    setPack ({ commit }, payload) {
      commit('pack', payload);
    },
    setTopdown ({ commit }, payload) {
      commit('topdown', payload);
    },
  },
});
