import EmberObject, {computed} from '@ember/object';
import {not} from '@ember/object/computed';

import {promisifyTx} from 'nomicon/lib/idb_utils';
import Atom from './atom';

export default EmberObject.extend({
  store: null,

  // These are stored directly in IndexedDB
  id: '',
  home: false,
  atoms: [],

  // These are assigned by the store in _buildIdentityMap
  incoming: [],
  outgoing: [],

  init() {
    this._super(...arguments);
    this.incoming = [];
    this.outgoing = [];

    if (this.atoms.length === 0) {
      this.atoms.pushObject(this.newAtom('', ''));
    }
  },

  title: computed('atoms.[]', {
    get(key) {
      return this.atoms[this.atoms.length-1].value.title;
    },
    set(key, val) {
      if (val !== this.title) {
        this.atoms.push(this.newAtom(val, this.body));
      }
      return val;
    }
  }),
  body: computed('atoms.[]', {
    get(key) {
      return this.atoms[this.atoms.length-1].value.body;
    },
    set(key, val) {
      if (val !== this.body) {
        this.atoms.push(this.newAtom(this.title, val));
      }
      return val;
    }
  }),

  newAtom(title, body) {
    return new Atom({
      id: this.store.nextId(),
      objectType: 'page',
      objectId: this.id,
      type: 'write',
      parent: null,
      value: {title, body},
    });
  },

  numPeers: computed('{incoming,outgoing}.[]', function() {
    return this.incoming.length + this.outgoing.length;
  }),
  stub: not('body'),

  async linkTo(otherId) {
    return this.store.insertLink(this.id, otherId);
  },
  async linkFrom(otherId) {
    return this.store.insertLink(otherId, this.id);
  },

  saveAttributes() {
    let tx = this.store.db.transaction('pages', 'readwrite');
    tx.objectStore('pages').put(this.serialize());
    return promisifyTx(tx);
  },

  serialize() {
    return {
      id: this.id,
      home: this.home,
      atoms: this.atoms.slice(-1),
    };
  },

  // When we remove a page from the graph, we remove all references to its links
  // on the other side, but leave them on the now-orphaned page. So then when the
  // page is later destroyed, it can also destroy all its dangling links.
  willDestroy() {
    this.incoming.forEach(l => l.destroy());
    this.outgoing.forEach(l => l.destroy());
    this._super(...arguments);
  },
});
