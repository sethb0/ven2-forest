<template>
  <div id="visualizer"></div>
</template>

<style>
#visualizer { background-color: ghostwhite; overflow: hidden; }
</style>

<script>
import { mapState } from 'vuex/dist/vuex.esm';
import svgPanZoom from 'svg-pan-zoom';

const MIN_ZOOM = 0.02;

let annotatedElement;
let panZoom;

export default {
  computed: mapState(['svgElement']),
  methods: {
    onClick (evt) {
      let element = evt.target;
      while (!element.id || element.id.startsWith('a_')) {
        element = element.parentElement;
      }
      this.$store.dispatch('setSelectedCharm', element.id);
    },
  },
  watch: {
    svgElement (newValue) {
      const parent = document.getElementById('visualizer');
      if (annotatedElement) {
        if (panZoom) {
          panZoom.destroy();
        }
        parent.removeChild(annotatedElement);
      }
      if (newValue) {
        annotatedElement = annotate(newValue, (evt) => ::this.onClick(evt));
        parent.appendChild(annotatedElement);
        panZoom = svgPanZoom(annotatedElement, {
          dblClickZoomEnabled: false,
          minZoom: MIN_ZOOM,
          maxZoom: 1,
          fit: false,
          center: false,
        });
        panZoom.zoomAtPoint(MIN_ZOOM, { x: 0, y: 0 });
      } else {
        annotatedElement = null;
        panZoom = null;
      }
    },
  },
};

function annotate (svg, handler) {
  svg.getElementById('a_graph0').remove();
  for (const el of svg.querySelectorAll('title')) {
    el.remove();
  }
  for (const el of svg.querySelectorAll('g.node a, g.cluster a')) {
    el.onclick = handler;
  }
  return svg;
}
</script>
