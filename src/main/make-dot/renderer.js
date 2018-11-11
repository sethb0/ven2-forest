class Element {
  constructor (tag) {
    this._tag = tag;
    this.attributes = { id: tag.replace(/\W/gu, '_') };
  }

  render (indent = '') {
    return `${indent}${this._tag}${Element.renderAttributes(this.attributes)};`;
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

class Graph extends Element {
  constructor (tag) {
    super(tag);
    this.nodeDefaults = {};
    this.edgeDefaults = {};
    this.children = [];
  }

  render (indent = '') {
    const out = [`${indent}${this._tag} {`];
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
    for (const child of this.children) {
      out.push(child.render(`${indent}  `));
    }
    out.push(`${indent}}`);
    return out.join('\n');
  }
}

class RootGraph extends Graph {
  constructor (params) {
    super('strict digraph');
    // this.attributes.concentrate = true;
    this.attributes.compound = true;
    this.attributes.splines = 'polyline';
    this.attributes.rankdir = 'LR';
    this.attributes.dpi = 300;
    this.attributes.fontsize = 24;
    this.attributes.fontname = params.fontFamily;
    this.attributes.label = params.title;
    this.attributes.labelloc = 't';
    this.attributes.bgcolor = params.pageColor;
    this.edgeDefaults.arrowhead = 'open';
    this.edgeDefaults.fontsize = 8;
    this.edgeDefaults.fontname = params.fontFamily;
    this.nodeDefaults.style = 'filled';
    this.nodeDefaults.fontsize = 10;
    this.nodeDefaults.fontname = params.fontFamily;
    this.nodeDefaults.fillcolor = params.charmColor;
  }
}

class Cluster extends Graph {
  constructor (charm, params) {
    super(`subgraph ${Element.escape(`cluster_${charm.id}`)}`);
    this.attributes.label = charm.label;
    this.attributes.fontsize = 12;
    this.attributes.bgcolor = params.clusterColor;
    this.nodeDefaults.fontsize = 8;
  }
}

class Edge extends Element {
  constructor (dependency) {
    const from = dependency.target;
    const to = dependency.dependent;
    let realFrom = from.id;
    if (from.variants?.length) {
      realFrom = from.variants[0].id;
    }
    let realTo = to.id;
    if (to.variants?.length) {
      realTo = to.variants[0].id;
    }
    super(`${Element.escape(realFrom)} -> ${Element.escape(realTo)}`);
    this._from = from;
    this._to = to;
    if (realFrom !== from.id) {
      this.attributes.ltail = `cluster_${from.id}`;
    }
    if (realTo !== to.id) {
      this.attributes.lhead = `cluster_${to.id}`;
    }
    if (dependency.count) {
      this.attributes.taillabel = dependency.count;
    }
    if (from.base && to.base === from.base) {
      this._internal = true;
      this.attributes.constraint = false;
    } else {
      // this.attributes.headport = 'w';
      // this.attributes.tailport = 'e';
    }
  }

  get from () {
    return this._from;
  }

  get to () {
    return this._to;
  }

  get internal () {
    return this._internal;
  }
}

class Node extends Element {
  constructor (charm, params) {
    super(Element.escape(charm.id));
    this.attributes.shape = params[charm.shape];
    this.attributes.label = charm.label;
  }
}

export function render (parsed, params) {
  const root = new RootGraph(params);
  const stack = parsed.slice();
  stack.reverse();
  while (stack.length) {
    const x = stack.pop();
    if (x.variants?.length) {
      let c = root;
      if (!x.proxy) {
        c = new Cluster(x, params);
        root.children.push(c);
      }
      for (const v of x.variants) {
        c.children.push(new Node(v, params));
        for (const d of v.dependencies) {
          if (d.target.virtual) {
            stack.push(d.target);
          }
          const e = new Edge(d);
          if (e.internal) {
            c.children.push(e);
          } else {
            root.children.push(e);
          }
        }
      }
    } else {
      root.children.push(new Node(x, params));
    }
    for (const d of x.dependencies) {
      if (d.target.virtual) {
        stack.push(d.target);
      }
      root.children.push(new Edge(d));
    }
  }
  return root.render();
}
