<template>
  <div id="app" class="uk-flex uk-flex-column">
    <ven-navbar class="uk-flex-none"></ven-navbar>
    <vk-grid gutter="collapse" class="main">
      <ven-visualizer class="uk-width-expand" v-vk-height-viewport.offsetTop></ven-visualizer>
      <ven-inspector class="uk-width-large" v-vk-height-viewport.offsetTop></ven-inspector>
    </vk-grid>
  </div>
</template>

<style>
.brand-font { font-family: 'Pterra', fantasy }
body { overflow: hidden; }
</style>

<script>
import '../assets/css/Pterra.font.css';

import { mapState } from 'vuex/dist/vuex.esm';
import VkHeightViewport from 'vuikit/lib/height-viewport';
import { Grid as VkGrid } from 'vuikit/lib/grid';

import VenNavbar from './navbar.vue';
import VenVisualizer from '../visualizer/visualizer.vue';
import VenInspector from '../inspector/inspector.vue';

export default {
  components: {
    VenNavbar, VenVisualizer, VenInspector, VkGrid,
  },
  directives: { VkHeightViewport },
  computed: {
    ...mapState(['title']),
  },
  watch: {
    title (newValue) {
      document.title = newValue;
    },
  },
};
</script>
