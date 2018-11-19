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
  constructor (tag, options) {
    super(tag);
    this.prefix = 'subgraph';
    this.attributes.bgcolor = `/svg/${options.clusterColor}`;
  }
}

class RootGraph extends Graph {
  constructor (options) {
    super('G');
    this.prefix = 'strict digraph';
    this.attributes.concentrate = false;
    this.attributes.compound = true;
    this.attributes.splines = 'polyline';
    this.attributes.rankdir = 'LR';
    this.attributes.packmode = 'clust';
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
    this.nodeDefaults.fillcolor = `/svg/${options.charmColor}`;
  }
}

class Builder {
  constructor (charms, options) {
    this.charms = charms.filter((c) => ['charm', 'generic', 'knack', 'proxy'].includes(c.type));
    this.options = options;
    this.lastTag = 0;
    this.root = new RootGraph(options);
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
          node = new Cluster(`cluster${this.lastTag += 1}`, this.options);
          for (const variant of charm.variants) {
            const child = new Node(`n${this.lastTag += 1}`);
            const id = `${charm.id}.${variant.id}`;
            node.nodes[variant.id] = child;
            child.parent = node;
            child.attributes.id = id;
            child.attributes.tooltip = `id: ${charm.id}\nvariant: ${variant.id}`;
            child.attributes.label = variant.name;
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
                this.root.edges.push(new Edge(child, this.getExcellenciesNode(p.excellencies)));
              }
              if (p.groups?.length) {
                const l = p.groups.length;
                for (let i = 0; i < l; i += 1) {
                  this.root.edges.push(new Edge(child, this.getGroupNode(p, i, id)));
                }
              }
              if (p.charms?.length) {
                for (const dep of p.charms) {
                  this.pushDependency(child, dep, parent);
                }
              }
            }
          }
        } else {
          const node = this.root.nodes[charm.id];
          if (!node) {
            throw new Error(`Charm ${charm.id} not found`);
          }
          const p = charm.prerequisites;
          if (p) {
            if (p.excellencies) {
              this.root.edges.push(new Edge(node, this.getExcellenciesNode(p.excellencies)));
            }
            if (p.groups?.length) {
              const l = p.groups.length;
              for (let i = 0; i < l; i += 1) {
                this.root.edges.push(new Edge(node, this.getGroupNode(p, i, charm.id)));
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
    if (dep.variant) {
      const depParent = this.root.nodes[dep.id];
      if (!depParent) {
        const proxyDep = this.root.nodes[`${dep.id}.${dep.variant}`];
        if (proxyDep) {
          this.root.edges.push(new Edge(node, proxyDep, dep.count));
          return;
        }
        throw new Error(`Charm ${dep.id} not found`);
      }
      const depChild = depParent.nodes[dep.variant];
      if (!depChild) {
        throw new Error(`Variant ${dep.variant} not found in Charm ${dep.id}`);
      }
      if (depParent.tag === parent?.tag) {
        const edge = new Edge(node, depChild, dep.count);
        edge.attributes.constraint = false;
        parent.edges.push(edge);
      } else {
        this.root.edges.push(new Edge(node, depChild, dep.count));
      }
    } else {
      const depNode = this.root.nodes[dep.id];
      if (!depNode) {
        throw new Error(`Charm ${dep.id} not found`);
      }
      this.root.edges.push(new Edge(node, depNode, dep.count));
    }
  }

  static makeLabel (charm) {
    let name = charm.name;
    const p = charm.prerequisites;
    if (!p.excellencies && !p.charms?.length && !p.groups?.length) {
      name = name.toUpperCase();
    }
    const minEssence = p.essence;
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
  const builder = new Builder(charms, options);
  builder.doNodes();
  builder.doEdges();
  return builder.render();
}