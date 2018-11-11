export class MemoryLibrary {
  constructor () {
    this._cache = {};
  }

  add (charm) {
    this._cache[charm.id] ||= charm;
  }

  lookup (id) {
    return this._cache[id];
  }
}
