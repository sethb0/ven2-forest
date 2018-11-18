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

let postprocessedElement;
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
      if (postprocessedElement) {
        if (panZoom) {
          panZoom.destroy();
        }
        parent.removeChild(postprocessedElement);
      }
      if (newValue) {
        postprocessedElement = postprocess(newValue, (evt) => ::this.onClick(evt));
        parent.appendChild(postprocessedElement);
        panZoom = svgPanZoom(postprocessedElement, {
          dblClickZoomEnabled: false,
          minZoom: MIN_ZOOM,
          maxZoom: 1,
          fit: false,
          center: false,
        });
        panZoom.zoomAtPoint(MIN_ZOOM, { x: 0, y: 0 });
      } else {
        postprocessedElement = null;
        panZoom = null;
      }
    },
  },
};

function postprocess (svg, handler) {
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
