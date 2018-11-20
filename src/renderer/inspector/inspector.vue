<template>
  <div id="inspector">
    <vue-simple-markdown :source="markdown"
      :emoji="false" :image="false" :highlight="false" :link="false" :linkify="false"
    ></vue-simple-markdown>
  </div>
</template>

<style>
:root, [data-theme] [data-theme^="light"] {
  --inspector-background: floralwhite;
  --inspector-text: #6b4423; /* kobicha */
}
[data-theme^="dark"], [data-theme] [data-theme^="dark"] {
  --inspector-background: #332c22;
  --inspector-text: antiquewhite;
}

#inspector {
  background-color: var(--inspector-background);
  overflow-y: scroll;
  overscroll-behavior: contain;
}
#inspector .markdown-body {
  padding: 10px 15px;
  font-size: 10pt;
}
#inspector .markdown-body, #inspector .markdown-body * {
  font-family: 'Source Sans Pro', sans-serif;
  color: var(--inspector-text);
}
#inspector .markdown-body strong {
  font-weight: 800;
}
</style>

<script>
import { mapState } from 'vuex/dist/vuex.esm';

export default {
  data () {
    return { markdown: '' };
  },
  computed: mapState(['charms', 'selectedCharm']),
  methods: {
    updateMarkdown () {
      if (this.charms && this.selectedCharm) {
        const m = /^([^\s.]+\.[^\s.]+)(?:\.(\S+))?$/u.exec(this.selectedCharm);
        const id = m ? m[1] : this.selectedCharm;
        const v = m && m[2];
        for (const charm of this.charms) {
          if (charm.id === id) {
            if (charm.type !== 'proxy') {
              let variant;
              if (v && charm.variants) {
                for (const vart of charm.variants) {
                  if (v === vart.id) {
                    variant = vart;
                    break;
                  }
                }
              }
              this.markdown = formatDescription(charm, variant);
            }
            break;
          }
        }
      }
    },
  },
  watch: {
    charms () {
      this.updateMarkdown();
    },
    selectedCharm () {
      this.updateMarkdown();
    },
  },
};

function formatDescription (charm, variant) {
  let description = (charm.description || '')
    .replace(/\n([^-])/gu, '\n\n$1')
    .replace(/(\n- [^\n]+)\n\n([^-])/gu, '$1\n$2');
  while (description.endsWith('\n')) {
    description = description.slice(0, -1);
  }
  if (variant?.description) {
    let variantDescription = variant.description.replace(/\n([^-])/gu, '\n\n$1');
    while (variantDescription.endsWith('\n')) {
      variantDescription = variantDescription.slice(0, -1);
    }
    description = `${description}\n### ${variant.name}\n${variantDescription}`;
  }
  const p = charm.prerequisites;
  const minEssence = p?.essence || 1;
  const minTraits = p?.traits || {};
  const minima = [`Essence ${minEssence}`];
  for (const [k, v] of Object.entries(minTraits)) {
    minima.push(`${k} ${v}`);
  }
  const keywords = Object.entries(charm.keywords || {}).map(([k, v]) => {
    if (v === true) {
      return k;
    }
    return `${k} ${v}`;
  });
  if (charm.martial) {
    const keys = Object.keys(charm.martial);
    keys.sort();
    keywords.push(`Martial (${keys.join(', ')})`);
  }
  if (charm['martial-ready']) {
    keywords.push('Martial-Ready');
  }
  if (charm.virtue) {
    const keys = Object.keys(charm.virtue);
    keys.sort();
    keywords.push(...keys.map((v) => `Virtue (${v})`));
  }
  keywords.sort();
  const details = [`**Cost:** ${charm.cost || '\u2014'}`, `**Action:** ${charm.action}`];
  if (charm.duration) {
    details.push(`**Duration:** ${charm.duration}`);
  }
  return `## ${charm.name}
**Minima:** ${minima.join(', ')}
**Keywords:** ${keywords.length ? keywords.join(', ') : '\u2014'}
${details.join('\n')}

${description}`;
}
</script>
