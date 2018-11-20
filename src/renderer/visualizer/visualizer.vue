<template>
  <div id="visualizer" :class="visClass"></div>
</template>

<style>
#visualizer { overflow: hidden; }

:root, [data-theme] [data-theme^="light"] {
  --visualizer-background: ghostwhite;
  --visualizer-edge: black;
  --visualizer-edge-width: 1px;

  --abyssal-charm: darkgray;
  --abyssal-cluster: gainsboro;
  --alchemical-charm: darkorange;
  --alchemical-cluster: navajowhite;
  --dragon-blooded-charm: indianred;
  --dragon-blooded-cluster: rosybrown;
  --infernal-charm: lightgreen;
  --infernal-cluster: darkseagreen;
  --jadeborn-charm: peru;
  --jadeborn-cluster: burlywood;
  --lunar-charm: lightskyblue;
  --lunar-cluster: dodgerblue;
  --raksha-charm: forestgreen;
  --raksha-cluster: yellowgreen;
  --sidereal-charm: plum;
  --sidereal-cluster: mediumpurple;
  --solar-charm: gold;
  --solar-cluster: goldenrod;
  --tma-charm: indianred;
  --tma-cluster: rosybrown;
  --cma-charm: lightsteelblue;
  --cma-cluster: thistle;
  --sma-charm: plum;
  --sma-cluster: mediumpurple;
}
[data-theme^="dark"], [data-theme] [data-theme^="dark"] {
  --visualizer-background: #1c1e1f;
  --visualizer-edge: white;
  --visualizer-edge-width: 2px;

  --infernal-charm: #206c20;
  --infernal-cluster: #004800;
  --solar-charm: #9c7408;
  --solar-cluster: #98460c;
  --cma-charm: #383880;
  --cma-cluster: #242470;
}

#visualizer {
  background-color: var(--visualizer-background);
}

#visualizer.abyssal {
  --visualizer-charm: var(--abyssal-charm);
  --visualizer-cluster: var(--abyssal-cluster);
}
#visualizer.alchemical {
  --visualizer-charm: var(--alchemical-charm);
  --visualizer-cluster: var(--alchemical-cluster);
}
#visualizer.dragon-blooded {
  --visualizer-charm: var(--dragon-blooded-charm);
  --visualizer-cluster: var(--dragon-blooded-cluster);
}
#visualizer.infernal {
  --visualizer-charm: var(--infernal-charm);
  --visualizer-cluster: var(--infernal-cluster);
}
#visualizer.jadeborn {
  --visualizer-charm: var(--jadeborn-charm);
  --visualizer-cluster: var(--jadeborn-cluster);
}
#visualizer.lunar {
  --visualizer-charm: var(--lunar-charm);
  --visualizer-cluster: var(--lunar-cluster);
}
#visualizer.raksha {
  --visualizer-charm: var(--raksha-charm);
  --visualizer-cluster: var(--raksha-cluster);
}
#visualizer.sidereal {
  --visualizer-charm: var(--sidereal-charm);
  --visualizer-cluster: var(--sidereal-cluster);
}
#visualizer.solar {
  --visualizer-charm: var(--solar-charm);
  --visualizer-cluster: var(--solar-cluster);
}
#visualizer.terrestrial-martial-arts {
  --visualizer-charm: var(--tma-charm);
  --visualizer-cluster: var(--tma-cluster);
}
#visualizer.celestial-martial-arts {
  --visualizer-charm: var(--cma-charm);
  --visualizer-cluster: var(--cma-cluster);
}
#visualizer.sidereal-martial-arts {
  --visualizer-charm: var(--sma-charm);
  --visualizer-cluster: var(--sma-cluster);
}

#visualizer text {
  fill: var(--visualizer-edge);
}
#visualizer .edge *|path, #visualizer *|polygon, #visualizer *|ellipse {
  stroke: var(--visualizer-edge);
}
#visualizer .edge *|path, #visualizer .edge *|polygon {
  stroke-width: var(--visualizer-edge-width);
}
#visualizer .edge *|polygon {
  fill: var(--visualizer-edge);
}
#visualizer .node *|polygon, #visualizer .node *|ellipse {
  fill: var(--visualizer-charm);
}
#visualizer .cluster *|polygon {
  fill: var(--visualizer-cluster);
}
</style>

<script>
import { mapState } from 'vuex/dist/vuex.esm';
import svgPanZoom from 'svg-pan-zoom';

import { toKebab } from '../../common/util';

const MIN_ZOOM = 0.02;

let postprocessedElement;
let panZoom;

export default {
  computed: {
    ...mapState(['activeType', 'svgElement']),
    visClass () {
      return toKebab(this.activeType);
    },
  },
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
  for (const el of svg.querySelectorAll('[fill]')) {
    if (el.getAttribute('fill') !== 'none') {
      el.removeAttribute('fill');
    }
  }
  for (const el of svg.querySelectorAll('[stroke]')) {
    if (el.getAttribute('stroke') !== 'none') {
      el.removeAttribute('stroke');
    }
  }
  for (const el of svg.querySelectorAll('g.node a, g.cluster a')) {
    el.onclick = handler;
  }
  return svg;
}
</script>
