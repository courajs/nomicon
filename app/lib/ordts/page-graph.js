import EmberObject from '@ember/object';

import uuid from 'uuid/v4';

import Atom from '../atom';

export default EmberObject.extend({
  id: '',
  atoms: [],

  store: null,

  process() {
    let pages = [];
    let links = [];
    let lookup = {};
    function store(item) {
      let {id} = item;
      if (!lookup[id.site]) {
        lookup[id.site] = {};
      }
      lookup[id.site][id.lamport] = item;
    }
    function retrieve(id) {
      return lookup[id.site] && lookup[id.site][id.lamport];
    }

    for (let atom of this.atoms) {
      if (atom.type === 'new-page') {
        pages.push(atom);
        store(atom);
      } else if (atom.type === 'new-link') {
        links.push(atom);
        store(atom);
      } else if (atom.type === 'delete') {
        retrieve(atom.locator).deleted = true;
      }
    }

    return {
      pages: pages.filter(p => !p.deleted),
      links: links.filter(l => !l.deleted),
    };
  },

  prevId() {
    for (let i=this.atoms.length-1; i>=0; i--) {
      if (this.atoms[i].type !== 'delete') {
        return this.atoms[i].id;
      }
    }
    return null;
  },

  async deleteItem(itemId) {
    let atom = new Atom({
      id: this.store.nextId(),
      collectionId: this.id,
      type: 'delete',
      locator: itemId,
      value: null,
    });
    this.atoms.push(atom);
    await this.store.persistAtom(atom);
  },

  async createPage() {
    let atom = new Atom({
      id: this.store.nextId(),
      collectionId: this.id,
      type: 'new-page',
      locator: this.prevId(),
      value: {
        uuid: uuid(),
        homeCollectionId: uuid(),
        titleCollectionId: uuid(),
        bodyCollectionId: uuid(),
      },
    });
    this.atoms.push(atom);
    await this.store.persistAtom(atom);
    return atom;
  },

  async createLink(fromUUID, toUUID) {
    let atom = new Atom({
      id: this.store.nextId(),
      collectionId: this.id,
      type: 'new-link',
      locator: this.prevId(),
      value: {
        from: fromUUID,
        to: toUUID,
      },
    });
    this.atoms.push(atom);
    await this.store.persistAtom(atom);
    return atom;
  },
});
