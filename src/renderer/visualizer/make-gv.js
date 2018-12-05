const FONT_FAMILY = 'Pterra';
const FONT_SIZE = 10;
const REAL_SHAPE = 'octagon';
const DUMMY_SHAPE = 'ellipse';
const GROUP_SHAPE = 'circle';

class Element {
  constructor (tag) {
    this.tag = tag;
    this.attributes = {};
  }

  render (indent = '') {
    return `${indent}${this.tag}${Element.renderAttributes(this.attributes)};`;
  }

  static renderAttributes (attributes) {
    const e = Object.entries(attributes);
    if (!e.length) {
      return '';
    }
    const line = [];
    for (const [k, v] of e) {
      line.push(`${k}=${Element.escape(v)}`);
    }
    return ` [${line.join(', ')}]`;
  }

  static escape (value) {
    if (typeof value !== 'string') {
      return value;
    }
    return `"${value.replace('\\', '\\\\').replace('"', '\\"')}"`;
  }
}

class Node extends Element {}

class Edge extends Element {
  constructor (dependent, provider, n) {
    super(`${provider.tag} -> ${dependent.tag}`);
    if (n && n > 1) {
      this.attributes.taillabel = `${n}`;
    }
  }
}

class Graph extends Element {
  constructor (tag) {
    super(tag);
    this.nodeDefaults = {};
    this.edgeDefaults = {};
    this.nodes = {};
    this.edges = [];
  }

  render (indent = '') {
    const out = [`${indent}${this.prefix} ${this.tag} {`];
    for (const [k, v] of Object.entries(this.attributes)) {
      out.push(`${indent}  ${k}=${Element.escape(v)};`);
    }
    const n = Element.renderAttributes(this.nodeDefaults);
    if (n) {
      out.push(`${indent}  node${n};`);
    }
    const e = Element.renderAttributes(this.edgeDefaults);
    if (e) {
      out.push(`${indent}  edge${e};`);
    }
    for (const node of Object.values(this.nodes)) {
      out.push(node.render(`${indent}  `));
    }
    for (const edge of this.edges) {
      out.push(edge.render(`${indent}  `));
    }
    out.push(`${indent}}`);
    return out.join('\n');
  }
}

class Cluster extends Graph {
  constructor (tag) {
    super(tag);
    this.prefix = 'subgraph';
  }
}

class RootGraph extends Graph {
  constructor (options) {
    super('G');
    this.prefix = 'strict digraph';
    this.attributes.concentrate = false;
    this.attributes.compound = true;
    this.attributes.splines = 'polyline';
    this.attributes.rankdir = options.topdown ? 'TB' : 'LR';
    this.attributes.packmode = options.pack ? 'node' : 'clust';
    this.attributes.dpi = 300;
    this.attributes.fontsize = FONT_SIZE;
    this.attributes.fontname = FONT_FAMILY;
    this.attributes.bgcolor = '/x11/transparent';
    this.attributes.tooltip = options.title;
    this.edgeDefaults.arrowhead = 'open';
    this.edgeDefaults.fontsize = FONT_SIZE;
    this.edgeDefaults.fontname = FONT_FAMILY;
    this.edgeDefaults.labelfontsize = FONT_SIZE + 2;
    this.nodeDefaults.style = 'filled';
    this.nodeDefaults.fontsize = FONT_SIZE;
    this.nodeDefaults.fontname = FONT_FAMILY;
    this.nodeDefaults.shape = 'house';
  }
}

class Builder {
  constructor (charms, options) {
    this.charms = charms.filter((c) => ['charm', 'generic', 'knack', 'proxy'].includes(c.type));
    this.lastTag = 0;
    this.root = new RootGraph(options);
    this.characterCharms = {};
    for (const c of options.character) {
      this.characterCharms[c.variant ? `${c.id}.${c.variant}` : c.id] = true;
    }
  }

  render () {
    return this.root.render();
  }

  doNodes () {
    for (const charm of this.charms) {
      if (charm.type === 'proxy') {
        if (charm.variants) {
          for (const variant of charm.variants) {
            const node = new Node(`n${this.lastTag += 1}`);
            const id = `${charm.id}.${variant.id}`;
            this.root.nodes[id] = node;
            node.attributes.id = id;
            node.attributes.tooltip = `id: ${charm.id}\nvariant: ${variant.id}`;
            node.attributes.label = variant.name;
            node.attributes.shape = DUMMY_SHAPE;
          }
        } else {
          const node = new Node(`n${this.lastTag += 1}`);
          this.root.nodes[charm.id] = node;
          node.attributes.id = charm.id;
          node.attributes.tooltip = `id: ${charm.id}`;
          node.attributes.label = charm.name;
          node.attributes.shape = DUMMY_SHAPE;
        }
      } else {
        let node;
        if (charm.variants) {
          node = new Cluster(`cluster${this.lastTag += 1}`);
          for (const variant of charm.variants) {
            const child = new Node(`n${this.lastTag += 1}`);
            const id = `${charm.id}.${variant.id}`;
            node.nodes[variant.id] = child;
            child.parent = node;
            child.attributes.id = id;
            child.attributes.tooltip = `id: ${charm.id}\nvariant: ${variant.id}`;
            child.attributes.label = variant.name;
            if (this.characterCharms[id]) {
              child.attributes.label += ' \u2705'.repeat(this.characterCharms[id].count || 1);
            }
            child.attributes.shape = REAL_SHAPE;
          }
        } else {
          node = new Node(`n${this.lastTag += 1}`);
          node.attributes.shape = REAL_SHAPE;
        }
        this.root.nodes[charm.id] = node;
        node.attributes.id = charm.id;
        node.attributes.tooltip = `id: ${charm.id}`;
        node.attributes.label = Builder.makeLabel(charm);
        if (this.characterCharms[charm.id]) {
          node.attributes.label += ' \u2705'.repeat(this.characterCharms[charm.id].count || 1);
        }
      }
    }
  }

  doEdges () {
    for (const charm of this.charms) {
      if (charm.type !== 'proxy') {
        if (charm.variants) {
          const parent = this.root.nodes[charm.id];
          if (!parent) {
            throw new Error(`Charm ${charm.id} not found`);
          }
          for (const variant of charm.variants) {
            const id = `${charm.id}.${variant.id}`;
            const child = parent.nodes[variant.id];
            if (!child) {
              throw new Error(`Variant ${variant.id} not found in Charm ${charm.id}`);
            }
            const p = variant.prerequisites;
            if (p) {
              if (p.excellencies) {
                this.pushSpecialDependency(child, this.getExcellenciesNode(p.excellencies));
              }
              if (p.groups?.length) {
                const l = p.groups.length;
                for (let i = 0; i < l; i += 1) {
                  this.pushSpecialDependency(child, this.getGroupNode(p, i, id));
                }
              }
              if (p.charms?.length) {
                for (const dep of p.charms) {
                  this.pushDependency(child, dep, parent);
                }
              }
            }
          }
        }
        const node = this.root.nodes[charm.id];
        if (!node) {
          throw new Error(`Charm ${charm.id} not found`);
        }
        const p = charm.prerequisites;
        if (p) {
          if (p.excellencies) {
            this.pushSpecialDependency(node, this.getExcellenciesNode(p.excellencies));
          }
          if (p.groups?.length) {
            const l = p.groups.length;
            for (let i = 0; i < l; i += 1) {
              this.pushSpecialDependency(node, this.getGroupNode(p, i, charm.id));
            }
          }
          if (p.charms?.length) {
            for (const dep of p.charms) {
              this.pushDependency(node, dep);
            }
          }
        }
      }
    }
  }

  getExcellenciesNode (excNum) {
    const excId = `exc (${excNum})`;
    let node = this.root.nodes[excId];
    if (!node) {
      node = this.root.nodes[excId] = new Node(`n${this.lastTag += 1}`);
      node.attributes.id = excId;
      const excText = `${excNum} Excellencies`;
      node.attributes.label = `Any ${excNum === 1 ? 'Excellency' : excText}`;
      node.attributes.tooltip = `excellencies: ${excNum}`;
      node.attributes.shape = DUMMY_SHAPE;
    }
    return node;
  }

  getGroupNode (prereqs, i, id) {
    const group = prereqs.groups[i];
    const groupId = `${id} group #${i}`;
    if (this.root.nodes[groupId]) {
      return this.root.nodes[groupId];
    }
    const node = this.root.nodes[groupId] = new Node(`n${this.lastTag += 1}`);
    node.attributes.id = groupId;
    node.attributes.label = `${group.threshold}`;
    node.attributes.tooltip = `threshold: ${group.threshold}`;
    node.attributes.shape = GROUP_SHAPE;
    if (group.charms?.length) {
      for (const dep of group.charms) {
        this.pushDependency(node, dep);
      }
    }
    return node;
  }

  pushDependency (node, dep, parent) {
    let lhead;
    if (node instanceof Cluster && Object.keys(node.nodes).length) {
      lhead = node;
      node = node.nodes[Object.keys(node.nodes)[0]];
    }
    if (dep.variant) {
      const depParent = this.root.nodes[dep.id];
      if (!depParent) {
        const proxyDep = this.root.nodes[`${dep.id}.${dep.variant}`];
        if (proxyDep) {
          const edge = new Edge(node, proxyDep, dep.count);
          if (lhead) {
            edge.attributes.lhead = lhead.tag;
          }
          this.root.edges.push(edge);
          return;
        }
        throw new Error(`Charm ${dep.id} not found`);
      }
      if (depParent instanceof Cluster) {
        const depChild = depParent.nodes[dep.variant];
        if (!depChild) {
          throw new Error(`Variant ${dep.variant} not found in Charm ${dep.id}`);
        }
        if (depParent.tag === parent?.tag) {
          const edge = new Edge(node, depChild, dep.count);
          edge.attributes.constraint = false;
          parent.edges.push(edge);
        } else {
          const edge = new Edge(node, depChild, dep.count);
          if (lhead) {
            edge.attributes.lhead = lhead.tag;
          }
          this.root.edges.push(edge);
        }
      } else {
        const edge = new Edge(node, depParent, dep.count);
        if (lhead) {
          edge.attributes.lhead = lhead.tag;
        }
        this.root.edges.push(edge);
      }
    } else {
      let depNode = this.root.nodes[dep.id];
      let ltail;
      if (!depNode) {
        throw new Error(`Charm ${dep.id} not found`);
      }
      if (depNode instanceof Cluster && Object.keys(depNode.nodes).length) {
        ltail = depNode;
        depNode = depNode.nodes[Object.keys(depNode.nodes)[0]];
      }
      const edge = new Edge(node, depNode, dep.count);
      if (lhead) {
        edge.attributes.lhead = lhead.tag;
      }
      if (ltail) {
        edge.attributes.ltail = ltail.tag;
      }
      this.root.edges.push(edge);
    }
  }

  pushSpecialDependency (node, depNode) {
    let lhead;
    if (node instanceof Cluster && Object.keys(node.nodes).length) {
      lhead = node;
      node = node.nodes[Object.keys(node.nodes)[0]];
    }
    const edge = new Edge(node, depNode);
    if (lhead) {
      edge.attributes.lhead = lhead.tag;
    }
    this.root.edges.push(edge);
  }


  static makeLabel (charm) {
    let name = charm.name;
    const p = charm.prerequisites || {};
    if (!p.excellencies && !p.charms?.length && !p.groups?.length) {
      name = name.toUpperCase();
    }
    if (charm.type === 'knack') {
      return name;
    }
    const minEssence = p.essence || 1;
    let keyTrait = charm.group || '_';
    if (charm.exalt?.endsWith(' Martial Arts') && keyTrait !== 'Dexterity') {
      keyTrait = 'Martial Arts';
    }
    const minTrait = p.traits && p.traits[keyTrait];
    if (minEssence || minTrait) {
      const t = minTrait ? `${minTrait}/` : '';
      name = `${name} [${t}${minEssence || ''}]`;
    }
    return name;
  }
}

export default function makeGv (charms, options) {
  options ||= {};
  options.character ||= [];
  const builder = new Builder(charms, options);
  builder.doNodes();
  builder.doEdges();
  return builder.render();
}
