/* eslint class-methods-use-this: off */

class Node {
  reify (library) {
    for (const d of this.dependencies) {
      d.reify(library);
    }
  }

  static makeDependencies (from, data) {
    const out = [];
    const p = data.prerequisites;
    if (p?.excellencies) {
      out.push(new ExcellenciesDependency(from, p.excellencies));
    }
    if (p?.groups) {
      for (let i = 0; i < p.groups.length; i += 1) {
        out.push(new GroupDependency(from, `${data} #${i}`, p.groups[i]));
      }
    }
    if (p?.charms) {
      for (const ch of p.charms) {
        out.push(new CharmDependency(from, ch.id, ch.variant, ch.count));
      }
    }
    return out;
  }
}

class Dependency {
  constructor (from) {
    this._from = from;
  }

  get dependent () {
    return this._from;
  }
}

class VirtualNode extends Node {
  get virtual () {
    return true;
  }
}

class ExcellenciesNode extends VirtualNode {
  constructor (n) {
    super();
    this._id = `exc (${n})`;
    if (n === 1) {
      this._label = 'Any Excellency';
    } else {
      this._label = `Any ${n} Excellencies`;
    }
  }

  get id () {
    return this._id;
  }

  get label () {
    return this._label;
  }

  get shape () {
    return 'dummyShape';
  }

  get dependencies () {
    return [];
  }
}

class ExcellenciesDependency extends Dependency {
  constructor (from, n) {
    super(from);
    this._charm = new ExcellenciesNode(n);
  }

  get target () {
    return this._charm;
  }

  reify (library) {
    if (!this._reified) {
      library.add(this._charm);
      this._charm = library.lookup(this._charm.id);
      this._reified = true;
    }
  }
}

class GroupNode extends VirtualNode {
  constructor (id, data) {
    super();
    this._id = id;
    this._label = `${data.threshold}`;
    this._dependencies
      = data.charms.map((ch) => new CharmDependency(this, ch.id, ch.variant, ch.count));
  }

  get id () {
    return this._id;
  }

  get label () {
    return this._label;
  }

  get shape () {
    return 'groupShape';
  }

  get dependencies () {
    return this._dependencies;
  }
}

class GroupDependency extends Dependency {
  constructor (from, id, data) {
    super(from);
    this._node = new GroupNode(id, data);
  }

  get target () {
    return this._node;
  }

  reify (library) {
    if (!this._reified) {
      this._node.reify(library);
      this._reified = true;
    }
  }
}

class VariantNode extends Node {
  constructor (charm, data) {
    super();
    this._id = `${charm.id} ${data.id}`;
    this._base = charm;
    this._variantId = data.id;
    this._label = data.name;
    this._dependencies = Node.makeDependencies(this, data);
  }

  get id () {
    return this._id;
  }

  get variantId () {
    return this._variantId;
  }

  get base () {
    return this._base;
  }

  get label () {
    return this._label;
  }

  get shape () {
    return this.base._shape;
  }

  get dependencies () {
    return this._dependencies;
  }
}

class CharmNode extends Node {
  constructor (data) {
    super();
    this._id = data.id;
    this._proxy = data.type === 'proxy';
    this._shape = data.type === 'proxy' ? 'dummyShape' : 'realShape';
    this._label = CharmNode.makeLabel(data);
    this._dependencies = Node.makeDependencies(this, data);
    this._data = data.type !== 'proxy' && data;
    this._variants = data.variants?.map((v) => new VariantNode(this, v)) || [];
  }

  get id () {
    return this._id;
  }

  get proxy () {
    return this._proxy;
  }

  get label () {
    return this._label;
  }

  get shape () {
    return this._shape;
  }

  get dependencies () {
    return this._dependencies;
  }

  get variants () {
    return this._variants;
  }

  reify (library) {
    super.reify(library);
    for (const v of this._variants) {
      v.reify(library);
    }
  }

  static makeLabel (data) {
    if (data.type === 'proxy') {
      return data.name;
    }
    const p = data.prerequisites;
    let name = data.name;
    if (!p?.charms && !p?.groups && !p?.excellencies) {
      name = name.toUpperCase();
    }
    let traitName = data.group || '_';
    if (data.exalt?.endsWith('Martial Arts') && traitName !== 'Dexterity') {
      traitName = 'Martial Arts';
    }
    const minTrait = (p?.traits || {})[traitName];
    const minEssence = p?.essence;
    if (minTrait || minEssence) {
      const t = minTrait ? `${minTrait}/` : '';
      name = `${name} [${t}${minEssence || ''}]`;
    }
    return name;
  }
}

class CharmDependency extends Dependency {
  constructor (from, charm, variantId, count) {
    super(from);
    this._charm = charm;
    if (typeof charm === 'string') {
      this._variant = variantId; // empty string variant is not the same as nullish variant
    } else if (variantId) {
      this._variant = charm.variants.find((v) => v.id === variantId);
      if (!this.variant) {
        throw new Error(`Could not find Charm ${charm.id} variant ${variantId}`);
      }
    }
    this._count = count === 1 ? 0 : count || 0;
  }

  get target () {
    return this._variant || this._charm;
  }

  get count () {
    return this._count;
  }

  reify (library) {
    if (!this._reified) {
      if (typeof this._charm === 'string') {
        const charm = library.lookup(this._charm);
        if (charm) {
          this._charm = charm;
          if (typeof this._variant === 'string') {
            const v = charm.variants.find((x) => x.variantId === this._variant);
            if (v) {
              this._variant = v;
            } else {
              throw new Error(`Could not reify Charm ${charm.id} variant ${this._variant}`);
            }
          }
        } else {
          throw new Error(`Could not reify Charm ${this._charm}`);
        }
      }
      this._reified = true;
    }
  }
}

export function parse (data, library) {
  const d = data.filter(
    (x) => x.type === 'charm' || x.type === 'generic' || x.type === 'knack'
      || x.type === 'proxy'
  );
  const nodes = [];
  for (const item of d) {
    const node = new CharmNode(item);
    nodes.push(node);
    library.add(node);
  }
  for (const n of nodes) {
    n.reify(library);
  }
  return nodes;
}
