<template>
  <div id="inspector">
    <div class="markdown-body" v-html="html">
    </div>
  </div>
</template>

<style>
#inspector {
  background-color: floralwhite;
  overflow-y: scroll;
  overscroll-behavior: contain;
}
.markdown-body {
  padding: 10px 15px;
  font-size: 11pt;
}
.markdown-body, .markdown-body * {
  font-family: 'Source Sans Pro', sans-serif;
  color: #6b4423; /* kobicha */
}
.markdown-body strong {
  font-weight: 700;
}
</style>

<script>
import { mapState } from 'vuex/dist/vuex.esm';
import Markdown from 'markdown-it';
import MarkdownDeflist from 'markdown-it-deflist';

const md = new Markdown({ breaks: true })
  .use(MarkdownDeflist);

export default {
  data () {
    return { html: '' };
  },
  computed: mapState(['charms', 'selectedCharm', 'activeGroup']),
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
              this.html = md.render(formatDescription(charm, variant, this.activeGroup));
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

function formatDescription (charm, variant, group) {
  let name = charm.name;
  if (variant?.name) {
    if (name.includes('{')) {
      name = name.replace(/\{.*\}/u, variant.name);
    } else {
      name = `${name}: ${variant.name}`;
    }
  }
  let description = reformatLineBreaks(charm.description);
  if (variant?.description) {
    description = `${description}
### ${variant.name}
${reformatLineBreaks(variant.description)}`;
  }
  const p = charm.prerequisites;
  const minEssence = Math.max(p?.essence || 0, variant?.prerequisites?.essence || 0);
  const minTraits = { ...p?.traits || {}, ...variant?.prerequisites?.traits || {} };
  const minima = [];
  for (const [k, v] of Object.entries(minTraits)) {
    minima.push(`${k === '_' ? group : k} ${v}`);
  }
  if (minEssence) {
    minima.push(`Essence ${minEssence}`);
  }
  let details = [];
  if (charm.type !== 'knack') {
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
    details = [
      `\n**Keywords:** ${keywords.length ? keywords.join(', ') : '\u2014'}`,
      `\n**Cost:** ${charm.cost || '\u2014'}`,
      `\n**Action:** ${charm.action}`,
    ];
    if (charm.duration) {
      details.push(`\n**Duration:** ${charm.duration}`);
    }
  }
  return `## ${name}
**Minima:** ${minima.length ? minima.join(', ') : '(see below)'}${details.join('')}

${description}`;
}

function reformatLineBreaks (description) {
  description = (description || '')
    .replace(/\n([^-|])/gu, '\n\n$1')
    .replace(/(\n- [^\n]+)\n\n([^-])/gu, '$1\n$2');
  while (description.endsWith('\n')) {
    description = description.slice(0, -1);
  }
  return description;
}
</script>
